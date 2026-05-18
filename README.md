# IQ Tester — Detyrë Kursi

Aplikim web full-stack: pyetësor IQ me 20 pyetje random dhe 15 min kohë limit.

- **Frontend:** React 18 + Vite + React Router + plain CSS
- **Backend:** Node.js + Express
- **DB:** PostgreSQL (lokal nëpërmjet pgAdmin)
- **Auth:** JWT (`localStorage`) + bcrypt për fjalëkalimet
- **Rolet:** `admin` (CRUD mbi pyetjet, kategoritë, përdoruesit) + `user` (bën testin)

---

## Struktura

```
detyrakursiAplikimet/
├── server/        # API Express
└── client/        # SPA React (Vite)
```

---

## 1) Përgatit databazën në pgAdmin

1. Hap pgAdmin → klikon **Servers** → lidhu me PostgreSQL lokal.
2. Right-click **Databases → Create → Database** → emri `iq_tester` → Save.
3. Klikon te `iq_tester` → **Tools → Query Tool**.
4. Hap skedarin **`server/src/db/schema.sql`**, kopjo gjithë përmbajtjen, ngjite në Query Tool dhe **Execute (F5)**.
5. Verifiko te **Schemas → public → Tables** që janë krijuar: `users`, `categories`, `questions`, `options`, `attempts`, `answers`.

> **Shënim:** seed-i (admin + pyetjet shembull) bëhet me Node.js, jo me SQL. Ndiq hapin 3.

---

## 2) Konfiguro dhe nis backend-in

```powershell
cd server
copy .env.example .env       # ploteso PGPASSWORD etj
npm install
npm run seed                  # krijon admin + pyetje shembull
npm run dev                   # nis serverin ne port 4000
```

Variablat ne `.env`:

```
PORT=4000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password-yt
PGDATABASE=iq_tester
JWT_SECRET=zevendeso-me-nje-sekret-te-gjate
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
QUIZ_QUESTIONS_PER_ATTEMPT=20
QUIZ_TIME_LIMIT_MINUTES=15
```

Pas `npm run seed` ke nje admin default:

- **username:** `admin`
- **password:** `admin123`

---

## 3) Nis frontend-in

Ne nje terminal te dyte:

```powershell
cd client
npm install
npm run dev
```

Hap [http://localhost:5173](http://localhost:5173).

Vite e perdor proxy-n (`/api` → `http://localhost:4000`), keshtu qe nuk ke nevoje per setup tjeter CORS gjate zhvillimit.

---

## 4) Si testohet end-to-end

1. Hap [http://localhost:5173](http://localhost:5173)
2. **Regjistro** nje user te ri (p.sh. `studenti1`).
3. **Logout**, pastaj **login** me `admin / admin123`.
4. Shko te **Pyetjet** → modifiko/shto pyetje (cdo pyetje ka 4 opsione me 1 sakte).
5. Shko te **Kategorite** → shto nje kategori te re.
6. **Logout** → **login** si `studenti1`.
7. Klikon **Fillo Testin** → pergjigju → **Mbaro**.
8. Shih skorin ne **Result** dhe shko te **Historia ime → Detaje** per rishikim.

---

## 5) API endpoints (permbledhje)

```
POST   /api/auth/register            -> krijon user
POST   /api/auth/login               -> { token, user }
GET    /api/auth/me                  -> info per user-in aktual

GET    /api/categories
POST   /api/categories               (admin)
PUT    /api/categories/:id           (admin)
DELETE /api/categories/:id           (admin)

GET    /api/questions                (admin, me opsionet)
POST   /api/questions                (admin)
PUT    /api/questions/:id            (admin)
DELETE /api/questions/:id            (admin)

POST   /api/attempts/start           -> attempt + 20 pyetje
POST   /api/attempts/:id/answer      -> ruan nje pergjigje
POST   /api/attempts/:id/finish      -> kalkulon skorin
GET    /api/attempts/me              -> historia personale
GET    /api/attempts/:id             -> detaje + pergjigjet e sakta (vetem pas mbarimit)

GET    /api/users                    (admin)
DELETE /api/users/:id                (admin)
```

---

## 6) Probleme te zakonshme

- **`[db] Deshtoi lidhja me PostgreSQL`** → kontrollo `PGUSER` / `PGPASSWORD` ne `.env`. Provo ne pgAdmin se kredencialet jane te sakta.
- **`role "postgres" does not exist`** → ke vendosur user te gabuar ne `.env`.
- **`relation "users" does not exist`** → nuk ke ekzekutuar `schema.sql` ne databazen e duhur.
- **CORS error** → siguro qe `CLIENT_ORIGIN` ne `.env` te perputhet me `http://localhost:5173`.
- **JWT i pavlefshem** → fshi `localStorage` dhe ribej login.

---

## Cfare ka mbeshtetur cdo file (referenca te shpejta)

- `server/src/db/schema.sql` — krijon tabelat.
- `server/src/db/seed.js` — admin + shembuj pyetjesh.
- `server/src/db/pool.js` — lidhja PG, `query()` dhe `withTransaction()`.
- `server/src/controllers/attempts.controller.js` — logjika me e nderlikuar: start, answer, finish.
- `client/src/pages/QuizPage.jsx` — UI e testit me Timer dhe autosave per cdo pergjigje.
- `client/src/auth/AuthContext.jsx` — burimi i autentifikimit ne UI.
