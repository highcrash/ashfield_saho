# Smart Home Estimator

A website your clients use to plan a smart home room by room and download a budget estimate as a PDF, with an **admin panel** for you.

- **Clients** build a budget on the website. It is saved automatically, both in their browser and on your server.
- **You** sign in at `/admin/` to:
  - see every budget and edit it
  - follow up with clients
  - manage products, prices, photos and categories
  - set your company name, logo and contact details, which appear on the website and on every PDF
- Plain HTML, CSS and JavaScript plus a small Node.js server. It needs no npm packages, and the database is a single SQLite file.

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
server/                     the Node.js server (no npm install needed)
storage/                    created on first start: app.db (database), uploads/, backups/   ← back this up
deploy/                     Docker, Docker Compose + Caddy (HTTPS), Nginx files
```

## 1. Run it on your computer

You need **Node.js 22.13 or newer** (https://nodejs.org). In a terminal, from this folder:

```
cd server
npm start
```

The first start copies the products and settings into the database.

The admin password is **`admin12345`** unless you set `ADMIN_PASSWORD` before the first start. Change it in Admin → Settings; the dashboard warns until you do.

Forgot the password? Run `npm run reset-password` in the `server` folder. It goes back to `admin12345`, or use `npm run reset-password -- "new-password"` to set a specific one.

Then open:
- http://localhost:3000 for the estimator
- http://localhost:3000/admin/ for the admin panel

## 2. Put it online (DigitalOcean)

Use a **Droplet**, not App Platform. App Platform wipes the disk on every deploy, which would delete the database and photos.

1. **Create a Droplet.** In DigitalOcean choose **Create → Droplets → Marketplace → Docker on Ubuntu**. The Basic plan with 1 GB RAM is enough. Add your SSH key.
2. **Point your domain.** At your DNS provider, add an `A` record (for example `estimate.yourcompany.com`) pointing to the Droplet's IP address.
3. **Copy this folder** to the Droplet. For example, from your computer:
   ```
   scp -r smart-home-estimator root@YOUR_DROPLET_IP:/opt/
   ```
4. **Configure and start** it on the Droplet:
   ```
   cd /opt/smart-home-estimator
   cp deploy/.env.example deploy/.env
   nano deploy/.env            # set DOMAIN and ADMIN_PASSWORD
   docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
   ```
   Caddy gets a free HTTPS certificate automatically. Open `https://estimate.yourcompany.com/admin/` and sign in.

**Update the code later:** copy the new files over (keep `deploy/.env`), then run the same `docker compose … up -d --build` command. Your data lives in a Docker volume, so it is not touched.

**Logs:**
```
docker compose -f deploy/docker-compose.yml logs -f app
```

### Backups

Your data is in the Docker volume `deploy_estimator-data`: the database plus uploaded photos and logo. There are three ways to back it up:
- **Quick:** in the admin panel, **Settings → Your data → Full backup (JSON)**. Download it now and then.
- **Automatic:** add a nightly database copy with `crontab -e` on the Droplet. It keeps the newest 14 copies inside the volume:
  ```
  0 3 * * * cd /opt/smart-home-estimator && docker compose -f deploy/docker-compose.yml exec -T app node --disable-warning=ExperimentalWarning server/backup.js
  ```
- **Whole server:** turn on **Droplet Backups** in DigitalOcean (a small monthly cost).

### Without Docker

Install Node 22 on the server and run `node --disable-warning=ExperimentalWarning server/server.js` with a process manager (systemd or pm2). Put Nginx or Caddy in front for HTTPS.

**Environment variables:**
- `PORT`: default 3000
- `STORAGE_DIR`: default `./storage`
- `ADMIN_PASSWORD`: used on the first start only
- `SESSION_SECRET`: optional
- `TRUST_PROXY=1`: set this when the app runs behind a proxy

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

On Docker:
```
docker compose -f deploy/docker-compose.yml exec app node --disable-warning=ExperimentalWarning server/seed.js --new-only
```
Rebuild the image first so the new `products.js` is inside it.

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
