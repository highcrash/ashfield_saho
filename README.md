# Smart Home Estimator

A website your clients use to plan a smart home room by room and download a budget estimate as a PDF, with an **admin panel** for you.

- **Clients** build a budget on the website. It is saved automatically, both in their browser and on your server.
- **You** sign in at `/admin/` to:
  - see every budget and edit it
  - follow up with clients
  - manage products, prices, photos and categories
  - set your company name, logo and contact details, which appear on the website and on every PDF
- Plain HTML, CSS and JavaScript plus a small Node.js server.
- **Live:** public site at https://saho.ashfieldtech.com, admin panel at https://sadmin.ashfieldtech.com, on DigitalOcean App Platform with a managed PostgreSQL database and Spaces for photos.
- **On your computer:** it uses a single SQLite file and a local folder instead, so you need nothing else installed.

## What's in the folder

```
index.html                  the estimator (public website)
admin/                      the admin panel (/admin/)
assets/js/app.js            estimator logic
assets/js/estimate-core.js  pricing (shared by the website, admin panel and server)
assets/js/pdf.js            PDF estimate (shared by the website and admin panel)
assets/css/app.css          styles
assets/fonts/, assets/vendor/   fonts and the PDF library (jsPDF 2.5.1 + AutoTable 3.8.2)
data/products.js            starting product list; copied into the database on first start
assets/js/config.js         starting site settings; copied into the database on first start
images/products/            product photos that came with the catalog
server/                     the Node.js server
storage/                    local use only: app.db (SQLite), uploads/, backups/
Dockerfile                  the server image (App Platform and Docker)
.do/app.yaml                DigitalOcean App Platform spec (domains, database, environment variables)
deploy/                     Docker Compose + Caddy for a Droplet instead, Nginx file for static-only mode
```

## 1. Run it on your computer

