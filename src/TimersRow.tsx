import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, Plus, Square, Timer, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

export interface TimerPreset {
  id: string;
  durationSec: number;
}

type TimerStatus = "idle" | "running" | "paused";

interface TimerRuntime {
  status: TimerStatus;
  remainingMs: number;
  endsAt: number | null;
}

interface TimerAlert {
  id: string;
  durationSec: number;
}

export const MAX_TIMERS = 5;
const QUICK_PICKS_SEC = [60, 600, 900, 1500]; // 1m, 10m, 15m, 25m
const SOUND_LOOP_MS = 1200;

export const DEFAULT_TIMERS: TimerPreset[] = [
  { id: "timer-30s", durationSec: 30 },
  { id: "timer-1m", durationSec: 60 },
  { id: "timer-5m", durationSec: 5 * 60 },
  { id: "timer-30m", durationSec: 30 * 60 },
];

function formatDurationLabel(sec: number): string {
  if (sec < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function playChimeOnce() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = [880, 1175, 880];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.start(t);
      osc.stop(t + 0.15);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Ignore audio failures
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    return granted;
  } catch (err) {
    console.error("Notification permission check failed", err);
    return false;
  }
}

async function notifyTimerDone(durationSec: number) {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      console.warn("Notification permission not granted");
    }
    // Prefer Rust-side notification (more reliable on macOS)
    await invoke("notify_timer_done", {
      durationLabel: formatDurationLabel(durationSec),
    });
  } catch (err) {
    console.error("Timer notification failed", err);
  }
}

async function revealFluxBoxWindow() {
  try {
    await invoke("lock_window_open");
    await invoke("show_main_window");
  } catch (err) {
    console.error("Failed to show FluxBox window", err);
  }
}

function initialRuntime(durationSec: number): TimerRuntime {
  return {
    status: "idle",
    remainingMs: durationSec * 1000,
    endsAt: null,
  };
}

interface TimersRowProps {
  timers: TimerPreset[];
  onChange: (next: TimerPreset[]) => void;
  dropdownOpen: boolean;
  onToggleDropdown: () => void;
  dropdownRef?: React.RefObject<HTMLDivElement | null>;
}

