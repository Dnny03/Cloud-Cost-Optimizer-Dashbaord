# backend/app/services/providers/base_provider.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseCloudProvider(ABC):
    """Abstract base class for cloud providers"""

    def __init__(self, config: Dict):
        self.config = config
        self._validate_config()

    @abstractmethod
    def _validate_config(self):
        """Validate provider-specific configuration"""
        pass

    @abstractmethod
    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Get month-to-date costs by service/project"""
        pass

    @abstractmethod
    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily cost trend"""
        pass

    @abstractmethod
    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live metrics (CPU, memory, network, etc.)"""
        pass

    @abstractmethod
    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data for charts"""
        pass

    def get_mtd_total(self) -> float:
        """Get total MTD cost (default implementation)"""
        try:
            costs = self.get_mtd_costs()
            return sum(item.get('cost', 0) for item in costs)
        except:
            return 0.0

    # ==================== NEW FEATURE METHODS ====================
    # These have default implementations so real providers don't break
    # MockProvider overrides all of these with full implementations

    def get_anomalies(self) -> List[Dict[str, Any]]:
        """Get detected cost anomalies

        Returns list of anomalies with:
        - id, service, category, expected_cost, actual_cost
        - deviation_percent, severity, detected_at
        - description, recommendation
        """
        return []  # Default: no anomalies

    def get_forecast(self, days: int = 7) -> Dict[str, Any]:
        """Get cost forecast for next N days

        Returns:
        - forecast_data: list of {date, cost, type, cost_low, cost_high}
        - current_mtd, projected_eom, daily_average
        - trend: 'increasing' | 'stable' | 'decreasing'
        - confidence: float 0-1
        """
        return {
            'forecast_data': [],
            'current_mtd': self.get_mtd_total(),
            'projected_eom': 0,
            'daily_average': 0,
            'trend': 'stable',
            'confidence': 0
        }

    def get_recommendations(self) -> List[Dict[str, Any]]:
        """Get cost optimization recommendations

        Returns list of recommendations with:
        - id, type, title, description
        - potential_savings_monthly, potential_savings_yearly
        - effort: 'low' | 'medium' | 'high'
        - impact: 'low' | 'medium' | 'high'
        - category, status, created_at
        """
        return []  # Default: no recommendations

    def get_alerts(self) -> List[Dict[str, Any]]:
        """Get active cost alerts

        Returns list of alerts with:
        - id, type, title, message
        - severity: 'critical' | 'high' | 'warning' | 'medium' | 'low'
        - acknowledged: bool
        - created_at
        """
        return []  # Default: no alerts

    def get_budgets(self) -> List[Dict[str, Any]]:
        """Get budget tracking data

        Returns list of budgets with:
        - id, name, type: 'overall' | 'category'
        - budget_amount, spent_amount, remaining_amount
        - utilization_percent, projected_eom, projected_utilization
        - period, start_date, end_date
        - status: 'on_track' | 'at_risk'
        """
        return []  # Default: no budgets

    def get_services_breakdown(self) -> Dict[str, Any]:
        """Get detailed services breakdown by category

        Returns:
        - breakdown: list of categories with services
        - total_cost, total_services, category_count
        """
        # Default implementation using get_mtd_costs
        try:
            costs = self.get_mtd_costs()
            categories = {}

            for item in costs:
                cat = item.get('category', 'Other')
                if cat not in categories:
                    categories[cat] = {
                        'category': cat,
                        'total_cost': 0,
                        'service_count': 0,
                        'services': []
                    }
                categories[cat]['total_cost'] += item.get('cost', 0)
                categories[cat]['service_count'] += 1
                categories[cat]['services'].append(item)

            breakdown = sorted(
                categories.values(),
                key=lambda x: x['total_cost'],
                reverse=True
            )

            return {
                'breakdown': breakdown,
                'total_cost': sum(c['total_cost'] for c in breakdown),
                'total_services': sum(c['service_count'] for c in breakdown),
                'category_count': len(breakdown)
            }
        except:
            return {
                'breakdown': [],
                'total_cost': 0,
                'total_services': 0,
                'category_count': 0
            }