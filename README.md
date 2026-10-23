<p align="center">
  <h1 align="center">DineView</h1>
  <p align="center">QR-Based Restaurant Ordering Web App with AR Menu Viewing</p>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?logo=node.js" alt="Node.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/pnpm-9.15.0-F69220?logo=pnpm" alt="pnpm" /></a>
  <a href="#"><img src="https://img.shields.io/badge/turborepo-2.3-EF4444?logo=turborepo" alt="Turborepo" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js" alt="Next.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Express-4.x-000000?logo=express" alt="Express" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" /></a>
  <a href="#"><img src="https://img.shields.io/badge/WebXR-AR-ff69b4?logo=webxr" alt="WebXR" /></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

---

**DineView** is a full-stack, multi-tenant SaaS platform that transforms the restaurant dining experience. Customers scan a QR code at their table to browse the menu, preview dishes in augmented reality, and place orders -- all from their phone. Kitchen staff see orders in real time on a dedicated Kitchen Display System, while restaurant owners manage everything through a comprehensive admin panel.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Giving a Demo](#giving-a-demo)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [AR Integration](#ar-integration)
- [WebSocket Events](#websocket-events)
- [Environment Variables](#environment-variables)
- [Seed Data](#seed-data)
- [License](#license)

---

## Overview

DineView replaces paper menus and manual order-taking with a seamless digital workflow:

1. **Scan** -- A customer scans the QR code on their table.
2. **Browse** -- The full restaurant menu loads instantly (Redis-cached, 5-min TTL), complete with photos, allergen info, and nutrition details.
3. **Preview in AR** -- Customers place a real-size 3D model of the dish on their table (WebXR on Android, AR Quick Look on iPhone). Other devices get an interactive 3D viewer.
4. **Order** -- Items are added to a cart and submitted in a single tap.
5. **Track** -- Real-time order status updates are pushed over WebSocket (Placed -> Accepted -> Preparing -> Ready -> Served -> Paid).
6. **Manage** -- Restaurant staff use the admin panel for menu management, order tracking (kanban board), analytics, and more.

---

## Features

### Customer-Facing
- QR code scan-to-order flow (no app install required)
- Mobile-first responsive menu with category navigation
- Dish detail pages with photos, allergens, and nutrition info
- AR dish preview on iPhone (Quick Look) and Android (WebXR / Scene Viewer), 3D viewer on desktop
- Cart management and one-tap order placement
- Real-time order status tracking via WebSocket

### Kitchen & Staff
- Kitchen Display System (KDS) with real-time order queue
- Order status management (Placed -> Accepted -> Preparing -> Ready -> Served)
- Waiter notification system via WebSocket rooms
- Role-based access control (5 roles with granular permissions)

### Admin Panel
- Dashboard with key metrics and revenue analytics
- Menu CRUD: categories, dishes, pricing, photos, 3D assets
- Order management with kanban board view
- Table and QR code management (generate, regenerate, download)
- Staff management (invite, assign roles)
- Restaurant settings and configuration
- Analytics: revenue trends, top dishes, order statistics

### Platform
- Multi-tenant SaaS architecture with tenant isolation
- 14 EU allergen tracking (Regulation 1169/2011)
- Subscription tiers: Free, Starter, Professional, Enterprise
- Rate limiting on auth and QR scan endpoints
- Redis-cached public menu (5-minute TTL)
- Photo and 3D model uploads stored on disk

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm 9 workspaces + Turborepo 2 |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **State Management** | Redux Toolkit + RTK Query |
| **Styling** | Tailwind CSS 3, Lucide Icons, clsx + tailwind-merge |
| **AR / 3D** | Google `<model-viewer>` (AR Quick Look, Scene Viewer, WebXR) |
| **Backend** | Express 4, TypeScript, Pino logger |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL 16 (Alpine) |
| **Cache** | Redis 7 (Alpine) |
| **File Storage** | Local disk (`UPLOAD_DIR`), served via the API |
| **Real-time** | Socket.IO 4 (typed server/client events) |
| **Validation** | Zod (shared between frontend and backend) |
| **Auth** | JWT (access + refresh tokens) + session tokens for customers |
| **Infrastructure** | Docker Compose |

---

## Architecture

```
                         +-----------+
                         |  Browser  |
                         +-----+-----+
                               |
                    +----------+----------+
                    |                     |
              +-----+------+     +-------+--------+
              | Next.js 15 |     | Socket.IO WS   |
              | (port 3000)|     | (port 4000/ws)  |
              +-----+------+     +-------+--------+
                    |                     |
                    +----------+----------+
                               |
                         +-----+-----+
                         | Express   |
                         | API :4000 |
                         +-----+-----+
                               |
              +----------------+----------------+
              |                |                |
        +-----+-----+   +-----+-----+   +-----+-----+
        | PostgreSQL |   |   Redis   |   |  Uploads  |
        |   :5433    |   |   :6379   |   |  (disk)   |
        +-----+-----+   +-----------+   +-----------+
              |
        +-----+-----+
        |  Prisma   |
        |   ORM     |
        +-----------+
```

### Request Flow

**Customer ordering:**
```
QR Scan -> GET /api/scan/:token -> Session token issued
        -> GET /api/menu (Redis cache) -> Browse menu
        -> POST /api/orders -> Order created -> WebSocket broadcast to kitchen
        -> Kitchen updates status -> WebSocket broadcast to customer table
```

**Admin operations:**
```
POST /api/auth/login -> JWT issued (access + refresh)
     -> All /api/admin/* routes require JWT + tenant context + RBAC permission check
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 |
| pnpm | 9.15.0 |
| Docker & Docker Compose | Latest stable |

### Installation

```bash
# 1. Install dependencies (also generates the Prisma client)
pnpm install

# 2. Start PostgreSQL and Redis (auto-restart is disabled)
docker compose -f docker/docker-compose.yml up -d

# 3. Environment
cp apps/api/.env.example apps/api/.env      # defaults work with the compose file

# 4. Create the schema and load the demo restaurant (menu, 3D models, tables)
pnpm --filter @dineview/api db:setup

# 5. Start everything (builds packages/shared first)
pnpm dev
```

> PostgreSQL is mapped to host port **5433** to avoid clashing with a local install on 5432.
> Dish photos and 3D models uploaded from the admin panel are stored on disk in `apps/api/uploads`
> (the old MinIO service was removed: its Docker image is no longer published).

| Service | URL |
|---|---|
| **Web app** (guest + admin) | http://localhost:3000 |
| **API server** | http://localhost:4000 |
| **Prisma Studio** | `pnpm db:studio` → http://localhost:5555 |

The browser only ever talks to the web origin: Next.js proxies `/api`, `/uploads` and `/socket.io`
to the API, so the same build works on localhost, on a phone over HTTPS, or behind a tunnel.

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm --filter @dineview/api db:setup` | Apply migrations and seed the demo restaurant |
| `pnpm --filter @dineview/api demo:reset` | Clear all orders/sessions and regenerate 30 days of sample history |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm clean` | Remove all build artifacts and node_modules |

---

## Giving a Demo

AR needs HTTPS on the phone. The quickest way to get a real HTTPS link is a Cloudflare quick tunnel
(`brew install cloudflared`):

```bash
pnpm --filter @dineview/api demo:reset            # fresh kitchen, free tables, sample analytics
pnpm --filter @dineview/web build
pnpm --filter @dineview/api dev                   # API on :4000
cd apps/web && npx next start -p 3000             # web on :3000
cloudflared tunnel --url http://localhost:3000    # prints https://<random>.trycloudflare.com
```

Open the printed URL **on your laptop** (so QR codes encode the public URL, not localhost), then:

1. **Landing page** shows a QR code. Guests scan it with their phone camera and land on the demo table.
2. **Menu** → dishes with an **AR** badge (bakery, fruit bowl, tea set, lemonade) open a live 3D view.
   Tap **View on your table**: iPhone opens AR Quick Look, Android opens WebXR / Scene Viewer, and the dish
   appears at real size on the table.
3. **Order** from the phone. On the laptop, sign in with the **Owner** or **Kitchen** demo button and
   open **Kitchen display**: the ticket appears instantly with a chime. Bump it to Accepted → Cooking → Ready
   and the guest's phone updates live.
4. **Service** tab → *Call a waiter* pops up on the staff screen; *On my way* notifies the guest.
5. **Tables & QR** → print table codes, or *Close table & settle* to end the session.
6. **Menu** (admin) → edit a dish to show how a restaurant uploads a photo and a `.glb` model.

The quick-tunnel URL changes every time `cloudflared` restarts, and the demo logins are shown on the
login page, so treat the link as public while it's running. Stop the tunnel when you're done.

## Project Structure

```
dineview/
├── apps/
│   ├── api/                          # Express.js backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema (13 models, 7 enums)
│   │   │   └── seed.ts               # Seed data script
│   │   └── src/
│   │       ├── config/               # Database, Redis, S3, logger config
│   │       ├── middleware/            # Auth, RBAC, tenant, validation, rate limiting
│   │       ├── modules/              # Feature modules (13 total)
│   │       │   ├── analytics/        # Dashboard stats, revenue, top dishes
│   │       │   ├── asset/            # S3 presigned uploads, AR asset management
│   │       │   ├── auth/             # JWT login, refresh, logout, me
│   │       │   ├── category/         # Menu category CRUD + reorder
│   │       │   ├── dish/             # Dish CRUD + availability toggle
│   │       │   ├── health/           # Health check (DB + Redis)
│   │       │   ├── menu/             # Public menu (Redis-cached)
│   │       │   ├── order/            # Customer + admin order management
│   │       │   ├── qr/               # QR code generation + regeneration
│   │       │   ├── restaurant/       # Restaurant settings
│   │       │   ├── session/          # QR scan -> session token
│   │       │   ├── staff/            # Staff CRUD
│   │       │   └── table/            # Table CRUD
│   │       ├── routes/               # Route aggregation
│   │       ├── utils/                # Shared utilities
│   │       ├── websocket/            # Socket.IO setup + handlers
│   │       │   └── handlers/         # Order, notification, session handlers
│   │       ├── app.ts                # Express app setup
│   │       └── server.ts             # HTTP + WebSocket server entry
│   │
│   └── web/                          # Next.js 15 frontend
│       └── src/app/
│           ├── (admin)/admin/        # Admin panel routes
│           │   ├── analytics/        # Revenue charts, top dishes
│           │   ├── categories/       # Category management
│           │   ├── dashboard/        # Overview dashboard
│           │   ├── kitchen/          # Kitchen Display System (KDS)
│           │   ├── login/            # Admin login
│           │   ├── menu/             # Dish management (list, create, edit)
│           │   ├── orders/           # Order kanban board
│           │   ├── settings/         # Restaurant settings
│           │   ├── staff/            # Staff management
│           │   └── tables/           # Table + QR management
│           └── (customer)/           # Customer-facing routes
│               ├── actions/          # Post-order actions
│               ├── cart/             # Shopping cart
│               ├── dish/[id]/        # Dish detail
│               │   └── ar/           # AR / 3D dish preview
│               ├── menu/             # Menu browsing
│               ├── orders/           # Order tracking
│               └── scan/[token]/     # QR code landing
│
├── packages/
│   └── shared/                       # Shared package (@dineview/shared)
│       └── src/
│           ├── constants/            # Roles, allergens, order states, permissions
│           ├── types/                # TypeScript interfaces and types
│           ├── utils/                # Shared utility functions
│           └── validators/           # Zod schemas (auth, menu, order, table, etc.)
│
├── docker/
│   └── docker-compose.yml            # PostgreSQL 16, Redis 7
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace definition
├── tsconfig.base.json                # Shared TypeScript config
└── package.json                      # Root scripts and dev dependencies
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Public / Customer

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check (DB + Redis status) | None |
| `GET` | `/scan/:qrToken` | Scan QR code, get session token | Rate limited |
| `GET` | `/menu` | Get full menu (Redis-cached) | Optional session |
| `GET` | `/menu/categories/:slug` | Get category by slug | Optional session |
| `GET` | `/menu/dishes/:dishId` | Get dish detail | Optional session |
| `POST` | `/orders` | Place an order | Session |
| `GET` | `/orders/my` | Get orders for current session | Session |

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Login with email/password | Rate limited |
| `POST` | `/auth/refresh` | Refresh access token | Refresh token |
| `POST` | `/auth/logout` | Logout (revoke tokens) | JWT |
| `GET` | `/auth/me` | Get current user profile | JWT |

### Admin -- Tables & QR

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/tables` | List all tables | `table:read` |
| `POST` | `/admin/tables` | Create a table | `table:write` |
| `GET` | `/admin/tables/:id` | Get table by ID | `table:read` |
| `PATCH` | `/admin/tables/:id` | Update table | `table:write` |
| `DELETE` | `/admin/tables/:id` | Delete table | `table:write` |
| `POST` | `/admin/qr/tables/:tableId/generate` | Generate QR code | `qr:write` |
| `GET` | `/admin/qr/tables/:tableId` | Get QR code for table | `qr:read` |
| `POST` | `/admin/qr/tables/:tableId/regenerate` | Regenerate QR code | `qr:write` |

### Admin -- Menu Management

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/categories` | List all categories | `category:read` |
| `POST` | `/admin/categories` | Create category | `category:write` |
| `PATCH` | `/admin/categories/reorder` | Reorder categories | `category:write` |
| `GET` | `/admin/categories/:id` | Get category by ID | `category:read` |
| `PATCH` | `/admin/categories/:id` | Update category | `category:write` |
| `DELETE` | `/admin/categories/:id` | Delete category | `category:write` |
| `GET` | `/admin/dishes` | List all dishes | `dish:read` |
| `POST` | `/admin/dishes` | Create dish | `dish:write` |
| `GET` | `/admin/dishes/:id` | Get dish by ID | `dish:read` |
| `PATCH` | `/admin/dishes/:id` | Update dish | `dish:write` |
| `DELETE` | `/admin/dishes/:id` | Delete dish | `dish:write` |
| `PATCH` | `/admin/dishes/:id/availability` | Toggle dish availability | `dish:toggle_availability` |

### Admin -- Orders

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/orders` | List all orders | `order:read` (via `/orders/admin`) |
| `GET` | `/admin/orders/:orderId` | Get order detail | `order:read` |
| `PATCH` | `/admin/orders/:orderId/status` | Update order status | `order:update_status` |

### Admin -- Assets, Analytics, Restaurant, Staff

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `POST` | `/admin/assets/upload` | Get presigned upload URL | `asset:write` |
| `PUT` | `/admin/assets/:id` | Update AR asset metadata | `asset:write` |
| `POST` | `/admin/assets/:id/link/:dishId` | Link asset to dish | `asset:write` |
| `GET` | `/admin/assets/:id` | Get asset by ID | `asset:read` |
| `GET` | `/admin/analytics/dashboard` | Dashboard metrics | `analytics:read` |
| `GET` | `/admin/analytics/revenue` | Revenue analytics | `analytics:read` |
| `GET` | `/admin/analytics/top-dishes` | Top-selling dishes | `analytics:read` |
| `GET` | `/admin/restaurant` | Get restaurant settings | `restaurant:read` |
| `PATCH` | `/admin/restaurant` | Update restaurant settings | `restaurant:write` |
| `GET` | `/admin/staff` | List all staff | `staff:read` |
| `POST` | `/admin/staff` | Create staff member | `staff:write` |
| `GET` | `/admin/staff/:id` | Get staff member | `staff:read` |
| `DELETE` | `/admin/staff/:id` | Remove staff member | `staff:write` |

---

## AR Integration

Dish previews use Google's [`<model-viewer>`](https://modelviewer.dev) for the 3D view
(`apps/web/src/components/ar/model-viewer-ar.tsx`). "View on your table" then opens:

| Device | What happens |
|---|---|
| Android (Chrome + ARCore) | DineView's own WebXR session (`webxr-ar.ts`): aim at the table, tap to place, and an anchor keeps the dish pinned there. Falls back to Google Scene Viewer if WebXR can't start |
| iPhone / iPad (Safari, Chrome) | AR Quick Look with the dish's USDZ (`ArAsset.iosFileUrl`) |
| In-app browsers (Instagram, WhatsApp…) | 3D only, with a hint to open the page in Safari/Chrome |
| Desktop | Interactive 3D only, plus a QR code that opens the same dish on a phone |

We don't use model-viewer's built-in WebXR mode: it drops the model ~1 m away, snaps it to the first
plane it finds (often the floor) and doesn't anchor it, so dishes drift away.

Models are authored at **real-world scale in meters** and shown at fixed scale, so a croissant looks
croissant-sized on the table. The first AR launch on a device shows a short tips sheet.

### Models

- Demo models live in `apps/web/public/models/dishes/` as `.glb` plus a pre-converted `.usdz` for iOS
  (photoreal CC0 scans from Poly Haven, see `CREDITS.md` there); the seed links both.
- Restaurants upload their own `.glb` (≤ 50 MB) and photos from **Admin → Menu → Edit dish**. The editor also
  converts the model to USDZ in the browser and uploads both (`POST /api/v1/admin/uploads`), then links them
  with `PUT /api/v1/admin/dishes/:id/model`.
- Without a USDZ, Safari still converts on the fly but Chrome on iPhone can't show AR.
- For best results: real-world scale, JPEG/PNG textures ≤ 1024 px, no Draco/KTX2 (keeps iOS Quick Look happy),
  a few MB per model. USDZ must be served as `model/vnd.usdz+zip` (both the web app and API do this).

## WebSocket Events

DineView uses typed Socket.IO events for real-time communication. Clients join specific rooms based on their role:

| Room | Format | Audience |
|---|---|---|
| Restaurant | `restaurant:{restaurantId}` | All staff |
| Table | `restaurant:{restaurantId}:table:{tableId}` | Customers at a table |
| Kitchen | `restaurant:{restaurantId}:kitchen` | Kitchen staff (KDS) |
| Waiters | `restaurant:{restaurantId}:waiters` | Waiters |

### Key Events

| Event | Direction | Description |
|---|---|---|
| `join:restaurant` | Client -> Server | Join restaurant-wide updates |
| `join:table` | Client -> Server | Join table-specific updates |
| `join:kitchen` | Client -> Server | Join kitchen order feed |
| `join:waiters` | Client -> Server | Join waiter notifications |
| `order:new` | Server -> Client | New order placed |
| `order:statusUpdate` | Server -> Client | Order status changed |

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dineview:dineview_dev@localhost:5433/dineview` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_SESSION_SECRET` | Token signing secrets | (required) |
| `PORT` | API server port | `4000` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `WEB_URL` | Public web URL used in API-generated QR links | first `CORS_ORIGIN` |
| `DEMO_RESTAURANT_SLUG` | Enables `/scan/demo` for this restaurant | unset |
| `UPLOAD_DIR` | Where uploaded photos/models are stored | `./uploads` |

### Web (`apps/web/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL; leave blank to use the same-origin proxy | blank |
| `NEXT_PUBLIC_ENABLE_DEMO` | Show demo shortcuts (landing QR, demo logins, phone hand-off) | unset |
| `NEXT_PUBLIC_APP_URL` | Public URL to encode in QR codes (defaults to the current origin) | current origin |
| `API_ORIGIN` | Where Next.js proxies `/api`, `/uploads`, `/socket.io` | `http://127.0.0.1:4000` |

## Seed Data

`db:setup` (or `npx prisma db seed`) creates the **Bella Vista** demo restaurant: 5 staff users, 5 categories,
17 dishes (6 with AR models and photos) and 6 tables with QR codes. Re-running it refreshes the menu
without duplicating QR codes.

### Test Credentials

All demo users share the password `password123`:

| Role | Email |
|---|---|
| Owner | `owner@bellavista.com` |
| Manager | `manager@bellavista.com` |
| Kitchen Staff | `kitchen@bellavista.com` |
| Waiter | `waiter@bellavista.com` |

## Role-Based Access Control

DineView implements a hierarchical RBAC system with five roles:

| Role | Level | Capabilities |
|---|---|---|
| `SUPER_ADMIN` | 100 | Platform-wide access, manage all tenants |
| `OWNER` | 80 | Full restaurant management, staff management |
| `MANAGER` | 60 | Menu, orders, tables, analytics |
| `KITCHEN_STAFF` | 40 | View orders, update order status (KDS) |
| `WAITER` | 20 | View orders, mark as served |

Permissions are enforced at the middleware level using `requirePermission()` guards on every admin route.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with Express.js, Next.js, Prisma, and Three.js
</p>
