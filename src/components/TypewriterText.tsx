"use client";

import { motion } from "framer-motion";

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
    // Split words first, so we can check if they should be highlighted
    const words = text.split(" ");

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
        visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
        hidden: { opacity: 0, y: 10 },
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
                                style={{ display: "inline-block" }}
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
