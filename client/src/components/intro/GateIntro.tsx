import React, { useEffect, useState } from 'react';
import './gateIntro.css';
import { VibrantBackground } from '../ui/VibrantBackground.js';

interface GateIntroProps {
    children: React.ReactNode;
}

export const GateIntro: React.FC<GateIntroProps> = ({ children }) => {
    // Stages: 'closed' | 'gateOpen' | 'titleIn' | 'titleOut' | 'bookSceneShow' | 'bookRise' | 'bookOpen' | 'bookSparks' | 'done'
    const [stage, setStage] = useState<string>('closed');
    const [dots, setDots] = useState<{ id: number; left: number; delay: number; size: number; duration: number }[]>([]);
    const [sparks, setSparks] = useState<{ id: number; dx: number; dy: number; delay: number }[]>([]);

    const skipped = sessionStorage.getItem('ch-intro-seen') === 'true';

    useEffect(() => {
        // Generate ambient dust particles
        const particleCount = window.innerWidth < 640 ? 16 : 32;
        const newDots = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 10,
            size: 2 + Math.random() * 2.5,
            duration: 8 + Math.random() * 10,
        }));
        setDots(newDots);
    }, []);

    useEffect(() => {
        if (skipped) {
            setStage('done');
            return;
        }

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const t = reduced ? 0.05 : 1.6;

        const timers = [
            setTimeout(() => setStage('gateOpen'), 500 * t),
            setTimeout(() => setStage('titleIn'), 900 * t),
            setTimeout(() => setStage('titleOut'), 2600 * t),
            setTimeout(() => setStage('bookSceneShow'), 2900 * t),
            setTimeout(() => setStage('bookRise'), 3100 * t),
            setTimeout(() => setStage('bookOpen'), 4000 * t),
            setTimeout(() => {
                setStage('bookSparks');
                // Spawn sparks
                if (!reduced) {
                    const sparkCount = 20;
                    const newSparks = Array.from({ length: sparkCount }).map((_, i) => {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 70 + Math.random() * 160;
                        return {
                            id: i,
                            dx: Math.cos(angle) * dist,
                            dy: Math.sin(angle) * dist * 0.55,
                            delay: Math.random() * 90,
                        };
                    });
                    setSparks(newSparks);
                }
            }, 4150 * t),
            setTimeout(() => {
                setStage('done');
                sessionStorage.setItem('ch-intro-seen', 'true');
                // Try to focus email/login input (email is the ID of input in original LoginPage.tsx)
                const emailInput = document.getElementById('email') || document.getElementById('loginId');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 5300 * t),
        ];

        return () => timers.forEach(clearTimeout);
    }, [skipped]);

    const handleSkip = () => {
        setStage('done');
        sessionStorage.setItem('ch-intro-seen', 'true');
        setTimeout(() => {
            const emailInput = document.getElementById('email') || document.getElementById('loginId');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    };

    const isSkipHidden = stage === 'done';

    return (
        <div className="ch-scene-root" data-stage={stage}>
            <VibrantBackground />
            {/* Ambient Dust */}
            <div className="ch-dust">
                {dots.map((dot) => (
                    <div
                        key={dot.id}
                        className="ch-mote"
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

            {/* Vignette */}
            <div className="ch-vignette" />

            {/* Skip button */}
            <button
                type="button"
                className={`ch-skip-btn ${isSkipHidden ? 'ch-hidden' : ''}`}
                onClick={handleSkip}
            >
                Skip intro
            </button>

            {/* Gate Scene */}
            <section className={`ch-gate-scene ${(stage === 'bookSceneShow' || stage === 'bookRise' || stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-hide' : ''}`}>
                <div className={`ch-gate-frame ${(stage !== 'closed') ? 'ch-open' : ''}`}>
                    <div className="ch-gate-glow" />
                    <div className="ch-door ch-door-left" />
                    <div className="ch-door ch-door-right" />
                </div>

                <div className={`ch-title-block ${stage === 'titleIn' ? 'ch-in' : (stage === 'titleOut' || stage === 'bookSceneShow' || stage === 'bookRise' || stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-out' : ''}`}>
                    <p className="ch-eyebrow">Records &middot; Results &middot; Recognition</p>
                    <h1 className="ch-title">Career <span className="ch-accent">Hub</span></h1>
                    <p className="ch-subtitle">Academic Management Platform</p>
                </div>
            </section>

            {/* Book Scene */}
            <section className={`ch-book-scene ${(stage === 'bookSceneShow' || stage === 'bookRise' || stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-show' : ''}`}>
                <div className={`ch-book-wrap ${(stage === 'bookRise' || stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-rise' : ''} ${(stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-open-state' : ''}`}>
                    <div className="ch-book-shadow" />

                    <div className={`ch-book ${(stage === 'bookOpen' || stage === 'bookSparks' || stage === 'done') ? 'ch-open' : ''}`} id="book">

                        {/* Left Page (Registry/Crest) */}
                        <div className="ch-page ch-left-page">
                            <svg className="ch-crest" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M32 4c9 6 18 6 24 4-1 20-8 34-24 42C16 42 9 28 8 8c6 2 15 2 24-4Z" stroke="var(--ch-burgundy)" strokeWidth="1.6" />
                                <path d="M22 30h20M22 36h20M22 24h14" stroke="var(--ch-burgundy)" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            <p className="ch-motto">"Knowledge recorded.<br />Progress realized."</p>
                            <p className="ch-fine">
                                <strong>Career Hub Registry</strong>
                                Every course, grade, and milestone kept in one ledger — from orientation to graduation, held to a single standard of record.
                            </p>
                        </div>

                        {/* Right Page (Forms inside) */}
                        <div className="ch-page ch-right-page">
                            {children}
                        </div>

                        {/* Cover Splitting Halves */}
                        <div className="ch-cover-left ch-cover-half" />
                        <div className="ch-cover-right ch-cover-half" />

                        {/* Book Spine Seam */}
                        <div className="ch-book-spine" />

                        {/* Cover Plate */}
                        <div className="ch-cover-plate">
                            <div className="ch-cover-inner">
                                <svg className="ch-cover-emblem" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M32 4c9 6 18 6 24 4-1 20-8 34-24 42C16 42 9 28 8 8c6 2 15 2 24-4Z" stroke="var(--ch-gold-bright)" strokeWidth="1.6" />
                                    <path d="M22 30h20M22 36h20M22 24h14" stroke="var(--ch-gold-bright)" strokeWidth="1.4" strokeLinecap="round" />
                                </svg>
                                <p className="ch-cover-title">Career<br />Hub</p>
                                <p className="ch-cover-sub">Academic Management Platform</p>
                            </div>
                        </div>

                        {/* Light burst from opening book */}
                        <div className="ch-light-burst" />

                        {/* Sparks */}
                        {sparks.map((spark) => (
                            <span
                                key={spark.id}
                                className="ch-light-spark"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    animationDelay: `${spark.delay}ms`,
                                    // @ts-ignore
                                    '--dx': `${spark.dx}px`,
                                    '--dy': `${spark.dy}px`,
                                }}
                            />
                        ))}

                    </div>
                </div>
            </section>
        </div>
    );
};
