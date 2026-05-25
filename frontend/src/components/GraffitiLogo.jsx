import React from 'react';
import { motion } from 'framer-motion';

export default function GraffitiLogo({ className = "" }) {
    // Variants for the SVG path drawing animation
    const pathVariants = {
        hidden: {
            pathLength: 0,
            opacity: 0,
            fill: "rgba(128, 0, 32, 0)" // Transparent burgundy
        },
        visible: {
            pathLength: 1,
            opacity: 1,
            fill: "rgba(128, 0, 32, 1)", // Solid burgundy
            transition: {
                duration: 2,
                ease: "easeInOut",
                fill: {
                    delay: 1.5,
                    duration: 0.5
                }
            }
        }
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <svg 
                viewBox="0 0 300 100" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto drop-shadow-md"
            >
                <motion.text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-graffiti"
                    style={{ fontSize: "36px", fontFamily: "graffiti, cursive", fontWeight: "bold" }}
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                    stroke="#800020"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    HEAT & TREATS
                </motion.text>
            </svg>
        </div>
    );
}
