# Magnified Existence OS

Magnified Existence OS is a dual-application ecosystem comprising:
1. **User Application**: Accessible at `/`
2. **Admin Dashboard**: Accessible at `/admin/`

This project is fully optimized for local hosting, production deployments, and development using a centralized Node.js/Express server and automated build pipeline.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### 2. Installation
Install root dependencies and all subfolder application dependencies by running:
```bash
npm run install-all
```

### 3. Environment Configuration
Instead of managing environment variables in separate folders, you only need to configure them in a single, centralized `.env` file at the root.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your details (e.g., your Supabase Credentials and desired Port):
   ```env
   PORT=5050
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

> [!NOTE]
> During the build process, the system automatically runs a synchronization script (`scripts/sync-env.js`) to propagate these credentials to `User/.env` and `Admin/.env`.

---

## 🛠️ Commands

| Command | Action | Description |
|:---|:---|:---|
| `npm run install-all` | Installation | Installs dependencies for Root, User, and Admin apps. |
| `npm run sync-env` | Configuration | Propagates root `.env` values to child folders. |
| `npm run build` | Compilation | Syncs environment files and builds production bundles for both apps. |
| `npm run dev` | Development | Launches both User and Admin dev servers concurrently. |
| `npm start` | Production | Starts the production-ready local server. |

---

## 🛡️ Production server Features

Our Express server (`server.js`) is configured with the following production-grade capabilities:

### 1. Security Headers (CSP)
Secured using **Helmet** with a tailor-made Content Security Policy (CSP). It protects against common web vulnerabilities (Clickjacking, XSS, MIME Sniffing) while allowing compatibility with:
* Dynamic Emotion / Material UI styling (`'unsafe-inline'`).
* Google Fonts integrations.
* Supabase API endpoints (`https://*.supabase.co`) and WebSockets (`wss://*.supabase.co`).
* YouTube embeds (`https://www.youtube.com`) for tasks.

### 2. Request Logging
Integrates **Morgan** logging. In production mode, it logs requests in Apache-style combined format for audit logging and diagnostics.

### 3. Rate Limiting
Configured using **express-rate-limit** to protect endpoints from abuse, limiting clients to 200 requests per minute. Static assets (JS, CSS, images) are automatically bypassed for high-performance loading.

### 4. Asset-Aware SPA Routing
Unlike basic Express routing that serves the default `index.html` for every missing URL (causing syntax errors in the browser when assets fail), this server detects file request extensions and returns clean `404 Not Found` responses for missing files.

### 5. Health Checks
Exposes a `/health` endpoint for external monitoring, returning uptime statistics and status indicators:
```json
{
  "status": "healthy",
  "uptime": 120.45,
  "timestamp": "2026-05-29T12:00:00.000Z"
}
```

### 6. Graceful Shutdown
Listens for termination signals (`SIGINT`, `SIGTERM`) to cleanly shut down the server, allowing ongoing requests to finish before closing the process.
