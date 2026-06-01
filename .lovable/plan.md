# Corrigir layout do chat + Modo Voz "Blackbox"

## 1. Cabeçalho e rodapé fixos no chat

**Problema:** No mobile, `min-h-screen` + `flex-1 overflow-y-auto` não confina o scroll — a página inteira rola e o cabeçalho/rodapé sobem junto.

**Fix em `src/routes/index.tsx` (rota `/`, stage chat):**
- Substituir `min-h-screen flex flex-col` por `h-[100dvh] flex flex-col overflow-hidden` no `<main>`.
- Manter o `<header>` e o composer como filhos diretos (não-scrolláveis); só a `<div ref={scrollRef}>` (chat) faz scroll. Já está `flex-1 overflow-y-auto`.
- Resultado: cabeçalho "Delcio-English" e rodapé do input ficam fixos; só as bolhas rolam.

## 2. Modo Voz tela cheia (estilo Blackbox)

Quando o utilizador clicar em **"Modo Voz 🎙️"**, abrir um overlay tela cheia em vez de só mudar o estado:

**Novo componente inline `VoiceMode`** (mesmo ficheiro):
- Overlay `fixed inset-0 z-50` com fundo preto (`bg-black`), texto branco.
- **Orbe central animado**: círculo grande (~220px) com gradiente verde (cor `--primary`), `blur` suave e animação contínua de pulso/respirar. Quando `recording` → pulsa mais rápido e ganha anel exterior; quando `loading` (IA a responder) → roda gradiente; idle → respira devagar.
- **Status textual** acima do orbe: "Toque para falar" / "A ouvir…" / "A pensar…" / "A responder…".
- **Botão grande do microfone** abaixo do orbe (~72px, redondo, verde). Toca para iniciar/parar gravação (reusa `toggleMic`).
- **Botão X no canto superior direito** para fechar (volta a `mode = "text"`).
- Última transcrição do utilizador e última resposta do bot em texto pequeno discreto no fundo (opcional, ajuda contexto).

**Novas keyframes em `src/styles.css`:**
- `voice-orb-breathe` — escala 1 → 1.06 → 1, 4s ease-in-out infinite.
- `voice-orb-pulse` — escala + opacidade do anel exterior, 1.2s infinite (recording).
- `voice-orb-spin` — gradiente conic a rodar 360deg, 3s linear infinite (loading).

**Comportamento:**
- Entrar no modo voz NÃO esconde o chat por baixo (estado preservado) — apenas sobrepõe.
- Fechar (X) → `setMode("text")`, scroll do chat permanece onde estava.
- `speak()` continua a funcionar (já depende de `mode === "voice"`).

## Fora de âmbito
- Sem mudanças na API `/api/chat`, sem alteração da lógica de pontuação/níveis, sem alteração na página `/about`.
