import { useEffect, useRef, useState } from "react";
import {
  Bird,
  CloudLightning,
  CloudRain,
  Coffee,
  Flame,
  Pause,
  Play,
  Volume2,
  Waves,
  Wind,
} from "lucide-react";

export interface SoundDef {
  id: string;
  label: string;
  file: string;
}

export const AMBIENT_SOUNDS: SoundDef[] = [
  { id: "rain", label: "Rain", file: "/sounds/rain.ogg" },
  { id: "waves", label: "Waves", file: "/sounds/waves.ogg" },
  { id: "fireplace", label: "Fireplace", file: "/sounds/fireplace.ogg" },
  { id: "cafe", label: "Cafe", file: "/sounds/coffee-shop.ogg" },
  { id: "birds", label: "Birds", file: "/sounds/birds.ogg" },
  { id: "wind", label: "Wind", file: "/sounds/wind.ogg" },
  { id: "storm", label: "Storm", file: "/sounds/storm.ogg" },
  { id: "white-noise", label: "White Noise", file: "/sounds/white-noise.ogg" },
];

/** Overlap / crossfade length — hides imperfect loop points in the source files */
const CROSSFADE_SEC = 1.5;

function SoundIcon({ id, size = 12 }: { id: string; size?: number }) {
  switch (id) {
    case "rain":
      return <CloudRain size={size} />;
    case "waves":
      return <Waves size={size} />;
    case "fireplace":
      return <Flame size={size} />;
    case "cafe":
      return <Coffee size={size} />;
    case "birds":
      return <Bird size={size} />;
    case "wind":
      return <Wind size={size} />;
    case "storm":
      return <CloudLightning size={size} />;
    default:
      return <Volume2 size={size} />;
  }
}

interface SoundsRowProps {
  activeSoundId: string | null;
  volume: number;
  onActiveChange: (id: string | null) => void;
  onVolumeChange: (volume: number) => void;
}

type Layer = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

/**
 * Gapless ambient playback via Web Audio + overlapping crossfades.
 * HTMLAudioElement.loop leaves a silence gap; this schedules the next copy
 * to start before the current one ends and crossfades between them.
 */
function createCrossfadeLooper(
  ctx: AudioContext,
  buffer: AudioBuffer,
  masterGain: GainNode
) {
  let stopped = false;
  let nextStart = ctx.currentTime;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const layers: Layer[] = [];

  const fadeSec = Math.min(CROSSFADE_SEC, Math.max(0.25, buffer.duration * 0.2));

  const scheduleLayer = () => {
    if (stopped) return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(masterGain);

    const t0 = Math.max(nextStart, ctx.currentTime);
    const dur = buffer.duration;

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(1, t0 + fadeSec);
    gain.gain.setValueAtTime(1, t0 + dur - fadeSec);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    source.start(t0);
    source.stop(t0 + dur + 0.05);

    const layer: Layer = { source, gain };
    layers.push(layer);
    source.onended = () => {
      const idx = layers.indexOf(layer);
      if (idx >= 0) layers.splice(idx, 1);
      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        /* already disconnected */
      }
    };

    // Next layer starts early so the crossfade covers the loop point
    nextStart = t0 + dur - fadeSec;

    const delayMs = Math.max(50, (nextStart - ctx.currentTime - 0.05) * 1000);
    timer = setTimeout(scheduleLayer, delayMs);
  };

  scheduleLayer();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    const now = ctx.currentTime;
    for (const { source, gain } of layers) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        source.stop(now + 0.1);
      } catch {
        /* already stopped */
      }
    }
    layers.length = 0;
  };
}

export default function SoundsRow({
  activeSoundId,
  volume,
  onActiveChange,
  onVolumeChange,
}: SoundsRowProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const stopLooperRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const ensureContext = async () => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) throw new Error("Web Audio API not available");

    if (!ctxRef.current) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = Math.min(1, Math.max(0, volume));
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = master;
    }

    if (ctxRef.current.state === "suspended") {
      await ctxRef.current.resume();
    }

    return { ctx: ctxRef.current, master: masterGainRef.current! };
  };

  const loadBuffer = async (id: string, file: string, ctx: AudioContext) => {
    const cached = bufferCacheRef.current.get(id);
    if (cached) return cached;

    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    const raw = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    bufferCacheRef.current.set(id, buffer);
    return buffer;
  };

  const stopPlayback = () => {
    stopLooperRef.current?.();
    stopLooperRef.current = null;
    setIsPlaying(false);
  };

  // Start / stop when active sound changes
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      stopPlayback();

      if (!activeSoundId) return;

      const def = AMBIENT_SOUNDS.find((s) => s.id === activeSoundId);
      if (!def) return;

      setLoadingId(activeSoundId);
      try {
        const { ctx, master } = await ensureContext();
        if (cancelled) return;

        const buffer = await loadBuffer(def.id, def.file, ctx);
        if (cancelled) return;

        master.gain.value = Math.min(1, Math.max(0, volume));
        stopLooperRef.current = createCrossfadeLooper(ctx, buffer, master);
        setIsPlaying(true);
      } catch (err) {
        console.error("Ambient sound play failed", err);
        if (!cancelled) {
          setIsPlaying(false);
          onActiveChange(null);
        }
      } finally {
        if (!cancelled) setLoadingId(null);
      }
    };

    run();

    return () => {
      cancelled = true;
      stopPlayback();
    };
    // volume is applied via separate effect; intentionally omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSoundId]);

  // Live volume without restarting playback
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = Math.min(1, Math.max(0, volume));
    }
  }, [volume]);

  // Cleanup audio graph on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      const ctx = ctxRef.current;
      ctxRef.current = null;
      masterGainRef.current = null;
      if (ctx) ctx.close().catch(() => {});
    };
  }, []);

  const toggleSound = (id: string) => {
    if (activeSoundId === id && isPlaying) {
      onActiveChange(null);
      return;
    }
    onActiveChange(id);
  };

  const pauseActive = () => {
    onActiveChange(null);
  };

  return (
    <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
      {AMBIENT_SOUNDS.map((sound) => {
        const active = activeSoundId === sound.id && isPlaying;
        const loading = loadingId === sound.id;
        return (
          <button
            key={sound.id}
            onClick={() => toggleSound(sound.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm min-w-max transition-colors cursor-pointer ${
              active
                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                : "bg-gray-100/60 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-neutral-700/60"
            }`}
            title={active ? `Stop ${sound.label}` : `Play ${sound.label}`}
          >
            <SoundIcon id={sound.id} size={13} />
            <span className="text-[11px] font-semibold tracking-wide">{sound.label}</span>
            {loading ? (
              <span className="text-[10px] opacity-60">…</span>
            ) : active ? (
              <Pause size={11} fill="currentColor" />
            ) : (
              <Play size={11} fill="currentColor" />
            )}
          </button>
        );
      })}

      <div className="flex items-center gap-2 pl-1 pr-1 min-w-30 shrink-0">
        <Volume2 size={13} className="text-gray-400 dark:text-gray-500" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1 accent-black dark:accent-white cursor-pointer"
          title="Volume"
        />
        {isPlaying && (
          <button
            onClick={pauseActive}
            className="p-1 rounded-md text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
            title="Stop"
          >
            <Pause size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
