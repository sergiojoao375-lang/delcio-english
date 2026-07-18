## Objetivo

Tornar as chamadas ao backend (`/api/chat`, `/api/tts`) resilientes durante a janela de rotação da `LOVABLE_API_KEY` (~1h de coexistência), com retries automáticos e log estruturado de falhas para debug.

## Mudanças

### 1. Novo helper cliente `src/lib/api-client.ts`
Wrapper único `fetchWithRetry(url, init, opts)` usado por todas as chamadas de frontend:
- Até **3 tentativas** com backoff exponencial (400ms → 900ms → 2000ms + jitter).
- Retry apenas em: erros de rede, `408`, `429`, `500`, `502`, `503`, `504` e no novo código `401/403` com corpo `{ error: "unauthorized" | "key_rotated" }`.
- Não faz retry em `402` (créditos) nem em `400` (request inválido).
- Cada tentativa recebe um `requestId` (uuid curto) enviado no header `X-Client-Request-Id` para correlação.
- Em qualquer falha final, chama `logClientError({ requestId, url, attempts, status, message, ts })`:
  - Guarda os últimos 20 erros em `localStorage` (`delcio:error-log`).
  - `console.error` estruturado no modo dev.

### 2. Sinalização de "chave rotacionada" no servidor
Em `netlify/functions/chat.mjs`, `netlify/functions/tts.mjs` e `src/routes/api/chat.ts`, `src/routes/api/tts.ts`:
- Quando o upstream retorna `401`/`403`, responder com JSON `{ error: "key_rotated", retryable: true }` e status `503` (para o cliente entender que deve fazer retry com backoff maior, evitando loop imediato).
- Adicionar header `X-Backend-Request-Id` refletindo o `X-Client-Request-Id` recebido.
- Log server-side com `console.error(JSON.stringify({ scope, requestId, upstreamStatus, message }))` para aparecer nos logs do Netlify / server functions.

### 3. Integrar no `src/routes/index.tsx`
Trocar os `fetch("/api/chat", ...)` e `fetch("/api/tts", ...)` pelo novo `fetchWithRetry`. Manter os erros de UX existentes ("Erro ao falar com o Delcio"), mas adicionar sub-mensagem quando `error === "key_rotated"`: *"A conectar novamente ao servidor…"* durante os retries.

### 4. Página oculta de debug `src/routes/debug.tsx`
Rota simples (não linkada) que lê `localStorage["delcio:error-log"]` e mostra tabela com timestamp, url, status, tentativas e requestId, com botão "Limpar". Útil para o utilizador enviar screenshot em caso de falha persistente.

## Detalhes técnicos

- Sem novas dependências.
- `fetchWithRetry` aborta com `AbortController` respeitando um `timeout` opcional (default 30s por tentativa) para não pendurar o UI.
- O código de status `503 + key_rotated` foi escolhido porque muitos proxies/CDN já entendem `503` como transitório; o corpo JSON deixa claro o motivo.
- Nenhuma alteração no fluxo de rotação em si (continua manual via painel do Lovable → Netlify).

## Fora de escopo

- Envio automático dos logs para um backend remoto (fica em `localStorage`).
- Rotação automática da chave.
