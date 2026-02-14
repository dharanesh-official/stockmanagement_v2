import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullScreen = false, message = 'Loading...' }) => {
    const sizeMap = {
        small: 20,
        medium: 40,
        large: 60
    };

    if (fullScreen) {
        return (
            <div className="loading-overlay">
                <div className="loading-content">
                    <Loader2 size={sizeMap[size]} className="spinner" />
                    <p className="loading-message">{message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="loading-inline">
            <Loader2 size={sizeMap[size]} className="spinner" />
            {message && <span className="loading-message">{message}</span>}
        </div>
    );
};

export default LoadingSpinner;
