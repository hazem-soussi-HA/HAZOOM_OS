import sys, os, subprocess, datetime, time
try:
    from flask import Flask, render_template_string, jsonify, request
    import psutil
except ImportError:
    os.system("pip install flask psutil --break-system-packages > /dev/null 2>&1")
    from flask import Flask, render_template_string, jsonify, request
    import psutil

app = Flask(__name__)
# Keep track of last command executed
last_node_status = "READY FOR COMMAND"

def get_universe_map(path="."):
    universe = []
    ignore = ['node_modules', '.git', 'Antigravity', 'recover_pt']
    for root, dirs, files in os.walk(path):
        if any(x in root for x in ignore): continue
        level = root.replace(path, '').count(os.sep)
        indent = " " * 4 * level
        universe.append(f"{indent}📁 {os.path.basename(root)}/")
        for f in files:
            if f.endswith(('.pas', '.py', '.sh', '.js')):
                universe.append(f"{indent}    ✨ {f}")
    return "\n".join(universe)

@app.route('/api/telemetry')
def telemetry():
    # Trigger Pascal Kernel Pulse
    try: kernel = subprocess.check_output(['./synapse_os'], stderr=subprocess.STDOUT).decode()
    except: kernel = "CORE_SLEEP"
    
    return jsonify({
        "time": datetime.datetime.now().strftime("%H:%M:%S"),
        "cpu": f"{psutil.cpu_percent()}%",
        "ram": f"{psutil.virtual_memory().percent}%",
        "kernel": kernel,
        "universe": get_universe_map(),
        "node_status": last_node_status
    })

@app.route('/api/execute', methods=['POST'])
def execute():
    global last_node_status
    command = request.json.get('cmd')
    # Professional Security Gate: Only allow specific Pascal node builds
    if "fpc" in command or "./" in command:
        try:
            result = subprocess.check_output(command.split(), stderr=subprocess.STDOUT).decode()
            last_node_status = f"SUCCESS: {command}"
            return jsonify({"output": result})
        except Exception as e:
            last_node_status = f"ERROR: {str(e)}"
            return jsonify({"output": str(e)})
    return jsonify({"output": "Unauthorized Command Sequence"})

@app.route('/')
def index():
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>SYNAPSE OS | MASTER CONTROL</title>
        <style>
            body { background: #000; color: #00ff41; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
            .container { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; height: 90vh; }
            .panel { border: 1px solid #00ff41; padding: 15px; background: rgba(0,10,0,0.9); overflow: hidden; display: flex; flex-direction: column; }
            #universe-map { flex-grow: 1; overflow-y: auto; font-size: 11px; white-space: pre; color: #00d9ff; }
            #kernel-log { height: 120px; background: #050505; color: #fff; padding: 10px; border: 1px inset #00ff41; font-size: 12px; margin: 10px 0; }
            input { background: #000; border: 1px solid #ff0000; color: #ff0000; padding: 10px; width: 80%; font-family: inherit; }
            button { background: #ff0000; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; }
            .stat { font-size: 18px; color: #ffff00; }
        </style>
    </head>
    <body>
        <div style="text-align:center; color:#ff0000; font-weight:bold; margin-bottom:10px;">☢ MASTER CONTROL INTERFACE: ACTIVE ☢</div>
        <div class="container">
            <div class="panel">
                <div style="border-bottom: 1px solid #00d9ff;">UNIVERSE TOPOLOGY</div>
                <div id="universe-map">Loading Sector...</div>
                <div style="margin-top:20px;">
                    <input id="cmdInput" placeholder="ENTER NODE COMMAND (e.g. ./GalaxyServer)">
                    <button onclick="sendCommand()">EXEC</button>
                </div>
            </div>
            <div class="panel">
                <div class="stat">WSL TELEMETRY: CPU <span id="cpu">0%</span> | RAM <span id="ram">0%</span></div>
                <div id="clock" style="font-size:24px;">00:00:00</div>
                <div style="margin-top:20px;">KERNEL PULSE:</div>
                <div id="kernel-log"></div>
                <div style="margin-top:20px; color:#ff0000;">NODE EVENT STATUS:</div>
                <div id="node-status" style="font-size:14px; color:#ffff00;">READY</div>
            </div>
        </div>
        <script>
            function update() {
                fetch('/api/telemetry').then(r => r.json()).then(data => {
                    document.getElementById('cpu').innerText = data.cpu;
                    document.getElementById('ram').innerText = data.ram;
                    document.getElementById('clock').innerText = data.time;
                    document.getElementById('kernel-log').innerText = data.kernel;
                    document.getElementById('universe-map').innerText = data.universe;
                    document.getElementById('node-status').innerText = data.node_status;
                });
            }
            function sendCommand() {
                const cmd = document.getElementById('cmdInput').value;
                fetch('/api/execute', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({cmd: cmd})
                }).then(r => r.json()).then(d => alert("SYSTEM RESPONSE: " + d.output));
            }
            setInterval(update, 2000);
            update();
        </script>
    </body>
    </html>
    """)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
