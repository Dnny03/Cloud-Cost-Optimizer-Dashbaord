import React from 'react';
import AlertsPanel from './AlertsPanel.jsx';
import AnomalyDetectionPanel from './AnomalyDetectionPanel.jsx';
import RecommendationsPanel from './RecommendationsPanel.jsx';

export default function InsightsTab() {
    return (
        <div className="provider-tab">
            <h2>Insights & Alerts</h2>

            <div className="insights-top-row">
                <div className="insights-panel">
                    <AlertsPanel/>
                </div>
                <div className="insights-panel">
                    <RecommendationsPanel/>
                </div>
            </div>

            <div className="insights-bottom-row">
                <AnomalyDetectionPanel/>
            </div>
        </div>
    );
}