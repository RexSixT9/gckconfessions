"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

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
    const [isHovered, setIsHovered] = useState(false);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        x.set((px - 0.5) * 16);
        y.set((py - 0.5) * 16);
        scale.set(1.035);
        setIsHovered(true);
    };

    const handlePointerLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);
        setIsHovered(false);
    };

    return (
        <motion.div
            className={`flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 px-4 py-5 backdrop-blur-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50 ${className}`}
            style={{
                rotateX: y,
                rotateY: x,
                scale: scale,
                willChange: isHovered ? "transform" : "auto",
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerMove}
            onPointerUp={handlePointerLeave}
            tabIndex={0}
            aria-label={title}
        >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </span>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{body}</p>
        </motion.div>
    );
}
