import React from 'react';
import Galaxy from './Galaxy';

export default function CyberGalaxy({ variant = 'default', repulsionMultiplier = 1 }) {
  // Logic: Adjust galaxy colors based on the ZA.go brand state
  const config = {
    lilac: { hueShift: 280, saturation: 0.5, starSpeed: 0.3 },
    jade: { hueShift: 140, saturation: 0.9, starSpeed: 0.6 },
    security: { hueShift: 340, saturation: 1.0, starSpeed: 0.1 } // Burgundy/Red for alerts
  };

  const current = config[variant] || config.lilac;

  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none opacity-40">
      <Galaxy 
        {...current}
        density={1.2}
        glowIntensity={0.5}
        twinkleIntensity={0.6}
        mouseInteraction={true}
        mouseRepulsion={true}
        repulsionStrength={2.5 * repulsionMultiplier}
        transparent={true}
      />
    </div>
  );
}
