## Indicador visual de "Offline"

Adicionar um indicador visual quando `navigator.onLine === false`, para o utilizador perceber claramente quando está sem internet (especialmente útil quando o `/api/chat` falha por falta de rede).

### Mudanças

**1. Novo hook `src/hooks/use-online-status.ts`**
- Retorna `boolean` com estado atual.
- Inicializa com `navigator.onLine` (com guard para SSR → `true` por defeito).
- Regista listeners `online` / `offline` em `window` e limpa no unmount.

**2. Novo componente `src/components/offline-indicator.tsx`**
- Usa o hook. Quando offline, renderiza um badge fixo no topo (centrado):
  - Pequena pill com ícone `WifiOff` (lucide-react) + texto "Sem ligação".
  - Estilo: `bg-destructive text-destructive-foreground`, `rounded-full`, sombra suave, `fixed top-3 left-1/2 -translate-x-1/2 z-50`.
  - Animação subtil de entrada (fade + slide down) via classes Tailwind existentes.
- Não renderiza nada quando online.

**3. `src/routes/__root.tsx`**
- Importar e montar `<OfflineIndicator />` dentro de `RootComponent`, ao lado do `<Outlet />`, para ficar visível em todas as rotas.

**4. `src/routes/index.tsx` (modo voz)**
- Quando o utilizador tenta enviar/gravar enquanto offline, mostrar um `toast` curto ("Sem ligação à internet") em vez de tentar chamar `/api/chat`. Verificação simples no início de `callApi` / `sendText`.

### Fora do âmbito
- Não muda o comportamento do Service Worker.
- Não altera o orbe, waveform, autenticação, ou lógica do chat.
- Sem mudanças na base de dados.
