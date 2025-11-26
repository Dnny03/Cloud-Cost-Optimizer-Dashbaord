# backend/app/services/providers/aws_provider.py
# FIXED: Datetime serialization issues
from typing import List, Dict, Any
from .base_provider import BaseCloudProvider
from datetime import datetime, timedelta, date

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False


class AWSProvider(BaseCloudProvider):

    def _validate_config(self):
        if not AWS_AVAILABLE:
            raise ImportError("AWS SDK not installed. Run: pip install boto3")
        if 'account_id' not in self.config:
            raise ValueError("AWS account_id required")

    def _get_session(self):
        """Create boto3 session with optional profile"""
        profile = self.config.get('use_profile')
        if profile:
            return boto3.Session(profile_name=profile)
        return boto3.Session()  # Use default credentials

    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Get MTD costs using AWS Cost Explorer"""
        try:
            session = self._get_session()
            ce = session.client('ce', region_name=self.config.get('region', 'us-east-1'))

            now = datetime.now()
            start = now.replace(day=1).strftime('%Y-%m-%d')
            end = now.strftime('%Y-%m-%d')

            response = ce.get_cost_and_usage(
                TimePeriod={'Start': start, 'End': end},
                Granularity='MONTHLY',
                Metrics=['UnblendedCost'],
                GroupBy=[
                    {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                ]
            )

            results = []
            for result in response.get('ResultsByTime', []):
                for group in result.get('Groups', []):
                    results.append({
                        'service': str(group['Keys'][0]),
                        'cost': float(group['Metrics']['UnblendedCost']['Amount'])
                    })

            return sorted(results, key=lambda x: x['cost'], reverse=True)
        except Exception as e:
            return [{'error': str(e)}]

    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily cost trend"""
        try:
            session = self._get_session()
            ce = session.client('ce', region_name=self.config.get('region', 'us-east-1'))

            end = datetime.now()
            start = end - timedelta(days=days)

            response = ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start.strftime('%Y-%m-%d'),
                    'End': end.strftime('%Y-%m-%d')
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost']
            )

            results = []
            for item in response.get('ResultsByTime', []):
                # FIXED: Ensure date is properly formatted as string
                date_str = item['TimePeriod']['Start']

                # Ensure it's in YYYY-MM-DD format
                if isinstance(date_str, str) and len(date_str) == 10:
                    # Already in correct format
                    pass
                else:
                    # Parse and reformat if needed
                    try:
                        parsed_date = datetime.strptime(str(date_str), '%Y-%m-%d')
                        date_str = parsed_date.strftime('%Y-%m-%d')
                    except:
                        date_str = str(date_str)

                results.append({
                    'date': date_str,
                    'cost': float(item['Total']['UnblendedCost']['Amount'])
                })

            return results
        except Exception as e:
            return [{'error': str(e)}]

    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live EC2 metrics from CloudWatch"""
        try:
            session = self._get_session()
            cloudwatch = session.client('cloudwatch', region_name=self.config.get('region', 'us-east-1'))

            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=5)

            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Average']
            )

            cpu_avg = 0.0
            if response['Datapoints']:
                cpu_avg = sum(p['Average'] for p in response['Datapoints']) / len(response['Datapoints'])

            return {
                'updated_at': datetime.utcnow().isoformat(),
                'cpu_percent': round(cpu_avg, 1),
                'instances_monitored': len(response['Datapoints'])
            }
        except Exception as e:
            return {
                'error': str(e),
                'updated_at': datetime.utcnow().isoformat(),
                'cpu_percent': 0,
                'instances_monitored': 0
            }

    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data for charts"""
        try:
            if metric_type == 'cpu':
                return self._get_cpu_timeseries(minutes)
            else:
                return {"message": "AWS timeseries not yet fully implemented"}
        except Exception as e:
            return {"error": str(e)}

    def _get_cpu_timeseries(self, minutes: int) -> Dict[str, Any]:
        """Get CPU timeseries data"""
        try:
            session = self._get_session()
            cloudwatch = session.client('cloudwatch', region_name=self.config.get('region', 'us-east-1'))

            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=minutes)

            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                StartTime=start_time,
                EndTime=end_time,
                Period=60,  # 1 minute intervals
                Statistics=['Average']
            )

            # Sort datapoints by timestamp
            datapoints = sorted(response.get('Datapoints', []), key=lambda x: x['Timestamp'])

            ts = []
            cpu_percent = []
            for point in datapoints:
                # FIXED: Ensure timestamps are properly serialized
                timestamp = point['Timestamp']
                if hasattr(timestamp, 'isoformat'):
                    ts.append(timestamp.isoformat())
                else:
                    ts.append(str(timestamp))
                cpu_percent.append(round(point['Average'], 1))

            return {
                "ts": ts,
                "cpu_percent": cpu_percent
            }
        except Exception as e:
            return {
                "error": str(e),
                "ts": [],
                "cpu_percent": []
            }
