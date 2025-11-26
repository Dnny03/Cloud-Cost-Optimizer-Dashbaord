# backend/app/services/providers/azure_provider.py
# FIXED: Datetime serialization issues
from typing import List, Dict, Any
from .base_provider import BaseCloudProvider
from datetime import datetime, timedelta, date

try:
    from azure.identity import DefaultAzureCredential, AzureCliCredential
    from azure.mgmt.costmanagement import CostManagementClient

    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False


class AzureProvider(BaseCloudProvider):

    def _validate_config(self):
        if not AZURE_AVAILABLE:
            raise ImportError("Azure SDK not installed. Run: pip install azure-identity azure-mgmt-costmanagement")
        if 'subscription_id' not in self.config:
            raise ValueError("Azure subscription_id required")

    def _get_credential(self):
        """Get Azure credential using default chain or CLI"""
        if self.config.get('use_cli_auth'):
            return AzureCliCredential()
        return DefaultAzureCredential()

    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Get MTD costs using Azure Cost Management"""
        try:
            credential = self._get_credential()
            client = CostManagementClient(credential)

            scope = f"/subscriptions/{self.config['subscription_id']}"

            now = datetime.now()
            # FIXED: Ensure dates are strings, not date objects
            start = now.replace(day=1).strftime('%Y-%m-%d')
            end = now.strftime('%Y-%m-%d')

            query = {
                "type": "Usage",
                "timeframe": "Custom",
                "time_period": {"from": start, "to": end},
                "dataset": {
                    "granularity": "None",
                    "aggregation": {
                        "totalCost": {"name": "PreTaxCost", "function": "Sum"}
                    },
                    "grouping": [
                        {"type": "Dimension", "name": "ServiceName"}
                    ]
                }
            }

            result = client.query.usage(scope, query)
            costs = []

            for row in result.rows:
                costs.append({
                    'service': str(row[1]),
                    'cost': float(row[0])
                })

            return sorted(costs, key=lambda x: x['cost'], reverse=True)
        except Exception as e:
            return [{'error': str(e)}]

    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily cost trend"""
        try:
            credential = self._get_credential()
            client = CostManagementClient(credential)

            scope = f"/subscriptions/{self.config['subscription_id']}"

            end = datetime.now()
            start = end - timedelta(days=days)

            # FIXED: Ensure dates are strings
            query = {
                "type": "Usage",
                "timeframe": "Custom",
                "time_period": {
                    "from": start.strftime('%Y-%m-%d'),
                    "to": end.strftime('%Y-%m-%d')
                },
                "dataset": {
                    "granularity": "Daily",
                    "aggregation": {
                        "totalCost": {"name": "PreTaxCost", "function": "Sum"}
                    }
                }
            }

            result = client.query.usage(scope, query)
            costs = []

            for row in result.rows:
                # FIXED: Ensure date is properly serialized
                date_value = row[0]
                if isinstance(date_value, datetime):
                    date_str = date_value.strftime('%Y-%m-%d')
                elif isinstance(date_value, date):
                    date_str = date_value.strftime('%Y-%m-%d')
                elif hasattr(date_value, 'isoformat'):
                    date_str = date_value.isoformat()
                else:
                    date_str = str(date_value)

                costs.append({
                    'date': date_str,
                    'cost': float(row[1])
                })

            return sorted(costs, key=lambda x: x['date'])
        except Exception as e:
            return [{'error': str(e), 'message': 'Azure daily costs not yet fully implemented'}]

    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live VM metrics from Azure Monitor"""
        # Return mock data for now with proper datetime serialization
        return {
            'updated_at': datetime.utcnow().isoformat(),
            'cpu_percent': 0,
            'instances_monitored': 0,
            'message': 'Azure live metrics not yet fully implemented'
        }

    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data"""
        # Return empty arrays with proper structure
        if metric_type == 'cpu':
            return {
                'ts': [],
                'cpu_percent': [],
                'message': 'Azure timeseries not yet fully implemented'
            }
        else:
            return {
                'ts': [],
                'values': [],
                'message': 'Azure timeseries not yet fully implemented'
            }
