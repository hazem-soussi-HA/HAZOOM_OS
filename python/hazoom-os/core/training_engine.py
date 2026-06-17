"""
Hazoom OS - Advanced Neural Network Training Engine
Supports multi-GPU distributed training with automatic optimization
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torch.cuda.amp import GradScaler, autocast
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
import numpy as np
from typing import Dict, List, Optional, Tuple
import json
import os
from pathlib import Path
import wandb
from tqdm import tqdm
import time

from models.llm_architectures import get_model_architecture
from models.tokenizers import get_tokenizer
from storage.checkpoint_manager import CheckpointManager


class TrainingEngine:
    """
    Advanced training engine with distributed training, mixed precision,
    and automatic optimization capabilities
    """
    
    def __init__(
        self,
        model_name: str,
        dataset_path: str,
        epochs: int = 100,
        batch_size: int = 32,
        gpu_id: int = 0,
        learning_rate: float = 1e-4,
        use_amp: bool = True,
        use_ddp: bool = False,
    ):
        self.model_name = model_name
        self.dataset_path = dataset_path
        self.epochs = epochs
        self.batch_size = batch_size
        self.gpu_id = gpu_id
        self.learning_rate = learning_rate
        self.use_amp = use_amp
        self.use_ddp = use_ddp
        
        # Setup device
        if torch.cuda.is_available():
            self.device = torch.device(f'cuda:{gpu_id}')
            torch.cuda.set_device(gpu_id)
        else:
            self.device = torch.device('cpu')
        
        # Initialize components
        self.model = None
        self.optimizer = None
        self.scaler = None
        self.train_loader = None
        self.val_loader = None
        self.checkpoint_manager = CheckpointManager()
        
        # Training state
        self.current_epoch = 0
        self.best_loss = float('inf')
        self.training_history = []
        
        # Initialize wandb for experiment tracking
        self._init_wandb()
    
    def _init_wandb(self):
        """Initialize Weights & Biases for experiment tracking"""
        try:
            wandb.init(
                project="hazoom-os",
                name=f"{self.model_name}_{int(time.time())}",
                config={
                    "model": self.model_name,
                    "epochs": self.epochs,
                    "batch_size": self.batch_size,
                    "learning_rate": self.learning_rate,
                }
            )
        except Exception as e:
            print(f"Warning: Could not initialize wandb: {e}")
    
    def build_model(self):
        """Build the model architecture"""
        print(f"🔧 Building model: {self.model_name}")
        
        # Get model architecture
        model_class = get_model_architecture(self.model_name)
        
        # Initialize model
        if self.model_name.lower() == "gpt-4":
            self.model = model_class(
                vocab_size=50257,
                d_model=1024,
                n_layers=24,
                n_heads=16,
                d_ff=4096,
                max_seq_len=2048,
                dropout=0.1
            )
        elif self.model_name.lower() == "llama-2":
            self.model = model_class(
                vocab_size=32000,
                d_model=4096,
                n_layers=32,
                n_heads=32,
                d_ff=11008,
                max_seq_len=4096,
                dropout=0.1
            )
        else:
            # Default configuration
            self.model = model_class(
                vocab_size=50257,
                d_model=768,
                n_layers=12,
                n_heads=12,
                d_ff=3072,
                max_seq_len=1024,
                dropout=0.1
            )
        
        # Move to device
        self.model = self.model.to(self.device)
        
        # Wrap with DDP if using distributed training
        if self.use_ddp and torch.cuda.device_count() > 1:
            self.model = DDP(self.model, device_ids=[self.gpu_id])
        
        print(f"✅ Model built: {sum(p.numel() for p in self.model.parameters()):,} parameters")
        
        return self.model
    
    def prepare_data(self):
        """Prepare training and validation datasets"""
        print(f"📊 Loading dataset: {self.dataset_path}")
        
        # Load tokenizer
        tokenizer = get_tokenizer(self.model_name)
        
        # Load dataset
        if os.path.exists(self.dataset_path):
            # Load from file
            with open(self.dataset_path, 'r') as f:
                if self.dataset_path.endswith('.json') or self.dataset_path.endswith('.jsonl'):
                    import json
                    data = [json.loads(line) for line in f] if self.dataset_path.endswith('.jsonl') else json.load(f)
                else:
                    # Assume text file
                    data = f.read().split('\n')
        else:
            # Use default dataset
            from datasets import load_dataset
            dataset = load_dataset(self.dataset_path, split='train')
            data = dataset['text']
        
        # Create dataset
        train_dataset = TextDataset(data, tokenizer, max_length=1024)
        
        # Split into train/val
        train_size = int(0.9 * len(train_dataset))
        val_size = len(train_dataset) - train_size
        train_dataset, val_dataset = torch.utils.data.random_split(
            train_dataset, [train_size, val_size]
        )
        
        # Create data loaders
        self.train_loader = DataLoader(
            train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            num_workers=4,
            pin_memory=True
        )
        
        self.val_loader = DataLoader(
            val_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=4,
            pin_memory=True
        )
        
        print(f"✅ Dataset loaded: {len(train_dataset)} train, {len(val_dataset)} val samples")
        
        return self.train_loader, self.val_loader
    
    def setup_optimizer(self):
        """Setup optimizer and scheduler"""
        print("⚙️ Setting up optimizer...")
        
        # AdamW optimizer with weight decay
        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=self.learning_rate,
            betas=(0.9, 0.95),
            weight_decay=0.1
        )
        
        # Learning rate scheduler
        self.scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
            self.optimizer,
            T_0=10,
            T_mult=2,
            eta_min=1e-6
        )
        
        # Mixed precision scaler
        if self.use_amp:
            self.scaler = GradScaler()
        
        print("✅ Optimizer configured")
        
        return self.optimizer
    
    def train_epoch(self, epoch: int) -> float:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0
        
        progress_bar = tqdm(
            self.train_loader,
            desc=f"Epoch {epoch}/{self.epochs}",
            leave=True
        )
        
        for batch_idx, batch in enumerate(progress_bar):
            # Move batch to device
            input_ids = batch['input_ids'].to(self.device)
            attention_mask = batch['attention_mask'].to(self.device)
            labels = batch['labels'].to(self.device)
            
            # Forward pass with mixed precision
            self.optimizer.zero_grad()
            
            if self.use_amp:
                with autocast():
                    outputs = self.model(
                        input_ids=input_ids,
                        attention_mask=attention_mask
                    )
                    loss = self._compute_loss(outputs, labels)
                
                # Backward pass with mixed precision
                self.scaler.scale(loss).backward()
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask
                )
                loss = self._compute_loss(outputs, labels)
                loss.backward()
                self.optimizer.step()
            
            # Update scheduler
            self.scheduler.step()
            
            # Track metrics
            total_loss += loss.item()
            num_batches += 1
            
            # Update progress bar
            progress_bar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'lr': f'{self.scheduler.get_last_lr()[0]:.6f}'
            })
            
            # Log to wandb
            if batch_idx % 10 == 0:
                wandb.log({
                    'train/loss': loss.item(),
                    'train/lr': self.scheduler.get_last_lr()[0],
                    'train/step': epoch * len(self.train_loader) + batch_idx
                })
        
        avg_loss = total_loss / num_batches
        return avg_loss
    
    def validate(self) -> float:
        """Validate the model"""
        self.model.eval()
        total_loss = 0
        num_batches = 0
        
        with torch.no_grad():
            for batch in tqdm(self.val_loader, desc="Validating"):
                # Move batch to device
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)
                
                # Forward pass
                if self.use_amp:
                    with autocast():
                        outputs = self.model(
                            input_ids=input_ids,
                            attention_mask=attention_mask
                        )
                        loss = self._compute_loss(outputs, labels)
                else:
                    outputs = self.model(
                        input_ids=input_ids,
                        attention_mask=attention_mask
                    )
                    loss = self._compute_loss(outputs, labels)
                
                total_loss += loss.item()
                num_batches += 1
        
        avg_loss = total_loss / num_batches
        return avg_loss
    
    def _compute_loss(self, outputs, labels):
        """Compute loss from model outputs"""
        if isinstance(outputs, dict):
            logits = outputs['logits']
        else:
            logits = outputs
        
        # Shift logits and labels for causal language modeling
        shift_logits = logits[..., :-1, :].contiguous()
        shift_labels = labels[..., 1:].contiguous()
        
        # Compute cross-entropy loss
        loss = nn.functional.cross_entropy(
            shift_logits.view(-1, shift_logits.size(-1)),
            shift_labels.view(-1),
            ignore_index=-100
        )
        
        return loss
    
    def save_checkpoint(self, epoch: int, loss: float):
        """Save training checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'loss': loss,
            'model_name': self.model_name,
            'config': {
                'epochs': self.epochs,
                'batch_size': self.batch_size,
                'learning_rate': self.learning_rate,
            }
        }
        
        # Save checkpoint
        checkpoint_path = self.checkpoint_manager.save_checkpoint(
            checkpoint,
            self.model_name,
            epoch,
            loss
        )
        
        # Save best model
        if loss < self.best_loss:
            self.best_loss = loss
            best_path = self.checkpoint_manager.save_best_model(
                self.model,
                self.model_name,
                loss
            )
            print(f"💾 New best model saved: {best_path}")
        
        print(f"💾 Checkpoint saved: {checkpoint_path}")
    
    def load_checkpoint(self, checkpoint_path: Optional[str] = None):
        """Load training checkpoint"""
        if checkpoint_path is None:
            checkpoint_path = self.checkpoint_manager.get_latest_checkpoint(self.model_name)
        
        if checkpoint_path is None:
            print("⚠️ No checkpoint found, starting from scratch")
            return
        
        print(f"📂 Loading checkpoint: {checkpoint_path}")
        
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        
        self.current_epoch = checkpoint['epoch'] + 1
        self.best_loss = checkpoint['loss']
        
        if self.model is None:
            self.build_model()
        
        self.model.load_state_dict(checkpoint['model_state_dict'])
        
        if self.optimizer is None:
            self.setup_optimizer()
        
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        print(f"✅ Checkpoint loaded: epoch {self.current_epoch}, loss {self.best_loss:.4f}")
    
    def train(self):
        """Main training loop"""
        print("=" * 60)
        print("🚀 Starting Training")
        print("=" * 60)
        
        # Build model
        if self.model is None:
            self.build_model()
        
        # Prepare data
        if self.train_loader is None:
            self.prepare_data()
        
        # Setup optimizer
        if self.optimizer is None:
            self.setup_optimizer()
        
        # Training loop
        for epoch in range(self.current_epoch, self.epochs):
            print(f"\n{'='*60}")
            print(f"Epoch {epoch + 1}/{self.epochs}")
            print(f"{'='*60}")
            
            # Train
            train_loss = self.train_epoch(epoch)
            
            # Validate
            val_loss = self.validate()
            
            # Log metrics
            metrics = {
                'epoch': epoch,
                'train_loss': train_loss,
                'val_loss': val_loss,
                'learning_rate': self.scheduler.get_last_lr()[0],
            }
            
            wandb.log({
                'epoch': epoch,
                'train/loss': train_loss,
                'val/loss': val_loss,
                'train/lr': self.scheduler.get_last_lr()[0],
            })
            
            self.training_history.append(metrics)
            
            # Print metrics
            print(f"\n📊 Epoch {epoch + 1} Results:")
            print(f"   Train Loss: {train_loss:.4f}")
            print(f"   Val Loss:   {val_loss:.4f}")
            print(f"   LR:         {self.scheduler.get_last_lr()[0]:.6f}")
            
            # Save checkpoint
            if (epoch + 1) % 5 == 0 or epoch == self.epochs - 1:
                self.save_checkpoint(epoch, val_loss)
            
            # Early stopping check
            if val_loss < self.best_loss * 0.99:
                self.best_loss = val_loss
        
        # Save training history
        self._save_training_history()
        
        print("\n" + "=" * 60)
        print("✅ Training Completed!")
        print("=" * 60)
        
        # Finish wandb
        wandb.finish()
    
    def _save_training_history(self):
        """Save training history to file"""
        history_path = Path("training_history") / f"{self.model_name}_history.json"
        history_path.parent.mkdir(exist_ok=True)
        
        with open(history_path, 'w') as f:
            json.dump(self.training_history, f, indent=2)
        
        print(f"💾 Training history saved: {history_path}")


class TextDataset(Dataset):
    """Custom dataset for text data"""
    
    def __init__(self, texts, tokenizer, max_length=1024):
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].squeeze(0),
            'attention_mask': encoding['attention_mask'].squeeze(0),
            'labels': encoding['input_ids'].squeeze(0).clone()
        }