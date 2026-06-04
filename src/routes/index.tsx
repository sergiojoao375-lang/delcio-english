import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Send, Languages, RefreshCcw, Flame, Trophy, Sparkles, PartyPopper, Star, Crown, Play, Volume2 } from "lucide-react";
import { VOICES, DEFAULT_VOICE_ID } from "@/lib/voices";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delcio-English — Aprende inglês conversando" },
      {
        name: "description",
        content:
          "Pratique inglês ou português com Delcio, o professor de IA. Conversação, correções gentis, áudio e tradução instantânea.",
      },
      { property: "og:title", content: "Delcio-English — Aprende inglês conversando" },
      {
        property: "og:description",
        content:
          "Pratique inglês ou português com Delcio, o professor de IA. Conversação, correções gentis, áudio e tradução instantânea.",
      },
    ],
  }),
  component: Index,
});

type LearningLang = "en" | "pt";

type Bubble =
  | { id: string; kind: "bot"; text: string; translation?: string }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "correction"; text: string };

const LEVELS = ["Iniciante", "Básico", "Elementar", "Pré-intermediário", "Intermediário"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function stripScore(content: string): { clean: string; correct: boolean | null } {
  const match = content.match(/<score>([\s\S]*?)<\/score>/i);
  let correct: boolean | null = null;
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (typeof parsed.correct === "boolean") correct = parsed.correct;
    } catch {
      /* ignore */
    }
  }
  const clean = content.replace(/<score>[\s\S]*?<\/score>/gi, "").trim();
  return { clean, correct };
}

function splitCorrection(text: string): { correction?: string; rest: string } {
  // Find first line starting with ✏️
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => l.trim().startsWith("✏️"));
  if (idx === -1) return { rest: text };
  const correction = lines[idx].replace(/^✏️\s*/, "").trim();
  const rest = lines.filter((_, i) => i !== idx).join("\n").trim();
  return { correction, rest };
}

