from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseCloudProvider(ABC):
    """Abstract base class for cloud providers"""
    
    def __init__(self, config: Dict):
        self.config = config
        self._validate_config()
    
    @abstractmethod
    def _validate_config(self):
        """Validate provider-specific configuration"""
        pass
    
    @abstractmethod
    def get_mtd_costs(self) -> List[Dict[str, Any]]:
        """Get month-to-date costs by service/project"""
        pass
    
    @abstractmethod
    def get_daily_costs(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily cost trend"""
        pass
    
    @abstractmethod
    def get_live_metrics(self) -> Dict[str, Any]:
        """Get live metrics (CPU, memory, network, etc.)"""
        pass
    
    @abstractmethod
    def get_timeseries(self, metric_type: str, minutes: int) -> Dict[str, Any]:
        """Get time series data for charts"""
        pass
    
    def get_mtd_total(self) -> float:
        """Get total MTD cost (default implementation)"""
        try:
            costs = self.get_mtd_costs()
            return sum(item.get('cost', 0) for item in costs)
        except:
            return 0.0
