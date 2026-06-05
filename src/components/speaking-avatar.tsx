import { useEffect, useRef, useState } from "react";

type Props = {
  avatar: string;
  name: string;
  audio: HTMLAudioElement | null;
  speaking: boolean;
  size?: number;
};

// Module-singleton AudioContext + map of already-connected media elements
let audioCtx: AudioContext | null = null;
const connected = new WeakMap<HTMLMediaElement, { analyser: AnalyserNode }>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function attach(el: HTMLMediaElement): AnalyserNode | null {
  const ctx = getCtx();
  if (!ctx) return null;
  const existing = connected.get(el);
  if (existing) return existing.analyser;
  try {
    const source = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    connected.set(el, { analyser });
    return analyser;
  } catch {
    return null;
  }
}

export function SpeakingAvatar({ avatar, name, audio, speaking, size = 280 }: Props) {
  const [mouth, setMouth] = useState(0); // 0..1 opening
  const [blink, setBlink] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Lip-sync: read RMS from current audio element while speaking
  useEffect(() => {
    if (!audio || !speaking) {
      setMouth(0);
      return;
    }
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    const analyser = attach(audio);
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length); // ~0..0.5
      const norm = Math.min(1, rms * 3.2);
      setMouth((prev) => prev * 0.45 + norm * 0.55);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setMouth(0);
    };
  }, [audio, speaking]);

  // Blink loop
  useEffect(() => {
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      const wait = 3500 + Math.random() * 3000;
      setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          loop();
        }, 140);
      }, wait);
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mouth geometry (relative to avatar circle)
  const mouthCx = 50;
  const mouthCy = 72;
  const mouthW = 14 + mouth * 6; // wider when louder
  const mouthH = 1.5 + mouth * 11;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer pulse rings while speaking */}
      {speaking && (
        <>
          <span
            className="absolute rounded-full border-2 border-primary/60 voice-orb-pulse"
            style={{ width: size + 30, height: size + 30 }}
          />
          <span
            className="absolute rounded-full border border-primary/40"
            style={{
              width: size + 60,
              height: size + 60,
              opacity: 0.3 + mouth * 0.5,
              transform: `scale(${1 + mouth * 0.05})`,
              transition: "opacity 80ms linear, transform 80ms linear",
            }}
          />
        </>
      )}

      {/* Avatar with breathing */}
      <div
        className="relative rounded-full overflow-hidden shadow-2xl"
        style={{
          width: size,
          height: size,
          boxShadow: speaking
            ? `0 0 ${40 + mouth * 80}px ${6 + mouth * 18}px color-mix(in oklab, var(--primary) ${45 + mouth * 35}%, transparent)`
            : "0 10px 40px rgba(0,0,0,0.45)",
          animation: "avatar-breathe 4.5s ease-in-out infinite",
          border: "3px solid color-mix(in oklab, var(--primary) 70%, white 10%)",
        }}
      >
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />

        {/* Eyelid blink overlay (very subtle, top quarter) */}
        <div
          aria-hidden
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "32%",
            height: "10%",
            background:
              "linear-gradient(to bottom, color-mix(in oklab, currentColor 0%, transparent) 0%, rgba(0,0,0,0.0) 100%)",
            transformOrigin: "center top",
            transform: blink ? "scaleY(1)" : "scaleY(0)",
            transition: blink ? "transform 90ms ease-in" : "transform 160ms ease-out",
            backgroundColor: blink ? "rgba(0,0,0,0.25)" : "transparent",
            mixBlendMode: "multiply",
          }}
        />

        {/* Mouth SVG overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Soft shadow under mouth */}
          <ellipse
            cx={mouthCx}
            cy={mouthCy + mouthH * 0.25}
            rx={mouthW * 0.55}
            ry={Math.max(0.6, mouthH * 0.45)}
            fill="rgba(0,0,0,0.18)"
          />
          {/* Mouth body */}
          <ellipse
            cx={mouthCx}
            cy={mouthCy}
            rx={mouthW / 2}
            ry={Math.max(0.7, mouthH / 2)}
            fill="#3a1212"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={0.4}
            style={{ transition: "rx 60ms linear, ry 60ms linear" }}
          />
          {/* Upper-teeth hint when slightly open */}
          {mouth > 0.15 && (
            <rect
              x={mouthCx - mouthW / 2 + 1.2}
              y={mouthCy - mouthH / 2 + 0.3}
              width={mouthW - 2.4}
              height={Math.min(1.6, mouthH * 0.22)}
              rx={0.6}
              fill="#f6efe6"
              opacity={Math.min(1, (mouth - 0.15) * 2.5)}
            />
          )}
        </svg>
      </div>

      {/* Name caption */}
      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
          {speaking ? "A falar" : "Voz"}
        </div>
        <div className="text-base font-medium text-white">{name}</div>
      </div>
    </div>
  );
}
