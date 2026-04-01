import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = ({ isVotingEnabled }) => {
  const navigate = useNavigate();

  return (
    <div className="hero-section" id="home">
      <div className="hero-content reveal active">
        <div className="hero-badge">ROCK LAUNCH</div>
        <h1 className="hero-title">
          <span className="title-top">INGRESANDO A LA</span>
          <br />
          <span className="title-main">NUEVA ERA</span>
        </h1>
        <p className="hero-subtitle">
          Rock Launch 2025 es el epicentro de la disrupción tecnológica.
          Únete a los líderes que están forjando el destino de la industria.
        </p>
        <div className="hero-actions">
          <button
            className={`btn-primary main-cta ${!isVotingEnabled ? 'btn-disabled' : ''}`}
            onClick={() => {
              if (isVotingEnabled) {
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');
                if (token) {
                  navigate(`/votar?token=${token}`);
                } else {
                  navigate('/vote');
                }
              }
            }}
            disabled={!isVotingEnabled}
            title={!isVotingEnabled ? "Votación habilitada próximamente" : "Ir a votar"}
          >
            INICIAR VOTACIÓN
          </button>
          <button className="btn-outline secondary-cta" onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}>
            VER DETALLES
          </button>
        </div>
      </div>
      <style>{`
        .hero-section {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem 2rem 4rem;
          position: relative;
        }
        .hero-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid var(--accent);
          color: var(--accent);
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.2rem;
          margin-bottom: 2rem;
          text-transform: uppercase;
        }
        .hero-title {
          font-size: clamp(3rem, 10vw, 6rem);
          line-height: 0.9;
          font-weight: 900;
          margin-bottom: 2rem;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }
        .title-top {
          font-size: 0.4em;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.5rem;
        }
        .title-main {
          background: linear-gradient(to right, #fff 20%, var(--accent) 50%, #fff 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 5s linear infinite;
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
        .hero-subtitle {
          max-width: 600px;
          margin: 0 auto 3rem;
          font-size: 1.25rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .main-cta {
          padding: 1.25rem 3rem;
          font-size: 1.1rem;
          box-shadow: 0 0 30px rgba(91, 113, 119, 0.3);
        }
        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
          transform: none !important;
          box-shadow: none !important;
        }
        .main-cta:disabled {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--glass-border);
          color: var(--text-muted);
        }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: #fff;
          padding: 1.25rem 3rem;
          font-size: 1.1rem;
          border-radius: var(--radius-md);
          transition: all 0.3s;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default Hero;
