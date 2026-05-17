## Objetivo

Tornar o nível atual e o progresso da sessão claramente visíveis no header durante o chat. Hoje já existe um indicador, mas é fino e discreto — vamos transformá-lo num bloco dedicado e legível.

## O que muda

No header (`src/routes/index.tsx`, estado `chat`):

1. **Bloco "Nível"** abaixo da linha do logo:
   - Texto: `Nível: Iniciante` (atualiza para Básico → Elementar → Pré-intermediário → Intermediário conforme a pontuação).
   - Mini "stepper" com 5 pontos representando os 5 níveis; o ponto do nível atual fica destacado e os anteriores marcados como concluídos.

2. **Barra de progresso da sessão**:
   - Altura aumentada (de 1.5px para ~8px) com cantos arredondados.
   - Label à esquerda: `Progresso da sessão` e à direita: `X / 10 turnos` (a cada 10 turnos a barra reseta — comportamento atual).
   - Transição suave ao avançar.

3. **Próximo nível**:
   - Pequena legenda: `Próximo: Básico` (oculta quando já está no nível máximo).

4. Mantém as pílulas existentes (👤 nome, 🏆 pontos, 🔥 streak) na primeira linha — sem mudanças.

## Detalhes técnicos

- Sem novas dependências; apenas marcação e classes Tailwind usando tokens já definidos em `src/styles.css` (`bg-correction`, `bg-white/15`, `text-primary-foreground` etc.).
- Lógica de nível e progresso permanece a mesma:
  - `level = LEVELS[min(floor(score / 80), 4)]`
  - `progress = (turns % 10) / 10 * 100`
- Adicionar derivação `nextLevel` e contador `turns % 10` para o label.
- Acessibilidade: usar `role="progressbar"` com `aria-valuenow`, `aria-valuemin`, `aria-valuemax` na barra.
- Responsivo: no mobile o bloco continua dentro de `max-w-3xl mx-auto` e quebra naturalmente.

## Fora do escopo

- Não alterar a fórmula de pontuação nem os limiares dos níveis.
- Não persistir progresso (continua por sessão).
- Não mexer no fluxo de welcome nem no composer.
