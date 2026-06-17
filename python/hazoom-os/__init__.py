"""
Hazoom OS - AGI-Powered LLM Training & Verification System
"""

__version__ = "1.0.0"
__author__ = "Hazoom OS Team"
__email__ = "contact@hazoom.com"

from .core import (
    TrainingEngine,
    VerificationEngine,
    AGIOptimizer,
    SystemInitializer,
    ModelDeployer,
    SystemStatus,
)
from .models import (
    GPT4Model,
    LLaMAModel,
    TransformerModel,
    get_model_architecture,
    GPT4Tokenizer,
    LLaMATokenizer,
    GLM4Tokenizer,
    get_tokenizer,
)
from .api import APIServer
from .monitoring import MonitoringSystem
from .storage import CheckpointManager
from .cli import CLIManager

__all__ = [
    # Version info
    '__version__',
    '__author__',
    '__email__',
    
    # Core modules
    'TrainingEngine',
    'VerificationEngine',
    'AGIOptimizer',
    'SystemInitializer',
    'ModelDeployer',
    'SystemStatus',
    
    # Models
    'GPT4Model',
    'LLaMAModel',
    'TransformerModel',
    'get_model_architecture',
    'GPT4Tokenizer',
    'LLaMATokenizer',
    'GLM4Tokenizer',
    'get_tokenizer',
    
    # API
    'APIServer',
    
    # Monitoring
    'MonitoringSystem',
    
    # Storage
    'CheckpointManager',
    
    # CLI
    'CLIManager',
]