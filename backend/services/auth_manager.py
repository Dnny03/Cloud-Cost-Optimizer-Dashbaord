import os
import json
from typing import Dict, List, Optional

class AuthManager:
    """
    Manages authentication for multiple cloud providers.
    Supports both environment variables and config files.
    """
    
    def __init__(self):
        self.configs = self._load_configs()
    
    def _load_configs(self) -> Dict:
        """Load configurations from environment and/or config file"""
        configs = {}
        
        # Try loading from config file first
        config_path = os.getenv("CLOUD_CONFIG_PATH", "config/clouds.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    configs = json.load(f)
            except:
                pass
        
        # GCP Configuration
        if os.getenv("GCP_PROJECT_ID"):
            configs['gcp'] = {
                'project_id': os.getenv("GCP_PROJECT_ID"),
                'credentials_path': os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
                'billing_dataset': os.getenv("BILLING_DATASET", "billing_export"),
                'billing_table': os.getenv("BQ_BILLING_TABLE", "gcp_billing_export_v1_")
            }
        
        # AWS Configuration
        if os.getenv("AWS_ACCOUNT_ID"):
            configs['aws'] = {
                'account_id': os.getenv("AWS_ACCOUNT_ID"),
                'region': os.getenv("AWS_REGION", "us-east-1"),
                'use_profile': os.getenv("AWS_PROFILE"),
                'cost_explorer_enabled': os.getenv("AWS_COST_EXPLORER", "true").lower() == "true"
            }
        
        # Azure Configuration
        if os.getenv("AZURE_SUBSCRIPTION_ID"):
            configs['azure'] = {
                'subscription_id': os.getenv("AZURE_SUBSCRIPTION_ID"),
                'tenant_id': os.getenv("AZURE_TENANT_ID"),
                'use_cli_auth': os.getenv("AZURE_USE_CLI", "true").lower() == "true"
            }
        
        return configs
    
    def is_provider_configured(self, provider: str) -> bool:
        """Check if a provider is configured"""
        return provider.lower() in self.configs
    
    def get_config(self, provider: str) -> Optional[Dict]:
        """Get configuration for a specific provider"""
        return self.configs.get(provider.lower())
    
    def get_active_providers(self) -> List[Dict]:
        """Get list of all configured providers"""
        return [
            {
                'name': provider,
                'display_name': provider.upper(),
                'configured': True
            }
            for provider in self.configs.keys()
        ]