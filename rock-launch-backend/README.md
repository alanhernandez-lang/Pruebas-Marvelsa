# Rock Launch Backend

Backend API para registro de asistentes, votaciones por departamento, panel administrativo y envíos por WhatsApp.

## Stack
- Node.js (CommonJS)
- Express 5
- PostgreSQL (`pg`)
- Socket.IO (solo entorno servidor tradicional)
- Multer (carga de archivos)
- XLSX (importación masiva de personas)

## Estructura
- `index.js`: app Express, middlewares y rutas.
- `db.js`: adapter DB (usa Postgres cuando existe `DATABASE_URL`).
- `controllers/`: lógica por dominio.
- `routes/`: endpoints HTTP.
- `utils/upload.js`: configuración de `multer`.
- `vercel.json`: build y routing para Vercel.

## Requisitos
- Node.js 20+ (recomendado LTS)
- npm 10+
- PostgreSQL accesible por URL

## Variables de entorno
Copia `.env.example` a `.env` y completa valores:

```bash
cp .env.example .env
```

Variables mínimas:
- `DATABASE_URL`
- `PGSSLMODE`
- `ADMIN_API_KEY` (obligatoria para endpoints administrativos)

Variables recomendadas de seguridad:
- `CORS_ORIGINS` (lista separada por comas de dominios frontend permitidos)

Variables para WhatsApp:
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`
- `WHATSAPP_WABA_ID`
- `WHATSAPP_VERSION`

## Instalación local
```bash
npm install
npm run dev
```

Health check:
- `GET /api/ping`

## Endpoints principales
- Auth
  - `POST /api/auth/register`
  - `GET /api/auth/validate-token`
  - `POST /api/auth/reset-index`
- Departments
  - `GET /api/departments`
- Votes
  - `POST /api/votes`
- Admin
  - Requiere header `Authorization: Bearer <ADMIN_API_KEY>` o `X-API-Key: <ADMIN_API_KEY>`
  - `POST /api/admin/departments`
  - `PUT /api/admin/departments/:id`
  - `DELETE /api/admin/departments/:id`
  - `GET /api/admin/presenters`
  - `POST /api/admin/presenters`
  - `PUT /api/admin/presenters/:id`
  - `DELETE /api/admin/presenters/:id`
  - `GET /api/admin/people`
  - `POST /api/admin/people`
  - `PUT /api/admin/people/:type/:id`
  - `DELETE /api/admin/people/:type/:id`
  - `POST /api/admin/people/import`
  - `POST /api/admin/people/sync-tokens`
  - `GET /api/admin/stats`
  - `GET /api/admin/stats-history`
- WhatsApp
  - Requiere header `Authorization: Bearer <ADMIN_API_KEY>` o `X-API-Key: <ADMIN_API_KEY>`
  - `POST /api/whatsapp/send`
  - `POST /api/whatsapp/send-bulk`
  - `POST /api/whatsapp/upload-meta`
  - `GET /api/whatsapp/media-info`
  - `POST /api/whatsapp/upload-image`

## Preparación para GitHub
1. Inicializa repo (si aún no existe):
```bash
git init
```
2. Verifica que no se suban secretos ni binarios:
```bash
git status
```
3. Agrega y confirma:
```bash
git add .
git commit -m "chore: prepare backend for github and vercel"
```
4. Conecta remoto y publica:
```bash
git remote add origin <TU_REPO_URL>
git branch -M main
git push -u origin main
```

## Deploy en Vercel
### 1) Importar repo
- En Vercel: **Add New Project** -> selecciona repositorio de GitHub.

### 2) Configurar Environment Variables
Configura en Vercel (Project Settings -> Environment Variables):
- `DATABASE_URL`
- `PGSSLMODE`
- `ADMIN_API_KEY`
- `CORS_ORIGINS`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`
- `WHATSAPP_WABA_ID`
- `WHATSAPP_VERSION`

### 3) Deploy
- Ejecuta deploy desde Vercel UI (o con `vercel --prod`).

### 4) Verificación post-deploy
- `GET https://<tu-dominio>/api/ping` debe responder `{ "message": "pong" }`.
- Probar `GET /api/admin/people` y `GET /api/departments`.

## Notas importantes para producción en Vercel
- **Archivos locales (`uploads/`)**: no son persistentes en serverless. Recomendado mover a S3/Cloudinary/Vercel Blob.
- **Socket.IO**: conexiones persistentes no son ideales en Vercel Functions. Recomendado usar proveedor realtime externo (Pusher, Ably, Supabase Realtime).

## Seguridad recomendada (pendiente)
- Validar tamaño/tipo MIME en cargas de archivos.
- Añadir rate limiting y auditoría de acciones críticas.

## Seguridad implementada
- Protección por API key para rutas sensibles:
  - `/api/admin/*`
  - `/api/whatsapp/*`
- Rate limiting básico por IP para API general y rutas sensibles.
- Sanitización de logs para no imprimir secretos en request body.
- Headers base de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, etc.).

## Scripts útiles
- `npm start`: ejecuta backend
- `npm run dev`: backend con nodemon
