import { motion } from 'framer-motion';

/**
 * Freshness Monitor HUD (Glass-Bento Component)
 * Shifts from Electric Lime to Safety Orange as the 30-minute window closes.
 */
export default function FreshnessMonitor({ freshness, countdown }) {
  // Logic: Shift from Lilac (#C8A2C8) to Safety Orange (#FF6B00) as time expires
  const isHighRisk = countdown < 600; // Less than 10 minutes remaining
  const color = isHighRisk ? '#FF6B00' : '#C8A2C8';

  return (
    <div className="glass-panel p-6 border-white/10 bg-black/30 backdrop-blur-[20px] rounded-xl overflow-hidden relative">
      {/* Subtle glow effect */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <span className="font-inter text-[10px] uppercase tracking-widest text-gray-400">
          TELEMETRY: FRESHNESS
        </span>
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="font-inter text-2xl font-bold" 
          style={{ color }}
        >
          {freshness}%
        </motion.span>
      </div>
      
      {/* 30-minute stability countdown bar */}
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(countdown / 1800) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full shadow-[0_0_15px_rgba(200,162,200,0.4)]"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}66`
          }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-3 relative z-10">
        <p className="font-inter text-[9px] text-gray-400 uppercase tracking-widest">
          STABILITY WINDOW
        </p>
        <p className="font-inter text-sm font-bold tracking-tighter" style={{ color }}>
          {Math.floor(countdown / 60)}M {countdown % 60}S REMAINING
        </p>
      </div>
    </div>
  );
}
