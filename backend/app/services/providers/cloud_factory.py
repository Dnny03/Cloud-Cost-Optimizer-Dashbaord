# backend/app/services/providers/cloud_factory.py
"""
Factory to create cloud provider instances
Includes mock provider for testing
"""

from .base_provider import BaseCloudProvider
from .gcp_provider import GCPProvider
from .aws_provider import AWSProvider
from .azure_provider import AzureProvider
from .mock_provider import MockProvider


class CloudProviderFactory:
    """Factory to create cloud provider instances"""

    _providers = {
        'gcp': GCPProvider,
        'aws': AWSProvider,
        'azure': AzureProvider,
        'mock': MockProvider,  # Add mock provider
        'mock_gcp': MockProvider,  # Mock as GCP
        'mock_aws': MockProvider,  # Mock as AWS
        'mock_azure': MockProvider,  # Mock as Azure
    }

    @classmethod
    def create(cls, provider: str, config: dict) -> BaseCloudProvider:
        """Create a cloud provider instance"""
        provider_lower = provider.lower()

        # If USE_MOCK_DATA is set, use mock provider
        import os
        if os.getenv('USE_MOCK_DATA', 'false').lower() == 'true':
            config['name'] = provider
            return MockProvider(config)

        if provider_lower not in cls._providers:
            raise ValueError(f"Unsupported provider: {provider}")

        return cls._providers[provider_lower](config)

    @classmethod
    def register_provider(cls, name: str, provider_class):
        """Register a new provider (for extensibility)"""
        cls._providers[name.lower()] = provider_class
