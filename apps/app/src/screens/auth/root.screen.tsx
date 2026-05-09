import { Outlet } from "@tanstack/react-router";
import { LogoIcon } from "~/assets/icons/logo.svg";
import LoginHeroImg from "~/assets/images/login-hero.png";

export default function AuthRootScren() {
  return (
    <main className="grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <div className="relative hidden min-h-svh overflow-hidden border-border border-r bg-card lg:block">
        <img
          src={LoginHeroImg}
          alt="A cinematic workspace wallpaper"
          className="absolute inset-0 size-full object-cover grayscale saturate-125"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_0,rgba(13,13,13,0.15)_32%,rgba(13,13,13,0.88)_74%)]" />

        <a
          href="https://agenrix.com"
          className="absolute top-5 left-5 flex items-center gap-2"
        >
          <LogoIcon size={20} />
          <p className="font-heading text-lg">Agenrix</p>
        </a>

        <a
          href="https://x.com/wh0sumit/status/2050805979462463610"
          target="_blank"
          rel="noreferrer"
          className="absolute right-5 bottom-5 font-medium text-muted-foreground text-xs transition-colors duration-300 hover:text-foreground/65"
        >
          Image by Sumit (rightfit.so)
        </a>
      </div>

      <section className="mx-auto flex min-h-screen w-sm flex-col items-center justify-center">
        <Outlet />
      </section>
    </main>
  );
}
