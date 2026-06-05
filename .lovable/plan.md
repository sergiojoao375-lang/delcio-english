## Avatares para as vozes do Delcio

Cada voz (Sarah, Laura, Lily, Matilda, Jessica, Charlie, George, Liam, Brian) vai ganhar uma cara. O utilizador passa a ver claramente *com quem* está a falar — no seletor de voz, no modo voz (junto à orbe) e nas mensagens do bot no chat.

### O que muda

**1. Gerar 9 avatares** (`src/assets/voices/`)
Retratos estilizados, consistentes entre si (mesmo estilo de ilustração, fundo circular suave em tom da marca, enquadramento ombros-para-cima, expressão amigável). Um por voz, combinando com a descrição (ex.: Lily = jovem e doce; George = maduro e calmo; Brian = casual). Guardados como assets via `lovable-assets` e referenciados em `src/lib/voices.ts` como `avatar: string`.

**2. `src/lib/voices.ts`**
Adicionar campo `avatar` a cada `VoiceOption`.

**3. Seletor de voz (texto + modo voz) em `src/routes/index.tsx`**
- Botão "Voz: [Nome]" passa a mostrar o avatar circular (24px) + nome.
- Painel de escolha: cada voz aparece como linha com avatar (40px) + nome + descrição + botão "Ouvir". A voz selecionada fica com anel verde à volta do avatar.

**4. Modo voz (orbe central)**
- Pequeno cartão flutuante no canto superior esquerdo com avatar + nome da voz atual (substitui o botão de texto simples).
- Quando o Delcio está a falar (`speaking === true`), o avatar ganha um anel pulsante verde sincronizado com a orbe, reforçando "é esta pessoa que está a falar agora".

**5. Mensagens do bot no chat**
- Cada bolha do bot passa a ter o avatar da voz selecionada à esquerda (32px). Se o utilizador mudar de voz, as novas mensagens usam o novo avatar (mensagens antigas mantêm o avatar com que foram criadas — guardado no objeto da mensagem).

### Fora do âmbito
- Não muda lógica de TTS, chat, correções faladas, orbe, auth ou offline.
- Sem animações de boca/lip-sync (apenas o anel pulsante durante a fala).
- Mantém-se as 9 vozes atuais; sem adicionar/remover.

### Notas
- Os 9 avatares são gerados em paralelo com `imagegen` (estilo: ilustração flat moderna, paleta quente, fundo circular verde-claro da marca) para garantir coerência visual.
