import React from 'react';
import ForecastingChart from './ForecastingChart.jsx';
import BudgetTracker from './BudgetTracker.jsx';

export default function BudgetsTab() {
  return (
    <div className="provider-tab">
      <h2>Budgets & Forecast</h2>

      <div className="budgets-content">
        <ForecastingChart />
        <BudgetTracker />
      </div>

      <style>{`
        .budgets-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}