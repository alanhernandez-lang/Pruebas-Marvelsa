import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate, onFinish }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Call onFinish only when timer reaches zero
  useEffect(() => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference <= 0 && onFinish) {
      onFinish();
    }
  }, [targetDate, onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, targetDate]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    timerComponents.push(
      <div key={interval} className="countdown-item">
        <span className="countdown-value">{timeLeft[interval].toString().padStart(2, '0')}</span>
        <span className="countdown-label">{interval.toUpperCase()}</span>
      </div>
    );
  });

  return (
    <div className="countdown-container glass">
      {timerComponents.length ? timerComponents : <span>Lanzamiento en curso!</span>}
      <style>{`
        .countdown-container {
          display: flex;
          gap: 2rem;
          padding: 2rem 3rem;
          margin-top: 3rem;
          justify-content: center;
          align-items: center;
        }
        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .countdown-value {
          font-size: 3.5rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          background: linear-gradient(135deg, #fff, var(--text-muted));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .countdown-label {
          font-size: 0.75rem;
          letter-spacing: 0.2rem;
          color: var(--accent);
          font-weight: 600;
          margin-top: 0.5rem;
        }
        @media (max-width: 640px) {
          .countdown-container {
            gap: 1rem;
            padding: 1.5rem;
          }
          .countdown-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Countdown;
