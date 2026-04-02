# Jute E-commerce (Frontend + Backend)

## Local development

Backend (Express + MongoDB):

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Frontend (Vite):

```bash
cd ..
npm install
npm run dev
```

The frontend uses relative `/api/...` calls and Vite proxies them to `http://localhost:5000` (see `vite.config.js`).

## Render deployment notes

- Backend service: set `MONGODB_URI` (and optionally `CORS_ORIGIN`).
- Frontend service: set `VITE_API_BASE_URL` to your backend URL (example: `https://ecom-group.onrender.com`).
