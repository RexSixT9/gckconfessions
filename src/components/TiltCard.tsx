"use client";

import { motion, useMotionValue, useSpring, HTMLMotionProps } from "framer-motion";
import { ReactNode, useCallback, useRef } from "react";

interface TiltCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    /** Disables the 3-D tilt effect (e.g. on a card where tilt conflicts with layout). */
    noTilt?: boolean;
}

export default function TiltCard({ children, className = "", noTilt = false, ...props }: TiltCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Gentle spring — snappy enough to feel responsive, damped enough to not overshoot
    const springConfig = { stiffness: 280, damping: 28 };
    const rotateX = useSpring(y, springConfig);
    const rotateY = useSpring(x, springConfig);
    const scale = useSpring(1, { stiffness: 300, damping: 30 });

    // Whether this device has a fine pointer (mouse) — skip tilt for touch screens
    const isFinePtrRef = useRef<boolean | null>(null);
    const isFinePinter = () => {
        if (isFinePtrRef.current === null) {
            isFinePtrRef.current =
                typeof window !== "undefined" &&
                window.matchMedia("(pointer: fine)").matches &&
                !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return isFinePtrRef.current;
    };

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (noTilt || !isFinePinter()) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        x.set((px - 0.5) * 14);
        y.set((py - 0.5) * 14);
        scale.set(1.025);
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    }, [noTilt, x, y, scale, mouseX, mouseY]);

    const handlePointerLeave = useCallback(() => {
        x.set(0);
        y.set(0);
        scale.set(1);
        mouseX.set(-100);
        mouseY.set(-100);
    }, [x, y, scale, mouseX, mouseY]);

    return (
        <motion.div
            className={`relative group overflow-hidden ${className}`}
            style={{
                rotateX: noTilt ? 0 : rotateX,
                rotateY: noTilt ? 0 : rotateY,
                scale,
                willChange: "transform",
                transformStyle: "preserve-3d",
                "--mouse-x": mouseX,
                "--mouse-y": mouseY,
                ...props.style,
            } as React.CSSProperties & Record<string, unknown>}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            tabIndex={0}
            {...props}
        >
            {/* Border follower glow — only renders on pointer:fine devices via CSS */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: "radial-gradient(circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent)) 0%, transparent 45%)",
                    padding: "1px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            />
            {/* Soft inner glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]"
                style={{
                    background: "radial-gradient(350px circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent)), transparent 45%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </motion.div>
    );
}
