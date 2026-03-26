import React from 'react';

const FeatureCard = ({ title, description, icon }) => {
    return (
        <div className="feature-card glass reveal">
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
            <style>{`
        .feature-card {
          padding: 2.5rem;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-10px) scale(1.02);
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.1);
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, var(--accent), #fff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        .feature-description {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.6;
        }
      `}</style>
        </div>
    );
};

export default FeatureCard;
