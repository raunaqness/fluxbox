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

export default function SoundsRow({
  activeSoundId,
  volume,
  onActiveChange,
  onVolumeChange,
}: SoundsRowProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Create / swap audio element when active sound changes
  useEffect(() => {
    const audio = audioRef.current ?? new Audio();
    audio.loop = true;
    audioRef.current = audio;

    if (!activeSoundId) {
      audio.pause();
      audio.removeAttribute("src");
      setIsPlaying(false);
      return;
    }

    const def = AMBIENT_SOUNDS.find((s) => s.id === activeSoundId);
    if (!def) return;

    const nextSrc = def.file;
    const needsNewSrc = !audio.src.endsWith(nextSrc);
    if (needsNewSrc) {
      audio.src = nextSrc;
      audio.load();
    }
    audio.volume = Math.min(1, Math.max(0, volume));
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error("Ambient sound play failed", err);
        setIsPlaying(false);
        onActiveChange(null);
      });

    return () => {
      // Don't destroy on every dep change — handled in unmount effect below
    };
  }, [activeSoundId]);

  // Volume updates without restarting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = (id: string) => {
    if (activeSoundId === id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      onActiveChange(null);
      return;
    }
    onActiveChange(id);
  };

  const pauseActive = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    // Keep activeSoundId so Play on the same chip resumes — actually design is toggle off.
    // Clear active so chip returns to idle look.
    onActiveChange(null);
  };

  return (
    <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
      {AMBIENT_SOUNDS.map((sound) => {
        const active = activeSoundId === sound.id && isPlaying;
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
            {active ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
          </button>
        );
      })}

      <div className="flex items-center gap-2 pl-1 pr-1 min-w-[7.5rem] flex-shrink-0">
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
