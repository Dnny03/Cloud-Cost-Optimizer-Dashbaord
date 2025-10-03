from typing import List, Dict, Any
from services.base_provider import BaseCloudProvider

try:
    from google.cloud import bigquery, monitoring_v3
    from google.oauth2 import service_account
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False

from datetime import datetime, timedelta, timezone
import os

class GCPProvider(BaseCloudProvider):
    
    def _validate_config(self):
        if not GCP_AVAILABLE:
            raise ImportError("Google Cloud libraries not installed. Run: pip install google-cloud-bigquery google-cloud-monitoring")
        if 'project_id' not in self.config:
            raise ValueError("GCP project_id required")
    
    def _get_credentials(self):
        creds_path = self.config.get('credentials_path')
        if creds_path and os.path.exists(creds_path):
            return service_account.Credentials.from_service_account_file(creds_path)
        return None  # Use ADC
    
    def _bq_client(self):
        return bigquery.Client(
            project=self.config['project_id'],
            credentials=self._get_credentials()
        )
    
    def _monitoring_client(self):
        return monitoring_v3.MetricServiceClient(credentials=self._get_credentials())
    
    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Query BigQuery for MTD costs"""
        dataset = self.config.get('billing_dataset', 'billing_export')
        table = self.config.get('billing_table', 'gcp_billing_export_v1_')
        
        sql = f"""
        SELECT
          project.name AS project,
          service.description AS service,
          ROUND(SUM(cost), 2) AS cost
        FROM `{dataset}.{table}*`
        WHERE usage_start_time >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
        GROUP BY 1,2
        ORDER BY cost DESC
        """
        
        client = self._bq_client()
        return [dict(row) for row in client.query(sql).result()]
    
    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Query BigQuery for daily costs"""
        dataset = self.config.get('billing_dataset', 'billing_export')
        table = self.config.get('billing_table', 'gcp_billing_export_v1_')
        
        sql = f"""
        SELECT
          DATE(usage_start_time) AS date,
          ROUND(SUM(cost), 2) AS cost
        FROM `{dataset}.{table}*`
        WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
        GROUP BY date
        ORDER BY date
        """
        
        client = self._bq_client()
        results = []
        for row in client.query(sql).result():
            results.append({
                'date': row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                'cost': float(row['cost'])
            })
        return results
    
    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live VM metrics from Cloud Monitoring"""
        try:
            return self._fetch_live_metrics()
        except Exception as e:
            return {
                'error': str(e),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
    
    def _fetch_live_metrics(self) -> Dict[str, Any]:
        """Fetch metrics from Cloud Monitoring"""
        project_name = f"projects/{self.config['project_id']}"
        client = self._monitoring_client()
        
        end = datetime.now(timezone.utc)
        start = end - timedelta(minutes=5)
        interval = monitoring_v3.TimeInterval(
            end_time={"seconds": int(end.timestamp())},
            start_time={"seconds": int(start.timestamp())},
        )
        
        # CPU utilization
        cpu_filter = 'metric.type="compute.googleapis.com/instance/cpu/utilization"'
        cpu_series = list(client.list_time_series(
            request={
                "name": project_name,
                "filter": cpu_filter,
                "interval": interval,
                "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
            }
        ))
        
        cpu_vals = []
        for ts in cpu_series:
            for p in ts.points:
                if p.value.double_value is not None:
                    cpu_vals.append(p.value.double_value * 100)
        
        cpu_avg = round(sum(cpu_vals) / len(cpu_vals), 1) if cpu_vals else 0.0
        
        return {
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'cpu_percent': cpu_avg,
            'instances_monitored': len(cpu_series)
        }
    
    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data for charts"""
        if metric_type == 'cpu':
            return self._cpu_timeseries(minutes)
        elif metric_type == 'traffic':
            return self._traffic_timeseries(minutes)
        else:
            return {"error": "Unsupported metric type"}
    
    def _cpu_timeseries(self, minutes: int) -> Dict[str, Any]:
        """CPU time series"""
        # Simplified implementation
        return {
            "ts": [],
            "cpu_percent": []
        }
    
    def _traffic_timeseries(self, minutes: int) -> Dict[str, Any]:
        """Network traffic time series"""
        return {
            "ts": [],
            "mbps_in": [],
            "mbps_out": []
        }