## Tirar a "mancha" preta da boca

O avatar do Sarah (e dos outros 8) já tem **a boca desenhada na imagem original**. O componente `SpeakingAvatar` está a desenhar por cima uma elipse escura (`fill="#3a1212"`) + sombra para simular abertura — e é isso que aparece como mancha castanha/preta sobre os lábios da Sarah.

Como os avatares são ilustrações estilizadas com bocas diferentes (posição, forma, cor de batom variam), **não há posição/cor universal** que encaixe nos 9 sem ficar mal. Em vez de tentar calibrar 9 overlays, removo o overlay e uso uma técnica visual mais limpa que continua a dar a sensação de "está a falar":

### Nova abordagem (sem overlay sobre a cara)

Mantenho o lip-sync via Web Audio (RMS por frame), mas em vez de desenhar boca por cima, uso esse valor para:

1. **Micro-deformação vertical do avatar** — `scaleY` muito subtil (1.0 ↔ ~1.012) com `transform-origin: top center`, dando a ilusão de mandíbula a mexer. Imperceptível parado, natural durante fala.
2. **Pulso do anel verde** já existente, agora reativo ao volume (mais forte em sílabas tónicas).
3. **Brilho/shadow** do avatar pulsa com volume (já existe — mantém-se).
4. Respiração e piscar de olhos passivos — mantêm-se.

Resultado: a cara da Sarah aparece **limpa, sem mancha**, e continua a "ganhar vida" sincronizada com o áudio.

### Ficheiro tocado

- `src/components/speaking-avatar.tsx` — remover o `<svg>` com elipse da boca, sombra e dentes; aplicar `scaleY` reativo ao container do `<img>` em vez disso.

### Fora do âmbito

Não mexo em TTS, vozes, seleção, bolhas, ou qualquer outra parte. Só limpeza visual do avatar grande no modo voz.
