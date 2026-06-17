"""
Hazoom OS - Model Deployer
Handles model deployment to production environments
"""

import torch
import json
from pathlib import Path
from typing import Dict, Any, Optional
import time


class ModelDeployer:
    """
    Manages model deployment to various environments
    """
    
    def __init__(self):
        self.deployments_dir = Path("deployments")
        self.deployments_dir.mkdir(exist_ok=True)
    
    def deploy(self, model_id: str, environment: str = "production") -> Dict[str, Any]:
        """
        Deploy a model to the specified environment
        
        Args:
            model_id: ID of the model to deploy
            environment: Target environment (production, staging, development)
        
        Returns:
            Deployment information
        """
        print(f"🚀 Deploying model {model_id} to {environment}...")
        
        # Verify model exists
        model_path = Path("models") / f"{model_id}.pt"
        if not model_path.exists():
            raise FileNotFoundError(f"Model {model_id} not found")
        
        # Load model metadata
        checkpoint = torch.load(model_path, map_location='cpu')
        
        # Create deployment record
        deployment_info = {
            "model_id": model_id,
            "environment": environment,
            "deployed_at": time.time(),
            "model_metadata": {
                "model_name": checkpoint.get('model_name', 'unknown'),
                "config": checkpoint.get('config', {}),
                "metadata": checkpoint.get('metadata', {}),
            },
            "status": "deployed",
            "endpoint": self._generate_endpoint(model_id, environment),
            "version": "1.0.0",
        }
        
        # Save deployment record
        deployment_file = self.deployments_dir / f"{model_id}_{environment}.json"
        with open(deployment_file, 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print(f"✅ Model deployed successfully!")
        print(f"   Endpoint: {deployment_info['endpoint']}")
        print(f"   Deployment file: {deployment_file}")
        
        return deployment_info
    
    def _generate_endpoint(self, model_id: str, environment: str) -> str:
        """Generate deployment endpoint URL"""
        base_url = "https://api.hazoom.com"
        
        if environment == "production":
            return f"{base_url}/v1/models/{model_id}"
        elif environment == "staging":
            return f"{base_url}/staging/v1/models/{model_id}"
        else:
            return f"{base_url}/dev/v1/models/{model_id}"
    
    def list_deployments(self, environment: Optional[str] = None) -> list:
        """List all deployments"""
        pattern = "*.json"
        if environment:
            pattern = f"*_{environment}.json"
        
        deployments = []
        for deployment_file in self.deployments_dir.glob(pattern):
            with open(deployment_file, 'r') as f:
                deployment_info = json.load(f)
                deployments.append(deployment_info)
        
        return deployments
    
    def get_deployment(self, model_id: str, environment: str) -> Optional[Dict[str, Any]]:
        """Get deployment information"""
        deployment_file = self.deployments_dir / f"{model_id}_{environment}.json"
        
        if not deployment_file.exists():
            return None
        
        with open(deployment_file, 'r') as f:
            return json.load(f)
    
    def undeploy(self, model_id: str, environment: str) -> bool:
        """Undeploy a model"""
        deployment_file = self.deployments_dir / f"{model_id}_{environment}.json"
        
        if not deployment_file.exists():
            return False
        
        deployment_file.unlink()
        print(f"✅ Model {model_id} undeployed from {environment}")
        
        return True
    
    def get_deployment_stats(self) -> Dict[str, Any]:
        """Get deployment statistics"""
        deployments = self.list_deployments()
        
        stats = {
            "total_deployments": len(deployments),
            "by_environment": {},
            "by_model": {},
        }
        
        for deployment in deployments:
            env = deployment.get('environment', 'unknown')
            model_id = deployment.get('model_id', 'unknown')
            
            stats["by_environment"][env] = stats["by_environment"].get(env, 0) + 1
            stats["by_model"][model_id] = stats["by_model"].get(model_id, 0) + 1
        
        return stats