# hazoom-os/kernel/modules/sysinfo/routes.py
from flask import Blueprint, jsonify
import psutil

sysinfo_bp = Blueprint('sysinfo', __name__)

@sysinfo_bp.route('/')
def get_sysinfo():
    """
    Returns basic system information.
    """
    return jsonify({
        'cpu_usage_percent': psutil.cpu_percent(),
        'memory_usage_percent': psutil.virtual_memory().percent,
    })