function Index() {
  const [stage, setStage] = useState<"welcome" | "chat">("welcome");
  const [name, setName] = useState("");
  const [learningLang, setLearningLang] = useState<LearningLang>("en");

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceId, setVoiceId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_VOICE_ID;
    return localStorage.getItem("delcio.voiceId") || DEFAULT_VOICE_ID;
  });
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);




  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [turns, setTurns] = useState(0); // for progress
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);


  const [celebration, setCelebration] = useState<{
    show: boolean;
    message: string;
    type: "level" | "session";
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef(-1);
  const prevTurnsRef = useRef(-1);

  // History sent to API (excluding corrections/translations meta)
  const apiHistory = useMemo(
    () =>
      bubbles
        .filter((b) => b.kind === "bot" || b.kind === "user")
        .map((b) => ({
          role: b.kind === "bot" ? ("assistant" as const) : ("user" as const),
          content: b.text,
        })),
    [bubbles]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, loading]);

  const levelIndex = Math.min(Math.floor(score / 80), LEVELS.length - 1);
  const level = LEVELS[levelIndex];
  const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;
  const turnsInCycle = turns % 10;
  const progress = (turnsInCycle / 10) * 100;

  // Celebration effects
  useEffect(() => {
    if (stage !== "chat") {
      prevLevelRef.current = levelIndex;
      prevTurnsRef.current = turns;
      return;
    }

    const prevLevel = prevLevelRef.current;
    const prevTurnsVal = prevTurnsRef.current;

    prevLevelRef.current = levelIndex;
    prevTurnsRef.current = turns;

    if (prevLevel < 0) return; // first mount

    if (levelIndex > prevLevel) {
      setCelebration({ show: true, message: `🎉 Parabéns, ${name}! Você subiu para "${level}"!`, type: "level" });
      const t = setTimeout(() => {
        setCelebration((prev) => (prev ? { ...prev, show: false } : null));
      }, 4500);
      const t2 = setTimeout(() => {
        setCelebration(null);
      }, 5500);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }

    if (turns > 0 && turns % 10 === 0 && turns !== prevTurnsVal) {
      setCelebration({ show: true, message: `🎊 Muito bem, ${name}! Você completou 10 turnos de prática!`, type: "session" });
      const t = setTimeout(() => {
        setCelebration((prev) => (prev ? { ...prev, show: false } : null));
      }, 4500);
      const t2 = setTimeout(() => {
        setCelebration(null);
      }, 5500);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [levelIndex, level, turns, name, stage]);

  // Confetti config
  const confetti = useMemo(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF69B4"];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
  }, [celebration?.show]);

  async function speak(text: string, overrideVoiceId?: string) {
    if (typeof window === "undefined") return;
    const cleaned = text.replace(/[🇺🇸🇧🇷✏️🌐🎉🎊⚠️]/g, "").trim();
    if (!cleaned) return;
    try {
      // Cancel any pending speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned, voiceId: overrideVoiceId || voiceId }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setSpeaking(true);
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      // Fallback to browser speech synthesis
      try {
        if (!("speechSynthesis" in window)) return;
        const utter = new SpeechSynthesisUtterance(cleaned);
        utter.lang = learningLang === "en" ? "en-US" : "pt-BR";
        utter.rate = 0.95;
        utter.pitch = 1.1;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch {
        /* ignore */
      }
    }
  }

  async function previewVoice(id: string) {
    if (previewingVoice) return;
    setPreviewingVoice(id);
    const sample =
      learningLang === "en"
        ? "Hello! I'm your English teacher. Let's practice together!"
        : "Olá! Sou seu professor. Vamos praticar juntos!";
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sample, voiceId: id }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  }

  function selectVoice(id: string) {
    setVoiceId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("delcio.voiceId", id);
    }
  }



  // Reactive level from microphone while recording
  useEffect(() => {
    if (!recording) return;
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const Ctx: typeof AudioContext =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        ctx = new Ctx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setVoiceLevel(Math.min(1, rms * 3.2));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* mic denied */
      }
    })();
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      setVoiceLevel(0);
    };
  }, [recording]);

  // Synthetic level while TTS is speaking or while loading
  useEffect(() => {
    if (recording) return;
    if (!speaking && !loading) return;
    let raf = 0;
    const start = performance.now();
    const amp = speaking ? 1 : 0.35;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const wave =
        0.45 +
        0.28 * Math.sin(t * 7.3) +
        0.18 * Math.sin(t * 13.7 + 1.2) +
        0.1 * Math.sin(t * 21.1 + 0.7);
      const noise = (Math.random() - 0.5) * 0.12;
      const v = Math.max(0.06, Math.min(1, Math.abs(wave) + noise)) * amp;
      setVoiceLevel(v);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      setVoiceLevel(0);
    };
  }, [speaking, loading, recording]);


  async function callApi(payload: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("Sem ligação à internet.");
    }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("Muitas requisições — aguarde um momento.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos.");
      throw new Error(data?.error || "Erro ao falar com o Delcio.");
    }
    return (await res.json()) as { content: string };
  }

  async function start() {
    if (!name.trim()) return;
    setStage("chat");
    setLoading(true);
    try {
      const seedUser = {
        role: "user" as const,
        content:
          learningLang === "en"
            ? `Hi! My name is ${name}. I'm a beginner. Please greet me and ask a simple question.`
            : `Oi! Meu nome é ${name}. Sou iniciante. Por favor me cumprimente e me faça uma pergunta simples.`,
      };
      const { content } = await callApi({
        messages: [seedUser],
        userName: name,
        learningLang,
      });
      const { clean } = stripScore(content);
      const { correction, rest } = splitCorrection(clean);
      const newBubbles: Bubble[] = [];
      if (correction)
        newBubbles.push({ id: uid(), kind: "correction", text: correction });
      newBubbles.push({ id: uid(), kind: "bot", text: rest });
      setBubbles(newBubbles);
      speak(rest);
    } catch (e: any) {
      setBubbles([{ id: uid(), kind: "bot", text: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userBubble: Bubble = { id: uid(), kind: "user", text };
    const nextBubbles = [...bubbles, userBubble];
    setBubbles(nextBubbles);
    setLoading(true);
    try {
      const history = [
        ...apiHistory,
        { role: "user" as const, content: text },
      ];
      const { content } = await callApi({
        messages: history,
        userName: name,
        learningLang,
      });
      const { clean, correct } = stripScore(content);
      const { correction, rest } = splitCorrection(clean);

      setBubbles((prev) => {
        const out = [...prev];
        if (correction) out.push({ id: uid(), kind: "correction", text: correction });
        out.push({ id: uid(), kind: "bot", text: rest });
        return out;
      });

      setTurns((t) => t + 1);
      if (correct === true) {
        setScore((s) => s + 10);
        setStreak((s) => s + 1);
      } else if (correct === false) {
        setStreak(0);
      }
      speak(rest);
    } catch (e: any) {
      setBubbles((prev) => [...prev, { id: uid(), kind: "bot", text: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Chrome no desktop.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = learningLang === "en" ? "en-US" : "pt-BR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setRecording(false);
      send(transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  }

  async function translateLast() {
    const lastBot = [...bubbles].reverse().find((b) => b.kind === "bot") as
      | Extract<Bubble, { kind: "bot" }>
      | undefined;
    if (!lastBot || loading) return;
    if (lastBot.translation) return;
    setLoading(true);
    try {
      const { content } = await callApi({
        mode: "translate",
        textToTranslate: lastBot.text,
        learningLang,
      });
      setBubbles((prev) =>
        prev.map((b) =>
          b.id === lastBot.id && b.kind === "bot" ? { ...b, translation: content } : b
        )
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setBubbles([]);
    setScore(0);
    setStreak(0);
    setTurns(0);
    setInput("");
    setCelebration(null);
    prevLevelRef.current = -1;
    prevTurnsRef.current = -1;
    setStage("welcome");
  }

  if (stage === "welcome") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-secondary to-accent">
        <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-xl p-8 border border-border bubble-in">
          <div className="flex justify-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-md bg-primary/10 text-primary-dark font-bold text-sm tracking-wide border border-primary/30">POR</span>
            <span className="px-3 py-1 rounded-md bg-primary/10 text-primary-dark font-bold text-sm tracking-wide border border-primary/30">ENG</span>
          </div>
          <h1 className="text-3xl font-bold text-center text-primary-dark">
            Delcio-English <span className="text-primary">🌍</span>
            <span className="block text-base font-medium text-muted-foreground mt-1">
              Aprenda inglês conversando com IA
            </span>
          </h1>
          <p className="text-center text-muted-foreground mt-2 mb-6">
            Aprenda conversando com o seu professor virtual.
          </p>

          <label htmlFor="learner-name" className="block text-sm font-medium mb-1">
            Como você se chama? / What's your name?
          </label>
          <input
            id="learner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && start()}
          />

          <p className="text-sm font-medium mb-2">O que você quer aprender?</p>
          <div className="grid grid-cols-1 gap-2 mb-6">
            <button
              onClick={() => setLearningLang("en")}
              className={`text-left rounded-lg border px-4 py-3 transition ${
                learningLang === "en"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span className="inline-block min-w-[2.5rem] text-center px-2 py-0.5 mr-2 rounded bg-primary/10 text-primary-dark font-bold text-xs">ENG</span>
              Aprendo <b>Inglês</b> (falo português)
            </button>
            <button
              onClick={() => setLearningLang("pt")}
              className={`text-left rounded-lg border px-4 py-3 transition ${
                learningLang === "pt"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span className="inline-block min-w-[2.5rem] text-center px-2 py-0.5 mr-2 rounded bg-primary/10 text-primary-dark font-bold text-xs">POR</span>
              I'm learning <b>Portuguese</b> (I speak English)
            </button>
          </div>

          <button
            onClick={start}
            disabled={!name.trim()}
            className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-50 transition"
          >
            Começar / Let's Go! 🚀
          </button>
        </div>
      </main>
    );
  }

  const lastUser = [...bubbles].reverse().find((b) => b.kind === "user") as
    | Extract<Bubble, { kind: "user" }>
    | undefined;
  const lastBot = [...bubbles].reverse().find((b) => b.kind === "bot") as
    | Extract<Bubble, { kind: "bot" }>
    | undefined;

  return (
    <main className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-primary-dark text-primary-foreground px-4 py-3 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Delcio-English</span>
            <span className="text-xl">🌍</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-medium border ${
                online
                  ? "bg-emerald-500/15 border-emerald-300/30 text-emerald-100"
                  : "bg-amber-500/20 border-amber-300/40 text-amber-100"
              }`}
              title={online ? "Conectado" : "Sem internet — a IA não responde offline"}
            >
              {online ? "● Online" : "● Offline"}
            </span>
            <span className="bg-white/10 rounded-full px-3 py-1">👤 {name}</span>
            <span className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {score}
            </span>
            <span className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {streak}
            </span>
            <Link
              to="/about"
              className="bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1 text-[12px] font-medium"
            >
              Sobre
            </Link>
          </div>

        </div>
        <div className="max-w-3xl mx-auto mt-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span className="opacity-80">Nível:</span>
              <span className="font-semibold">{level}</span>
            </div>
            <div className="flex items-center gap-1.5" aria-label={`Nível ${levelIndex + 1} de ${LEVELS.length}`}>
              {LEVELS.map((l, i) => (
                <span
                  key={l}
                  title={l}
                  className={`h-2 rounded-full transition-all ${
                    i < levelIndex
                      ? "w-4 bg-correction/70"
                      : i === levelIndex
                        ? "w-6 bg-correction"
                        : "w-4 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] opacity-80">
            <span>Progresso da sessão</span>
            <span>{turnsInCycle} / 10 turnos</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1 h-2 bg-white/15 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-correction transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextLevel && (
            <div className="mt-1.5 text-[11px] opacity-70">
              Próximo: <span className="font-medium opacity-100">{nextLevel}</span>
            </div>
          )}
        </div>
      </header>

      {/* Celebration overlay */}
      {celebration?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in-overlay" />
          <div className="absolute inset-0 overflow-hidden">
            {confetti.map((c) => (
              <div
                key={c.id}
                className="absolute top-0 confetti-fall"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                }}
              >
                <div
                  style={{
                    width: c.size,
                    height: c.size * 0.6,
                    backgroundColor: c.color,
                    borderRadius: 2,
                    transform: `rotate(${c.rotation}deg)`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3 animate-celebration-pop text-center px-6">
            {celebration.type === "level" ? (
              <Crown className="w-14 h-14 text-yellow-400 drop-shadow" />
            ) : (
              <PartyPopper className="w-14 h-14 text-yellow-400 drop-shadow" />
            )}
            <div className="bg-card/95 backdrop-blur rounded-2xl border border-border px-6 py-5 shadow-2xl max-w-sm">
              <p className="text-lg font-bold text-primary-dark">{celebration.message}</p>
              <div className="mt-3 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-correction animate-star-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {bubbles.map((b) => {
            if (b.kind === "user") {
              return (
                <div key={b.id} className="flex justify-end bubble-in">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-user-bubble text-user-bubble-foreground px-4 py-2.5 shadow">
                    {b.text}
                  </div>
                </div>
              );
            }
            if (b.kind === "correction") {
              return (
                <div key={b.id} className="flex justify-start bubble-in">
                  <div className="max-w-[85%] rounded-2xl bg-correction text-correction-foreground px-4 py-2.5 shadow border border-amber-300/50">
                    <div className="text-xs font-semibold mb-1">✏️ Correção</div>
                    <div className="text-sm">{b.text}</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={b.id} className="flex justify-start bubble-in flex-col gap-1.5">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-bot-bubble text-bot-bubble-foreground px-4 py-2.5 shadow whitespace-pre-line">
                  {b.text}
                </div>
                {b.translation && (
                  <div className="max-w-[85%] rounded-2xl bg-translation text-translation-foreground px-4 py-2 italic text-sm shadow border border-blue-200/50">
                    🌐 {b.translation}
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-bot-bubble/80 text-bot-bubble-foreground px-4 py-2.5 shadow">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-3 py-3">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <button
              onClick={() => setMode("text")}
              className={`rounded-full px-3 py-1 border ${
                mode === "text"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border"
              }`}
            >
              Modo Texto ✍️
            </button>
            <button
              onClick={() => setMode("voice")}
              className={`rounded-full px-3 py-1 border ${
                mode === "voice"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border"
              }`}
            >
              Modo Voz 🎙️
            </button>
            <div className="flex-1" />
            <button
              onClick={translateLast}
              disabled={loading}
              className="rounded-full px-3 py-1 border border-border hover:bg-secondary flex items-center gap-1 disabled:opacity-50"
              title="Traduzir última mensagem"
            >
              <Languages className="w-3.5 h-3.5" /> Traduzir
            </button>
            <button
              onClick={restart}
              className="rounded-full px-3 py-1 border border-border hover:bg-secondary flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Recomeçar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`shrink-0 rounded-full w-11 h-11 flex items-center justify-center border ${
                recording
                  ? "bg-destructive text-destructive-foreground border-destructive mic-recording"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
              }`}
              aria-label="Microfone"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                learningLang === "en"
                  ? "Type in English… (ou em português)"
                  : "Digite em português… (or in English)"
              }
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-full w-11 h-11 flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modo Voz — overlay tela cheia estilo Blackbox */}
      {mode === "voice" && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in-overlay">
          <button
            onClick={() => {
              if (recording) recognitionRef.current?.stop();
              if (typeof window !== "undefined") window.speechSynthesis?.cancel();
              setMode("text");
            }}
            aria-label="Fechar modo voz"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/90 z-10"
          >
            ✕
          </button>

          {/* Seletor de voz */}
          {langVoices.length > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("delcio.voiceURI", e.target.value);
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-full px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/40 max-w-[220px] cursor-pointer"
                aria-label="Escolher voz"
              >
                {langVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-black text-white">
                    {v.name.replace(/Microsoft |Google /, "")} · {v.lang}
                  </option>
                ))}
              </select>
            </div>
          )}



          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
            <div className="text-center text-sm uppercase tracking-[0.2em] text-white/60 min-h-[20px]">
              {loading
                ? "A pensar…"
                : speaking
                  ? "A responder…"
                  : recording
                    ? "A ouvir…"
                    : "Toque para falar"}
            </div>

            {/* Orbe */}
            <div className="relative flex items-center justify-center">
              {/* Anel externo reativo */}
              <div
                className="absolute rounded-full border border-primary/40"
                style={{
                  width: 260,
                  height: 260,
                  opacity: 0.25 + voiceLevel * 0.55,
                  transform: `scale(${1 + voiceLevel * 0.35})`,
                  transition: "opacity 80ms linear, transform 80ms linear",
                }}
              />
              <div
                className="absolute rounded-full border border-primary/30"
                style={{
                  width: 320,
                  height: 320,
                  opacity: 0.15 + voiceLevel * 0.4,
                  transform: `scale(${1 + voiceLevel * 0.5})`,
                  transition: "opacity 100ms linear, transform 100ms linear",
                }}
              />
              {/* Pulso quando a gravar */}
              {recording && (
                <div
                  className="absolute rounded-full border-2 border-primary/50 voice-orb-pulse"
                  style={{ width: 300, height: 300 }}
                />
              )}
              {/* Orbe principal reativo */}
              <div
                className={`relative rounded-full ${
                  loading
                    ? "voice-orb-spin"
                    : recording || speaking
                      ? ""
                      : "voice-orb-breathe"
                }`}
                style={{
                  width: 220,
                  height: 220,
                  background:
                    "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--primary) 85%, white), var(--primary) 55%, var(--primary-dark) 100%)",
                  boxShadow: `0 0 ${60 + voiceLevel * 100}px ${10 + voiceLevel * 24}px color-mix(in oklab, var(--primary) ${50 + voiceLevel * 35}%, transparent), inset 0 0 60px rgba(255,255,255,0.18)`,
                  filter: `blur(0.3px) brightness(${1 + voiceLevel * 0.55}) saturate(${1 + voiceLevel * 0.4})`,
                  transform:
                    recording || speaking
                      ? `scale(${1 + voiceLevel * 0.32})`
                      : undefined,
                  transition:
                    "transform 70ms linear, box-shadow 70ms linear, filter 70ms linear",
                }}
              />
            </div>

            {/* Waveform reativa */}
            <Waveform level={voiceLevel} active={recording || speaking || loading} />

            {/* Última troca */}
            <div className="w-full max-w-md text-center space-y-2 min-h-[60px]">
              {lastUser && (
                <p className="text-white/70 text-sm">
                  <span className="text-white/40">Você: </span>
                  {lastUser.text}
                </p>
              )}
              {lastBot && (
                <p className="text-white text-base font-medium leading-snug">
                  {lastBot.text}
                </p>
              )}
            </div>
          </div>


          {/* Botão microfone */}
          <div className="pb-12 pt-4 flex flex-col items-center gap-3">
            <button
              onClick={toggleMic}
              disabled={loading}
              aria-label={recording ? "Parar gravação" : "Falar"}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-2xl ${
                recording
                  ? "bg-destructive text-destructive-foreground mic-recording"
                  : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 disabled:opacity-50"
              }`}
            >
              <Mic className="w-9 h-9" />
            </button>
            <p className="text-xs text-white/40">
              {recording ? "Toque para parar" : "Toque no microfone"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function Waveform({ level, active }: { level: number; active: boolean }) {
  const N = 32;
  return (
    <div className="flex items-end justify-center gap-[3px] h-16">
      {Array.from({ length: N }).map((_, i) => {
        const center = (N - 1) / 2;
        const bell = 1 - Math.abs(i - center) / center;
        const wobble = 0.55 + 0.45 * Math.sin(i * 0.85 + level * 22 + i);
        const h = active
          ? Math.max(4, (6 + level * 58) * (0.35 + bell * 0.65) * wobble)
          : 4;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-primary"
            style={{
              height: h,
              opacity: active ? 0.6 + level * 0.4 : 0.35,
              transition: "height 70ms linear, opacity 120ms linear",
            }}
          />
        );
      })}
    </div>
  );
}