export default function TimersRow({
  timers,
  onChange,
  dropdownOpen,
  onToggleDropdown,
  dropdownRef,
}: TimersRowProps) {
  const [runtimes, setRuntimes] = useState<Record<string, TimerRuntime>>(() => {
    const map: Record<string, TimerRuntime> = {};
    for (const t of timers) map[t.id] = initialRuntime(t.durationSec);
    return map;
  });
  const [now, setNow] = useState(() => Date.now());
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customSeconds, setCustomSeconds] = useState("0");
  const [alertQueue, setAlertQueue] = useState<TimerAlert[]>([]);
  const finishedRef = useRef<Set<string>>(new Set());
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentAlert = alertQueue[0] ?? null;

  // Sync runtimes when presets are added/removed
  useEffect(() => {
    setRuntimes((prev) => {
      const next: Record<string, TimerRuntime> = {};
      for (const t of timers) {
        next[t.id] = prev[t.id] ?? initialRuntime(t.durationSec);
      }
      return next;
    });
  }, [timers]);

  const anyRunning = Object.values(runtimes).some((r) => r.status === "running");

  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [anyRunning]);

  // Loop alert sound while a modal alert is active
  useEffect(() => {
    if (!currentAlert) {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
      return;
    }

    playChimeOnce();
    soundIntervalRef.current = setInterval(playChimeOnce, SOUND_LOOP_MS);
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    };
  }, [currentAlert?.id]);

  // Complete timers that hit zero
  useEffect(() => {
    const completed: TimerAlert[] = [];
    for (const t of timers) {
      const rt = runtimes[t.id];
      if (!rt || rt.status !== "running" || rt.endsAt == null) continue;
      const remaining = Math.max(0, rt.endsAt - now);
      if (remaining <= 0 && !finishedRef.current.has(t.id)) {
        finishedRef.current.add(t.id);
        completed.push({ id: t.id, durationSec: t.durationSec });
      }
    }
    if (completed.length === 0) return;

    setRuntimes((prev) => {
      const next = { ...prev };
      for (const alert of completed) {
        next[alert.id] = {
          status: "idle",
          remainingMs: 0,
          endsAt: null,
        };
      }
      return next;
    });

    for (const alert of completed) {
      notifyTimerDone(alert.durationSec);
    }
    revealFluxBoxWindow();
    setAlertQueue((q) => [...q, ...completed]);
  }, [now, timers, runtimes]);

  const dismissAlert = async () => {
    if (!currentAlert) return;
    const id = currentAlert.id;
    const durationSec = currentAlert.durationSec;

    finishedRef.current.delete(id);
    setRuntimes((prev) => ({
      ...prev,
      [id]: initialRuntime(durationSec),
    }));

    setAlertQueue((q) => {
      const next = q.slice(1);
      if (next.length === 0) {
        invoke("unlock_window_open").catch(() => {});
      }
      return next;
    });
  };

  if (timers.length === 0) {
    return (
      <div className="flex flex-1 items-center text-xs text-gray-400 dark:text-gray-500 px-1">
        Loading timers…
      </div>
    );
  }

  const getRemainingMs = (id: string, durationSec: number): number => {
    const rt = runtimes[id] ?? initialRuntime(durationSec);
    if (rt.status === "running" && rt.endsAt != null) {
      return Math.max(0, rt.endsAt - now);
    }
    return rt.remainingMs;
  };

  const playTimer = async (id: string, durationSec: number) => {
    // Request notification permission on user gesture (first Play)
    ensureNotificationPermission();

    finishedRef.current.delete(id);
    setRuntimes((prev) => {
      const rt = prev[id] ?? initialRuntime(durationSec);
      const base =
        rt.status === "paused"
          ? rt.remainingMs
          : rt.remainingMs > 0
            ? rt.remainingMs
            : durationSec * 1000;
      return {
        ...prev,
        [id]: {
          status: "running",
          remainingMs: base,
          endsAt: Date.now() + base,
        },
      };
    });
  };

  const pauseTimer = (id: string, durationSec: number) => {
    setRuntimes((prev) => {
      const rt = prev[id] ?? initialRuntime(durationSec);
      if (rt.status !== "running" || rt.endsAt == null) return prev;
      return {
        ...prev,
        [id]: {
          status: "paused",
          remainingMs: Math.max(0, rt.endsAt - Date.now()),
          endsAt: null,
        },
      };
    });
  };

  const stopTimer = (id: string, durationSec: number) => {
    finishedRef.current.delete(id);
    setRuntimes((prev) => ({
      ...prev,
      [id]: initialRuntime(durationSec),
    }));
  };

  const removeTimer = (id: string) => {
    if (timers.length <= 1) return;
    onChange(timers.filter((t) => t.id !== id));
  };

  const addTimer = (durationSec: number) => {
    if (timers.length >= MAX_TIMERS || durationSec <= 0) return;
    const newId = `timer-${Date.now()}`;
    onChange([...timers, { id: newId, durationSec }]);
    onToggleDropdown();
    setCustomMinutes("25");
    setCustomSeconds("0");
  };

  const addCustom = () => {
    const m = Math.max(0, parseInt(customMinutes, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(customSeconds, 10) || 0));
    const total = m * 60 + s;
    if (total <= 0) return;
    addTimer(total);
  };

  return (
    <>
      <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
        {timers.map((timer) => {
          const rt = runtimes[timer.id] ?? initialRuntime(timer.durationSec);
          const remaining = getRemainingMs(timer.id, timer.durationSec);
          const isRunning = rt.status === "running";
          const isPaused = rt.status === "paused";

          return (
            <div
              key={timer.id}
              className={`group relative flex items-center gap-2.5 bg-gray-100/60 dark:bg-neutral-800/60 px-3 py-1.5 rounded-xl border shadow-sm min-w-max transition-colors ${
                isRunning
                  ? "border-black/20 dark:border-white/25"
                  : isPaused
                    ? "border-gray-300 dark:border-neutral-600"
                    : "border-gray-200 dark:border-neutral-800"
              }`}
            >
              <div className="flex flex-col leading-none gap-0.5 min-w-[3.25rem]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {formatDurationLabel(timer.durationSec)}
                </span>
                <span
                  className={`font-medium tabular-nums text-sm ${
                    isRunning
                      ? "text-black dark:text-white"
                      : isPaused
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {formatRemaining(remaining)}
                </span>
              </div>

              <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-neutral-700 pl-2">
                {isRunning ? (
                  <button
                    onClick={() => pauseTimer(timer.id, timer.durationSec)}
                    className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title="Pause"
                  >
                    <Pause size={13} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={() => playTimer(timer.id, timer.durationSec)}
                    className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title={isPaused ? "Resume" : "Start"}
                  >
                    <Play size={13} fill="currentColor" />
                  </button>
                )}
                <button
                  onClick={() => stopTimer(timer.id, timer.durationSec)}
                  disabled={rt.status === "idle" && remaining >= timer.durationSec * 1000 - 1}
                  className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Stop"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              </div>

              {timers.length > 1 && (
                <button
                  onClick={() => removeTimer(timer.id)}
                  className="hidden group-hover:flex absolute -top-1 -right-1 w-4 h-4 items-center justify-center bg-red-500 text-white rounded-full scale-75 shadow-lg"
                  title="Remove timer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div ref={dropdownRef} className="relative shrink-0">
        <button
          onClick={onToggleDropdown}
          disabled={timers.length >= MAX_TIMERS}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm cursor-pointer active:scale-95 ${
            timers.length >= MAX_TIMERS
              ? "bg-gray-50 dark:bg-neutral-900/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-neutral-800 opacity-50 cursor-not-allowed"
              : "bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700"
          }`}
          title="Add timer"
        >
          <Plus size={16} />
        </button>

        {dropdownOpen && timers.length < MAX_TIMERS && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-2">
            <div className="px-3 pb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Timer size={11} /> Add timer
            </div>

            <div className="px-3 pb-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-14 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-black dark:text-white outline-none text-center tabular-nums"
                aria-label="Minutes"
              />
              <span className="text-xs text-gray-400">min</span>
              <input
                type="number"
                min={0}
                max={59}
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value)}
                className="w-14 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-black dark:text-white outline-none text-center tabular-nums"
                aria-label="Seconds"
              />
              <span className="text-xs text-gray-400">sec</span>
            </div>

            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PICKS_SEC.map((sec) => (
                <button
                  key={sec}
                  onClick={() => addTimer(sec)}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  {formatDurationLabel(sec)}
                </button>
              ))}
            </div>

            <div className="px-3 pt-1">
              <button
                onClick={addCustom}
                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity cursor-pointer"
              >
                Add timer
              </button>
            </div>
          </div>
        )}
      </div>

      {currentAlert &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/55 dark:bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-md flex flex-col items-center gap-5 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl px-8 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                <Timer size={28} className="text-black dark:text-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
                  TIME UP!!!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your {formatDurationLabel(currentAlert.durationSec)} timer has finished.
                </p>
                {alertQueue.length > 1 && (
                  <p className="text-xs text-gray-400 mt-1">
                    +{alertQueue.length - 1} more waiting
                  </p>
                )}
              </div>
              <button
                onClick={dismissAlert}
                className="mt-2 w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
