"use client";

import { motion, useMotionValue, useSpring, HTMLMotionProps } from "framer-motion";
import { ReactNode, useCallback, useRef, useEffect, useState } from "react";

interface TiltCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    /** Disable 3-D tilt (useful where tilt conflicts with layout flow). */
    noTilt?: boolean;
}

export default function TiltCard({ children, className = "", noTilt = false, ...props }: TiltCardProps) {
    // --- Tilt axes (raw values, fed into springs below)
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    // Springs give a smooth, physically-plausible return-to-zero
    const springCfg = { stiffness: 260, damping: 26 };
    const rotateX = useSpring(rawY, springCfg);
    const rotateY = useSpring(rawX, springCfg);
    const scale = useSpring(1, { stiffness: 300, damping: 28 });

    // Gradient spotlight position — init VERY far off-screen so no glow
    // bleeds into the card on initial render or touch `:hover` events.
    const mouseX = useMotionValue(-9999);
    const mouseY = useMotionValue(-9999);

    // Detect fine-pointer (mouse) device once on mount, memoised in a ref.
    // Touch / stylus devices skip all tilt + scale logic entirely.
    const isFinePtr = useRef<boolean | null>(null);
    const checkFine = () => {
        if (isFinePtr.current === null && typeof window !== "undefined") {
            isFinePtr.current =
                window.matchMedia("(pointer: fine)").matches &&
                !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return !!isFinePtr.current;
    };

    // `willChange` is only beneficial while the pointer is actively hovering.
    // Permanently setting it on every card wastes GPU memory on mobile.
    const [isHovered, setIsHovered] = useState(false);

    // Reset spotlight position when the component unmounts or loses focus
    useEffect(() => {
        return () => {
            mouseX.set(-9999);
            mouseY.set(-9999);
        };
    }, [mouseX, mouseY]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (noTilt || !checkFine()) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        rawX.set((px - 0.5) * 13);
        rawY.set((py - 0.5) * 13);
        scale.set(1.022);
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    }, [noTilt, rawX, rawY, scale, mouseX, mouseY]);

    const handlePointerEnter = useCallback(() => {
        if (checkFine()) setIsHovered(true);
    }, []);

    const handlePointerLeave = useCallback(() => {
        rawX.set(0);
        rawY.set(0);
        scale.set(1);
        // Move spotlight off-screen — not to -100 (can still bleed), but truly away
        mouseX.set(-9999);
        mouseY.set(-9999);
        setIsHovered(false);
    }, [rawX, rawY, scale, mouseX, mouseY]);

    return (
        <motion.div
            className={`relative group overflow-hidden ${className}`}
            style={{
                rotateX: noTilt ? 0 : rotateX,
                rotateY: noTilt ? 0 : rotateY,
                scale,
                // Only promote to its own GPU layer while actively being hovered —
                // avoids the mobile memory cost of permanent compositing layers.
                willChange: isHovered ? "transform" : "auto",
                // Do NOT set transform-style: preserve-3d here — it creates a new
                // stacking context that breaks absolute-positioned child overlays
                // (the glow divs) in Safari and older Android browsers.
                "--mouse-x": mouseX,
                "--mouse-y": mouseY,
                ...props.style,
            } as React.CSSProperties & Record<string, unknown>}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            tabIndex={0}
            {...props}
        >
            {/*
        Border-following spotlight glow.
        Uses a 1px padding + mask trick to produce a glowing border ring
        that follows the cursor. CSS custom properties (--mouse-x, --mouse-y)
        are inherited by children, so the gradient centre tracks correctly.
        The -9999px default puts it far off any reasonable card dimension.
      */}
            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(120px circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent) / 0.7) 0%, transparent 100%)",
                    padding: "1px",
                    borderRadius: "inherit",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            />
            {/* Soft inner area glow — smaller radius, subtler opacity */}
            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(250px circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent) / 0.07), transparent 70%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </motion.div>
    );
}
