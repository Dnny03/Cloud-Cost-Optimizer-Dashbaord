# backend/app/services/providers/mock_provider.py
"""
Mock cloud provider for testing without real credentials
Returns realistic fake data for development
"""

from typing import List, Dict, Any
from .base_provider import BaseCloudProvider
from datetime import datetime, timedelta, timezone
import random


class MockProvider(BaseCloudProvider):
    """Mock provider that returns fake data for testing"""

    def __init__(self, config: Dict):
        super().__init__(config)
        self.provider_name = config.get('name', 'mock')

    def _validate_config(self):
        # No validation needed for mock
        pass

    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Return mock MTD costs"""
        services = [
            {'service': 'Compute Engine', 'project': 'my-project', 'cost': 1250.45},
            {'service': 'Cloud Storage', 'project': 'my-project', 'cost': 450.30},
            {'service': 'BigQuery', 'project': 'analytics', 'cost': 890.75},
            {'service': 'Cloud SQL', 'project': 'database', 'cost': 675.20},
            {'service': 'Kubernetes Engine', 'project': 'k8s-prod', 'cost': 2100.00},
        ]

        # Add some randomness to make it look real
        for item in services:
            item['cost'] = round(item['cost'] * (0.9 + random.random() * 0.2), 2)

        return sorted(services, key=lambda x: x['cost'], reverse=True)

    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Return mock daily costs"""
        results = []
        base_cost = 150.0
        today = datetime.now()

        for i in range(days):
            date = today - timedelta(days=days - i - 1)
            # Add some variation
            daily_cost = base_cost + random.uniform(-50, 100)
            results.append({
                'date': date.strftime('%Y-%m-%d'),
                'cost': round(daily_cost, 2)
            })

        return results

    def get_live_metrics(self) -> Dict[str, Any]:
        """Return mock live metrics"""
        return {
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'cpu_percent': round(45.0 + random.uniform(-20, 30), 1),
            'instances_monitored': 12,
            'memory_percent': round(60.0 + random.uniform(-15, 20), 1),
            'network_in_mbps': round(25.5 + random.uniform(-10, 15), 1),
            'network_out_mbps': round(18.3 + random.uniform(-5, 10), 1)
        }

    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Return mock timeseries data"""
        data_points = min(minutes, 60)  # Limit data points
        ts = []
        values = []

        now = datetime.now(timezone.utc)
        base_value = 50.0 if metric_type == 'cpu' else 100.0

        for i in range(data_points):
            timestamp = now - timedelta(minutes=data_points - i)
            ts.append(timestamp.isoformat())
            values.append(round(base_value + random.uniform(-20, 20), 1))

        if metric_type == 'cpu':
            return {'ts': ts, 'cpu_percent': values}
        elif metric_type == 'memory':
            return {'ts': ts, 'memory_percent': values}
        else:
            return {'ts': ts, 'values': values}