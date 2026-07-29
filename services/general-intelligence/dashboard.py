from flask import Flask, render_template_string
import os
import markdown
import glob

app = Flask(__name__)

# Interface Cyberpunk / Centre de Commandement
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>CAPTAIN GENERAL INTELLIGENCE - COMMAND CENTER</title>
    <style>
        :root {
            --bg-dark: #050505;
            --panel-bg: #0d1117;
            --accent-cyan: #00f0ff;
            --accent-green: #39ff14;
            --accent-red: #ff003c;
            --text-main: #c9d1d9;
        }
        body { 
            background: var(--bg-dark); 
            color: var(--text-main); 
            font-family: 'Courier New', Consolas, monospace; 
            margin: 0; padding: 0; 
            display: flex; flex-direction: column; height: 100vh;
        }
        header {
            background: linear-gradient(90deg, #000 0%, #002233 100%);
            padding: 15px 30px;
            border-bottom: 2px solid var(--accent-cyan);
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }
        h1 { 
            color: var(--accent-cyan); 
            margin: 0; 
            text-shadow: 0 0 10px var(--accent-cyan);
            letter-spacing: 2px;
        }
        .status { color: var(--accent-green); font-size: 0.9em; margin-top: 5px; }
        .container { display: flex; flex: 1; overflow: hidden; }
        
        /* Sidebar Navigation */
        .sidebar { 
            width: 320px; 
            background: var(--panel-bg); 
            border-right: 1px solid #333; 
            padding: 20px; 
            overflow-y: auto;
        }
        .sidebar h2 { 
            color: var(--accent-cyan); 
            font-size: 1.1em; 
            border-bottom: 1px solid #333; 
            padding-bottom: 5px; 
            margin-top: 20px;
        }
        ul { list-style-type: none; padding: 0; margin: 0; }
        li { margin: 8px 0; }
        a { 
            color: var(--accent-green); 
            text-decoration: none; 
            display: block;
            padding: 8px 12px;
            border: 1px solid transparent;
            border-radius: 4px;
            transition: all 0.2s;
        }
        a:hover { 
            background: rgba(57, 255, 20, 0.1); 
            border-color: var(--accent-green); 
            box-shadow: 0 0 8px rgba(57, 255, 20, 0.4);
        }
        
        /* Main Content Area */
        .content { 
            flex: 1; 
            padding: 30px; 
            overflow-y: auto; 
            background: #080b10;
        }
        .content h2 { color: var(--accent-cyan); border-bottom: 1px solid #333; padding-bottom: 10px; }
        
        /* Code & Markdown Styling */
        pre { 
            background: #000; 
            color: #0f0; 
            padding: 20px; 
            border-radius: 5px; 
            border-left: 4px solid var(--accent-cyan);
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
        }
        code { background: #111; padding: 2px 6px; border-radius: 3px; color: var(--accent-green); }
        .md-content { line-height: 1.6; font-family: Arial, sans-serif; color: #ddd; }
        .md-content h1, .md-content h2, .md-content h3 { color: var(--accent-cyan); font-family: 'Courier New', monospace; }
        .md-content blockquote { border-left: 3px solid var(--accent-green); padding-left: 15px; color: #aaa; }
        
        .empty-state {
            text-align: center;
            margin-top: 100px;
            color: #666;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <header>
        <h1>👑 CAPTAIN GENERAL INTELLIGENCE COMMAND CENTER</h1>
        <div class="status">SYSTEM STATUS: ONLINE | WSL2 NODE: ACTIVE | PROTOCOL: SPARK VELOCITY</div>
    </header>
    
    <div class="container">
        <div class="sidebar">
            <h2>📂 MISSION LOGS</h2>
            <ul>
                {% for f in md_files %}
                    <li><a href="/view/{{ f }}">📄 {{ f }}</a></li>
                {% endfor %}
            </ul>
            
            <h2>⚙️ PROTOCOLS & SCRIPTS</h2>
            <ul>
                {% for f in sh_files %}
                    <li><a href="/view/{{ f }}">⚡ {{ f }}</a></li>
                {% endfor %}
            </ul>
            
            <h2>🐍 PYTHON ARTIFACTS</h2>
            <ul>
                {% for f in py_files %}
                    <li><a href="/view/{{ f }}">🐍 {{ f }}</a></li>
                {% endfor %}
            </ul>
        </div>
        
        <div class="content">
            {% if content %}
                <h2>📟 {{ filename }}</h2>
                {% if is_markdown %}
                    <div class="md-content">{{ content|safe }}</div>
                {% else %}
                    <pre>{{ content }}</pre>
                {% endif %}
            {% else %}
                <div class="empty-state">
                    <p>🛰️ EN ATTENTE D'ORDRES, CAPITAINE SOUSSI.</p>
                    <p>Sélectionnez un rapport de mission ou un protocole dans la matrice de navigation.</p>
                </div>
            {% endif %}
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    md_files = sorted([os.path.basename(f) for f in glob.glob('*.md')])
    sh_files = sorted([os.path.basename(f) for f in glob.glob('*.sh')])
    py_files = sorted([os.path.basename(f) for f in glob.glob('*.py')])
    return render_template_string(HTML_TEMPLATE, 
                                  md_files=md_files, 
                                  sh_files=sh_files, 
                                  py_files=py_files, 
                                  content=None)

@app.route('/view/<filename>')
def view(filename):
    md_files = sorted([os.path.basename(f) for f in glob.glob('*.md')])
    sh_files = sorted([os.path.basename(f) for f in glob.glob('*.sh')])
    py_files = sorted([os.path.basename(f) for f in glob.glob('*.py')])
    
    is_markdown = False
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            text = f.read()
            
        if filename.endswith('.md'):
            content = markdown.markdown(text, extensions=['fenced_code', 'tables'])
            is_markdown = True
        else:
            content = text
            
    except Exception as e:
        content = f"ERREUR DE LECTURE DU FICHIER : {str(e)}"
        
    return render_template_string(HTML_TEMPLATE, 
                                  md_files=md_files, 
                                  sh_files=sh_files, 
                                  py_files=py_files, 
                                  content=content, 
                                  filename=filename,
                                  is_markdown=is_markdown)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 INITIALISATION DU CENTRE DE COMMANDEMENT...")
    print("🌍 ACCÈS LOCAL : http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
