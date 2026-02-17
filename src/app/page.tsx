'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  GitBranch,
  Lock,
  MagnifyingGlass,
  ArrowRight,
  Check,
  Terminal,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] landing-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0b]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center overflow-hidden">
                <Image
                  src="/icon-192x192.png"
                  alt="Prompt Manager"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-semibold tracking-tight">Prompt Manager</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/app"
                className="text-sm text-white/60 hover:text-white transition-colors duration-150"
              >
                Documentación
              </Link>
              <Link
                href="/app"
                className="text-sm text-white/60 hover:text-white transition-colors duration-150"
              >
                Precios
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm text-white/60 hover:text-white transition-colors duration-150"
              >
                Iniciar sesión
              </Link>
              <Button size="sm" className="bg-[#8b5cf6] hover:bg-[#7c3aed]" asChild>
                <Link href="/app">Comenzar gratis</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-white/50 font-mono">v2.0 estable</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
              Manage AI prompts
              <br />
              <span className="text-white/40">like code.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-white/50 max-w-xl mb-8 leading-relaxed">
              Versiona, organiza y reutiliza tus prompts con la misma disciplina
              que aplicas a tu código. Dile adiós a prompts perdidos en chats.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Button size="lg" className="bg-[#8b5cf6] hover:bg-[#7c3aed] gap-2" asChild>
                <Link href="/app">
                  Comenzar gratis
                  <ArrowRight weight="regular" className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/[0.15] text-white/80 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.25]"
                asChild
              >
                <Link href="#features">
                  Ver características
                </Link>
              </Button>
            </div>

            {/* Trust signals */}
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-4">USADO POR EQUIPOS EN</p>
              <div className="flex items-center gap-8 opacity-40">
                <span className="text-sm font-medium text-white/60">Vercel</span>
                <span className="text-sm font-medium text-white/60">Linear</span>
                <span className="text-sm font-medium text-white/60">Stripe</span>
                <span className="text-sm font-medium text-white/60">Supabase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot */}
      <section className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#111113] overflow-hidden shadow-2xl shadow-black/50">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0b]">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/[0.05] text-xs text-white/40 font-mono">
                  prompt-manager.app
                </div>
              </div>
              <div className="w-16" /> {/* Spacer for symmetry */}
            </div>

            {/* App preview */}
            <div className="aspect-[16/9] bg-gradient-to-br from-[#111113] via-[#0f0f11] to-[#0a0a0b] flex items-center justify-center">
              <div className="text-center">
                <Terminal weight="regular" className="h-16 w-16 text-white/15 mx-auto mb-4" />
                <p className="text-white/30 text-sm font-mono tracking-wide">
                  Vista previa del dashboard
                </p>
                <p className="text-white/20 text-xs font-mono mt-2">
                  Haz clic en &quot;Comenzar gratis&quot; para verlo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="max-w-xl mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Todo lo que necesitas para gestionar prompts a escala.
            </h2>
            <p className="text-white/50">
              Una herramienta diseñada para desarrolladores que toman en serio
              sus prompts.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-lg overflow-hidden">
            <FeatureCard
              icon={<GitBranch weight="regular" className="h-5 w-5" />}
              title="Versionado"
              description="Cada cambio queda registrado. Compara versiones, revierte errores, mantén un historial limpio."
            />
            <FeatureCard
              icon={<MagnifyingGlass weight="regular" className="h-5 w-5" />}
              title="Búsqueda semántica"
              description="Encuentra cualquier prompt en segundos. No más scroll infinito en chats."
            />
            <FeatureCard
              icon={<Lock weight="regular" className="h-5 w-5" />}
              title="Seguridad"
              description="Detección automática de PII. Tus datos sensibles protegidos por diseño."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24 border-t border-white/[0.06]">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              De chat caótico a biblioteca estructurada.
            </h2>
            <p className="text-white/50">
              Tres pasos para transformar tu workflow de prompts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Importa"
              description="Copia prompts existentes desde cualquier fuente. La herramienta detecta automáticamente estructura y metadata."
            />
            <StepCard
              number="02"
              title="Organiza"
              description="Agrupa por proyecto, categoría o contexto. Etiquetas y búsqueda hacen que todo sea encontrable."
            />
            <StepCard
              number="03"
              title="Itera"
              description="Versiona mejoras, mide efectividad con feedback de usuarios, evoluciona tus prompts con datos."
            />
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="relative z-10 py-24 border-t border-white/[0.06]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-4">
                Construido para profesionales.
              </h2>
              <p className="text-white/50 mb-8">
                Características que importan cuando trabajas con prompts todos los días.
              </p>

              <div className="space-y-4">
                <CheckItem text="Versionado automático con diff visual" />
                <CheckItem text="Detección de PII en tiempo real" />
                <CheckItem text="Integración con CI/CD" />
                <CheckItem text="API REST completa" />
                <CheckItem text="Búsqueda full-text y semántica" />
                <CheckItem text="Exportación a múltiples formatos" />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#111113] overflow-hidden">
              {/* File header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0b]">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#8b5cf6]" />
                  <span className="text-xs text-white/40 font-mono">prompt.config.ts</span>
                </div>
                <div className="w-16" />
              </div>
              {/* Code content */}
              <div className="p-6">
                <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
                  <code>
                    <span className="text-[#c084fc]">import</span>
                    <span className="text-white/70"> {'{'} defineConfig {'}'} </span>
                    <span className="text-[#c084fc]">from</span>
                    <span className="text-[#34d399]"> &apos;prompt-manager&apos;</span>
                    <span className="text-white/70">;</span>
                    {"\n\n"}
                    <span className="text-[#c084fc]">export</span>
                    <span className="text-[#c084fc]"> default</span>
                    <span className="text-[#60a5fa]"> defineConfig</span>
                    <span className="text-white/70">({'{'})</span>
                    {"\n"}
                    <span className="text-white/50">  versioning: {'{'}</span>
                    {"\n"}
                    <span className="text-white/50">    enabled: </span>
                    <span className="text-[#f472b6]">true</span>
                    <span className="text-white/50">,</span>
                    {"\n"}
                    <span className="text-white/50">    keepHistory: </span>
                    <span className="text-[#fbbf24]">50</span>
                    {"\n"}
                    <span className="text-white/50">  {'}'},</span>
                    {"\n"}
                    <span className="text-white/50">  security: {'{'}</span>
                    {"\n"}
                    <span className="text-white/50">    piiDetection: </span>
                    <span className="text-[#f472b6]">true</span>
                    <span className="text-white/50">,</span>
                    {"\n"}
                    <span className="text-white/50">    redactOnExport: </span>
                    <span className="text-[#f472b6]">true</span>
                    {"\n"}
                    <span className="text-white/50">  {'}'},</span>
                    {"\n"}
                    <span className="text-white/50">  categories: [</span>
                    {"\n"}
                    <span className="text-[#34d399]">    &apos;assistant&apos;</span>
                    <span className="text-white/50">,</span>
                    {"\n"}
                    <span className="text-[#34d399]">    &apos;code-review&apos;</span>
                    <span className="text-white/50">,</span>
                    {"\n"}
                    <span className="text-[#34d399]">    &apos;documentation&apos;</span>
                    {"\n"}
                    <span className="text-white/50">  ]</span>
                    {"\n"}
                    <span className="text-white/70">{'}'});</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 border-t border-white/[0.06]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-semibold tracking-tight mb-4">
            Empieza en minutos.
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Sin tarjeta de crédito. Sin configuración compleja.
            Solo crea una cuenta y empieza a organizar tus prompts.
          </p>
          <Button size="lg" className="bg-[#8b5cf6] hover:bg-[#7c3aed] gap-2" asChild>
            <Link href="/app">
              Comenzar gratis
              <ArrowRight weight="regular" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-[#8b5cf6] flex items-center justify-center overflow-hidden">
                <Image
                  src="/icon-192x192.png"
                  alt="Prompt Manager"
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-sm text-white/40">Prompt Manager</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/app" className="hover:text-white transition-colors">
                Documentación
              </Link>
              <Link href="/app" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/app" className="hover:text-white transition-colors">
                Términos
              </Link>
            </div>

            <p className="text-xs text-white/30">
              © 2025 Prompt Manager
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componentes de UI

function FeatureCard({
  icon,
  title,
  description,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="group p-6 bg-[#0a0a0b] hover:bg-[#111113] transition-all duration-200">
      <div className="h-12 w-12 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center mb-5 text-[#8b5cf6] group-hover:border-[#8b5cf6]/40 group-hover:bg-[#8b5cf6]/15 transition-all duration-200">
        {icon}
      </div>
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="group space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-mono font-semibold text-[#8b5cf6]/50 group-hover:text-[#8b5cf6]/70 transition-colors">
          {number}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
      </div>
      <h3 className="font-medium text-xl">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { readonly text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
        <Check weight="regular" className="h-3 w-3 text-[#8b5cf6]" />
      </div>
      <span className="text-sm text-white/70">{text}</span>
    </div>
  );
}
