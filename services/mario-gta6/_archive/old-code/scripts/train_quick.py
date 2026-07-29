#!/usr/bin/env python3
"""Quick training run — 5000 steps to verify the full pipeline."""
import sys
sys.path.insert(0, '/home/hazem/mario_gta6')

from python.ai import TrainingConfig, Trainer

config = TrainingConfig(
    total_timesteps=5000,
    max_steps_per_env=200,
    log_interval=10,
    save_interval=500,
    batch_size=64,
    num_epochs=4,
    learning_rate=3e-4,
)
config.network.device = 'cpu'
config.save_dir = '/home/hazem/mario_gta6/checkpoints'

trainer = Trainer(config)
trainer.train()

# Save final ONNX
import torch
trainer.net.eval()
torch.onnx.export(trainer.net,
    (torch.randn(1,4,84,84), torch.randn(1,16), None),
    '/home/hazem/mario_gta6/checkpoints/mario_ppo_final.onnx',
    input_names=['frames','state','hidden'],
    output_names=['logits','value','new_hidden'], opset_version=17)
print("ONNX exported to checkpoints/mario_ppo_final.onnx")
