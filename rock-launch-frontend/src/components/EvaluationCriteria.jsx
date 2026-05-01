import React from 'react';

const EvaluationCriteria = () => {
    const criteria = [
        {
            id: 1,
            title: 'Impacto',
            description: 'Evalúa el resultado real y positivo que dejaron los Rocks trabajados en el 2025.',
            color: '#10b981', // Green
            icon: '1'
        },
        {
            id: 2,
            title: 'Creatividad',
            description: 'Evalúa la originalidad y frescura de la presentación.',
            color: '#3b82f6', // Blue
            icon: '2'
        },
        {
            id: 3,
            title: 'Claridad',
            description: 'Evalúa la capacidad del equipo para explicar su proyecto de forma sencilla.',
            color: '#fbbf24', // Yellow/Gold
            icon: '3'
        },
        {
            id: 4,
            title: 'Actitud',
            description: 'Evalúa el desempeño del presentador en el escenario (disposición y energía positiva).',
            color: '#ef4444', // Red
            icon: '4'
        }
    ];

    return (
        <div className="criteria-container">
            <div className="criteria-grid">
                {criteria.map((item) => (
                    <div key={item.id} className="criteria-card glass reveal" style={{ '--accent-color': item.color }}>
                        <div className="criteria-number-wrapper">
                            <div className="criteria-number">{item.icon}</div>
                            <div className="criteria-number-blur"></div>
                        </div>
                        <h3 className="criteria-title">{item.title}</h3>
                        <p className="criteria-description">{item.description}</p>
                    </div>
                ))}
            </div>

            <style>{`
        .criteria-container {
          width: 100%;
          margin-top: 4rem;
        }
        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2rem;
        }
        .criteria-card {
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .criteria-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: var(--accent-color);
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        .criteria-card:hover {
          transform: translateY(-15px) rotateX(4deg) rotateY(4deg);
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6), 
                      0 0 30px -5px var(--accent-color);
        }
        .criteria-card:hover .criteria-number {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }
        .criteria-card:hover::before {
          opacity: 1;
          height: 6px;
        }
        .criteria-number-wrapper {
          position: relative;
          margin-bottom: 2.5rem;
          width: 80px;
          height: 80px;
          perspective: 1000px;
        }
        .criteria-number {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), #fff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          font-weight: 900;
          color: #000;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .criteria-number-blur {
          position: absolute;
          inset: -5px;
          background: var(--accent-color);
          filter: blur(15px);
          opacity: 0.3;
          border-radius: 50%;
          z-index: 1;
          transition: opacity 0.3s ease;
        }
        .criteria-card:hover .criteria-number-blur {
          opacity: 0.6;
        }
        .criteria-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 1.25rem;
          color: #fff;
          letter-spacing: 0.1rem;
          text-transform: uppercase;
        }
        .criteria-description {
          color: var(--text-muted);
          font-size: 1.1rem;
          line-height: 1.7;
          font-weight: 400;
        }
        @media (max-width: 768px) {
          .criteria-card {
            padding: 2.5rem 1.5rem;
          }
          .criteria-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
        </div>
    );
};

export default EvaluationCriteria;
