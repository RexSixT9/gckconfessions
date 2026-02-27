"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TypewriterTextProps {
    text: string;
    className?: string;
    delay?: number;
    highlightWords?: string[];
    highlightClass?: string;
}

export default function TypewriterText({
    text,
    className = "",
    delay = 0,
    highlightWords = [],
    highlightClass = "text-[hsl(var(--accent))]",
}: TypewriterTextProps) {
    // Memoize the split words to prevent recalculation during hydration
    const words = useMemo(() => text.split(" "), [text]);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: {
                staggerChildren: 0.04,
                delayChildren: delay * i,
            },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "tween",
                ease: "easeOut",
                duration: 0.25
            }
        },
        hidden: { opacity: 0, y: 8 },
    };

    return (
        <motion.div
            style={{ overflow: "hidden", display: "inline-flex", flexWrap: "wrap", justifyContent: "center" }}
            variants={container}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {words.map((word, index) => {
                // Strip out punctuation for the exact highlight check, but keep the punctuation in rendering
                const cleanWord = word.replace(/[^\w\s]/gi, "");
                const isHighlight = highlightWords.includes(cleanWord);

                return (
                    <span
                        key={index}
                        style={{ display: "inline-block", marginRight: "0.25em" }}
                        className={isHighlight ? highlightClass : ""}
                    >
                        {Array.from(word).map((char, charIndex) => (
                            <motion.span
                                variants={child}
                                key={charIndex}
                                style={{ display: "inline-block", willChange: "opacity, transform" }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </span>
                );
            })}
        </motion.div>
    );
}
