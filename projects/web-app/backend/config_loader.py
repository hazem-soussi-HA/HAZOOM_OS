import json
import os

def load_config(config_file='config.json'):
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    # Override with env vars
    config['storage_type'] = os.getenv('STORAGE_TYPE', config.get('storage_type', 'file'))
    config['path'] = os.getenv('STORAGE_PATH', config.get('path', './data'))
    
    return config

def get_storage(config):
    storage_type = config['storage_type']
    if storage_type == 'file':
        from storage import FileStorage
        return FileStorage(config['path'])
    elif storage_type == 'database':
        from storage import DatabaseStorage
        return DatabaseStorage(config['path'])
    elif storage_type == 'cloud':
        from storage import CloudStorage
        return CloudStorage(config['path'])
    else:
        raise ValueError("Unknown storage type")