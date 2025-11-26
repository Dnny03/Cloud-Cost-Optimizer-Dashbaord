"""
Comprehensive Mock Cloud Provider for Cloud Cost Optimizer Dashboard
Returns realistic fake data for development and demos
Includes: 140+ services, anomalies, forecasting, recommendations, alerts, budgets
"""

from typing import List, Dict, Any
from .base_provider import BaseCloudProvider
from datetime import datetime, timedelta, timezone
import random


class MockProvider(BaseCloudProvider):
    """Mock provider that returns comprehensive fake data for testing"""

    def __init__(self, config: Dict):
        super().__init__(config)
        self.provider_name = config.get('name', 'mock')

        # Define comprehensive service catalogs for each provider
        self._service_catalogs = {
            'aws': self._get_aws_services(),
            'azure': self._get_azure_services(),
            'gcp': self._get_gcp_services()
        }

    def _validate_config(self):
        """No validation needed for mock provider"""
        pass

    # ==================== SERVICE CATALOGS ====================

    def _get_aws_services(self) -> List[Dict[str, Any]]:
        """Return comprehensive AWS service catalog with 50+ services"""
        return [
            # Compute Services
            {'service': 'Amazon EC2', 'category': 'Compute', 'base_cost': 2500.00},
            {'service': 'AWS Lambda', 'category': 'Compute', 'base_cost': 450.00},
            {'service': 'Amazon ECS', 'category': 'Compute', 'base_cost': 890.00},
            {'service': 'Amazon EKS', 'category': 'Compute', 'base_cost': 1200.00},
            {'service': 'AWS Fargate', 'category': 'Compute', 'base_cost': 780.00},
            {'service': 'Amazon Lightsail', 'category': 'Compute', 'base_cost': 120.00},
            {'service': 'AWS Batch', 'category': 'Compute', 'base_cost': 340.00},
            {'service': 'AWS Elastic Beanstalk', 'category': 'Compute', 'base_cost': 210.00},

            # Storage Services
            {'service': 'Amazon S3', 'category': 'Storage', 'base_cost': 1800.00},
            {'service': 'Amazon EBS', 'category': 'Storage', 'base_cost': 950.00},
            {'service': 'Amazon EFS', 'category': 'Storage', 'base_cost': 420.00},
            {'service': 'Amazon FSx', 'category': 'Storage', 'base_cost': 380.00},
            {'service': 'Amazon S3 Glacier', 'category': 'Storage', 'base_cost': 85.00},
            {'service': 'AWS Storage Gateway', 'category': 'Storage', 'base_cost': 290.00},
            {'service': 'AWS Backup', 'category': 'Storage', 'base_cost': 175.00},

            # Database Services
            {'service': 'Amazon RDS', 'category': 'Database', 'base_cost': 1650.00},
            {'service': 'Amazon DynamoDB', 'category': 'Database', 'base_cost': 890.00},
            {'service': 'Amazon ElastiCache', 'category': 'Database', 'base_cost': 540.00},
            {'service': 'Amazon Redshift', 'category': 'Database', 'base_cost': 1200.00},
            {'service': 'Amazon DocumentDB', 'category': 'Database', 'base_cost': 480.00},
            {'service': 'Amazon Neptune', 'category': 'Database', 'base_cost': 320.00},
            {'service': 'Amazon Aurora', 'category': 'Database', 'base_cost': 980.00},
            {'service': 'Amazon MemoryDB', 'category': 'Database', 'base_cost': 410.00},
            {'service': 'Amazon Keyspaces', 'category': 'Database', 'base_cost': 190.00},
            {'service': 'Amazon Timestream', 'category': 'Database', 'base_cost': 260.00},

            # Networking Services
            {'service': 'Amazon VPC', 'category': 'Networking', 'base_cost': 350.00},
            {'service': 'Amazon CloudFront', 'category': 'Networking', 'base_cost': 680.00},
            {'service': 'Amazon Route 53', 'category': 'Networking', 'base_cost': 125.00},
            {'service': 'Amazon API Gateway', 'category': 'Networking', 'base_cost': 290.00},
            {'service': 'AWS Direct Connect', 'category': 'Networking', 'base_cost': 850.00},
            {'service': 'AWS Global Accelerator', 'category': 'Networking', 'base_cost': 420.00},
            {'service': 'Elastic Load Balancing', 'category': 'Networking', 'base_cost': 380.00},
            {'service': 'AWS Transit Gateway', 'category': 'Networking', 'base_cost': 290.00},

            # Analytics Services
            {'service': 'Amazon Athena', 'category': 'Analytics', 'base_cost': 340.00},
            {'service': 'Amazon EMR', 'category': 'Analytics', 'base_cost': 780.00},
            {'service': 'Amazon Kinesis', 'category': 'Analytics', 'base_cost': 520.00},
            {'service': 'Amazon QuickSight', 'category': 'Analytics', 'base_cost': 280.00},
            {'service': 'AWS Glue', 'category': 'Analytics', 'base_cost': 460.00},
            {'service': 'AWS Data Pipeline', 'category': 'Analytics', 'base_cost': 180.00},
            {'service': 'AWS Lake Formation', 'category': 'Analytics', 'base_cost': 320.00},
            {'service': 'Amazon OpenSearch', 'category': 'Analytics', 'base_cost': 590.00},

            # Machine Learning Services
            {'service': 'Amazon SageMaker', 'category': 'Machine Learning', 'base_cost': 1450.00},
            {'service': 'Amazon Rekognition', 'category': 'Machine Learning', 'base_cost': 380.00},
            {'service': 'Amazon Comprehend', 'category': 'Machine Learning', 'base_cost': 290.00},
            {'service': 'Amazon Polly', 'category': 'Machine Learning', 'base_cost': 120.00},
            {'service': 'Amazon Lex', 'category': 'Machine Learning', 'base_cost': 210.00},
            {'service': 'Amazon Transcribe', 'category': 'Machine Learning', 'base_cost': 180.00},
            {'service': 'Amazon Textract', 'category': 'Machine Learning', 'base_cost': 240.00},
            {'service': 'Amazon Bedrock', 'category': 'Machine Learning', 'base_cost': 890.00},

            # Security Services
            {'service': 'AWS IAM', 'category': 'Security', 'base_cost': 0.00},
            {'service': 'AWS KMS', 'category': 'Security', 'base_cost': 95.00},
            {'service': 'AWS Secrets Manager', 'category': 'Security', 'base_cost': 65.00},
            {'service': 'AWS WAF', 'category': 'Security', 'base_cost': 180.00},
            {'service': 'AWS Shield', 'category': 'Security', 'base_cost': 3000.00},
            {'service': 'Amazon GuardDuty', 'category': 'Security', 'base_cost': 220.00},
            {'service': 'Amazon Inspector', 'category': 'Security', 'base_cost': 140.00},
            {'service': 'Amazon Macie', 'category': 'Security', 'base_cost': 180.00},

            # Management Services
            {'service': 'Amazon CloudWatch', 'category': 'Management', 'base_cost': 320.00},
            {'service': 'AWS CloudTrail', 'category': 'Management', 'base_cost': 85.00},
            {'service': 'AWS Config', 'category': 'Management', 'base_cost': 120.00},
            {'service': 'AWS Systems Manager', 'category': 'Management', 'base_cost': 75.00},
            {'service': 'AWS Organizations', 'category': 'Management', 'base_cost': 0.00},
            {'service': 'AWS Control Tower', 'category': 'Management', 'base_cost': 0.00},
        ]

    def _get_azure_services(self) -> List[Dict[str, Any]]:
        """Return comprehensive Azure service catalog with 50+ services"""
        return [
            # Compute Services
            {'service': 'Virtual Machines', 'category': 'Compute', 'base_cost': 2200.00},
            {'service': 'App Service', 'category': 'Compute', 'base_cost': 680.00},
            {'service': 'Azure Functions', 'category': 'Compute', 'base_cost': 380.00},
            {'service': 'Azure Kubernetes Service', 'category': 'Compute', 'base_cost': 1100.00},
            {'service': 'Container Instances', 'category': 'Compute', 'base_cost': 290.00},
            {'service': 'Azure Batch', 'category': 'Compute', 'base_cost': 420.00},
            {'service': 'Service Fabric', 'category': 'Compute', 'base_cost': 350.00},
            {'service': 'Azure Spring Apps', 'category': 'Compute', 'base_cost': 480.00},
            {'service': 'Virtual Machine Scale Sets', 'category': 'Compute', 'base_cost': 890.00},

            # Storage Services
            {'service': 'Blob Storage', 'category': 'Storage', 'base_cost': 1500.00},
            {'service': 'File Storage', 'category': 'Storage', 'base_cost': 420.00},
            {'service': 'Queue Storage', 'category': 'Storage', 'base_cost': 85.00},
            {'service': 'Table Storage', 'category': 'Storage', 'base_cost': 120.00},
            {'service': 'Disk Storage', 'category': 'Storage', 'base_cost': 780.00},
            {'service': 'Data Lake Storage', 'category': 'Storage', 'base_cost': 650.00},
            {'service': 'Azure NetApp Files', 'category': 'Storage', 'base_cost': 890.00},
            {'service': 'Azure Backup', 'category': 'Storage', 'base_cost': 320.00},

            # Database Services
            {'service': 'Azure SQL Database', 'category': 'Database', 'base_cost': 1400.00},
            {'service': 'Cosmos DB', 'category': 'Database', 'base_cost': 980.00},
            {'service': 'Azure Database for MySQL', 'category': 'Database', 'base_cost': 520.00},
            {'service': 'Azure Database for PostgreSQL', 'category': 'Database', 'base_cost': 580.00},
            {'service': 'Azure Database for MariaDB', 'category': 'Database', 'base_cost': 340.00},
            {'service': 'Azure Cache for Redis', 'category': 'Database', 'base_cost': 450.00},
            {'service': 'Azure Synapse Analytics', 'category': 'Database', 'base_cost': 1200.00},
            {'service': 'Azure SQL Managed Instance', 'category': 'Database', 'base_cost': 1650.00},

            # Networking Services
            {'service': 'Virtual Network', 'category': 'Networking', 'base_cost': 280.00},
            {'service': 'Load Balancer', 'category': 'Networking', 'base_cost': 320.00},
            {'service': 'Application Gateway', 'category': 'Networking', 'base_cost': 480.00},
            {'service': 'VPN Gateway', 'category': 'Networking', 'base_cost': 380.00},
            {'service': 'ExpressRoute', 'category': 'Networking', 'base_cost': 950.00},
            {'service': 'Azure CDN', 'category': 'Networking', 'base_cost': 420.00},
            {'service': 'Azure Front Door', 'category': 'Networking', 'base_cost': 580.00},
            {'service': 'Traffic Manager', 'category': 'Networking', 'base_cost': 180.00},
            {'service': 'Azure DNS', 'category': 'Networking', 'base_cost': 95.00},
            {'service': 'Azure Firewall', 'category': 'Networking', 'base_cost': 920.00},

            # Analytics Services
            {'service': 'Azure HDInsight', 'category': 'Analytics', 'base_cost': 780.00},
            {'service': 'Azure Databricks', 'category': 'Analytics', 'base_cost': 1100.00},
            {'service': 'Azure Stream Analytics', 'category': 'Analytics', 'base_cost': 420.00},
            {'service': 'Azure Data Factory', 'category': 'Analytics', 'base_cost': 580.00},
            {'service': 'Azure Analysis Services', 'category': 'Analytics', 'base_cost': 340.00},
            {'service': 'Power BI Embedded', 'category': 'Analytics', 'base_cost': 290.00},
            {'service': 'Azure Event Hubs', 'category': 'Analytics', 'base_cost': 380.00},

            # AI & Machine Learning Services
            {'service': 'Azure Machine Learning', 'category': 'Machine Learning', 'base_cost': 1350.00},
            {'service': 'Azure Cognitive Services', 'category': 'Machine Learning', 'base_cost': 480.00},
            {'service': 'Azure Bot Service', 'category': 'Machine Learning', 'base_cost': 180.00},
            {'service': 'Azure Cognitive Search', 'category': 'Machine Learning', 'base_cost': 520.00},
            {'service': 'Azure OpenAI Service', 'category': 'Machine Learning', 'base_cost': 980.00},
            {'service': 'Azure Form Recognizer', 'category': 'Machine Learning', 'base_cost': 290.00},

            # Security Services
            {'service': 'Azure Key Vault', 'category': 'Security', 'base_cost': 85.00},
            {'service': 'Microsoft Defender for Cloud', 'category': 'Security', 'base_cost': 420.00},
            {'service': 'Azure Sentinel', 'category': 'Security', 'base_cost': 680.00},
            {'service': 'Azure DDoS Protection', 'category': 'Security', 'base_cost': 2950.00},
            {'service': 'Azure Information Protection', 'category': 'Security', 'base_cost': 180.00},

            # Management Services
            {'service': 'Azure Monitor', 'category': 'Management', 'base_cost': 380.00},
            {'service': 'Azure Advisor', 'category': 'Management', 'base_cost': 0.00},
            {'service': 'Azure Cost Management', 'category': 'Management', 'base_cost': 0.00},
            {'service': 'Azure Automation', 'category': 'Management', 'base_cost': 120.00},
            {'service': 'Azure Policy', 'category': 'Management', 'base_cost': 0.00},
            {'service': 'Azure Resource Manager', 'category': 'Management', 'base_cost': 0.00},
        ]

    def _get_gcp_services(self) -> List[Dict[str, Any]]:
        """Return comprehensive GCP service catalog with 40+ services"""
        return [
            # Compute Services
            {'service': 'Compute Engine', 'category': 'Compute', 'base_cost': 2100.00},
            {'service': 'App Engine', 'category': 'Compute', 'base_cost': 520.00},
            {'service': 'Cloud Functions', 'category': 'Compute', 'base_cost': 340.00},
            {'service': 'Cloud Run', 'category': 'Compute', 'base_cost': 480.00},
            {'service': 'Google Kubernetes Engine', 'category': 'Compute', 'base_cost': 1050.00},
            {'service': 'Anthos', 'category': 'Compute', 'base_cost': 890.00},
            {'service': 'Compute Engine Sole-Tenant', 'category': 'Compute', 'base_cost': 1800.00},
            {'service': 'Preemptible VMs', 'category': 'Compute', 'base_cost': 420.00},

            # Storage Services
            {'service': 'Cloud Storage', 'category': 'Storage', 'base_cost': 1400.00},
            {'service': 'Persistent Disk', 'category': 'Storage', 'base_cost': 680.00},
            {'service': 'Filestore', 'category': 'Storage', 'base_cost': 520.00},
            {'service': 'Cloud Storage Archive', 'category': 'Storage', 'base_cost': 75.00},
            {'service': 'Cloud Storage Nearline', 'category': 'Storage', 'base_cost': 180.00},
            {'service': 'Cloud Storage Coldline', 'category': 'Storage', 'base_cost': 95.00},

            # Database Services
            {'service': 'Cloud SQL', 'category': 'Database', 'base_cost': 1250.00},
            {'service': 'Cloud Spanner', 'category': 'Database', 'base_cost': 980.00},
            {'service': 'Firestore', 'category': 'Database', 'base_cost': 420.00},
            {'service': 'Cloud Bigtable', 'category': 'Database', 'base_cost': 780.00},
            {'service': 'Memorystore', 'category': 'Database', 'base_cost': 380.00},
            {'service': 'AlloyDB', 'category': 'Database', 'base_cost': 890.00},
            {'service': 'Firebase Realtime Database', 'category': 'Database', 'base_cost': 180.00},

            # Networking Services
            {'service': 'Virtual Private Cloud', 'category': 'Networking', 'base_cost': 320.00},
            {'service': 'Cloud Load Balancing', 'category': 'Networking', 'base_cost': 450.00},
            {'service': 'Cloud CDN', 'category': 'Networking', 'base_cost': 380.00},
            {'service': 'Cloud DNS', 'category': 'Networking', 'base_cost': 85.00},
            {'service': 'Cloud Armor', 'category': 'Networking', 'base_cost': 520.00},
            {'service': 'Cloud NAT', 'category': 'Networking', 'base_cost': 180.00},
            {'service': 'Cloud Interconnect', 'category': 'Networking', 'base_cost': 850.00},
            {'service': 'Cloud VPN', 'category': 'Networking', 'base_cost': 290.00},

            # Analytics Services
            {'service': 'BigQuery', 'category': 'Analytics', 'base_cost': 1100.00},
            {'service': 'Dataflow', 'category': 'Analytics', 'base_cost': 680.00},
            {'service': 'Dataproc', 'category': 'Analytics', 'base_cost': 520.00},
            {'service': 'Pub/Sub', 'category': 'Analytics', 'base_cost': 340.00},
            {'service': 'Data Fusion', 'category': 'Analytics', 'base_cost': 480.00},
            {'service': 'Looker', 'category': 'Analytics', 'base_cost': 890.00},
            {'service': 'Dataprep', 'category': 'Analytics', 'base_cost': 280.00},

            # Machine Learning Services
            {'service': 'Vertex AI', 'category': 'Machine Learning', 'base_cost': 1280.00},
            {'service': 'Vision AI', 'category': 'Machine Learning', 'base_cost': 320.00},
            {'service': 'Speech-to-Text', 'category': 'Machine Learning', 'base_cost': 180.00},
            {'service': 'Natural Language AI', 'category': 'Machine Learning', 'base_cost': 240.00},
            {'service': 'Translation AI', 'category': 'Machine Learning', 'base_cost': 150.00},
            {'service': 'AutoML', 'category': 'Machine Learning', 'base_cost': 580.00},
            {'service': 'Document AI', 'category': 'Machine Learning', 'base_cost': 290.00},

            # Security Services
            {'service': 'Cloud IAM', 'category': 'Security', 'base_cost': 0.00},
            {'service': 'Cloud KMS', 'category': 'Security', 'base_cost': 75.00},
            {'service': 'Secret Manager', 'category': 'Security', 'base_cost': 45.00},
            {'service': 'Security Command Center', 'category': 'Security', 'base_cost': 380.00},
            {'service': 'Cloud Data Loss Prevention', 'category': 'Security', 'base_cost': 280.00},

            # Management Services
            {'service': 'Cloud Monitoring', 'category': 'Management', 'base_cost': 290.00},
            {'service': 'Cloud Logging', 'category': 'Management', 'base_cost': 180.00},
            {'service': 'Cloud Trace', 'category': 'Management', 'base_cost': 95.00},
            {'service': 'Cloud Debugger', 'category': 'Management', 'base_cost': 0.00},
            {'service': 'Cloud Profiler', 'category': 'Management', 'base_cost': 0.00},
        ]

    # ==================== COST DATA METHODS ====================

    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Return mock MTD costs with comprehensive service breakdown"""
        services = self._service_catalogs.get(self.provider_name, self._get_gcp_services())

        results = []
        for svc in services:
            # Add randomness to make it look realistic (±20%)
            cost = svc['base_cost'] * (0.8 + random.random() * 0.4)
            if cost > 0:  # Only include services with costs
                results.append({
                    'service': svc['service'],
                    'category': svc['category'],
                    'project': self._get_random_project(),
                    'cost': round(cost, 2),
                    'usage_type': self._get_usage_type(svc['category']),
                    'region': self._get_random_region()
                })

        return sorted(results, key=lambda x: x['cost'], reverse=True)

    def get_mtd_total(self) -> float:
        """Return total MTD cost"""
        costs = self.get_mtd_costs()
        return round(sum(c['cost'] for c in costs), 2)

    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Return mock daily costs with trends"""
        results = []
        base_cost = self.get_mtd_total() / 30  # Average daily cost
        today = datetime.now()

        for i in range(days):
            date = today - timedelta(days=days - i - 1)
            # Add weekly patterns (weekends slightly lower)
            day_factor = 0.85 if date.weekday() >= 5 else 1.0
            # Add some random variation
            daily_cost = base_cost * day_factor * (0.9 + random.random() * 0.2)
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
            'instances_monitored': random.randint(15, 45),
            'instances_running': random.randint(12, 40),
            'instances_stopped': random.randint(2, 8),
            'memory_percent': round(60.0 + random.uniform(-15, 20), 1),
            'network_in_mbps': round(125.5 + random.uniform(-50, 75), 1),
            'network_out_mbps': round(88.3 + random.uniform(-30, 50), 1),
            'storage_used_tb': round(12.5 + random.uniform(-2, 5), 2),
            'active_connections': random.randint(150, 500)
        }

    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Return mock timeseries data"""
        data_points = min(minutes, 60)
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

    # ==================== ANOMALY DETECTION ====================

    def get_anomalies(self) -> List[Dict[str, Any]]:
        """Return detected cost anomalies"""
        services = self._service_catalogs.get(self.provider_name, self._get_gcp_services())

        # Generate 3-6 anomalies
        num_anomalies = random.randint(3, 6)
        selected_services = random.sample(services, min(num_anomalies, len(services)))

        anomalies = []
        severity_levels = ['low', 'medium', 'high', 'critical']

        for svc in selected_services:
            expected_cost = svc['base_cost']
            # Anomaly is 30-200% higher than expected
            anomaly_multiplier = 1.3 + random.random() * 1.7
            actual_cost = expected_cost * anomaly_multiplier
            deviation = ((actual_cost - expected_cost) / expected_cost) * 100

            # Determine severity based on deviation
            if deviation > 150:
                severity = 'critical'
            elif deviation > 100:
                severity = 'high'
            elif deviation > 50:
                severity = 'medium'
            else:
                severity = 'low'

            anomalies.append({
                'id': f"anomaly-{random.randint(1000, 9999)}",
                'service': svc['service'],
                'category': svc['category'],
                'expected_cost': round(expected_cost, 2),
                'actual_cost': round(actual_cost, 2),
                'deviation_percent': round(deviation, 1),
                'severity': severity,
                'detected_at': (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))).isoformat(),
                'description': self._get_anomaly_description(svc['service'], deviation),
                'recommendation': self._get_anomaly_recommendation(svc['category'])
            })

        return sorted(anomalies, key=lambda x: x['deviation_percent'], reverse=True)

    # ==================== FORECASTING ====================

    def get_forecast(self, days: int = 7) -> Dict[str, Any]:
        """Return cost forecast for next N days"""
        current_mtd = self.get_mtd_total()
        daily_avg = current_mtd / datetime.now().day

        forecast_data = []
        today = datetime.now()

        # Historical data (last 7 days)
        for i in range(7, 0, -1):
            date = today - timedelta(days=i)
            cost = daily_avg * (0.9 + random.random() * 0.2)
            forecast_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'cost': round(cost, 2),
                'type': 'actual'
            })

        # Today
        forecast_data.append({
            'date': today.strftime('%Y-%m-%d'),
            'cost': round(daily_avg * (0.95 + random.random() * 0.1), 2),
            'type': 'actual'
        })

        # Forecast (next N days) - slight upward trend
        trend_factor = 1.0
        for i in range(1, days + 1):
            date = today + timedelta(days=i)
            trend_factor += random.uniform(-0.02, 0.05)  # Slight variation with upward bias
            predicted = daily_avg * trend_factor * (0.95 + random.random() * 0.1)

            forecast_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'cost': round(predicted, 2),
                'cost_low': round(predicted * 0.85, 2),  # Confidence interval
                'cost_high': round(predicted * 1.15, 2),
                'type': 'forecast'
            })

        # Calculate projected monthly total
        days_in_month = 30
        days_remaining = days_in_month - datetime.now().day
        projected_remaining = daily_avg * trend_factor * days_remaining
        projected_total = current_mtd + projected_remaining

        return {
            'forecast_data': forecast_data,
            'current_mtd': round(current_mtd, 2),
            'projected_eom': round(projected_total, 2),
            'daily_average': round(daily_avg, 2),
            'trend': 'increasing' if trend_factor > 1.02 else 'stable' if trend_factor > 0.98 else 'decreasing',
            'confidence': 0.85
        }

    # ==================== RECOMMENDATIONS ====================

    def get_recommendations(self) -> List[Dict[str, Any]]:
        """Return cost optimization recommendations"""
        recommendations_templates = [
            {
                'type': 'rightsizing',
                'title': 'Rightsize Underutilized Instances',
                'description': 'Several compute instances are running below 20% CPU utilization.',
                'potential_savings': (500, 2000),
                'effort': 'medium',
                'impact': 'high',
                'category': 'Compute'
            },
            {
                'type': 'reserved',
                'title': 'Purchase Reserved Instances',
                'description': 'Consistent workloads could benefit from 1-year reserved capacity.',
                'potential_savings': (1000, 4000),
                'effort': 'low',
                'impact': 'high',
                'category': 'Compute'
            },
            {
                'type': 'storage',
                'title': 'Move Infrequently Accessed Data',
                'description': 'Move data not accessed in 90+ days to archive storage tier.',
                'potential_savings': (200, 800),
                'effort': 'low',
                'impact': 'medium',
                'category': 'Storage'
            },
            {
                'type': 'idle',
                'title': 'Terminate Idle Resources',
                'description': 'Detected idle load balancers and unattached storage volumes.',
                'potential_savings': (150, 600),
                'effort': 'low',
                'impact': 'medium',
                'category': 'Networking'
            },
            {
                'type': 'scheduling',
                'title': 'Implement Instance Scheduling',
                'description': 'Dev/test environments can be shut down outside business hours.',
                'potential_savings': (400, 1500),
                'effort': 'medium',
                'impact': 'high',
                'category': 'Compute'
            },
            {
                'type': 'spot',
                'title': 'Use Spot/Preemptible Instances',
                'description': 'Fault-tolerant workloads can use discounted spot instances.',
                'potential_savings': (600, 2500),
                'effort': 'high',
                'impact': 'high',
                'category': 'Compute'
            },
            {
                'type': 'database',
                'title': 'Optimize Database Instances',
                'description': 'Some database instances are over-provisioned for current workload.',
                'potential_savings': (300, 1200),
                'effort': 'medium',
                'impact': 'medium',
                'category': 'Database'
            },
            {
                'type': 'network',
                'title': 'Reduce Data Transfer Costs',
                'description': 'Use CDN caching and regional endpoints to reduce egress fees.',
                'potential_savings': (200, 900),
                'effort': 'medium',
                'impact': 'medium',
                'category': 'Networking'
            },
            {
                'type': 'licensing',
                'title': 'Review Software Licensing',
                'description': 'Consider BYOL options or open-source alternatives where possible.',
                'potential_savings': (400, 1800),
                'effort': 'high',
                'impact': 'medium',
                'category': 'Management'
            },
            {
                'type': 'cleanup',
                'title': 'Delete Unused Snapshots',
                'description': 'Old snapshots and backups beyond retention policy detected.',
                'potential_savings': (100, 400),
                'effort': 'low',
                'impact': 'low',
                'category': 'Storage'
            }
        ]

        # Select 5-8 random recommendations
        num_recommendations = random.randint(5, 8)
        selected = random.sample(recommendations_templates, num_recommendations)

        recommendations = []
        for i, rec in enumerate(selected):
            savings = random.randint(rec['potential_savings'][0], rec['potential_savings'][1])
            recommendations.append({
                'id': f"rec-{i+1:03d}",
                'type': rec['type'],
                'title': rec['title'],
                'description': rec['description'],
                'potential_savings_monthly': savings,
                'potential_savings_yearly': savings * 12,
                'effort': rec['effort'],
                'impact': rec['impact'],
                'category': rec['category'],
                'status': 'open',
                'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 14))).isoformat()
            })

        return sorted(recommendations, key=lambda x: x['potential_savings_monthly'], reverse=True)

    # ==================== ALERTS ====================

    def get_alerts(self) -> List[Dict[str, Any]]:
        """Return active cost alerts"""
        alert_templates = [
            {
                'type': 'budget_threshold',
                'title': 'Budget Threshold Exceeded',
                'message': 'Monthly budget at {percent}% utilization',
                'severity': 'warning'
            },
            {
                'type': 'spike',
                'title': 'Cost Spike Detected',
                'message': '{service} costs increased by {percent}% in the last 24 hours',
                'severity': 'high'
            },
            {
                'type': 'anomaly',
                'title': 'Anomaly Detected',
                'message': 'Unusual spending pattern detected in {category}',
                'severity': 'medium'
            },
            {
                'type': 'forecast',
                'title': 'Forecast Alert',
                'message': 'Projected to exceed monthly budget by {amount}',
                'severity': 'warning'
            },
            {
                'type': 'idle',
                'title': 'Idle Resource Alert',
                'message': '{count} idle resources detected costing ${cost}/month',
                'severity': 'low'
            }
        ]

        services = self._service_catalogs.get(self.provider_name, self._get_gcp_services())
        categories = list(set(s['category'] for s in services))

        # Generate 2-5 alerts
        num_alerts = random.randint(2, 5)
        selected = random.sample(alert_templates, min(num_alerts, len(alert_templates)))

        alerts = []
        for i, alert in enumerate(selected):
            alert_data = {
                'id': f"alert-{random.randint(1000, 9999)}",
                'type': alert['type'],
                'title': alert['title'],
                'severity': alert['severity'],
                'acknowledged': random.choice([True, False]),
                'created_at': (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))).isoformat()
            }

            # Format message with random data
            if alert['type'] == 'budget_threshold':
                percent = random.randint(80, 110)
                alert_data['message'] = alert['message'].format(percent=percent)
                alert_data['severity'] = 'critical' if percent > 100 else 'warning'
            elif alert['type'] == 'spike':
                svc = random.choice(services)
                percent = random.randint(25, 150)
                alert_data['message'] = alert['message'].format(service=svc['service'], percent=percent)
            elif alert['type'] == 'anomaly':
                cat = random.choice(categories)
                alert_data['message'] = alert['message'].format(category=cat)
            elif alert['type'] == 'forecast':
                amount = random.randint(500, 3000)
                alert_data['message'] = alert['message'].format(amount=f"${amount}")
            elif alert['type'] == 'idle':
                count = random.randint(3, 12)
                cost = random.randint(100, 500)
                alert_data['message'] = alert['message'].format(count=count, cost=cost)

            alerts.append(alert_data)

        return sorted(alerts, key=lambda x: x['created_at'], reverse=True)

    # ==================== BUDGETS ====================

    def get_budgets(self) -> List[Dict[str, Any]]:
        """Return budget tracking data"""
        current_mtd = self.get_mtd_total()
        daily_avg = current_mtd / max(datetime.now().day, 1)

        # Calculate projected end-of-month
        days_remaining = 30 - datetime.now().day
        projected_eom = current_mtd + (daily_avg * days_remaining)

        # Overall budget
        overall_budget = round(projected_eom * random.uniform(0.9, 1.1), 2)

        budgets = [
            {
                'id': f'budget-{self.provider_name}-overall',
                'name': f'{self.provider_name.upper()} Overall Budget',
                'type': 'overall',
                'provider': self.provider_name,
                'budget_amount': overall_budget,
                'spent_amount': current_mtd,
                'remaining_amount': round(overall_budget - current_mtd, 2),
                'utilization_percent': round((current_mtd / overall_budget) * 100, 1),
                'projected_eom': round(projected_eom, 2),
                'projected_utilization': round((projected_eom / overall_budget) * 100, 1),
                'period': 'monthly',
                'start_date': datetime.now().replace(day=1).strftime('%Y-%m-%d'),
                'end_date': (datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1).strftime('%Y-%m-%d'),
                'status': 'on_track' if projected_eom <= overall_budget else 'at_risk'
            }
        ]

        # Category budgets
        services = self._service_catalogs.get(self.provider_name, self._get_gcp_services())
        categories = {}
        for svc in services:
            cat = svc['category']
            if cat not in categories:
                categories[cat] = 0
            categories[cat] += svc['base_cost'] * (0.8 + random.random() * 0.4)

        for cat, spent in categories.items():
            budget_amount = spent * random.uniform(0.85, 1.15)
            projected = spent * (30 / max(datetime.now().day, 1))

            budgets.append({
                'id': f"budget-{self.provider_name}-{cat.lower().replace(' ', '-')}",
                'name': f'{cat} Budget',
                'type': 'category',
                'category': cat,
                'provider': self.provider_name,
                'budget_amount': round(budget_amount, 2),
                'spent_amount': round(spent, 2),
                'remaining_amount': round(budget_amount - spent, 2),
                'utilization_percent': round((spent / budget_amount) * 100, 1),
                'projected_eom': round(projected, 2),
                'projected_utilization': round((projected / budget_amount) * 100, 1),
                'period': 'monthly',
                'status': 'on_track' if projected <= budget_amount else 'at_risk'
            })

        return budgets

    # ==================== SERVICES BREAKDOWN ====================

    def get_services_breakdown(self) -> Dict[str, Any]:
        """Return detailed services breakdown by category"""
        services = self.get_mtd_costs()

        # Group by category
        categories = {}
        for svc in services:
            cat = svc['category']
            if cat not in categories:
                categories[cat] = {
                    'category': cat,
                    'total_cost': 0,
                    'service_count': 0,
                    'services': []
                }
            categories[cat]['total_cost'] += svc['cost']
            categories[cat]['service_count'] += 1
            categories[cat]['services'].append(svc)

        # Sort services within each category
        for cat in categories.values():
            cat['services'] = sorted(cat['services'], key=lambda x: x['cost'], reverse=True)
            cat['total_cost'] = round(cat['total_cost'], 2)

        # Convert to list and sort by total cost
        breakdown = sorted(categories.values(), key=lambda x: x['total_cost'], reverse=True)

        return {
            'breakdown': breakdown,
            'total_cost': round(sum(c['total_cost'] for c in breakdown), 2),
            'total_services': sum(c['service_count'] for c in breakdown),
            'category_count': len(breakdown)
        }

    # ==================== HELPER METHODS ====================

    def _get_random_project(self) -> str:
        """Return a random project name"""
        projects = {
            'aws': ['prod-workloads', 'dev-environment', 'analytics-pipeline', 'ml-training', 'data-warehouse'],
            'azure': ['production-rg', 'development-rg', 'analytics-rg', 'ml-workspace-rg', 'shared-services-rg'],
            'gcp': ['prod-project', 'dev-project', 'analytics-proj', 'ml-project', 'data-project']
        }
        return random.choice(projects.get(self.provider_name, projects['gcp']))

    def _get_random_region(self) -> str:
        """Return a random region"""
        regions = {
            'aws': ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
            'azure': ['eastus', 'westus2', 'westeurope', 'southeastasia', 'japaneast'],
            'gcp': ['us-central1', 'us-east1', 'europe-west1', 'asia-east1', 'asia-southeast1']
        }
        return random.choice(regions.get(self.provider_name, regions['gcp']))

    def _get_usage_type(self, category: str) -> str:
        """Return usage type based on category"""
        usage_types = {
            'Compute': 'On-Demand',
            'Storage': 'Standard',
            'Database': 'Provisioned',
            'Networking': 'Data Transfer',
            'Analytics': 'Query Processing',
            'Machine Learning': 'Training & Inference',
            'Security': 'Active Protection',
            'Management': 'Monitoring'
        }
        return usage_types.get(category, 'Standard')

    def _get_anomaly_description(self, service: str, deviation: float) -> str:
        """Generate anomaly description"""
        if deviation > 150:
            return f"{service} costs spiked dramatically, possibly due to unexpected traffic or misconfiguration."
        elif deviation > 100:
            return f"{service} spending significantly higher than baseline. Review recent deployments."
        elif deviation > 50:
            return f"{service} costs moderately elevated. Monitor for continued increase."
        else:
            return f"{service} showing slight cost increase from historical average."

    def _get_anomaly_recommendation(self, category: str) -> str:
        """Generate recommendation based on category"""
        recommendations = {
            'Compute': 'Review instance sizing and consider reserved capacity for stable workloads.',
            'Storage': 'Check for large file uploads or consider lifecycle policies.',
            'Database': 'Review query patterns and consider read replicas or caching.',
            'Networking': 'Analyze traffic patterns and consider CDN or regional endpoints.',
            'Analytics': 'Review query costs and consider partitioning strategies.',
            'Machine Learning': 'Check training jobs and consider spot instances for non-critical workloads.',
            'Security': 'Review security tool configurations and scan frequencies.',
            'Management': 'Optimize log retention and monitoring granularity.'
        }
        return recommendations.get(category, 'Review usage patterns and optimize where possible.')