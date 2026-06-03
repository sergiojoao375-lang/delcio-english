## Vozes mais naturais com ElevenLabs (escolha do utilizador)

Substituir o `speechSynthesis` do navegador (robotizado) por **ElevenLabs TTS** — vozes humanas de alta qualidade, consistentes em qualquer dispositivo. O utilizador escolhe a voz numa lista curada de vozes amigáveis.

### Pré-requisito
Adicionar a chave `ELEVENLABS_API_KEY` aos secrets do projeto. Vou pedi-la via `add_secret` quando começar a implementação. Indicações para o utilizador: criar conta em elevenlabs.io → Profile → API Keys → copiar a chave.

### Mudanças

**1. Novo endpoint server `src/routes/api/tts.ts`**
- POST `{ text, voiceId }` → devolve MP3 binário (`audio/mpeg`).
- Usa `eleven_multilingual_v2` (suporta EN e PT-BR).
- Lê `process.env.ELEVENLABS_API_KEY`; 500 se faltar.
- `voice_settings`: stability 0.5, similarity_boost 0.75, style 0.4, speed 1.0 — tom conversacional e quente.
- Valida `text` (1–2000 chars) e `voiceId` contra allowlist.

**2. Catálogo de vozes amigáveis `src/lib/voices.ts`**
Lista curada (todas multilingues, soam naturais em EN e PT):
- **Sarah** — feminina, calma, amigável (`EXAVITQu4vr4xnSDxMaL`)
- **Laura** — feminina, animada (`FGY2WhTYpPnrIDTdsKH5`)
- **Lily** — feminina, doce e jovem (`pFZP5JQG7iQjIQuC4Bku`)
- **Matilda** — feminina, calorosa (`XrExE9yKIg1WjnnlVkGX`)
- **Charlie** — masculina, natural (`IKne3meq5aSn9XLyUdCD`)
- **George** — masculina, calma (`JBFqnCBsd6RMkjVDRZzb`)
- **Liam** — masculina, jovem e simpática (`TX3LPaxmHKxFdv7VOQHJ`)
- **Brian** — masculina, descontraída (`nPczCjzI2devNBz1zQrb`)

Cada entrada: `{ id, name, gender, description }`.

**3. `src/routes/index.tsx`**
- Remover lógica de `speechSynthesis.getVoices()` e do `<select>` de vozes do SO (adicionado na iteração anterior).
- Novo estado `voiceId` persistido em `localStorage` (default: Sarah).
- Reescrever `speak(text)`:
  - `fetch('/api/tts', { method: 'POST', body: { text, voiceId } })`
  - `response.blob()` → `URL.createObjectURL` → `new Audio(url)` → `play()`
  - Ligar `onplay`/`onended`/`onerror` a `setSpeaking`.
  - Guardar ref do `Audio` atual para poder cancelar quando o utilizador fecha o modo voz ou começa a falar.
  - Fallback: se o fetch falhar (offline, 429, 402), mostrar toast e cair em `speechSynthesis` como backup.
- Substituir o `<select>` atual por um picker mais cuidado no canto superior esquerdo do modo voz:
  - Mostra a voz atual com nome + género.
  - Clicar abre um pequeno painel com a lista das 8 vozes, cada uma com nome, descrição e botão "▶ Ouvir" (toca uma amostra curta de ~3 s da voz).
  - Selecionar fecha o painel e guarda em localStorage.

### Fora do âmbito
- Sem mudanças no chat, orbe, waveform, auth, base de dados, ou modo offline.
- Sem streaming TTS (mantém-se simples — MP3 completo). Posso adicionar depois se for lento.

### Notas técnicas
- ElevenLabs é pago após free tier (~10k chars/mês grátis). Vou comunicar isto ao utilizador quando pedir a chave.
- Em offline, salta o fetch e usa o `speechSynthesis` (que já funciona sem rede).
