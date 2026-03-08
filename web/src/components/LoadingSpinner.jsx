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
            <div className="premium-loading-overlay full-screen fade-in">
                <div className="loading-nexus">
                    <div className="loading-orbit">
                        <div className="orbit-dot"></div>
                    </div>
                    {message && <p className="loading-subtitle">{message}</p>}
                </div>
            </div>
        );
    }

    if (size === 'large') {
        return (
            <div className="premium-loading-overlay contained fade-in">
                <div className="loading-nexus">
                    <div className="loading-orbit">
                        <div className="orbit-dot"></div>
                    </div>
                    {message && <p className="loading-subtitle">{message}</p>}
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
