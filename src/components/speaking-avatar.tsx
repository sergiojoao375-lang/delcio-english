import { useEffect, useRef, useState } from "react";

type Props = {
  avatar: string;
  name: string;
  audio: HTMLAudioElement | null;
  speaking: boolean;
  size?: number;
};

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
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    connected.set(el, { analyser });
    return analyser;
  } catch {
    return null;
  }
}

export function SpeakingAvatar({ avatar, name, audio, speaking, size = 280 }: Props) {
  const [mouth, setMouth] = useState(0);
  const [blink, setBlink] = useState(false);
  const rafRef = useRef<number | null>(null);

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
      const rms = Math.sqrt(sum / data.length);
      const norm = Math.min(1, rms * 3.5);
      setMouth((prev) => prev * 0.5 + norm * 0.5);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setMouth(0);
    };
  }, [audio, speaking]);

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

  const open = mouth;
  // Mouth position (approximate for these portrait avatars)
  const mouthTopPct = 72; // % from top
  const mouthCenterXPct = 50;
  const mouthWidth = size * 0.18;
  const mouthHeight = 4 + open * (size * 0.06);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
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
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
          style={{
            transform: `scaleY(${1 + open * 0.015})`,
            transformOrigin: "center top",
            transition: "transform 60ms linear",
          }}
        />

        {/* Mouth opening — small dark ellipse right at the lips */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: `${mouthTopPct}%`,
            left: `${mouthCenterXPct}%`,
            width: mouthWidth,
            height: mouthHeight,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(ellipse at center, rgba(30,8,12,0.85) 0%, rgba(30,8,12,0.6) 60%, rgba(30,8,12,0) 100%)",
            borderRadius: "9999px",
            opacity: open > 0.08 ? Math.min(1, open * 1.4) : 0,
            transition: "opacity 60ms linear, height 60ms linear",
            filter: "blur(1.5px)",
          }}
        />

        {/* Blink */}
        <div
          aria-hidden
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "32%",
            height: "10%",
            transformOrigin: "center top",
            transform: blink ? "scaleY(1)" : "scaleY(0)",
            transition: blink ? "transform 90ms ease-in" : "transform 160ms ease-out",
            backgroundColor: blink ? "rgba(0,0,0,0.18)" : "transparent",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
          {speaking ? "A falar" : "Voz"}
        </div>
        <div className="text-base font-medium text-white">{name}</div>
      </div>
    </div>
  );
}