You need **Node.js 22.13 or newer** (https://nodejs.org). In a terminal, from this folder:

```
cd server
npm install
npm start
```

The first start copies the products and settings into the database.

The admin password is **`admin12345`** unless you set `ADMIN_PASSWORD` before the first start. Change it in Admin → Settings; the dashboard warns until you do.

Forgot the password? Run `npm run reset-password` in the `server` folder. It goes back to `admin12345`, or use `npm run reset-password -- "new-password"` to set a specific one.

Then open:
- http://localhost:3000 for the estimator
- http://localhost:3000/admin/ for the admin panel

## 2. Online: DigitalOcean App Platform

| Part | What it is |
|---|---|
| App | App Platform app `ashfield-saho`, built from this GitHub repo (`highcrash/ashfield_saho`, branch `main`) using the `Dockerfile` |
| Public site | `saho.ashfieldtech.com`: the estimator only (`/admin` and the admin API return 404 there) |
| Admin panel | `sadmin.ashfieldtech.com`: opens the admin panel. "Edit in estimator" also runs here, using your admin session |
| Database | Managed PostgreSQL cluster `db-postgresql-sgp1-26078`, database `ashfield_saho`. Tables are created on first start |
| Files | Space `ashfiledsaho` (sgp1), folder `estimator/uploads/…`. The Space stays private; the site serves the photos itself |

The whole setup is in `.do/app.yaml`. **Every push to `main` deploys automatically.**

### First-time setup (control panel)

1. **Spaces key.** Go to **API → Spaces Keys → Generate New Key**. Copy the key and the secret; the secret is shown once.
2. **Create the app.** Go to **Create → Apps → GitHub**, authorise access to `highcrash/ashfield_saho`, pick branch `main` and keep "Autodeploy" on. App Platform detects the Dockerfile. Choose the Singapore region and click through to **Create Resources**. The first build may fail because settings are missing; that is fine.
3. **Load the spec.** Open the app's **Settings → App Spec → Edit**. Replace everything with the contents of `.do/app.yaml` and **Save**. This adds:
   - both domains (DNS records are created automatically, because ashfieldtech.com uses DigitalOcean nameservers)
   - the database connection
   - the environment variables
4. **Secrets.** Open **Settings → web → Environment Variables → Edit**:
   - Set `SPACES_KEY` and `SPACES_SECRET` to the values from step 1. Tick **Encrypt** on both.
   - Click **Add** and create `ADMIN_PASSWORD` with your admin password. Tick **Encrypt**.
   - Save. The app redeploys.
5. **Check.** Under **Settings → Domains**, both domains should become *Active* (certificates take a few minutes). Then:
   - https://saho.ashfieldtech.com/api/health shows `{"ok":true,"db":"pg","files":"spaces"}`
   - https://sadmin.ashfieldtech.com takes you to the admin sign-in
6. **Lock down the database.** Under **Databases → db-postgresql-sgp1-26078 → Settings → Trusted Sources**, keep only the `ashfield-saho` app. Then **reset the `doadmin` password** (Users & Databases). The app picks up the new password automatically.

**Logs and redeploy:** use the app's **Runtime Logs** tab, or **Actions → Force Rebuild and Deploy**.

**Backups:**
- DigitalOcean backs up the managed database daily and keeps 7 days; you can restore to any point in that window.
- Files in the Space are kept until deleted.
- For your own copy, use **Admin → Settings → Your data → Full backup (JSON)**.

### Environment variables

| Variable | Meaning |
|---|---|
| `DATABASE_URL`, `DATABASE_CA_CERT` | PostgreSQL connection and its certificate. App Platform fills both in from the attached database. Without `DATABASE_URL`, SQLite in `storage/` is used |
| `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_REGION`, `SPACES_PREFIX` | File storage in Spaces. Without them, files go to `storage/uploads/` |
| `PUBLIC_HOST`, `ADMIN_HOST` | The two domains. Without `ADMIN_HOST`, everything is served on one address (local use) |
| `ADMIN_PASSWORD` | First start only. Default `admin12345` |
| `SESSION_SECRET` | Optional. Generated and stored in the database if not set |
| `TRUST_PROXY=1` | Use the visitor IP from the proxy for rate limits |
| `PORT` | Default 3000 |

To test the Spaces key from your computer:
```
cd server
$env:SPACES_KEY="…"; $env:SPACES_SECRET="…"; $env:SPACES_BUCKET="ashfiledsaho"; npm run check-spaces
```

### Alternative: a Droplet with Docker

`deploy/docker-compose.yml` runs the same image with Caddy for HTTPS on a single server, using SQLite and a Docker volume unless you add the variables above:
```
cp deploy/.env.example deploy/.env      # set DOMAIN, ADMIN_PASSWORD
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

## 3. Using the admin panel

| Page | What you do there |
|---|---|
| **Dashboard** | New budgets this week, pipeline value by status, latest activity |
| **Budgets** | Every budget clients started, newest first. Filter by status, search, export CSV. Open one to see all its lines, call or WhatsApp the client, set a status (New → Contacted → Quoted → Won / Lost), keep internal notes, download the PDF, or **Edit in estimator** to change rooms, products, quantities and unit prices |
| **Clients** | Saved automatically when a client enters a name and a phone, WhatsApp or email. The same phone number or email always maps to the same client, and `+880 1711-223344` and `01711223344` count as one number. Edit details, add notes, add clients yourself, export CSV |
| **Products** | Edit name, description, highlights, code (kept as text), model, power, category, type label, unit (piece or length/rolls), retail price in BDT, options (for example finish or gangs) with a price per combination, photo, suggested rooms, and whether the product shows on the website. **Duplicate** copies a product. **Archive** hides it from the website without breaking budgets that already contain it |
| **Categories** | Add, rename, reorder and hide the product tabs, and rename how product types are shown to clients |
| **Settings** | Website name, company name, tagline, phone, WhatsApp, email, website, address, logo, PDF notes, footer and validity, example project, admin password, backups |

**How prices work**
- Each line in a budget keeps the price it had when the client added it. Changing a product price does not change budgets already made.
- When a budget has lines whose list price has changed, its page says so. **Update prices** moves the budget to today's prices.
- A unit price you type yourself (in **Edit in estimator**) is marked as a manual price. **Update prices** leaves it as it is.
- The product form has a **retail price calculator**: ((Distributor USD × 127) + (net kg × 700)) × 1.5. It only fills the price field; the USD price is never saved or shown to clients.

**What clients see**
- In Step 1, a note tells clients that their estimate is saved with your company as they work.
- They can still save and open a project file, and download the PDF.
- If a client deletes a budget, it disappears from their browser. You still see it, marked **Deleted by client**.
- If you change a client's budget, they see your version the next time they open the website.

## 4. Product data and the Python build

After the first start, **the database is the master copy** of products and settings. `data/products.js` and `assets/js/config.js` are only used:
- to fill an empty database on first start
- as a fallback when the site is opened without the server (see section 5)

When the Python build (`build/build_webapp_catalog.py`) adds new products to `products.js`, load them with:
```
cd server
npm run import-catalog
```
This only **adds** products and categories whose ids are not in the database yet. It never changes products you edited in the admin panel.

On App Platform: commit and push the new `products.js`. Once it has deployed, open the app's **Console** tab and run:
```
node server/seed.js --new-only
```

**Product ids are permanent:** saved budgets refer to them. The admin panel never changes an id. New products get ids such as `x-ceiling-speaker-3f2a`.

## 5. Static-only mode (no server)

The estimator still works on any static host (cPanel, `python -m http.server`), using `data/products.js` and `assets/js/config.js`. In that mode:
- budgets stay in the client's browser only
- there is no admin panel
- the browser console shows a harmless 404 for `api/public/bootstrap.js`

## Notes

- **Security**
  - The admin password is stored hashed (scrypt).
  - Sessions use a signed, HttpOnly, SameSite=Strict cookie, valid for 7 days. Changing the password signs out every device.
  - Logins and public saves are rate-limited.
  - The server only serves the website folders. `server/` and `storage/` are never reachable from the web.
- **Privacy:** budgets are linked to a random token saved in each client's browser. Nobody else can read or overwrite them.
- **PDF:** generated in the browser. Product photos and the logo are embedded.
- **Browsers:** current Chrome, Edge, Firefox and Safari, desktop and mobile.
