# Tornar Delcio-English Offline (PWA)

## Objetivo
Tornar o app instalável no ecrã inicial de dispositivos móveis e funcionar offline com cache de assets.

## Ícones já gerados
- `public/icon-192x192.png` – ícone padrão
- `public/icon-512x512.png` – ícone grande para splash screens

## Passos

### 1. Criar `public/manifest.json`
Web App Manifest com nome, ícones, cores, `display: standalone` e `start_url: "/"`.

### 2. Criar `public/sw.js`
Service Worker simples que:
- Instala e cacheia o shell básico (`/`, `/index.html`, manifest, ícones, assets estáticos)
- Responde com cache-first para assets estáticos
- Responde com network-first para rotas de navegação
- Ignora chamadas à API (`/api/*`) para evitar cache de dados dinâmicos
- Limpa caches antigos no `activate`

### 3. Atualizar `src/routes/__root.tsx`
- Adicionar `<link rel="manifest" href="/manifest.json" />` no `head`
- Adicionar `<link rel="icon" ...>` para os dois tamanhos de ícone
- Adicionar `<meta name="theme-color" content="#3B82F6" />`
- Adicionar registo do service worker num `useEffect` em `RootComponent` (condicional: só fora de iframe/preview)

### 4. Adicionar indicador de estado offline (opcional mas recomendado)
- Pequeno componente/badge "Offline" visível quando `navigator.onLine === false`
- Desativar o input de chat e mostrar aviso quando offline (a IA precisa de internet)

## Fora de âmbito
- Não se pretende cache de mensagens/mensagens offline (a IA precisa de internet)
- Não se pretende sync em background
- Não se usa `vite-plugin-pwa` (evita problemas no preview do editor)

## Riscos / Notas
- Service workers persistem no browser; usaremos estratégia de cleanup (`skipWaiting` + `clients.claim`)
- No preview do Lovable (iframe), o registo será ignorado via deteção de `isInIframe` / `isPreviewHost`
- O app publicado é que verá o PWA ativo; no preview do editor o service worker não regista
