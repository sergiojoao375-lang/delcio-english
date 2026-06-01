# Secção Sobre (About) — SérgioTech

## Objetivo
Adicionar uma página "Sobre" credibilizando o autor (Sérgio João) dentro do app, com header e rodapé fixos.

## Passos

### 1. Guardar a logo
- Copiar `user-uploads://ChatGPT_Image_Jun_1_2026_07_27_20_PM.png` para `src/assets/sergiotech-logo.png` para import via ES6.

### 2. Criar rota `src/routes/about.tsx`
Layout com **header fixo** no topo e **rodapé fixo** no fundo, conteúdo central com scroll.

**Header fixo (`fixed top-0`)**
- Fundo branco com leve sombra/borda inferior
- Logo SérgioTech (pequena, ~40px) à esquerda + texto "SérgioTech" 
- Link "Voltar" para `/`

**Conteúdo central (com `pt-20 pb-20`)**
- Logo SérgioTech grande, centralizada (max-w ~260px)
- Nome em destaque: **Sérgio João** (h1, grande, bold)
- Subtítulo: *Especialista em Electricidade e Telecomunicações* (verde, médio)
- Card com descrição:
  > "Aplicação desenvolvida para cálculo luminotécnico e dimensionamento de sistemas de iluminação, permitindo obter resultados rápidos, precisos e profissionais para projetos elétricos."
- Cartões de contacto (2 colunas em desktop, empilhados em mobile):
  - **WhatsApp** com ícone (lucide `MessageCircle` / phone) → link `https://wa.me/244931728474`
  - **Email** com ícone (lucide `Mail`) → link `mailto:sergiojoao931@gmail.com`
- Botão principal "Contactar" verde grande → abre WhatsApp em nova aba

**Rodapé fixo (`fixed bottom-0`)**
- Fundo branco com borda superior
- Texto centralizado: "© 2026 SérgioTech - Todos os direitos reservados"
- Pequeno (text-xs, muted)

### 3. Estilo visual
- Usar tokens existentes (`--primary` já é verde Delcio — alinha com o pedido)
- Fundo claro `bg-background`
- Destaques `text-primary` / `bg-primary`
- Animações leves (`bubble-in` no card principal)
- Responsivo (mobile-first)

### 4. Link de acesso
- Adicionar link discreto "Sobre" no header da página inicial (`src/routes/index.tsx`) → navega para `/about`.

## Fora de âmbito
- Não alterar a lógica de chat / aprendizagem.
- Não alterar tokens globais do design system.
