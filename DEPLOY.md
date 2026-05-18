# Deploy IQ Tester (FALAS) - Vercel + Render + Neon

Ky udhezues te con nga repo lokal te nje URL publike `https://emri.vercel.app` pa paguar asgje.

**Koha e nevojshme**: ~30 minuta hera e pare.

**Para se te fillosh:**
- Kodi duhet te jete ne GitHub (`git push -u origin main`)
- Llogari GitHub te paktеn

---

## 🗄️ HAPI 1: Neon (PostgreSQL)

### 1.1 Krijo llogari & projekt

1. Hap [neon.tech](https://neon.tech) → **Sign up** me GitHub
2. Krijo **New Project** me:
   - Name: `iq-tester`
   - Postgres version: 16 (default)
   - Region: zgjedh me te afertin (Frankfurt p.sh.)
3. Pasi krijohet, do shohesh **Connection string** ne forme:
   ```
   postgresql://emri_perdoruesit:fjalekalimi@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   **Kopjoje** dhe ruaje (do na duhet).

### 1.2 Ekzekuto schema + seed nga lokal

Ne folderin `server/`, krijo nje file `.env.deploy` (jo te commitohet):

```
DATABASE_URL=postgresql://emri:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

Pastaj nga terminal:

```powershell
cd C:\Users\Admin\detyrakursiAplikimet\server
$env:DATABASE_URL = "postgresql://emri:pass@ep-xxx.neon.tech/neondb?sslmode=require"
node src/db/setup.js
node src/db/seed.js
```

Verifiko ne Neon dashboard → **Tables** → duhet te shohesh `users`, `questions`, etj.

---

## 🚀 HAPI 2: Render (Backend Node + Express)

### 2.1 Krijo llogari

1. Hap [render.com](https://render.com) → **Get Started** me GitHub
2. Autorizo Render te aksesoje repo-n tend

### 2.2 Krijo Web Service

1. Klikon **New + → Web Service**
2. Zgjedh repo-n `detyrakursiAplikimet`
3. Konfigurime:
   - **Name**: `iq-tester-api`
   - **Region**: Frankfurt (i njejti si Neon)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

### 2.3 Vendos Environment Variables

Te seksioni **Environment**, shto:

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `PORT` | `4000` |
| `DATABASE_URL` | (ngjit URL-n e plote te Neon nga hapi 1.1) |
| `JWT_SECRET` | (klikon "Generate" - Render krijon automatikisht) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_ORIGIN` | `http://localhost:5173` (do e perditesojme pas Vercel-it) |
| `QUIZ_QUESTIONS_PER_ATTEMPT` | `20` |
| `QUIZ_TIME_LIMIT_MINUTES` | `15` |

### 2.4 Deploy

Klikon **Create Web Service**. Render do beje deploy automatikisht (~3-5 min).

Pas deploy-it, do kesh nje URL si: `https://iq-tester-api.onrender.com`

**Test**: hap `https://iq-tester-api.onrender.com/api/health` ne browser. Duhet te shohesh `{"ok": true, ...}`.

> ⚠️ Pas 15 min papunesi, Render e fle backend-in. Kerkesa e pare pas pauzes pret ~30 sek.

---

## 🎨 HAPI 3: Vercel (Frontend React)

### 3.1 Krijo llogari

1. Hap [vercel.com](https://vercel.com) → **Sign Up** me GitHub
2. Autorizo Vercel

### 3.2 Krijo Project

1. Klikon **Add New → Project**
2. Importo repo-n `detyrakursiAplikimet`
3. Konfigurime:
   - **Framework Preset**: Vite (auto-detektohet)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

### 3.3 Environment Variables

Te seksioni **Environment Variables**, shto:

| Key | Value |
|---|---|
| `VITE_API_URL` | (URL-ja e backend-it nga Render, p.sh. `https://iq-tester-api.onrender.com`) |

### 3.4 Deploy

Klikon **Deploy**. Pret ~2 min.

Pas deploy-it, do marresh nje URL si: `https://iq-tester-xxx.vercel.app`

---

## 🔄 HAPI 4: Lidh frontend me backend (CORS)

Backend-i jot momentalisht lejon vetem `localhost:5173`. Duhet ta perditesojme.

1. Hap [Render Dashboard](https://dashboard.render.com)
2. Klikon ne service-in `iq-tester-api`
3. Shko te **Environment**
4. Edito `CLIENT_ORIGIN`:
   ```
   http://localhost:5173,https://iq-tester-xxx.vercel.app
   ```
   (zevendeso me URL-n tende te vertete nga Vercel)
5. Klikon **Save Changes** → Render do beje redeploy automatikisht

---

## ✅ HAPI 5: Test online

1. Hap URL-n e Vercel-it
2. Loginohu me `admin / admin123`
3. Provo nje test, leaderboard, analytics

Nese diçka nuk punon, hap **DevTools (F12) → Console** dhe shih gabimet.

---

## 🐛 Problemet me te zakonshme

### "Network Error" ne login
- Backend-i fle. Prit 30 sek dhe provo perseri.
- Ose CORS-i s'eshte konfiguruar - kontrollo `CLIENT_ORIGIN` ne Render.

### "Failed to connect to database"
- `DATABASE_URL` mungon ose i pasakte ne Render.
- Verifikoje ne Neon dashboard nese projekti eshte aktiv (jo i suspenduar).

### Build deshton ne Vercel
- Kontrollo logs-in te tab-i "Deployments" → klikon te deploy-i deshtuar
- Sigurohu qe `Root Directory` eshte `client`

### Backend deshton ne Render
- Shih logs-in te tab-i "Logs"
- Sigurohu qe `Root Directory` eshte `server`
- Kontrollo qe `DATABASE_URL` eshte saktesisht ai i Neon

---

## 🔁 Update i versioneve te ardhshme

Pas konfigurimit fillestar, çdo `git push` ne `main`:
- **Vercel** ben redeploy automatikisht
- **Render** ben redeploy automatikisht

Te dyja servise marrin ~2-3 min per redeploy.

---

## 💾 Cilet jane URL-te qe duhet te mbash

```
GitHub repo:    https://github.com/EMRI_TEND/detyrakursiAplikimet
Vercel app:     https://iq-tester-xxx.vercel.app
Render API:     https://iq-tester-api.onrender.com
Neon dashboard: https://console.neon.tech/app/projects/...
```

**Kredencialet (mbaj te sigurta):**
- Neon connection string (ka password te DB)
- JWT_SECRET (Render e ka)
- Admin user-i: `admin / admin123` (NDRYSHOJE pas deploy-it!)

---

## 🔐 Siguri: ndryshim i admin password-it ne produksion

Pas deploy-it te pare, eshte e domosdoshme te ndryshosh password-in default `admin123`.

Mund ta besh permes pgAdmin lokal te lidhur me Neon, ose duke shtuar nje user te ri ne UI dhe duke fshire admin-in default.
