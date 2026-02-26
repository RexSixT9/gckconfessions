"use client";

import { motion, useMotionValue, useSpring, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface TiltCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
}

export default function TiltCard({ children, className = "", ...props }: TiltCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    // Track localized cursor percentages (0 to 1) for the CSS gradient reflection
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const scale = useSpring(1, { stiffness: 300, damping: 30 });

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();

        // Tilt calculation (-0.5 to 0.5)
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        x.set((px - 0.5) * 16);
        y.set((py - 0.5) * 16);
        scale.set(1.035);

        // Reflection localized coordinates
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const handlePointerLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);

        // Move reflection off screen smoothly
        mouseX.set(-100);
        mouseY.set(-100);
    };

    return (
        <motion.div
            className={`relative group overflow-hidden ${className}`}
            style={{
                rotateX: y,
                rotateY: x,
                scale: scale,
                willChange: "transform",
                "--mouse-x": mouseX,
                "--mouse-y": mouseY,
                ...props.style,
            } as any}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerMove}
            onPointerUp={handlePointerLeave}
            tabIndex={0}
            {...props}
        >
            {/* Interactive Border Reflection - rendering a pseudo border driven by CSS radial gradient using mouse coordinates */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: 'radial-gradient(circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent)) 0%, transparent 40%)',
                    padding: '1px',
                    borderRadius: 'inherit',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
            />
            {/* Soft inner glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                style={{
                    background: 'radial-gradient(400px circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px), hsl(var(--accent)), transparent 40%)',
                    borderRadius: 'inherit',
                }}
            />

            {/* The child contents */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </motion.div>
    );
}
