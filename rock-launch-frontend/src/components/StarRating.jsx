import React, { useState } from 'react';
import './StarRating.css';

export default function StarRating({ label, description, value = 0, onChange, max = 5, size = '1.9rem', showValue = false }) {
    // choose a size class to help with consistent styling
    const sizeClass = size === '1.4rem' ? 'sr-small' : size === '1.6rem' ? 'sr-medium' : size === '2.2rem' ? 'sr-large' : '';
    const [expanded, setExpanded] = useState(false);
    const maxLen = 100; // characters to show before truncating

    const renderDescription = () => {
        if (!description) return null;
        if (description.length <= maxLen) return <p className="sr-desc">{description}</p>;
        if (expanded) {
            return (
                <p className="sr-desc">
                    {description} <button type="button" className="sr-desc-toggle" onClick={() => setExpanded(false)}>Ver menos</button>
                </p>
            );
        }
        const short = description.slice(0, maxLen).trim();
        return (
            <p className="sr-desc">
                {short}… <button type="button" className="sr-desc-toggle" onClick={() => setExpanded(true)}>Ver más</button>
            </p>
        );
    };

    return (
        <div className={`sr-root ${sizeClass}`}>
            {label && <label className="sr-label">{label}</label>}
            {renderDescription()}
            <div className="sr-stars" role="radiogroup" aria-label={label || 'rating'}>
                {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        aria-label={`${label || 'Valor'} ${star} de ${max}`}
                        aria-pressed={star === value}
                        className="sr-star-btn"
                    >
                        <span className={`sr-star ${star <= value ? 'full' : ''}`}>★</span>
                    </button>
                ))}
                {showValue && <span className="sr-value">{value || '-'}</span>}
            </div>
        </div>
    );
}
