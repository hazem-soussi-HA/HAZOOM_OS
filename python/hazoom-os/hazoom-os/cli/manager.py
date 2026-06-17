"""
Hazoom OS - CLI Manager
Command-line interface for managing the system
"""

import click
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.training_engine import TrainingEngine
from core.verification_engine import VerificationEngine
from core.agi_optimizer import AGIOptimizer
from core.deployer import ModelDeployer
from core.system_status import SystemStatus
from api.server import APIServer
from monitoring.monitor import MonitoringSystem
from core.initializer import SystemInitializer


class CLIManager:
    """
    Manages CLI commands for Hazoom OS
    """
    
    @staticmethod
    def init(config: str = "config.yaml"):
        """Initialize the system"""
        click.echo("🚀 Initializing Hazoom OS...")
        initializer = SystemInitializer(config)
        initializer.run()
    
    @staticmethod
    def train(
        model: str,
        dataset: str,
        epochs: int = 100,
        batch_size: int = 32,
        gpu: int = 0,
        learning_rate: float = 1e-4,
        resume: bool = False
    ):
        """Train a model"""
        click.echo(f"🚀 Starting training for {model} on {dataset}...")
        
        engine = TrainingEngine(
            model_name=model,
            dataset_path=dataset,
            epochs=epochs,
            batch_size=batch_size,
            gpu_id=gpu,
            learning_rate=learning_rate
        )
        
        if resume:
            engine.load_checkpoint()
        
        try:
            engine.train()
            click.echo("✅ Training completed successfully!")
        except Exception as e:
            click.echo(f"❌ Training failed: {e}")
            sys.exit(1)
    
    @staticmethod
    def verify(
        model_id: str,
        benchmark: str = "all",
        output: str = None
    ):
        """Verify and benchmark a model"""
        click.echo(f"🔍 Verifying model {model_id}...")
        
        verifier = VerificationEngine(model_id=model_id)
        
        if benchmark == "all":
            results = verifier.run_all_benchmarks()
        else:
            results = {benchmark: verifier.run_benchmark(benchmark)}
        
        if output:
            verifier.save_results(results, output)
        
        click.echo("✅ Verification completed!")
    
    @staticmethod
    def optimize(
        model_id: str,
        strategy: str = "auto"
    ):
        """Optimize a model using AGI intelligence"""
        click.echo(f"🧠 Optimizing model {model_id} with AGI intelligence...")
        
        optimizer = AGIOptimizer(model_id=model_id)
        results = optimizer.optimize(strategy=strategy)
        
        click.echo("✅ Optimization completed!")
        click.echo(f"Improvements: {results.improvements}")
    
    @staticmethod
    def serve(
        host: str = "0.0.0.0",
        port: int = 8000,
        workers: int = 4
    ):
        """Start the API server"""
        click.echo(f"🚀 Starting API server on {host}:{port}...")
        
        server = APIServer(host=host, port=port, workers=workers)
        server.start()
    
    @staticmethod
    def monitor(
        model_id: str,
        interval: int = 5
    ):
        """Monitor training/inference in real-time"""
        click.echo(f"📊 Monitoring model {model_id}...")
        
        monitor = MonitoringSystem(model_id=model_id)
        monitor.start(interval=interval)
    
    @staticmethod
    def deploy(
        model_id: str,
        env: str = "production"
    ):
        """Deploy model to production"""
        click.echo(f"🚀 Deploying model {model_id} to {env}...")
        
        deployer = ModelDeployer()
        deployment_info = deployer.deploy(model_id, env)
        
        click.echo("✅ Deployment completed!")
        click.echo(f"Endpoint: {deployment_info['endpoint']}")
    
    @staticmethod
    def status():
        """Show system status"""
        click.echo("📊 Hazoom OS System Status")
        click.echo("=" * 50)
        
        status = SystemStatus()
        status.print_status()
    
    @staticmethod
    def list_models():
        """List all models"""
        models_dir = Path("models")
        if not models_dir.exists():
            click.echo("No models found")
            return
        
        models = list(models_dir.glob("*.pt"))
        if not models:
            click.echo("No models found")
            return
        
        click.echo("Available models:")
        for model in models:
            size_mb = model.stat().st_size / (1024 * 1024)
            click.echo(f"  - {model.stem} ({size_mb:.2f} MB)")
    
    @staticmethod
    def list_checkpoints(model_name: str):
        """List checkpoints for a model"""
        from storage.checkpoint_manager import CheckpointManager
        
        manager = CheckpointManager()
        checkpoints = manager.list_checkpoints(model_name)
        
        if not checkpoints:
            click.echo(f"No checkpoints found for {model_name}")
            return
        
        click.echo(f"Checkpoints for {model_name}:")
        for checkpoint in checkpoints:
            click.echo(f"  - Epoch {checkpoint['epoch']}: Loss {checkpoint['loss']:.4f}")
    
    @staticmethod
    def cleanup(model_name: str, keep_last: int = 5):
        """Clean up old checkpoints"""
        from storage.checkpoint_manager import CheckpointManager
        
        manager = CheckpointManager()
        manager.cleanup_checkpoints(model_name, keep_last)
        
        click.echo(f"✅ Cleaned up checkpoints for {model_name}, kept last {keep_last}")