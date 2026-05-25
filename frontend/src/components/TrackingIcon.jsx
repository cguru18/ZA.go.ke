import React from 'react';
import { Radio } from 'lucide-react';

const TrackingIcon = ({ isLive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md cursor-pointer transition-all ${
        isLive 
          ? 'bg-black/40 border-jade-500/30 hover:border-jade-500/50 shadow-[0_0_15px_rgba(0,163,108,0.2)]' 
          : 'bg-black/40 border-white/10 hover:bg-white/5'
      }`}
    >
      {/* The Pulsing Indicator */}
      <div className="relative flex h-3 w-3">
        {/* Radiating outer ring (Only shows if isLive is true) */}
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-500 opacity-75"></span>
        )}
        
        {/* Solid center dot - Swaps color based on status */}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${
          isLive ? 'bg-jade-500 animate-radar' : 'bg-gray-600'
        }`}></span>
      </div>

      {/* Text Label */}
      <span className={`text-xs font-bold uppercase tracking-widest ${
        isLive ? 'text-jade-400' : 'text-gray-500'
      }`}>
        {isLive ? 'Live Tracking Active' : 'Courier Offline'}
      </span>
      
      {/* Lucide Icon for added flair */}
      <Radio className={`w-4 h-4 ${isLive ? 'text-jade-400 animate-pulse' : 'text-gray-500'}`} />
    </div>
  );
};

export default TrackingIcon;
