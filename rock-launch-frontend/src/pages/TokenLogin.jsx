import React, { useEffect, useContext, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api';
import { UserContext } from '../App';

function TokenLogin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useContext(UserContext);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Verificando invitación...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('No se encontró un token de acceso.');
            setError('Por favor usa el link que recibiste por WhatsApp.');
            return;
        }

        const validateToken = async () => {
            const TARGET_DATE = new Date("April 14, 2026 13:00:00");
            const now = new Date();

            if (now < TARGET_DATE) {
                // If too early, send back to home so they see the countdown
                navigate(`/?token=${token}`);
                return;
            }

            try {
                const res = await axios.get(`auth/validate-token?token=${token}`);
                const userData = res.data.user;

                // Success: Log them in and redirect
                login(userData);
                setStatus('¡Validación exitosa! Redirigiendo...');

                // Small delay for branding/smoothness
                setTimeout(() => {
                    navigate('/vote');
                }, 1000);

            } catch (err) {
                console.error(err);
                const msg = err.response?.data?.error || 'Error al validar el acceso.';
                setError(msg);
                setStatus('Acceso denegado');
            }
        };

        validateToken();
    }, [searchParams, login, navigate]);

    return (
        <div className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '90vh',
            textAlign: 'center',
            position: 'relative'
        }}>
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

            {/* Background decorative elements */}

            <div className="card glass reveal active" style={{ padding: '4rem 3rem', maxWidth: '600px', width: '95%', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <img
                    src="/logo_marvelsa.png"
                    alt="Marvelsa"
                    style={{
                        height: '110px',
                        marginBottom: '3rem',
                        filter: 'url(#remove-white) brightness(0) invert(1) drop-shadow(0 0 15px rgba(255,255,255,0.3))'
                    }}
                />

                {error ? (
                    <div className="fade-in">
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem',
                            filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))'
                        }}>⚠️</div>
                        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(to bottom, #ff4d4d, #a70000)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {status}
                        </h2>
                        <p style={{
                            fontSize: '1.2rem',
                            lineHeight: '1.8',
                            color: 'var(--text-muted)',
                            marginBottom: '2.5rem'
                        }}>{error}</p>

                        <button
                            className="btn-primary"
                            style={{ padding: '1.2rem 3rem' }}
                            onClick={() => navigate('/')}
                        >
                            Ir al inicio
                        </button>
                    </div>
                ) : (
                    <div className="fade-in">
                        <div className="loader-container" style={{ marginBottom: '2.5rem' }}>
                            <div className="loader-ring"></div>
                            <div className="loader-core"></div>
                        </div>
                        <h2 className="title" style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>{status}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                            PREPARANDO TU EXPERIENCIA ROCK LAUNCH 2025
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .loader-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto;
                }
                .loader-ring {
                    position: absolute;
                    inset: 0;
                    border: 4px solid rgba(212, 175, 55, 0.1);
                    border-top: 4px solid var(--accent);
                    border-radius: 50%;
                    animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                }
                .loader-core {
                    position: absolute;
                    inset: 20px;
                    background: var(--accent);
                    border-radius: 50%;
                    opacity: 0.2;
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.2); opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

export default TokenLogin;
