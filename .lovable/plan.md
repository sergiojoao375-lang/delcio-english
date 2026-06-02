# Orbe + waveform reativos à voz (Modo Voz)

## Problema
O orbe verde tem só animações CSS estáticas (`voice-orb-breathe`/`spin`), não reage à voz real.

## Solução (em `src/routes/index.tsx` + `src/styles.css`)

### 1. Hook de amplitude do microfone
Quando entra em modo gravação, criar um `AudioContext` + `AnalyserNode` ligado ao `MediaStream` do mic (reaproveitar o stream já obtido em `toggleMic`). Num `requestAnimationFrame` loop, ler `getByteTimeDomainData` → calcular RMS (0–1) → guardar em `useRef` + `useState` (throttled) chamado `level`.

Cleanup: parar rAF e fechar `AudioContext` quando para de gravar ou fecha o modo voz.

### 2. Hook de amplitude da fala do bot (TTS)
`speechSynthesis` não expõe áudio cru. Solução prática: enquanto `speaking` está `true`, gerar um `level` sintético oscilante (combinação de senos com pequeno ruído) que parece fala. Atualizado no mesmo rAF loop. Para quando `onend` dispara.

Resultado: existe sempre um `level` 0–1 que alimenta o orbe e as barras, vindo do mic (recording) OU do TTS (speaking) OU 0 (idle).

### 3. Orbe reativo
Aplicar estilo inline ao orbe:
- `transform: scale(${1 + level * 0.35})`
- `filter: brightness(${1 + level * 0.6}) blur(...)`
- Intensidade do anel exterior (`box-shadow` verde) cresce com `level`.
- Manter `voice-orb-breathe` como base subtil quando idle (level≈0).

### 4. Waveform por baixo do orbe
Adicionar uma fila de ~24 barras verticais (`div` finos verdes) centradas. Cada barra tem altura derivada de `level` + um offset por índice (seno) para criar forma de onda viva. Quando idle, barras ficam pequenas e estáticas; quando recording/speaking, dançam.

Pequenas barras com `rounded-full bg-primary`, gap pequeno, altura mín 4px / máx ~64px.

### 5. Estados visuais
- Idle: orbe respira devagar, barras planas.
- Recording (mic): orbe + barras seguem amplitude real do utilizador, anel pulsante vermelho-ish (manter `voice-orb-pulse`).
- Speaking (bot): orbe + barras seguem oscilação sintética em verde.
- Thinking (loading): manter `voice-orb-spin`, barras com pequena onda contínua.

## Ficheiros tocados
- `src/routes/index.tsx` — novo helper `useVoiceLevel(mediaStream, speaking)`, atualizar componente `VoiceMode` para usar `level`, adicionar `<Waveform level={level} />` inline.
- `src/styles.css` — pequenos ajustes (nenhuma nova keyframe obrigatória; talvez `waveform-idle` subtil).

## Fora de âmbito
- Sem mudanças em `/api/chat`, scoring, página `/about`, layout do chat de texto.
- Sem trocar TTS por ElevenLabs (continua `speechSynthesis`).
