"""
Hazoom OS - REST API Server
FastAPI-based API for model management, training, and inference
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import uvicorn
import torch
import json
from pathlib import Path
import asyncio

from core.training_engine import TrainingEngine
from core.verification_engine import VerificationEngine
from core.agi_optimizer import AGIOptimizer
from storage.checkpoint_manager import CheckpointManager


# Request/Response Models
class TrainRequest(BaseModel):
    model_name: str
    dataset_path: str
    epochs: int = 100
    batch_size: int = 32
    gpu_id: int = 0
    learning_rate: float = 1e-4


class VerifyRequest(BaseModel):
    model_id: str
    benchmark: str = "all"


class OptimizeRequest(BaseModel):
    model_id: str
    strategy: str = "auto"


class GenerateRequest(BaseModel):
    model_id: str
    prompt: str
    max_length: int = 100
    temperature: float = 1.0


class DeployRequest(BaseModel):
    model_id: str
    env: str = "production"


class TrainResponse(BaseModel):
    status: str
    model_id: str
    message: str


class VerifyResponse(BaseModel):
    status: str
    results: Dict[str, Any]


class OptimizeResponse(BaseModel):
    status: str
    strategy: str
    improvements: Dict[str, float]
    score_improvement: float


class GenerateResponse(BaseModel):
    status: str
    response: str
    model_id: str


class DeployResponse(BaseModel):
    status: str
    model_id: str
    endpoint: str


class StatusResponse(BaseModel):
    status: str
    models: List[str]
    checkpoints: Dict[str, int]


class APIServer:
    """
    FastAPI-based REST API server for Hazoom OS
    """
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8000, workers: int = 4):
        self.host = host
        self.port = port
        self.workers = workers
        
        # Initialize FastAPI app
        self.app = FastAPI(
            title="Hazoom OS API",
            description="AGI-Powered LLM Training & Verification System",
            version="1.0.0"
        )
        
        # Setup middleware
        self._setup_middleware()
        
        # Setup routes
        self._setup_routes()
        
        # Initialize components
        self.checkpoint_manager = CheckpointManager()
        
        # Active training jobs
        self.active_jobs = {}
    
    def _setup_middleware(self):
        """Setup CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.get("/")
        async def root():
            return {
                "message": "Hazoom OS API",
                "version": "1.0.0",
                "endpoints": [
                    "/train",
                    "/verify",
                    "/optimize",
                    "/generate",
                    "/deploy",
                    "/status",
                    "/models",
                    "/checkpoints"
                ]
            }
        
        @self.app.post("/train", response_model=TrainResponse)
        async def train(request: TrainRequest, background_tasks: BackgroundTasks):
            """Start a training job"""
            try:
                # Check if model already exists
                model_path = Path("models") / f"{request.model_name}.pt"
                if model_path.exists():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Model {request.model_name} already exists"
                    )
                
                # Start training in background
                job_id = f"train_{request.model_name}_{int(time.time())}"
                self.active_jobs[job_id] = {
                    "status": "running",
                    "model_name": request.model_name,
                    "start_time": time.time()
                }
                
                background_tasks.add_task(
                    self._run_training,
                    request,
                    job_id
                )
                
                return TrainResponse(
                    status="started",
                    model_id=request.model_name,
                    message=f"Training started for {request.model_name}"
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/verify", response_model=VerifyResponse)
        async def verify(request: VerifyRequest):
            """Verify a trained model"""
            try:
                verifier = VerificationEngine(model_id=request.model_id)
                
                if request.benchmark == "all":
                    results = verifier.run_all_benchmarks()
                else:
                    results = {request.benchmark: verifier.run_benchmark(request.benchmark)}
                
                return VerifyResponse(
                    status="completed",
                    results={
                        name: {
                            "score": result.score,
                            "passed": result.passed,
                            "details": result.details
                        }
                        for name, result in results.items()
                    }
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/optimize", response_model=OptimizeResponse)
        async def optimize(request: OptimizeRequest):
            """Optimize a model using AGI intelligence"""
            try:
                optimizer = AGIOptimizer(model_id=request.model_id)
                result = optimizer.optimize(strategy=request.strategy)
                
                return OptimizeResponse(
                    status="completed",
                    strategy=result.strategy,
                    improvements=result.improvements,
                    score_improvement=result.score_improvement
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/generate", response_model=GenerateResponse)
        async def generate(request: GenerateRequest):
            """Generate text from a model"""
            try:
                # Load model
                model_path = Path("models") / f"{request.model_id}.pt"
                if not model_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Model {request.model_id} not found"
                    )
                
                # Load checkpoint
                checkpoint = torch.load(model_path, map_location='cpu')
                
                # Get model architecture
                from models.llm_architectures import get_model_architecture
                from models.tokenizers import get_tokenizer
                
                model_name = checkpoint.get('model_name', 'transformer')
                model_class = get_model_architecture(model_name)
                
                # Initialize model
                model = model_class()
                model.load_state_dict(checkpoint['model_state_dict'])
                model.eval()
                
                # Get tokenizer
                tokenizer = get_tokenizer(model_name)
                
                # Generate
                encoding = tokenizer(
                    request.prompt,
                    max_length=512,
                    padding=False,
                    truncation=True,
                    return_tensors='pt'
                )
                
                with torch.no_grad():
                    outputs = model(input_ids=encoding['input_ids'])
                    logits = outputs['logits']
                    
                    # Greedy decoding
                    generated = encoding['input_ids'].clone()
                    
                    for _ in range(request.max_length):
                        next_token = torch.argmax(logits[:, -1:, :], dim=-1)
                        generated = torch.cat([generated, next_token], dim=1)
                        
                        if generated.size(1) >= 512:
                            break
                        
                        outputs = model(input_ids=generated)
                        logits = outputs['logits']
                
                # Decode
                response = tokenizer.decode(generated[0].tolist())
                
                # Remove prompt from response
                if response.startswith(request.prompt):
                    response = response[len(request.prompt):].strip()
                
                return GenerateResponse(
                    status="completed",
                    response=response,
                    model_id=request.model_id
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/deploy", response_model=DeployResponse)
        async def deploy(request: DeployRequest):
            """Deploy a model to production"""
            try:
                # Check if model exists
                model_path = Path("models") / f"{request.model_id}.pt"
                if not model_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Model {request.model_id} not found"
                    )
                
                # Simulate deployment
                endpoint = f"https://api.hazoom.com/v1/models/{request.model_id}"
                
                # Save deployment info
                deployment_info = {
                    "model_id": request.model_id,
                    "endpoint": endpoint,
                    "environment": request.env,
                    "deployed_at": time.time()
                }
                
                deployment_path = Path("deployments") / f"{request.model_id}.json"
                deployment_path.parent.mkdir(exist_ok=True)
                
                with open(deployment_path, 'w') as f:
                    json.dump(deployment_info, f, indent=2)
                
                return DeployResponse(
                    status="deployed",
                    model_id=request.model_id,
                    endpoint=endpoint
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/status", response_model=StatusResponse)
        async def status():
            """Get system status"""
            try:
                # List models
                models_dir = Path("models")
                models = []
                if models_dir.exists():
                    models = [f.stem for f in models_dir.glob("*.pt")]
                
                # Count checkpoints
                checkpoints_dir = Path("checkpoints/checkpoints")
                checkpoint_counts = {}
                if checkpoints_dir.exists():
                    for model in models:
                        count = len(list(checkpoints_dir.glob(f"{model}_*.pt")))
                        checkpoint_counts[model] = count
                
                return StatusResponse(
                    status="running",
                    models=models,
                    checkpoints=checkpoint_counts
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/models")
        async def list_models():
            """List all available models"""
            try:
                models_dir = Path("models")
                if not models_dir.exists():
                    return {"models": []}
                
                models = []
                for model_file in models_dir.glob("*.pt"):
                    checkpoint = torch.load(model_file, map_location='cpu')
                    info = {
                        "name": model_file.stem,
                        "path": str(model_file),
                        "size_mb": model_file.stat().st_size / (1024 * 1024),
                    }
                    
                    if 'metadata' in checkpoint:
                        info.update(checkpoint['metadata'])
                    
                    models.append(info)
                
                return {"models": models}
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/checkpoints/{model_name}")
        async def list_checkpoints(model_name: str):
            """List checkpoints for a model"""
            try:
                checkpoints = self.checkpoint_manager.list_checkpoints(model_name)
                return {"checkpoints": checkpoints}
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/jobs")
        async def list_jobs():
            """List active jobs"""
            return {"jobs": self.active_jobs}
    
    async def _run_training(self, request: TrainRequest, job_id: str):
        """Run training in background"""
        try:
            # Update job status
            self.active_jobs[job_id]["status"] = "running"
            
            # Create training engine
            engine = TrainingEngine(
                model_name=request.model_name,
                dataset_path=request.dataset_path,
                epochs=request.epochs,
                batch_size=request.batch_size,
                gpu_id=request.gpu_id,
                learning_rate=request.learning_rate
            )
            
            # Train
            engine.train()
            
            # Save model
            models_dir = Path("models")
            models_dir.mkdir(exist_ok=True)
            
            model_path = models_dir / f"{request.model_name}.pt"
            torch.save({
                'model_state_dict': engine.model.state_dict(),
                'model_name': request.model_name,
                'config': {
                    'epochs': request.epochs,
                    'batch_size': request.batch_size,
                    'learning_rate': request.learning_rate,
                },
                'metadata': {
                    'trained_at': time.time(),
                    'dataset': request.dataset_path,
                }
            }, model_path)
            
            # Update job status
            self.active_jobs[job_id]["status"] = "completed"
            self.active_jobs[job_id]["completed_at"] = time.time()
            self.active_jobs[job_id]["model_path"] = str(model_path)
            
        except Exception as e:
            # Update job status with error
            self.active_jobs[job_id]["status"] = "failed"
            self.active_jobs[job_id]["error"] = str(e)
            self.active_jobs[job_id]["completed_at"] = time.time()
    
    def start(self):
        """Start the API server"""
        print(f"🚀 Starting Hazoom OS API Server on {self.host}:{self.port}")
        print(f"📊 API Documentation: http://{self.host}:{self.port}/docs")
        
        uvicorn.run(
            self.app,
            host=self.host,
            port=self.port,
            workers=self.workers
        )


if __name__ == "__main__":
    import time
    
    server = APIServer()
    server.start()