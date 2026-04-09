import React from 'react';

const VotingProcess = () => {
    const steps = [
        {
            id: '01',
            title: 'Acceso Directo',
            description: 'Recibirás un link personal vía WhatsApp. No necesitas usuarios ni contraseñas; tu invitación es única e intransferible.',
            icon: '📱'
        },
        {
            id: '02',
            title: 'Temporizador Activo',
            description: 'Cada presentación cuenta con un tiempo regulado. El sistema desbloqueará la votación automáticamente tras el periodo de exposición.',
            icon: '⏱️'
        },
        {
            id: '03',
            title: 'Evaluación de Rocks',
            description: 'Calificarás cada criterio con un sistema de estrellas. Recuerda que tu evaluación es nominal para garantizar la transparencia.',
            icon: '⭐'
        },
        {
            id: '04',
            title: 'Cierre de Bloque',
            description: 'Una vez enviada tu votación, pasarás al siguiente departamento. Al finalizar todos los bloques, tu participación habrá concluido.',
            icon: '🏁'
        }
    ];

    return (
        <div className="process-container">
            <h2 className="section-title reveal">
                <span style={{ fontSize: '0.4em', display: 'block', color: 'var(--accent)', letterSpacing: '0.8rem', marginBottom: '0.5rem', fontWeight: '500' }}>¿CÓMO FUNCIONA?</span>
                PROCESO DE VOTACIÓN
            </h2>
            
            <div className="process-grid">
                {steps.map((step, index) => (
                    <div key={step.id} className="process-card reveal" style={{ transitionDelay: `${index * 100}ms` }}>
                        <div className="process-step-badge">{step.id}</div>
                        <div className="process-icon">{step.icon}</div>
                        <h3 className="process-card-title">{step.title}</h3>
                        <p className="process-card-text">{step.description}</p>
                    </div>
                ))}
            </div>

            <div className="important-info reveal" style={{ marginTop: '5rem', padding: '3rem', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '30px', border: '1px solid rgba(212, 175, 55, 0.1)', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>⚠️ NOTA IMPORTANTE</h3>
                <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    Para garantizar una evaluación justa, el botón de <strong>"ENVIAR"</strong> se activará únicamente cuando el cronómetro de la presentación llegue a cero. Asegúrate de prestar atención a cada detalle antes de emitir tu voto, ya que <strong>no se podrán realizar cambios</strong> una vez enviado el bloque.
                </p>
            </div>

            <style>{`
                .process-container {
                    padding: 6rem 0;
                    width: 100%;
                }
                .process-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2.5rem;
                    margin-top: 4rem;
                }
                .process-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 3rem 2rem;
                    border-radius: 24px;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .process-card:hover {
                    background: rgba(212, 175, 55, 0.04);
                    border-color: rgba(212, 175, 55, 0.3);
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                .process-step-badge {
                    position: absolute;
                    top: -15px;
                    right: 30px;
                    background: var(--accent);
                    color: #000;
                    font-weight: 900;
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    letter-spacing: 1px;
                    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
                }
                .process-icon {
                    font-size: 3rem;
                    margin-bottom: 2rem;
                    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.1));
                }
                .process-card-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 1.25rem;
                    color: #fff;
                    letter-spacing: 1px;
                }
                .process-card-text {
                    color: var(--text-muted);
                    line-height: 1.6;
                    font-size: 1.05rem;
                }
                @media (max-width: 768px) {
                    .process-container {
                        padding: 4rem 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default VotingProcess;
