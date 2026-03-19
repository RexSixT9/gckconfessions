import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

type PageBackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

type PageIntroProps = {
  badge?: string;
  title: string;
  description: string;
  className?: string;
};

export function PageShell({ children, className, containerClassName }: PageShellProps) {
  return (
    <main className={cn("flex-1 overflow-x-clip bg-background", className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-5xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-9 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
          containerClassName
        )}
      >
        {children}
      </div>
    </main>
  );
}

export function PageBackLink({ href = "/", label = "Back home", className }: PageBackLinkProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      render={<Link href={href} />}
      className={cn(
        "group mb-6 gap-2 rounded-xl border border-border/60 bg-card/55 px-4 py-2 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/5",
        className
      )}
    >
      <>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {label}
      </>
    </Button>
  );
}

export function PageIntro({ badge, title, description, className }: PageIntroProps) {
  return (
    <div className={cn("mb-8 space-y-3", className)}>
      {badge ? (
        <Badge variant="secondary" className="uppercase tracking-wider">
          {badge}
        </Badge>
      ) : null}
      <h1 className="text-[clamp(1.7rem,5.5vw,2.3rem)] font-black tracking-tight text-balance">{title}</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}
