from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse

import os

app = FastAPI(title="Hazoom Educational Platform - Super Intelligence for Kids")

# Serve static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Serve assets directory (if it exists)
assets_path = "../hazoom_flutter_app/assets"
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# Serve images directory (if it exists)
images_path = "../LLM_hazoom_dataset_descriptive/public hazoom image assets"
if os.path.exists(images_path):
    app.mount("/images", StaticFiles(directory=images_path), name="images")

# Serve root files directly
@app.get("/{filename}")
async def serve_file(filename: str):
    # Serve Hazoom assets from the LLM dataset directory
    asset_files = [
        "hazoom_logo.png",
        "hazoom_emoji_1.svg", "hazoom_emoji_2.svg", "hazoom_emoji_3.svg",
        "hazoom_emoji_4.svg", "hazoom_emoji_5.svg", "hazoom_emoji_6.svg",
        "hazoom_emoji_7.svg", "hazoom_emoji_8.svg", "hazoom_emoji_9.svg",
        "hazoom_emoji_10.svg", "hazoom_emoji_11.svg", "hazoom_emoji_12.svg",
        "hazoom_emoji_13.svg"
    ]

    if filename in asset_files:
        from fastapi.responses import FileResponse
        # Path to the assets in the LLM dataset directory
        asset_path = f"../LLM_hazoom_dataset_descriptive/public hazoom image assets/{filename}"
        if filename.startswith("hazoom_emoji_"):
            asset_path = f"../LLM_hazoom_dataset_descriptive/public hazoom image assets/images/Hazoom_Emoji_Kangooroo/{filename}"
        elif filename == "hazoom_logo.png":
            asset_path = f"../LLM_hazoom_dataset_descriptive/public hazoom image assets/{filename}"

        if os.path.exists(asset_path):
            return FileResponse(asset_path)
        else:
            # Fallback to logos directory
            logo_path = f"../LLM_hazoom_dataset_descriptive/frontend/src/assets/logos/{filename}"
            if os.path.exists(logo_path):
                return FileResponse(logo_path)
            else:
                # Try the Hazoom_svg directory for emojis
                svg_path = f"../LLM_hazoom_dataset_descriptive/Hazoom_svg/Hazoom_svg/{filename}"
                if os.path.exists(svg_path):
                    return FileResponse(svg_path)

    return {"error": "File not found"}

# For serving the main page
templates = Jinja2Templates(directory=".")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    import sys

    # Allow port override via command line argument
    port = 8080
    if len(sys.argv) > 1 and sys.argv[1].startswith('--port='):
        port = int(sys.argv[1].split('=')[1])
    elif len(sys.argv) > 2 and sys.argv[1] == '--port':
        port = int(sys.argv[2])

    uvicorn.run(app, host="0.0.0.0", port=port)

import httpx

# Define the backend URL
BACKEND_URL = "http://localhost:8001"

# Create a reverse proxy for /api calls
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def reverse_proxy(request: Request, path: str):
    url = httpx.URL(path=f"/api/{path}", query=request.query_params)
    async with httpx.AsyncClient(base_url=BACKEND_URL) as client:
        try:
            # Read the request body
            body = await request.body()
            # Create a new request to forward to the backend
            req = client.build_request(
                request.method,
                url,
                headers=request.headers,
                content=body # Forward body
            )
            response = await client.send(req)
        except httpx.ConnectError as e:
            return JSONResponse(content={"error": f"Could not connect to backend: {e}"}, status_code=500)

        return JSONResponse(
            content=response.json(),
            status_code=response.status_code,
            headers=response.headers
        )
