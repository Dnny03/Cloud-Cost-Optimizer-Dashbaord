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
          <AlertsPanel />
        </div>
        <div className="insights-panel">
          <RecommendationsPanel />
        </div>
      </div>

      <div className="insights-bottom-row">
        <AnomalyDetectionPanel />
      </div>

      <style>{`
        .insights-top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .insights-panel {
          min-height: 0;
        }
        
        .insights-panel .card {
          height: 100%;
          max-height: 450px;
          overflow-y: auto;
        }
        
        .insights-bottom-row .card {
          max-height: 400px;
          overflow-y: auto;
        }
        
        @media (max-width: 1024px) {
          .insights-top-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}