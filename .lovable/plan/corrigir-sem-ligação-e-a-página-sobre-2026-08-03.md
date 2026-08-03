# Corrigir "Sem ligação" e a página Sobre

## 1. Aviso "Sem ligação" sempre visível

Hoje existem dois indicadores de rede independentes:
- o distintivo vermelho fixo no topo (`OfflineIndicator`);
- o distintivo verde "● Online" dentro do cabeçalho do chat.

Ambos leem `navigator.onLine`, mas em estados diferentes, por isso aparecem os
dois ao mesmo tempo (vermelho + verde), como na captura.

Correções:
- Passar a existir **uma única fonte de verdade** de estado de rede: o hook
  `use-online-status` é usado tanto pelo indicador fixo como pelo cabeçalho, e o
  estado local duplicado dentro da página do chat é removido.
- Tornar a deteção mais fiável: assumir "online" por omissão e só marcar offline
  depois de o evento `offline` do browser disparar **e** um pequeno pedido de
  verificação falhar; ao voltar `online`, limpar imediatamente o aviso. Isto
  evita o falso "sem ligação" causado por `navigator.onLine` incorreto em alguns
  browsers/preview.
- O distintivo vermelho passa a mostrar-se apenas quando realmente não há
  ligação, e nunca em simultâneo com o "● Online".

## 2. Página "Sobre" com texto errado

A página descreve "cálculo luminotécnico e dimensionamento de sistemas de
iluminação" — nada a ver com o Delcio-English.

Reescrever o conteúdo para o produto real, mantendo o layout, o logótipo
SérgioTech, o cabeçalho/rodapé fixos e os contactos:
- Título e metadados: "Sobre — Delcio-English".
- Descrição: assistente de conversação com IA para aprender inglês e português,
  com correções instantâneas, modo de voz com vozes realistas, níveis e
  progresso, e funcionamento offline (PWA).
- Pequena lista das funcionalidades principais.
- Crédito: desenvolvido por Sérgio João / SérgioTech, especialista em
  Electricidade e Telecomunicações.

## 3. Revisão final do software

- Verificar o app com o navegador de testes (ecrã inicial, chat, modo voz,
  Sobre) e corrigir erros de consola/runtime que apareçam.
- Confirmar que os metadados de cada página são únicos e coerentes com
  Delcio-English.

## Notas técnicas

- Ficheiros: `src/hooks/use-online-status.ts`, `src/components/offline-indicator.tsx`,
  `src/routes/index.tsx` (remover estado `online` duplicado, linhas ~93-101 e
  ~620-626), `src/routes/about.tsx`.
- Verificação de rede: `fetch('/manifest.json', { method: 'HEAD', cache: 'no-store' })`
  com timeout curto, apenas quando o browser reporta offline.
