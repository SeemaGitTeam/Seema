# Seema · سيمة — Website

Static bilingual (English / Arabic) website for Seema. No build step required.

## Deploy on GitHub Pages
1. Create a new repository on GitHub (e.g. `seema-website`).
2. Upload the **contents** of this folder to the repo root (so `index.html` sits at the top level), or push via git:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-user>/seema-website.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. The site goes live at `https://<your-user>.github.io/seema-website/` within a minute or two.

## Custom domain (seema.qa)
1. Settings → Pages → **Custom domain** → enter `seema.qa` (GitHub creates a `CNAME` file).
2. At your DNS provider add A records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, and a CNAME for `www` → `<your-user>.github.io`.
3. Tick **Enforce HTTPS** once the certificate is issued.

## Structure
- `index.html` / `home.html` — English homepage
- `ar/` — Arabic pages (`ar/index.html` = Arabic homepage)
- `assets/` — CSS, JS, brand marks, icons, favicons, images
- `.nojekyll` — tells GitHub Pages to serve files as-is
