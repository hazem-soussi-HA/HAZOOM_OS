"""
Hazoom OS - System Status
Provides system status and health information
"""

import torch
import psutil
import GPUtil
from pathlib import Path
from typing import Dict, Any, List
import json
import time


class SystemStatus:
    """
    Monitors and reports system status and health
    """
    
    def __init__(self):
        self.components = [
            'models',
            'checkpoints',
            'deployments',
            'training_history',
            'verification_reports',
            'monitoring_logs',
        ]
    
    def get_info(self) -> Dict[str, Any]:
        """Get comprehensive system information"""
        info = {
            'timestamp': time.time(),
            'datetime': time.strftime('%Y-%m-%d %H:%M:%S'),
            'system': self._get_system_info(),
            'components': self._get_component_info(),
            'storage': self._get_storage_info(),
            'health': self._get_health_status(),
        }
        
        return info
    
    def _get_system_info(self) -> Dict[str, Any]:
        """Get system-level information"""
        # CPU info
        cpu_info = {
            'cores': psutil.cpu_count(logical=False),
            'logical_cores': psutil.cpu_count(logical=True),
            'usage_percent': psutil.cpu_percent(),
        }
        
        # Memory info
        memory = psutil.virtual_memory()
        memory_info = {
            'total_gb': memory.total / (1024 ** 3),
            'available_gb': memory.available / (1024 ** 3),
            'used_gb': memory.used / (1024 ** 3),
            'usage_percent': memory.percent,
        }
        
        # GPU info
        gpu_info = {}
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]
                gpu_info = {
                    'name': gpu.name,
                    'total_memory_gb': gpu.memoryTotal / 1024,
                    'used_memory_gb': gpu.memoryUsed / 1024,
                    'memory_usage_percent': gpu.memoryUtil * 100,
                    'load_percent': gpu.load * 100,
                }
        except:
            gpu_info = {'status': 'not_available'}
        
        return {
            'cpu': cpu_info,
            'memory': memory_info,
            'gpu': gpu_info,
            'python_version': '3.8+',
            'pytorch_version': torch.__version__,
        }
    
    def _get_component_info(self) -> Dict[str, Any]:
        """Get information about system components"""
        components = {}
        
        # Models
        models_dir = Path("models")
        if models_dir.exists():
            models = list(models_dir.glob("*.pt"))
            components['models'] = {
                'count': len(models),
                'list': [m.stem for m in models],
            }
        else:
            components['models'] = {'count': 0, 'list': []}
        
        # Checkpoints
        checkpoints_dir = Path("checkpoints/checkpoints")
        if checkpoints_dir.exists():
            checkpoints = list(checkpoints_dir.glob("*.pt"))
            components['checkpoints'] = {
                'count': len(checkpoints),
                'total_size_mb': sum(c.stat().st_size for c in checkpoints) / (1024 * 1024),
            }
        else:
            components['checkpoints'] = {'count': 0, 'total_size_mb': 0}
        
        # Deployments
        deployments_dir = Path("deployments")
        if deployments_dir.exists():
            deployments = list(deployments_dir.glob("*.json"))
            components['deployments'] = {
                'count': len(deployments),
                'list': [d.stem for d in deployments],
            }
        else:
            components['deployments'] = {'count': 0, 'list': []}
        
        # Training history
        history_dir = Path("training_history")
        if history_dir.exists():
            history_files = list(history_dir.glob("*.json"))
            components['training_history'] = {
                'count': len(history_files),
            }
        else:
            components['training_history'] = {'count': 0}
        
        # Verification reports
        reports_dir = Path("verification_reports")
        if reports_dir.exists():
            reports = list(reports_dir.glob("*.json"))
            components['verification_reports'] = {
                'count': len(reports),
            }
        else:
            components['verification_reports'] = {'count': 0}
        
        # Monitoring logs
        logs_dir = Path("monitoring_logs")
        if logs_dir.exists():
            logs = list(logs_dir.glob("*.json"))
            components['monitoring_logs'] = {
                'count': len(logs),
                'total_size_mb': sum(l.stat().st_size for l in logs) / (1024 * 1024),
            }
        else:
            components['monitoring_logs'] = {'count': 0, 'total_size_mb': 0}
        
        return components
    
    def _get_storage_info(self) -> Dict[str, Any]:
        """Get storage information"""
        storage = {}
        
        # Disk usage
        disk = psutil.disk_usage('/')
        storage['disk'] = {
            'total_gb': disk.total / (1024 ** 3),
            'used_gb': disk.used / (1024 ** 3),
            'free_gb': disk.free / (1024 ** 3),
            'usage_percent': disk.percent,
        }
        
        # Project directory sizes
        project_dirs = [
            'checkpoints',
            'models',
            'training_history',
            'verification_reports',
            'monitoring_logs',
            'deployments',
        ]
        
        dir_sizes = {}
        for dir_name in project_dirs:
            dir_path = Path(dir_name)
            if dir_path.exists():
                total_size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
                dir_sizes[dir_name] = {
                    'size_mb': total_size / (1024 * 1024),
                    'file_count': len(list(dir_path.rglob('*'))),
                }
        
        storage['directories'] = dir_sizes
        
        return storage
    
    def _get_health_status(self) -> Dict[str, Any]:
        """Get system health status"""
        health = {
            'status': 'healthy',
            'issues': [],
            'warnings': [],
        }
        
        # Check disk space
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            health['status'] = 'critical'
            health['issues'].append(f"Disk space critically low: {disk.percent}% used")
        elif disk.percent > 80:
            health['status'] = 'warning'
            health['warnings'].append(f"Disk space low: {disk.percent}% used")
        
        # Check memory
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            health['status'] = 'critical'
            health['issues'].append(f"Memory critically low: {memory.percent}% used")
        elif memory.percent > 80:
            if health['status'] == 'healthy':
                health['status'] = 'warning'
            health['warnings'].append(f"Memory low: {memory.percent}% used")
        
        # Check GPU (if available)
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]
                if gpu.memoryUtil > 0.9:
                    health['status'] = 'warning'
                    health['warnings'].append(f"GPU memory high: {gpu.memoryUtil * 100:.1f}% used")
        except:
            pass
        
        # Check critical directories
        critical_dirs = ['models', 'checkpoints']
        for dir_name in critical_dirs:
            dir_path = Path(dir_name)
            if not dir_path.exists():
                health['status'] = 'warning'
                health['warnings'].append(f"Directory not found: {dir_name}")
        
        return health
    
    def print_status(self):
        """Print formatted system status"""
        info = self.get_info()
        
        print("=" * 60)
        print("📊 HAZOOM OS SYSTEM STATUS")
        print("=" * 60)
        
        print(f"\n⏰ Timestamp: {info['datetime']}")
        
        # System info
        print("\n🖥️  System:")
        cpu = info['system']['cpu']
        print(f"   CPU: {cpu['usage_percent']}% (Cores: {cpu['cores']})")
        
        memory = info['system']['memory']
        print(f"   Memory: {memory['usage_percent']}% ({memory['used_gb']:.1f}/{memory['total_gb']:.1f} GB)")
        
        gpu = info['system']['gpu']
        if 'name' in gpu:
            print(f"   GPU: {gpu['load_percent']:.1f}% - {gpu['name']}")
        else:
            print(f"   GPU: Not available")
        
        # Components
        print("\n📦 Components:")
        components = info['components']
        print(f"   Models: {components['models']['count']}")
        print(f"   Checkpoints: {components['checkpoints']['count']}")
        print(f"   Deployments: {components['deployments']['count']}")
        print(f"   Training History: {components['training_history']['count']}")
        print(f"   Verification Reports: {components['verification_reports']['count']}")
        
        # Storage
        print("\n💾 Storage:")
        storage = info['storage']
        disk = storage['disk']
        print(f"   Disk: {disk['usage_percent']}% ({disk['used_gb']:.1f}/{disk['total_gb']:.1f} GB)")
        
        # Health
        print("\n❤️  Health:")
        health = info['health']
        print(f"   Status: {health['status'].upper()}")
        
        if health['issues']:
            print(f"   Issues: {', '.join(health['issues'])}")
        
        if health['warnings']:
            print(f"   Warnings: {', '.join(health['warnings'])}")
        
        if not health['issues'] and not health['warnings']:
            print(f"   All systems operational!")
        
        print("\n" + "=" * 60)