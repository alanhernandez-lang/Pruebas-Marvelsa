import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Countdown from '../components/Countdown';
import EvaluationCriteria from '../components/EvaluationCriteria';

function Welcome() {
    const navigate = useNavigate();
    const [isVotingEnabled, setIsVotingEnabled] = React.useState(false);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [hasToken, setHasToken] = React.useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('token')) setHasToken(true);

        const handleScroll = () => {
            if (window.scrollY > 500) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCountdownFinish = React.useCallback(() => {
        setIsVotingEnabled(true);
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        // AUTO-REDIRECT only if time has come AND we have a token
        if (hasToken && isVotingEnabled) {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            navigate(`/votar?token=${token}`);
        }

        return () => observer.disconnect();
    }, [navigate, isVotingEnabled, hasToken]);

    return (
        <div className="landing-page">
            <header className="landing-header">
                <img src="/logo_marvelsa.png" alt="Logo Grupo" className="header-logo" />
            </header>

            {/* SVG Filter to remove white background accurately */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <filter id="remove-white" colorInterpolationFilters="sRGB">
                    <feColorMatrix type="matrix" values="
                        1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        -1 -1 -1 3 -1
                    "/>
                </filter>
            </svg>

            <Hero isVotingEnabled={isVotingEnabled} />

            <section className="countdown-section">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="reveal" style={{ fontSize: '1.2rem', letterSpacing: '0.4rem', color: 'var(--accent)', fontWeight: '700', marginBottom: '1rem' }}>FALTAN</h2>
                    <div className="reveal">
                        <Countdown
                            targetDate="April 1, 2026 10:15:00"
                            onFinish={handleCountdownFinish}
                        />
                    </div>

                    {hasToken && !isVotingEnabled && (
                        <div className="token-status fade-in" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'inline-block' }}>
                            <p style={{ color: 'var(--accent)', margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                                ✅ INVITACIÓN DETECTADA
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Tu acceso está listo. Podrás ingresar cuando el contador llegue a cero.
                            </p>
                        </div>
                    )}
                </div>
            </section>
            <section id="about" className="features-section">
                <div className="container">
                    <h2 className="section-title reveal">
                        <span style={{ fontSize: '0.4em', display: 'block', color: 'var(--accent)', letterSpacing: '0.8rem', marginBottom: '0.5rem', fontWeight: '500' }}>ENCIENDAN SUS MOTORES</span>
                        Es momento de acelerar juntos hacia nuestra visión del 2033.
                    </h2>
                    <div className="about-content reveal glass">
                        <p className="about-paragraph">
                            El <span className="highlight-accent">Rock Launch</span> es el punto de <span className="highlight-glow">ignición</span> donde la <span className="highlight-white">estrategia</span> se encuentra con la <span className="highlight-accent">pasión</span>. No es una simple rendición de cuentas ni una reunión corporativa más; es un evento de <span className="highlight-white">alto impacto</span> diseñado para que cada equipo demuestre cómo sus <span className="highlight-accent">Rocks</span>  están moviendo la aguja de la empresa hacia su visión a <span className="highlight-white">largo plazo</span>.
                        </p>
                        <p className="about-paragraph" style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
                            Para garantizar la transparencia, la votación es <span className="highlight-white">nominal y personal</span>.<br /><br />
                            📲 Recibirás un <span className="highlight-accent">link único</span> vía WhatsApp para participar. No es necesario registrarse manualmente.
                        </p>
                    </div>

                    <h2 className="section-title reveal">CRITERIOS DE EVALUACIÓN</h2>
                    <EvaluationCriteria />

                </div>
            </section>


            <footer className="landing-footer">
                <div className="container">
                    <p>Rock Launch 2025 © Grupo Marvelsa - Todos los derechos reservados</p>
                </div>
            </footer>

            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="scroll-top-btn"
                    title="Volver arriba"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
            )}

            <style>{`
                .landing-page {
                    overflow-x: hidden;
                }
                .landing-header {
                    padding: 1rem 2rem 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    position: relative;
                    z-index: 10;
                }
                .header-logo {
                    height: 160px;
                    filter: url(#remove-white) brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.2));
                }
                .section-title {
                    text-align: center;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 3rem;
                    letter-spacing: 0.3rem;
                    color: var(--text);
                    text-transform: uppercase;
                }
                .countdown-section {
                    padding: 8rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
                }
                .features-section {
                    padding: 8rem 2rem;
                    background: rgba(255, 255, 255, 0.01);
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1.5rem;
                    margin-top: 4rem;
                }
                .history-section {
                    padding: 8rem 2rem;
                }
                .history-timeline {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 2rem;
                    margin-top: 3rem;
                }
                .timeline-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .year {
                    font-size: 2rem;
                    font-weight: 900;
                    color: var(--accent);
                    margin-bottom: 1rem;
                }
                .landing-footer {
                    padding: 4rem 2rem;
                    text-align: center;
                    border-top: 1px solid var(--glass-border);
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .about-content {
                    max-width: 1000px;
                    margin: 0 auto 5rem;
                    padding: 4rem;
                    text-align: center;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                }
                .about-paragraph {
                    font-size: 1.5rem;
                    line-height: 1.8;
                    color: var(--text-muted);
                    font-weight: 400;
                    margin: 0;
                }
                .highlight-accent {
                    color: var(--accent);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .highlight-white {
                    color: #fff;
                    font-weight: 700;
                }
                .highlight-glow {
                    color: var(--accent);
                    font-weight: 800;
                    text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
                    text-transform: uppercase;
                }
                @media (max-width: 768px) {
                    .section-title {
                        font-size: 1.8rem;
                    }
                }
                .scroll-top-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: #000;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .scroll-top-btn:hover {
                    transform: translateY(-5px) scale(1.1);
                    box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
                    background: #fff;
                }
                @keyframes popIn {
                    from { transform: scale(0) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div >
    );
}

export default Welcome;
