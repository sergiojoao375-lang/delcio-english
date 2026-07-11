## Diagnóstico

O erro "Erro ao falar com o Delcio" no site publicado no Netlify acontece porque:

1. **O app não é um site estático** — ele usa **server functions do TanStack Start** (`src/routes/api/chat.ts` e `src/routes/api/tts.ts`) que rodam no backend, não no browser.
2. O teu `netlify.toml` atual publica só `.output/public` (assets estáticos). As rotas `/api/chat` e `/api/tts` não existem em produção → o fetch devolve 404/HTML → falha → "Erro ao falar com o Delcio".
3. Mesmo que o backend rodasse, faltariam as variáveis de ambiente `LOVABLE_API_KEY` e `ELEVENLABS_API_KEY` no Netlify (elas são geradas automaticamente no Lovable, mas não existem no teu painel Netlify).

Ou seja: **não é só configurar env vars** — o build atual não produz servidor nenhum no Netlify.

## Opções para resolver

### Opção A (recomendada): Publicar via Lovable
Já tens `https://delcio-english.lovable.app` a funcionar. O Lovable executa as server functions e injeta as chaves automaticamente. Se quiseres domínio próprio, ligas-o em Project Settings → Domains. Zero configuração, zero custo de manutenção.

### Opção B: Manter Netlify usando o adapter oficial do TanStack Start para Netlify Functions
Passos:

1. **Ajustar `vite.config.ts`** para gerar o output de servidor no formato Netlify (`target: "netlify"` no plugin TanStack Start), de modo que o build produza uma Netlify Function que serve as rotas `/api/*` e o SSR.
2. **Ajustar `netlify.toml`**:
   - `publish` continua a apontar para o output estático gerado pelo adapter
   - adicionar redirect `/* → /.netlify/functions/server 200` para o handler SSR
3. **Configurar Environment Variables no painel Netlify** (Site settings → Environment variables):
   - `LOVABLE_API_KEY` — precisas gerar/copiar a partir do gateway Lovable (posso gerar uma nova para ti quando implementarmos)
   - `ELEVENLABS_API_KEY` — a mesma chave que já usas no Lovable
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — copiar do `.env` do projeto (necessárias no build)
4. **Rebuild + redeploy** no Netlify.

Notas:
- O AI Gateway do Lovable (`ai.gateway.lovable.dev`) aceita a chave a partir de qualquer host, portanto funciona fora do Lovable — o problema não é CORS nem domínio, é apenas a ausência do backend + chaves.
- O Service Worker offline continua a funcionar normalmente.

## Recomendação

Se o objetivo é só ter o app online publicamente, fica com a **Opção A** — usa `delcio-english.lovable.app` (ou liga um domínio próprio). É gratuito, sem configuração, e as chaves ficam geridas.

Se tens uma razão específica para usar Netlify (integração com outro fluxo, domínio já lá, etc.), diz-me e avanço com a **Opção B** (adapter Netlify + env vars).

**Qual das duas queres que eu implemente?**
