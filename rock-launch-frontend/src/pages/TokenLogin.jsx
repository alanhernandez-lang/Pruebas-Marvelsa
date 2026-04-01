import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api';
import { UserContext } from '../App';
import Countdown from '../components/Countdown';

function TokenLogin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useContext(UserContext);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Verificando invitación...');
    const [isTooEarly, setIsTooEarly] = useState(false);
    const [isVotingEnabled, setIsVotingEnabled] = useState(false);

    const TARGET_DATE = "April 1, 2026 10:45:00";

    const validateToken = useCallback(async () => {
        const token = searchParams.get('token');
        if (!token) return;

        const now = new Date();
        const target = new Date(TARGET_DATE);

        if (now < target) {
            setIsTooEarly(true);
            setStatus('Votación no disponible');
            return;
        }

        try {
            const res = await axios.get(`auth/validate-token?token=${token}`);
            const userData = res.data.user;

            login(userData);
            setStatus('¡Validación exitosa! Redirigiendo...');

            setTimeout(() => {
                navigate('/vote');
            }, 1000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Error al validar el acceso.';
            setError(msg);
            setStatus('Acceso denegado');
        }
    }, [searchParams, login, navigate]);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('No se encontró un token de acceso.');
            setError('Por favor usa el link que recibiste por WhatsApp.');
            return;
        }
        validateToken();
    }, [validateToken, searchParams]);

    const handleCountdownFinish = () => {
        setIsVotingEnabled(true);
        setIsTooEarly(false);
        validateToken(); // Re-validate now that time has passed
    };

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
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <filter id="remove-white" colorInterpolationFilters="sRGB">
                    <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 3 -1" />
                </filter>
            </svg>

            <div className="card glass reveal active" style={{ padding: '3rem', maxWidth: '600px', width: '95%', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <img src="/logo_marvelsa.png" alt="Marvelsa" style={{ height: '80px', marginBottom: '2rem', filter: 'url(#remove-white) brightness(0) invert(1)' }} />

                {isTooEarly ? (
                    <div className="fade-in">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                        <h2 className="title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>EL CONTADOR AÚN NO TERMINA</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Tu acceso está listo, pero la votación comenzará en:
                        </p>
                        
                        <div style={{ transform: 'scale(0.8)', margin: '-1rem 0 1rem' }}>
                            <Countdown targetDate={TARGET_DATE} onFinish={handleCountdownFinish} />
                        </div>

                        <button 
                            className={`btn-primary ${!isVotingEnabled ? 'btn-disabled' : ''}`}
                            disabled={!isVotingEnabled}
                            onClick={validateToken}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            {isVotingEnabled ? 'INGRESAR A VOTAR' : 'ESPERANDO INICIO...'}
                        </button>
                    </div>
                ) : error ? (
                    <div className="fade-in">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#ff4d4d' }}>{status}</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>Ir al inicio</button>
                    </div>
                ) : (
                    <div className="fade-in">
                        <div className="loader-container" style={{ marginBottom: '2rem' }}>
                            <div className="loader-ring"></div>
                        </div>
                        <h2 className="title" style={{ fontSize: '2rem' }}>{status}</h2>
                    </div>
                )}
            </div>

            <style>{`
                .loader-container { position: relative; width: 60px; height: 60px; margin: 0 auto; }
                .loader-ring { position: absolute; inset: 0; border: 4px solid rgba(212, 175, 55, 0.1); border-top: 4px solid var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default TokenLogin;
