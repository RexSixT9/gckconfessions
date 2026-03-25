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
          "mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8 max-[430px]:px-3 max-[430px]:pb-10 max-[430px]:pt-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
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
        "group mb-8 gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-all hover:border-accent/40 hover:text-foreground max-[430px]:mb-6 max-[430px]:px-3.5 max-[430px]:py-2 max-[430px]:text-[0.64rem]",
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
    <div className={cn("mb-10 space-y-4 sm:mb-12 max-[430px]:mb-8 max-[430px]:space-y-3", className)}>
      {badge ? (
        <Badge variant="secondary" className="w-fit rounded-sm px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] max-[430px]:px-2.5 max-[430px]:text-[0.58rem]">
          {badge}
        </Badge>
      ) : null}
      <h1 className="text-[clamp(1.7rem,8.4vw,3.35rem)] font-semibold leading-[0.95] tracking-[0.04em] text-balance max-[430px]:leading-[0.98]">{title}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base max-[430px]:text-[0.9rem]">{description}</p>
    </div>
  );
}
