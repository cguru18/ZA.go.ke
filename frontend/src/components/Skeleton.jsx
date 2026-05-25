import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ className, style }) {
    return (
        <motion.div
            className={`rounded-2xl overflow-hidden relative ${className}`}
            style={{ 
                background: 'rgba(26, 29, 16, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                ...style 
            }}
            animate={{
                background: ['rgba(26, 29, 16, 0.5)', 'rgba(40, 43, 29, 0.8)', 'rgba(26, 29, 16, 0.5)'],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </motion.div>
    );
}
