## Objetivo
1. Delcio deve responder **só no idioma que o usuário está aprendendo**. A tradução para a língua nativa aparece **apenas** quando o usuário toca em "Traduzir".
2. Substituir o rótulo/bandeira **BR** por **POR** em toda a UI (e, por simetria, **US → ENG**).

## Mudanças

### `src/routes/api/chat.ts` — system prompt do modo `chat`
- Regra 2 reescrita: responder **somente em `${target}`**, 2–4 linhas curtas, sem repetir em `${native}`, sem prefixar com bandeiras.
- Regra 3 reescrita: pergunta final **somente em `${target}`**.
- Regra 1 mantida: se houver erro, linha de correção `✏️ <correção> — <explicação curta em ${native}>` (didática e condicional).
- Regra do `<score>` mantida.
- Modo `translate` permanece igual.

### `src/routes/index.tsx` — UI
- Welcome screen: substituir o bloco `🇧🇷 🇺🇸` por dois chips de texto **POR** e **ENG** (mesmo tamanho/estilo do atual).
- Botões "O que você quer aprender?":
  - `🇺🇸 Aprendo Inglês …` → `ENG · Aprendo Inglês (falo português)`
  - `🇧🇷 I'm learning Portuguese …` → `POR · I'm learning Portuguese (I speak English)`
- Como a resposta do bot agora vem num único idioma, o bubble do bot renderiza normal (sem mudanças estruturais). O `splitCorrection` continua removendo a linha `✏️`.
- Botão **Traduzir** e função `translateLast()` continuam iguais — passa a ser a única forma de ver a tradução.
- `speak()` segue usando `learningLang` (já correto, sem repetição de idiomas).

## Fora de escopo
- Sem alterações em pontuação, níveis, progresso da sessão, voz, header de nível, ou `src/styles.css`.
- Sem alterações no modo `translate` da API nem no fluxo do microfone.

## Observação
Vou usar **POR** e **ENG** como rótulos de texto (sem bandeiras). Se preferir manter 🇺🇸 e só trocar 🇧🇷, me diga antes de implementar.
