# Jute E-commerce Backend

This folder contains a minimal Express + MongoDB backend used by the Jute E-commerce frontend.

Quick start

1. Copy `.env.example` to `.env` and set `MONGODB_URI`.
	- Optional: set `CORS_ORIGIN` (comma-separated) for your frontend URLs.
	- Optional (recommended for localhost + Render): configure Cloudinary so uploaded images become permanent URLs.
	  - Set `CLOUDINARY_URL` OR (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
	  - Optional: set `CLOUDINARY_FOLDER`.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. (Optional) Seed the database with sample data:

```bash
npm run seed
```

APIs

- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

- GET /api/blogs
- GET /api/blogs/:id
- POST /api/blogs
- PUT /api/blogs/:id
- DELETE /api/blogs/:id

- GET /api/users
- POST /api/users

- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
