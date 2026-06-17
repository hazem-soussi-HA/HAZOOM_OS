#!/usr/bin/env python3
"""
Hazoom OS - AGI-Powered LLM Training & Verification System
Main entry point and CLI interface
"""

import asyncio
import click
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from cli.manager import CLIManager


@click.group()
def cli():
    """Hazoom OS - AGI-Powered LLM Training & Verification System"""
    pass


@cli.command()
@click.option('--config', default='config.yaml', help='Configuration file path')
def init(config):
    """Initialize the Hazoom OS system"""
    CLIManager.init(config)


@cli.command()
@click.option('--model', required=True, help='Model architecture (gpt-4, llama-2, etc.)')
@click.option('--dataset', required=True, help='Dataset path or name')
@click.option('--epochs', default=100, help='Number of training epochs')
@click.option('--batch-size', default=32, help='Batch size')
@click.option('--gpu', default=0, help='GPU device ID')
@click.option('--learning-rate', default=1e-4, help='Learning rate')
@click.option('--resume', is_flag=True, help='Resume from checkpoint')
def train(model, dataset, epochs, batch_size, gpu, learning_rate, resume):
    """Train a neural network model"""
    CLIManager.train(
        model=model,
        dataset=dataset,
        epochs=epochs,
        batch_size=batch_size,
        gpu=gpu,
        learning_rate=learning_rate,
        resume=resume
    )


@cli.command()
@click.option('--model-id', required=True, help='Model ID to verify')
@click.option('--benchmark', default='all', help='Benchmark type (accuracy, speed, all)')
@click.option('--output', help='Output directory for results')
def verify(model_id, benchmark, output):
    """Verify and benchmark a trained model"""
    CLIManager.verify(
        model_id=model_id,
        benchmark=benchmark,
        output=output
    )


@cli.command()
@click.option('--host', default='0.0.0.0', help='API server host')
@click.option('--port', default=8000, help='API server port')
@click.option('--workers', default=4, help='Number of worker processes')
def serve(host, port, workers):
    """Start the API server"""
    CLIManager.serve(
        host=host,
        port=port,
        workers=workers
    )


@cli.command()
@click.option('--model-id', required=True, help='Model ID to monitor')
@click.option('--interval', default=5, help='Update interval in seconds')
def monitor(model_id, interval):
    """Monitor training/inference in real-time"""
    CLIManager.monitor(
        model_id=model_id,
        interval=interval
    )


@cli.command()
@click.option('--model-id', required=True, help='Model ID to optimize')
@click.option('--strategy', default='auto', help='Optimization strategy')
def optimize(model_id, strategy):
    """AGI-powered model optimization"""
    CLIManager.optimize(
        model_id=model_id,
        strategy=strategy
    )


@cli.command()
@click.option('--model-id', required=True, help='Model ID to deploy')
@click.option('--env', default='production', help='Deployment environment')
def deploy(model_id, env):
    """Deploy model to production"""
    CLIManager.deploy(
        model_id=model_id,
        env=env
    )


@cli.command()
def status():
    """Show system status"""
    CLIManager.status()


@cli.command()
def list_models():
    """List all models"""
    CLIManager.list_models()


@cli.command()
@click.option('--model-name', required=True, help='Model name')
def list_checkpoints(model_name):
    """List checkpoints for a model"""
    CLIManager.list_checkpoints(model_name)


@cli.command()
@click.option('--model-name', required=True, help='Model name')
@click.option('--keep-last', default=5, help='Number of checkpoints to keep')
def cleanup(model_name, keep_last):
    """Clean up old checkpoints"""
    CLIManager.cleanup(model_name, keep_last)


if __name__ == '__main__':
    cli()