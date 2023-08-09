import React, { useState, useImperativeHandle, forwardRef } from "react";
import "../css/loading.css";


export const LoadingPage = forwardRef(function LoadingPage({ enable_default, text }, ref) {
    const [enabled, setEnabled] = useState(enable_default);
	
    useImperativeHandle(ref, () => ({
        enable() {
            setEnabled(true);
        },
        disable() {
            setEnabled(false);
        }
	}));
    
    if (enabled === false) {
        return <div className="not-loading">&nbsp;</div>;
    } else {
        return (
            <div className="loading-page-container">
                <div className="loading-frame">
                    <div className="loading-spin">&nbsp;</div>
                    <span>{text}</span>
                </div>
            </div>
        );
    }
});
