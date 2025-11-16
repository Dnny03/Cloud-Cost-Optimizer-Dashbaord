# backend/app/config.py
import os
from pathlib import Path
from datetime import timedelta

# Base directory
BASE_DIR = Path(__file__).parent.parent


class Config:
    """Base configuration"""
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')
    JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
    JWT_TTL_HOURS = int(os.getenv('JWT_TTL_HOURS', '8'))

    # Database
    INSTANCE_PATH = BASE_DIR / 'instance'
    INSTANCE_PATH.mkdir(exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{INSTANCE_PATH}/app.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Cloud providers config
    CLOUD_CONFIG_PATH = os.getenv('CLOUD_CONFIG_PATH', 'config/clouds.json')

    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

    # Override with production database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:pass@localhost/cloudcost'
    )


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}