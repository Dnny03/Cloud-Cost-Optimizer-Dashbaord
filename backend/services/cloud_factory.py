from services.base_provider import BaseCloudProvider
from services.providers.gcp_provider import GCPProvider
from services.providers.aws_provider import AWSProvider
from services.providers.azure_provider import AzureProvider

class CloudProviderFactory:
    """Factory to create cloud provider instances"""
    
    _providers = {
        'gcp': GCPProvider,
        'aws': AWSProvider,
        'azure': AzureProvider
    }
    
    @classmethod
    def create(cls, provider: str, config: dict) -> BaseCloudProvider:
        """Create a cloud provider instance"""
        provider = provider.lower()
        if provider not in cls._providers:
            raise ValueError(f"Unsupported provider: {provider}")
        
        return cls._providers[provider](config)
    
    @classmethod
    def register_provider(cls, name: str, provider_class):
        """Register a new provider (for extensibility)"""
        cls._providers[name.lower()] = provider_class