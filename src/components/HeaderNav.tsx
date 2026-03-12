"use client";

import Link from "next/link";
import { Heart, Menu, PenLine, BookOpen } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/guidelines", label: "Guidelines", icon: BookOpen },
];

export default function HeaderNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 animate-fade-in">
      <AnnouncementBanner />
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg px-1 py-1 text-foreground transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="GCK Confessions Home"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent shadow-sm">
            <Heart className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            GCK Confessions
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/submit" className={cn(buttonVariants({ size: "sm" }), "rounded-full font-semibold")}>
            <PenLine className="h-3.5 w-3.5" />
            Write
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger render={<button aria-label="Open navigation menu" />} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="p-5 pb-4">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Heart className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2.5} />
                  </span>
                  GCK Confessions
                </SheetTitle>
              </SheetHeader>
              <Separator />
              <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                <SheetClose render={<Link href="/submit" />} className={cn(buttonVariants({ size: "default" }), "w-full justify-start rounded-lg font-semibold")}>
                  <PenLine className="h-4 w-4" />
                  Write a Confession
                </SheetClose>
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <SheetClose key={href} render={<Link href={href} />} className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start rounded-lg")}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
