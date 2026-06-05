## Avatar a falar no modo voz (com lip-sync)

No modo voz, em vez da orbe central, o utilizador passa a ver o **avatar da voz escolhida em grande**, com a **boca a mexer em tempo real** sincronizada com o áudio do Delcio. O efeito é realista o suficiente para parecer que a pessoa do avatar está mesmo a falar.

### Como funciona o lip-sync

Os avatares atuais são imagens estáticas (JPG). Para "mexer a boca" sem refazer arte 3D, uso uma técnica de **mouth overlay reativo ao áudio**:

1. Quando o Delcio começa a falar, ligo o `<audio>` do ElevenLabs a um `AudioContext` + `AnalyserNode` (Web Audio API).
2. A cada frame (`requestAnimationFrame`), leio o volume RMS do áudio (0–1).
3. Esse valor controla a **abertura de uma "boca" SVG** desenhada por cima do avatar, na zona dos lábios — escala vertical + ligeira mudança de forma (fechada → "ah" aberta → "oh" arredondada conforme o nível).
4. Adiciono micro-movimentos passivos (respiração: leve scale 1.0↔1.015; piscar de olhos a cada 4-6s com um overlay de pálpebra) para o avatar não parecer congelado.

Resultado: parece realista porque a boca acompanha mesmo o ritmo da fala, não é uma animação loop genérica.

### O que muda na UI do modo voz

**Antes:** orbe verde animada no centro + cartão pequeno com avatar no canto.

**Depois:**
- **Avatar grande no centro** (~280px circular, com sombra suave verde), substituindo a orbe.
- Anel exterior pulsante verde **só quando `speaking === true`** (mantém o feedback visual da orbe, mas à volta da cara).
- Boca animada (SVG overlay) sobreposta na zona dos lábios do avatar — abre/fecha conforme volume.
- Subtil "respiração" sempre ativa; piscar de olhos ocasional.
- Nome da voz por baixo ("A falar com Sarah").
- Cartão do canto superior esquerdo deixa de ser necessário (a cara já é o foco) — removido no modo voz.

Quando o utilizador está a falar (mic ativo), o avatar fica calmo (boca fechada, sem anel verde) e aparece o indicador de "a ouvir" por baixo, como antes.

### Ficheiros tocados

- `src/routes/index.tsx` — substituir o JSX da orbe pelo novo componente `<SpeakingAvatar />` no modo voz; ligar a referência do `<audio>` TTS ao analisador.
- `src/components/speaking-avatar.tsx` *(novo)* — recebe `avatar`, `audioElement`, `speaking`; faz Web Audio analysis + render do avatar + SVG da boca + respiração/piscar.
- `src/styles.css` — 2 keyframes novos: `avatar-breathe` e `avatar-blink`.

### Fora do âmbito

- Não mexe em TTS, chat, correções faladas, seletor de voz, avatares nas bolhas, auth ou offline.
- Não substituo os avatares por modelos 3D nem uso APIs externas de lip-sync (mantém-se simples, 100% client-side, sem custos extra).
- A boca animada é um overlay estilizado, não um morph fotorrealista do rosto — calibrada para parecer natural à distância de visualização do modo voz.

### Notas técnicas

- `AudioContext` é criado on-demand (1ª fala) e reutilizado; respeita políticas de autoplay porque já houve interação do utilizador para entrar no modo voz.
- A análise pára quando `speaking === false` para não consumir CPU.
- Posição da boca no SVG é fixa em coordenadas relativas (ex.: 50% x, 68% y do círculo) — funciona bem porque todos os 9 avatares foram gerados com o mesmo enquadramento ombros-para-cima.
