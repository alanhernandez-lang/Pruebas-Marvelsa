import React from 'react';

function ThankYou() {
    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <div className="card fade-in">
                <h1 className="title" style={{ color: 'var(--success)' }}>¡Votación Completada!</h1>
                <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                    Gracias por tu participación en el Rock Launch. Tus evaluaciones han sido registradas correctamente.
                </p>
                <p style={{ color: 'var(--text-muted)' }}>Puedes cerrar esta ventana.</p>
            </div>
        </div>
    );
}

export default ThankYou;
