# ShoeStore / StyleHub — MERN Migration

This is a full migration of the original **Blazor Server (.NET 8)** application
(`ShoeStoreManagement`) to the **MERN stack** (MongoDB, Express, React, Node.js).
It preserves the original dual-vertical design: a **Shoes** store and a **Clothing**
store, each with its own POS, inventory, sales history, reports, and staff module.

## What changed, and why

The only architectural change is **authentication**: the original app used a
Blazor Server singleton (`AuthService`) holding `CurrentUser` in memory, tied to
the SignalR circuit. A REST API has no persistent circuit, so this was replaced
with **stateless JWT auth** (`Authorization: Bearer <token>`), which is the
standard equivalent for this kind of app. Every other feature — pages,
components, business rules, calculations, validations, CRUD flows — was ported
as-is.

Everything else (UI layout, Tailwind styling, `app.css`, page structure,
business logic in every service, the salary-report math, invoice numbering,
stock deduction, seed data) is a direct, feature-for-feature port.

## Project layout

```
server/                  Express + MongoDB/Mongoose API
  models/                 Mongoose schemas (Shop, User, Supplier, Shoes/*, Clothes/*)
  services/                Business logic — direct ports of the C# services
  controllers/              Thin HTTP handlers
  routes/                    REST endpoints under /api/*
  middleware/auth.js          JWT auth (replaces the Blazor AuthService)
  seed.js                     Seeds the same demo data as ApplicationDbContext.SeedData()
  server.js                   Entry point

client/                  React (Vite) frontend
  src/pages/shoes/*        Shoe store pages (Dashboard, POS, Products, Inventory, Sales, Reports)
  src/pages/clothes/*        Clothing store pages (same set + Staff/Payroll)
  src/layouts/                 Sidebar + header shells for each vertical
  src/context/                  AuthContext, ShoeCartContext, ClothingCartContext
  src/services/                  Axios API clients
  public/app.css, app.js            Copied verbatim from the original wwwroot for visual parity
```

## Running it locally

You'll need Node.js 18+ and a MongoDB instance (local or Atlas).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm run seed               # loads the same demo data as the original app
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

### 3. Log in

Same demo accounts as the original seed data:

- Shoe shop: `admin@stepup.pk` / `Admin@123`
- Clothing shop: `admin@stylehub.pk` / `Admin@123`

## Notes

- All monetary values, invoice numbering (`INV-YYYY-####`, `CL-YYYYMMDD-####`),
  stock deduction on sale, refund/stock-restore, and the salary report formulas
  (per-day rate, deductions, bonus, net payable) are ported 1:1 from the C#
  services.
- Sale line items are embedded as subdocuments (they were always loaded
  together via EF `Include()` in the original); Suppliers/Orders remain
  separate collections since they were queried independently.
- `server/.env.example` documents the two environment variables the backend
  needs (`MONGO_URI`, `JWT_SECRET`).
