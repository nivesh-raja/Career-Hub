import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeProvider.js';
import './vibrantBackground.css';

export const VibrantBackground: React.FC = () => {
    const { theme } = useTheme();
    const [dots, setDots] = useState<{ id: number; left: number; delay: number; size: number; duration: number }[]>([]);

    useEffect(() => {
        // Generate distinct drifting background particles
        const particleCount = window.innerWidth < 640 ? 12 : 28;
        const newDots = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 15,
            size: 1.5 + Math.random() * 3, // sizes between 1.5px and 4.5px
            duration: 12 + Math.random() * 18, // duration between 12s and 30s
        }));
        setDots(newDots);
    }, []);

    return (
        <div className="vibrant-bg-overlay" data-theme={theme}>
            {/* Live ambient mesh styling blobs */}
            <div className="vibrant-bg-glows">
                <div className="vibrant-blob-1" />
                <div className="vibrant-blob-2" />
                <div className="vibrant-blob-3" />
            </div>

            {/* Spotlighting vignette backdrop */}
            <div className="vibrant-vignette" />

            {/* Slow floating parchment/gold dust particles */}
            <div className="vibrant-dust">
                {dots.map((dot) => (
                    <div
                        key={dot.id}
                        className="vibrant-mote"
                        style={{
                            left: `${dot.left}vw`,
                            width: `${dot.size}px`,
                            height: `${dot.size}px`,
                            animationDuration: `${dot.duration}s`,
                            animationDelay: `-${dot.delay}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
