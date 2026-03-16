## PlugAI (Static UI + Real API Server)

This project is a multi-page static site (`index.html`, `docs.html`, `login.html`, `dashboard.html`, `playground.html`) plus an optional **real backend** that:

- Serves the website
- Provides `/api/chat` so the Playground can make **real API calls**
- Keeps your real API key **server-side** (never exposed in browser JavaScript)

### Run the real server (recommended)

#### 1) Install backend dependencies

From the project root:

```powershell
cd "c:\Users\viona\Desktop\plug\server"
python -m pip install -r requirements.txt
```

#### 2) Configure environment variables

Copy the example file and set your key:

```powershell
cd "c:\Users\viona\Desktop\plug\server"
copy .env.example .env
notepad .env
```

Set:

- `PLUGAI_BASE_URL` (default: `https://api.plugai.dev`)
- `PLUGAI_API_KEY` (**required**)

#### 3) Start the server

```powershell
cd "c:\Users\viona\Desktop\plug\server"
python -m uvicorn app:app --reload --port 5173
```

Now open:

- `http://127.0.0.1:5173/` (site)
- `http://127.0.0.1:5173/playground.html` (playground)

### How real API calling works

- Frontend Playground sends requests to **your server**:
  - `POST /api/chat`
- Server forwards to the upstream API:
  - `POST {PLUGAI_BASE_URL}/v1/chat`
- Server injects `Authorization: Bearer {PLUGAI_API_KEY}`

If the backend is not running or not configured, the Playground automatically falls back to **demo mode**.

