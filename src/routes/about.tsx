import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, ArrowLeft, Zap } from "lucide-react";
import logoAsset from "@/assets/sergiotech-logo.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre — SérgioTech" },
      {
        name: "description",
        content:
          "Sobre o SérgioTech: aplicação para cálculo luminotécnico e dimensionamento de sistemas de iluminação, por Sérgio João.",
      },
      { property: "og:title", content: "Sobre — SérgioTech" },
      {
        property: "og:description",
        content:
          "Aplicação desenvolvida por Sérgio João, especialista em Electricidade e Telecomunicações.",
      },
    ],
  }),
  component: AboutPage,
});

const WHATSAPP_URL = "https://wa.me/244931728474";
const EMAIL_URL = "mailto:sergiojoao931@gmail.com";

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header fixo */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src={logoAsset.url}
              alt="SérgioTech"
              className="h-9 w-9 object-contain"
            />
            <span className="font-bold text-foreground tracking-tight">
              Sérgio<span className="text-primary">Tech</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo central */}
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-28">
        <section className="bubble-in flex flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt="SérgioTech logo"
            className="w-56 sm:w-64 object-contain drop-shadow-sm"
          />

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Sérgio João
          </h1>
          <p className="mt-2 text-primary font-medium text-base sm:text-lg inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            Especialista em Electricidade e Telecomunicações
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <p className="text-card-foreground leading-relaxed text-center sm:text-left">
            Aplicação desenvolvida para cálculo luminotécnico e dimensionamento
            de sistemas de iluminação, permitindo obter resultados rápidos,
            precisos e profissionais para projetos elétricos.
          </p>
        </section>

        {/* Contactos */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                WhatsApp
              </div>
              <div className="font-semibold text-foreground truncate">
                +244 931 728 474
              </div>
            </div>
          </a>

          <a
            href={EMAIL_URL}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <Mail className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </div>
              <div className="font-semibold text-foreground truncate">
                sergiojoao931@gmail.com
              </div>
            </div>
          </a>
        </section>

        {/* Botão Contactar */}
        <div className="mt-8 flex justify-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            Contactar
          </a>
        </div>
      </main>

      {/* Rodapé fixo */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-3 text-center text-xs text-muted-foreground">
          © 2026 SérgioTech — Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}
