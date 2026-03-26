import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import { UserContext } from '../App';

function Registration() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Simple Validation
        const phoneRegex = /^\d{10}$/;
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

        if (!nameRegex.test(name)) {
            setError('El nombre solo debe contener letras.');
            return;
        }

        if (!phoneRegex.test(phone)) {
            setError('El teléfono debe tener exactamente 10 números.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: name.trim(),
                phone
            };

            const response = await axios.post('auth/register', payload);

            // Login user in context
            login(response.data.user);

            // Redirect to voting
            navigate('/vote');
        } catch (err) {
            console.error("Authentication error:", err);
            setError(err.response?.data?.error || 'Ocurrió un error al verificar tus datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '85vh'
        }}>
            <div className="card fade-in" style={{
                maxWidth: '550px',
                width: '100%',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bienvenido</h2>
                    <p className="subtitle" style={{ fontSize: '1rem', margin: '0' }}>Ingresa tus datos para acceder al evento.</p>
                </div>

                {error && (
                    <div className="fade-in" style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '2rem',
                        fontSize: '0.95rem',
                        textAlign: 'center'
                    }}>
                        <span style={{ marginRight: '0.5rem' }}>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="name">Nombre Completo</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Ej. Juan Pérez"
                            style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="phone">Número de Teléfono</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                            placeholder="10 dígitos"
                            pattern="[0-9]{10}"
                            title="Por favor ingresa 10 dígitos"
                            style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="spinner" style={{ marginRight: '10px' }}></div>
                                Procesando...
                            </div>
                        ) : 'Continuar al Evento'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Registration;
