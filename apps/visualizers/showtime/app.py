# hazoom-os/showtime/app.py
import time
import random
from flask import Flask, render_template, Response

app = Flask(__name__)

def mock_search(query):
    """
    A mock search function that simulates finding results.
    """
    results = [
        f"Result for '{query}': User Profile",
        f"Result for '{query}': Settings Page",
        f"Result for '{query}': Dashboard",
        f"Result for '{query}': Documentation",
        f"Result for '{query}': API Endpoint",
    ]
    for result in results:
        # Simulate a delay for each result
        time.sleep(random.uniform(0.1, 0.5))
        yield f"data: {result}\n\n"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search/<query>')
def search(query):
    return Response(mock_search(query), content_type='text/event-stream')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)