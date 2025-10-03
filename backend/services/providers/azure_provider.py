from typing import List, Dict, Any
from services.base_provider import BaseCloudProvider
from datetime import datetime, timedelta

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
                    'service': row[1],
                    'cost': float(row[0])
                })
            
            return sorted(costs, key=lambda x: x['cost'], reverse=True)
        except Exception as e:
            return [{'error': str(e)}]
    
    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily cost trend"""
        return [{'message': 'Azure daily costs not yet fully implemented'}]
    
    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live VM metrics from Azure Monitor"""
        return {'message': 'Azure live metrics not yet fully implemented'}
    
    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data"""
        return {'message': 'Azure timeseries not yet fully implemented'}