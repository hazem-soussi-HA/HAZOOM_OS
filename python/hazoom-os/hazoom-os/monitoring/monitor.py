"""
Hazoom OS - Real-time Monitoring System
Monitors training progress, inference metrics, and system health
"""

import torch
import time
import json
from pathlib import Path
from typing import Dict, Optional, List
import threading
from collections import deque
import psutil
import GPUtil


class MonitoringSystem:
    """
    Real-time monitoring system for training and inference
    """
    
    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id
        self.metrics_history = deque(maxlen=1000)
        self.is_monitoring = False
        self.monitor_thread = None
        
        # System metrics
        self.system_metrics = {
            'cpu_percent': [],
            'memory_percent': [],
            'gpu_percent': [],
            'gpu_memory': [],
            'timestamp': []
        }
    
    def start(self, interval: int = 5):
        """Start monitoring"""
        print(f"📊 Starting monitoring for model: {self.model_id or 'system'}")
        print(f"   Update interval: {interval} seconds")
        print(f"   Press Ctrl+C to stop")
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(
            target=self._monitor_loop,
            args=(interval,),
            daemon=True
        )
        self.monitor_thread.start()
        
        try:
            # Keep main thread alive
            while self.is_monitoring:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping monitoring...")
            self.stop()
    
    def stop(self):
        """Stop monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        
        # Save metrics history
        self._save_metrics()
        
        print("✅ Monitoring stopped")
    
    def _monitor_loop(self, interval: int):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Collect system metrics
                metrics = self._collect_system_metrics()
                
                # Collect model-specific metrics if model_id is provided
                if self.model_id:
                    model_metrics = self._collect_model_metrics()
                    metrics.update(model_metrics)
                
                # Add timestamp
                metrics['timestamp'] = time.time()
                
                # Store metrics
                self.metrics_history.append(metrics)
                
                # Display metrics
                self._display_metrics(metrics)
                
                # Sleep for interval
                time.sleep(interval)
                
            except Exception as e:
                print(f"Error collecting metrics: {e}")
                time.sleep(interval)
    
    def _collect_system_metrics(self) -> Dict[str, float]:
        """Collect system-level metrics"""
        metrics = {}
        
        # CPU usage
        metrics['cpu_percent'] = psutil.cpu_percent()
        
        # Memory usage
        memory = psutil.virtual_memory()
        metrics['memory_percent'] = memory.percent
        
        # GPU usage (if available)
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]  # First GPU
                metrics['gpu_percent'] = gpu.load * 100
                metrics['gpu_memory'] = gpu.memoryUtil * 100
            else:
                metrics['gpu_percent'] = 0
                metrics['gpu_memory'] = 0
        except:
            metrics['gpu_percent'] = 0
            metrics['gpu_memory'] = 0
        
        return metrics
    
    def _collect_model_metrics(self) -> Dict[str, float]:
        """Collect model-specific metrics"""
        metrics = {}
        
        try:
            # Check if model checkpoint exists
            checkpoint_path = Path("checkpoints/best_models") / f"{self.model_id}_best_*.pt"
            checkpoints = list(checkpoint_path.parent.glob(f"{self.model_id}_best_*.pt"))
            
            if checkpoints:
                # Get latest checkpoint
                latest = max(checkpoints, key=lambda x: x.stat().st_mtime)
                
                # Load checkpoint
                checkpoint = torch.load(latest, map_location='cpu')
                
                # Extract metrics
                if 'loss' in checkpoint:
                    metrics['model_loss'] = checkpoint['loss']
                
                if 'metadata' in checkpoint:
                    metadata = checkpoint['metadata']
                    if 'epoch' in metadata:
                        metrics['model_epoch'] = metadata['epoch']
                    
                    if 'learning_rate' in metadata:
                        metrics['model_lr'] = metadata['learning_rate']
            
            # Check training history
            history_path = Path("training_history") / f"{self.model_id}_history.json"
            if history_path.exists():
                with open(history_path, 'r') as f:
                    history = json.load(f)
                
                if history:
                    latest_entry = history[-1]
                    metrics['train_loss'] = latest_entry.get('train_loss', 0)
                    metrics['val_loss'] = latest_entry.get('val_loss', 0)
        
        except Exception as e:
            print(f"Warning: Could not collect model metrics: {e}")
        
        return metrics
    
    def _display_metrics(self, metrics: Dict[str, float]):
        """Display metrics in console"""
        # Clear screen (simple version)
        print("\n" * 3)
        print("=" * 60)
        print(f"📊 MONITORING: {self.model_id or 'System'}")
        print("=" * 60)
        
        # System metrics
        print("\n🖥️  System Metrics:")
        print(f"   CPU Usage:      {metrics.get('cpu_percent', 0):.1f}%")
        print(f"   Memory Usage:   {metrics.get('memory_percent', 0):.1f}%")
        print(f"   GPU Usage:      {metrics.get('gpu_percent', 0):.1f}%")
        print(f"   GPU Memory:     {metrics.get('gpu_memory', 0):.1f}%")
        
        # Model metrics
        if self.model_id:
            print("\n🤖 Model Metrics:")
            if 'model_loss' in metrics:
                print(f"   Loss:           {metrics['model_loss']:.4f}")
            if 'model_epoch' in metrics:
                print(f"   Epoch:          {metrics['model_epoch']}")
            if 'model_lr' in metrics:
                print(f"   Learning Rate:  {metrics['model_lr']:.6f}")
            if 'train_loss' in metrics:
                print(f"   Train Loss:     {metrics['train_loss']:.4f}")
            if 'val_loss' in metrics:
                print(f"   Val Loss:       {metrics['val_loss']:.4f}")
        
        # Timestamp
        print(f"\n⏰ Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
    
    def _save_metrics(self):
        """Save metrics history to file"""
        if not self.metrics_history:
            return
        
        # Convert deque to list
        metrics_list = list(self.metrics_history)
        
        # Save to file
        output_dir = Path("monitoring_logs")
        output_dir.mkdir(exist_ok=True)
        
        filename = f"{self.model_id or 'system'}_{int(time.time())}.json"
        filepath = output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(metrics_list, f, indent=2)
        
        print(f"\n💾 Metrics saved to: {filepath}")
    
    def get_metrics_summary(self) -> Dict[str, float]:
        """Get summary of collected metrics"""
        if not self.metrics_history:
            return {}
        
        metrics_list = list(self.metrics_history)
        
        summary = {}
        
        # Calculate averages for each metric
        for key in metrics_list[0].keys():
            if key != 'timestamp':
                values = [m.get(key, 0) for m in metrics_list if key in m]
                if values:
                    summary[f'avg_{key}'] = sum(values) / len(values)
                    summary[f'min_{key}'] = min(values)
                    summary[f'max_{key}'] = max(values)
        
        return summary
    
    def plot_metrics(self):
        """Generate plots of metrics (requires matplotlib)"""
        try:
            import matplotlib.pyplot as plt
            import numpy as np
            
            if not self.metrics_history:
                print("No metrics to plot")
                return
            
            metrics_list = list(self.metrics_history)
            
            # Extract timestamps
            timestamps = [m.get('timestamp', 0) for m in metrics_list]
            times = [(t - timestamps[0]) / 60 for t in timestamps]  # Convert to minutes
            
            # Create subplots
            fig, axes = plt.subplots(2, 2, figsize=(12, 10))
            
            # Plot 1: CPU and Memory
            cpu_values = [m.get('cpu_percent', 0) for m in metrics_list]
            memory_values = [m.get('memory_percent', 0) for m in metrics_list]
            
            axes[0, 0].plot(times, cpu_values, label='CPU %', color='blue')
            axes[0, 0].plot(times, memory_values, label='Memory %', color='green')
            axes[0, 0].set_xlabel('Time (minutes)')
            axes[0, 0].set_ylabel('Usage %')
            axes[0, 0].set_title('System Resource Usage')
            axes[0, 0].legend()
            axes[0, 0].grid(True)
            
            # Plot 2: GPU
            gpu_values = [m.get('gpu_percent', 0) for m in metrics_list]
            gpu_memory = [m.get('gpu_memory', 0) for m in metrics_list]
            
            axes[0, 1].plot(times, gpu_values, label='GPU %', color='red')
            axes[0, 1].plot(times, gpu_memory, label='GPU Memory %', color='orange')
            axes[0, 1].set_xlabel('Time (minutes)')
            axes[0, 1].set_ylabel('Usage %')
            axes[0, 1].set_title('GPU Usage')
            axes[0, 1].legend()
            axes[0, 1].grid(True)
            
            # Plot 3: Model Loss (if available)
            if self.model_id:
                train_loss = [m.get('train_loss', 0) for m in metrics_list]
                val_loss = [m.get('val_loss', 0) for m in metrics_list]
                
                if any(train_loss) or any(val_loss):
                    axes[1, 0].plot(times, train_loss, label='Train Loss', color='blue')
                    axes[1, 0].plot(times, val_loss, label='Val Loss', color='red')
                    axes[1, 0].set_xlabel('Time (minutes)')
                    axes[1, 0].set_ylabel('Loss')
                    axes[1, 0].set_title('Training Loss')
                    axes[1, 0].legend()
                    axes[1, 0].grid(True)
            
            # Plot 4: Learning Rate (if available)
            if self.model_id:
                lr_values = [m.get('model_lr', 0) for m in metrics_list]
                
                if any(lr_values):
                    axes[1, 1].plot(times, lr_values, label='Learning Rate', color='purple')
                    axes[1, 1].set_xlabel('Time (minutes)')
                    axes[1, 1].set_ylabel('Learning Rate')
                    axes[1, 1].set_title('Learning Rate Schedule')
                    axes[1, 1].legend()
                    axes[1, 1].grid(True)
                    axes[1, 1].set_yscale('log')
            
            plt.tight_layout()
            
            # Save plot
            output_dir = Path("monitoring_plots")
            output_dir.mkdir(exist_ok=True)
            
            filename = f"{self.model_id or 'system'}_{int(time.time())}.png"
            filepath = output_dir / filename
            
            plt.savefig(filepath, dpi=150, bbox_inches='tight')
            plt.close()
            
            print(f"📊 Plot saved to: {filepath}")
            
        except ImportError:
            print("⚠️  matplotlib not installed. Install with: pip install matplotlib")
        except Exception as e:
            print(f"Error generating plot: {e}")