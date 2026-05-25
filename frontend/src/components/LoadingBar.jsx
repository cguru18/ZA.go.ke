import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingBar({ active }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="fixed top-0 left-0 right-0 h-[3px] z-[9999] origin-left"
                    style={{ 
                        background: 'linear-gradient(90deg, #00a86b 0%, #00d48a 50%, #00a86b 100%)',
                        boxShadow: '0 0 12px rgba(0, 168, 107, 0.6)'
                    }}
                />
            )}
        </AnimatePresence>
    );
}
