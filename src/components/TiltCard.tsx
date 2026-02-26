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
            className={className}
            style={{
                rotateX: y,
                rotateY: x,
                scale: scale,
                willChange: "transform",
                ...props.style,
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerMove}
            onPointerUp={handlePointerLeave}
            tabIndex={0}
            {...props}
        >
            {children}
        </motion.div>
    );
}
