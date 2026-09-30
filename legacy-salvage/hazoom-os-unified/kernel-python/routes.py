# hazoom-os/kernel/routes.py
from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def index():
        return "Hazoom Dynamic Kernel Feature Service (HDKFS) is running."

    # Import and register the sysinfo blueprint
    from .modules.sysinfo.routes import sysinfo_bp
    app.register_blueprint(sysinfo_bp, url_prefix='/sysinfo')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True)
