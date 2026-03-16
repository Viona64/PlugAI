
2import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]  # .../plug
load_dotenv(Path(__file__).resolve().parent / ".env")


class ChatRequest(BaseModel):
    model: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(512, ge=1, le=8192)
    system: Optional[str] = None
    stream: bool = False


app = FastAPI(title="PlugAI Server", version="1.0.0")


# Serve the existing static site (HTML/CSS/JS) from project root
app.mount("/static", StaticFiles(directory=str(ROOT), html=False), name="static")


@app.get("/")
def landing():
    return FileResponse(str(ROOT / "index.html"))


@app.get("/{page_name}.html")
def pages(page_name: str):
    target = ROOT / f"{page_name}.html"
    if not target.exists():
        raise HTTPException(status_code=404, detail="Page not found")
    return FileResponse(str(target))


@app.get("/css/{path:path}")
def css_files(path: str):
    target = ROOT / "css" / path
    if not target.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(target))


@app.get("/js/{path:path}")
def js_files(path: str):
    target = ROOT / "js" / path
    if not target.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(target))


@app.post("/api/chat")
async def chat(req: ChatRequest) -> Dict[str, Any]:
    """
    Proxies a chat request to the upstream PlugAI API.
    Keeps API key server-side (env var), so the browser never sees it.
    """
    base_url = os.getenv("PLUGAI_BASE_URL", "https://api.plugai.dev").rstrip("/")
    api_key = os.getenv("PLUGAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server is missing PLUGAI_API_KEY")

    upstream_url = f"{base_url}/v1/chat"
    payload: Dict[str, Any] = {
        "model": req.model,
        "message": req.message,
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
        "stream": req.stream,
    }
    if req.system:
        payload["system"] = req.system

    start = time.time()
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(
                upstream_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Upstream connection failed: {e}") from e

    latency_ms = int((time.time() - start) * 1000)

    # Try to pass through upstream JSON if possible; otherwise return text
    content_type = r.headers.get("content-type", "")
    if "application/json" in content_type:
        data = r.json()
        if isinstance(data, dict):
            data.setdefault("meta", {})
            if isinstance(data["meta"], dict):
                data["meta"]["latency_ms"] = latency_ms
        return data

    return {
        "error": "non_json_response",
        "status_code": r.status_code,
        "content_type": content_type,
        "latency_ms": latency_ms,
        "text": r.text,
    }

