"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface BentoCardProps {
    icon: LucideIcon;
    title: string;
    body: string;
    className?: string;
}

export default function BentoCard({ icon: Icon, title, body, className = "" }: BentoCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useSpring(1, { stiffness: 300, damping: 30 });

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        x.set((px - 0.5) * 16);
        y.set((py - 0.5) * 16);
        scale.set(1.035);
    };

    const handlePointerLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);
    };

    return (
        <motion.div
            className={`flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 px-4 py-5 backdrop-blur-sm transition-all duration-200 focus:outline-none ${className}`}
            style={{
                rotateX: y,
                rotateY: x,
                scale: scale,
                willChange: "transform"
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerMove}
            onPointerUp={handlePointerLeave}
            tabIndex={0}
            aria-label={title}
        >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            </span>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{body}</p>
        </motion.div>
    );
}
