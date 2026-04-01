import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { BASE_API_URL } from '../api';
import { UserContext } from '../App';
import StarRating from '../components/StarRating';
import CRITERIA_DESCRIPTIONS from '../constants/criteria';

function VotingFlow() {
    const { user, login } = useContext(UserContext);
    const navigate = useNavigate();

    const COOLDOWN_SEC = 300; // 5 minutos

    useEffect(() => {
        const TARGET_DATE = new Date("April 1, 2026 12:10:00");
        if (new Date() < TARGET_DATE) {
            navigate('/');
        }
    }, [navigate]);

    // State
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [deptStats, setDeptStats] = useState(null);
    const [infoMessage, setInfoMessage] = useState('');
    const [criteria, setCriteria] = useState({ attitude: 0, creativity: 0, clarity: 0, impact: 0 });
    const [presenterScores, setPresenterScores] = useState({}); // { [id]: score }
    const [zoomedPhoto, setZoomedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0); // Cooldown in seconds

    // Fetch Departments
    useEffect(() => {
        axios.get('departments')
            .then(res => {
                const sorted = (res.data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                setDepartments(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching departments", err);
                setError("Error loading departments.");
                setLoading(false);
            });
    }, []);

    const currentDeptIndex = user?.current_dept_index || 0;
    const isFinished = !loading && departments.length > 0 && currentDeptIndex >= departments.length;
    const currentDept = departments[currentDeptIndex] || null;

    // Cooldown Timer Logic
    useEffect(() => {
        if (!currentDept || !user) return;

        const storageKey = `cooldown_${user.id}_dept_${currentDept.id}`;
        const storedStart = localStorage.getItem(storageKey);

        let initialTime;
        if (storedStart) {
            const elapsed = Math.floor((Date.now() - parseInt(storedStart)) / 1000);
            initialTime = Math.max(0, COOLDOWN_SEC - elapsed);
        } else {
            const now = Date.now().toString();
            localStorage.setItem(storageKey, now);
            initialTime = COOLDOWN_SEC;
        }

        setTimeLeft(initialTime);

        if (initialTime > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [currentDeptIndex, user?.id, currentDept?.id]);

    // Handlers
    const handleCriteriaChange = (key, value) => {
        setCriteria(prev => ({ ...prev, [key]: parseInt(value) }));
    };

    const handlePresenterScoreChange = (id, value) => {
        setPresenterScores(prev => ({ ...prev, [id]: parseInt(value) }));
    };

    const isValid = () => {
        const criteriaValid = Object.values(criteria).every(v => v > 0);
        const presentersValid = currentDept?.presenters?.every(p => presenterScores[p.id] > 0);
        return criteriaValid && (presentersValid || (currentDept?.presenters?.length === 0));
    };

    const handleRestart = async () => {
        try {
            await axios.post('auth/reset-index', { user_id: user.id, user_type: user.type });
            const resetUser = { ...user, current_dept_index: 0 };
            
            // Limpiar temporizadores para permitir volver a empezar con los 5 minutos completos
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`cooldown_${user.id}_`)) {
                    localStorage.removeItem(key);
                }
            });

            login(resetUser);
            setCriteria({ attitude: 0, creativity: 0, clarity: 0, impact: 0 });
            setPresenterScores({});
            setShowResults(false);
        } catch (err) {
            console.error("Error resetting index", err);
            setError("Error al reiniciar la votación.");
        }
    };

    const handleNext = () => {
        const nextIndex = currentDeptIndex + 1;
        const updatedUser = { ...user, current_dept_index: nextIndex };
        login(updatedUser);
        setCriteria({ attitude: 0, creativity: 0, clarity: 0, impact: 0 });
        setPresenterScores({});
        setShowResults(false);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (!isValid()) {
            console.log("Validation failed:", { criteria, presenterScores });
            return;
        }
        setSubmitting(true);
        setError('');

        console.log("Submitting vote for:", currentDept.name);

        try {
            await axios.post('votes', {
                user_id: user.id,
                user_type: user.type,
                department_id: currentDept.id,
                criteria_scores: criteria,
                presenter_scores: presenterScores
            });

            console.log("Vote recorded. Advancing...");
            handleNext();

        } catch (err) {
            console.error("Submit error:", err);
            setError(err.response?.data?.error || "Error al enviar la votación.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container">Cargando...</div>;

    if (isFinished) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
                <div className="card glass reveal active">
                    <h1 className="title">VOTACIÓN COMPLETADA</h1>
                    <p className="subtitle">
                        ¡Gracias por participar! Has completado todas las evaluaciones exitosamente.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Volver al Inicio</button>
                </div>
            </div>
        );
    }

    // Safety check: Avoid crash if departments are empty or index is invalid
    if (!currentDept) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
                <div className="card glass">
                    <h2 className="title">No hay evaluaciones disponibles</h2>
                    <p className="subtitle">Por favor, contacta al administrador o vuelve más tarde.</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>Volver al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <span className="subtitle">Evaluando a:</span>
                    <h1 className="title">{currentDept.name}</h1>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                    {currentDeptIndex + 1} / {departments.length}
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

            <div className="dashboard-grid">
                <div className="card fade-in">
                    <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Proyecto</h3>
                    <StarRating label="Actitud" description={CRITERIA_DESCRIPTIONS.attitude} value={criteria.attitude} onChange={(v) => handleCriteriaChange('attitude', v)} />
                    <StarRating label="Creatividad" description={CRITERIA_DESCRIPTIONS.creativity} value={criteria.creativity} onChange={(v) => handleCriteriaChange('creativity', v)} />
                    <StarRating label="Claridad" description={CRITERIA_DESCRIPTIONS.clarity} value={criteria.clarity} onChange={(v) => handleCriteriaChange('clarity', v)} />
                    <StarRating label="Impacto" description={CRITERIA_DESCRIPTIONS.impact} value={criteria.impact} onChange={(v) => handleCriteriaChange('impact', v)} />
                </div>

                <div className="card fade-in">
                    <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Presentadores</h3>

                    {currentDept.presenters && currentDept.presenters.length > 0 ? (
                        currentDept.presenters.map(p => (
                            <div key={p.id} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    {p.photo_url ? (
                                        <div className="presenter-photo-container" onClick={() => setZoomedPhoto(p)}>
                                            <img src={p.photo_url.startsWith('data:') ? p.photo_url : `${BASE_API_URL}${p.photo_url}`} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
                                        </div>
                                    ) : (
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Representante</div>
                                    </div>
                                </div>
                                <StarRating label="Desempeño" value={presenterScores[p.id] || 0} onChange={(v) => handlePresenterScoreChange(p.id, v)} max={10} size={'1.2rem'} showValue={true} />
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sin representantes asignados</p>
                    )}

                    <button
                        className={`btn-primary ${(!isValid() || submitting || timeLeft > 0) ? 'btn-disabled' : ''}`}
                        style={{ width: '100%', marginTop: '1rem', position: 'relative', overflow: 'hidden' }}
                        onClick={handleSubmit}
                        disabled={!isValid() || submitting || timeLeft > 0}
                    >
                        {submitting ? 'Guardando...' :
                            timeLeft > 0
                                ? `ESPERA (${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`
                                : 'SIGUIENTE'
                        }
                        {timeLeft > 0 && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                height: '3px',
                                background: 'var(--accent)',
                                width: `${(timeLeft / COOLDOWN_SEC) * 100}%`,
                                transition: 'width 1s linear'
                            }} />
                        )}
                    </button>
                    {timeLeft > 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                            Tiempo de presentación en curso...
                        </p>
                    ) : (
                        !isValid() && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>Completa todos los campos para continuar</p>
                    )}
                </div>
            </div>
            {/* Results modal shown to jury after voting */}
            {showResults && deptStats && user?.type === 'JURY' && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 60 }}>
                    <div className="card" style={{ width: '90%', maxWidth: 700, position: 'relative' }}>
                        <button onClick={() => setShowResults(false)} style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
                        <h2 style={{ marginTop: 0 }}>{deptStats.name || currentDept.name} — Resultados</h2>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Puntuación final</div>
                                <div style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--primary)' }}>{deptStats.final_score} / 100</div>
                            </div>

                            {/* simple bar for final score (assuming max 10) */}
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 14, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (deptStats.final_score || 0) * 10)}%`, background: 'linear-gradient(90deg, var(--accent), var(--primary))' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Jurado (votos)</div>
                                    <div style={{ fontWeight: 700 }}>{deptStats.jury_stats?.count ?? deptStats.jury_count ?? '-'}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Público (votos)</div>
                                    <div style={{ fontWeight: 700 }}>{deptStats.public_stats?.count ?? deptStats.public_count ?? '-'}</div>
                                </div>
                            </div>

                            {/* Per-criterion comparison (Jurado vs Público) */}
                            <div>
                                <h4 style={{ margin: '6px 0' }}>Detalles por criterio</h4>
                                {['attitude', 'creativity', 'clarity', 'impact'].map((key) => {
                                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                                    const juryAvg = deptStats.jury_stats?.details?.avgPerCriterion?.[key] ?? 0;
                                    const pubAvg = deptStats.public_stats?.details?.avgPerCriterion?.[key] ?? 0;
                                    const juryPct = Math.round((juryAvg / 5) * 100);
                                    const pubPct = Math.round((pubAvg / 5) * 100);
                                    return (
                                        <div key={key} style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                                <div style={{ color: 'var(--text-muted)' }}>{label}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>{((juryAvg || 0).toFixed(2))} / {((pubAvg || 0).toFixed(2))}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${juryPct}%`, background: 'var(--primary)' }} />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pubPct}%`, background: 'var(--accent)' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Presenter averages comparison */}
                            <div>
                                <h4 style={{ margin: '6px 0' }}>Presentador (promedio)</h4>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Jurado</div>
                                        <div style={{ fontWeight: 700 }}>{(deptStats.jury_stats?.details?.avgPresenter || 0).toFixed(2)}</div>
                                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 12, overflow: 'hidden', marginTop: 6 }}>
                                            <div style={{ height: '100%', width: `${Math.min(100, (deptStats.jury_stats?.details?.avgPresenter || 0) * 10)}%`, background: 'var(--primary)' }} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Público</div>
                                        <div style={{ fontWeight: 700 }}>{(deptStats.public_stats?.details?.avgPresenter || 0).toFixed(2)}</div>
                                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, height: 12, overflow: 'hidden', marginTop: 6 }}>
                                            <div style={{ height: '100%', width: `${Math.min(100, (deptStats.public_stats?.details?.avgPresenter || 0) * 10)}%`, background: 'var(--accent)' }} />
                                        </div>
                                    </div>
                                </div>
                                {/* Combined presenter final score */}
                                {(() => {
                                    const juryPresenter = deptStats.jury_stats?.details?.avgPresenter || 0;
                                    const pubPresenter = deptStats.public_stats?.details?.avgPresenter || 0;
                                    let presenterCombined = 0;
                                    if ((deptStats.jury_stats?.count || 0) > 0 && (deptStats.public_stats?.count || 0) > 0) {
                                        presenterCombined = (juryPresenter * 0.7) + (pubPresenter * 0.3);
                                    } else if ((deptStats.jury_stats?.count || 0) > 0) {
                                        presenterCombined = juryPresenter;
                                    } else if ((deptStats.public_stats?.count || 0) > 0) {
                                        presenterCombined = pubPresenter;
                                    }

                                    return (
                                        <div style={{ marginTop: 8, textAlign: 'right', color: 'var(--text-muted)' }}>
                                            <div style={{ fontSize: 13 }}>Calificación combinada presentador</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{presenterCombined.toFixed(2)} / 10</div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <button className="btn-primary" onClick={handleNext}>Continuar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info for jury when results are not yet available */}
            {infoMessage && user?.type === 'JURY' && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, color: 'var(--text-muted)' }}>{infoMessage}</div>
            )}

            {/* Photo Zoom Modal */}
            {zoomedPhoto && (
                <div className="image-zoom-overlay" onClick={() => setZoomedPhoto(null)}>
                    <div className="image-zoom-content">
                        <img src={zoomedPhoto.photo_url.startsWith('data:') ? zoomedPhoto.photo_url : `${BASE_API_URL}${zoomedPhoto.photo_url}`} alt={zoomedPhoto.name} />
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <h2 style={{ margin: 0 }}>{zoomedPhoto.name}</h2>
                            <p style={{ color: 'var(--accent)', margin: '5px 0 0' }}>Presentador</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotingFlow;
