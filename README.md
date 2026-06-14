# Africœur — Plateforme solidaire africaine

Collecte d'aide humanitaire, médicale et sociale pour l'Afrique francophone.
**Modèle de confiance absolue** : validation institutionnelle *a priori* (hôpitaux
& ONG agréées), **aucun espace famille**, **aucun accès direct aux fonds**. Les
fonds transitent par un compte séquestre et sont débloqués uniquement sur
justificatifs (chèques conditionnés / virements aux hôpitaux & fournisseurs).

> Notifications **par e-mail uniquement** (pas de SMS). L'hébergement n'est pas
> couvert ici. Tests réalisés sur **Supabase Cloud** ; **Supabase self-hosted**
> est dockerisé et prêt pour la production.

---

## Architecture

```
┌──────────────┐   JWT Supabase   ┌──────────────────┐
│  Next.js 14  │ ───────────────► │   Django + DRF   │
│  (frontend)  │   REST /api/v1   │   (backend API)  │
│  FR / EN     │ ◄─────────────── │  Celery + Redis  │
└──────┬───────┘                  └────────┬─────────┘
       │ auth / storage / video            │ ORM
       ▼                                    ▼
┌─────────────────────────── Supabase ───────────────────────────┐
│  PostgreSQL  ·  Auth (GoTrue + MFA TOTP)  ·  Storage  ·  Vidéo   │
└─────────────────────────────────────────────────────────────────┘
```

| Couche             | Choix                                                        |
| ------------------ | ------------------------------------------------------------ |
| Frontend           | **Next.js 14** (App Router) + Tailwind + `next-intl` (FR/EN) |
| Backend / API      | **Django 5 + Django REST Framework**                         |
| Base de données    | **PostgreSQL Supabase** (Django ORM possède le schéma métier)|
| Auth               | **Supabase Auth** (GoTrue) + **MFA TOTP** ; JWT vérifié côté Django |
| Stockage / vidéo   | **Supabase Storage** (lecture progressive HTTP Range)        |
| Cache / files      | **Redis** + **Celery** (e-mails asynchrones)                 |
| Notifications      | **E-mail** (SMTP / console en dev) — pas de SMS              |
| Paiements          | CinetPay · Campay · Flutterwave (abstraction + webhook)      |
| Déploiement        | **Docker** (front, back, worker, redis) + Supabase self-hosted |

### Pourquoi Django **et** Supabase ?

Supabase fournit une base Postgres managée, l'authentification (avec MFA TOTP
gratuit) et le stockage/vidéo — services lourds à réimplémenter. Django apporte
la **logique métier sensible** : modération, workflow de déblocage des fonds,
commissions, séparation étanche des espaces, audit. Django se connecte à la base
Supabase et **vérifie les JWT** émis par Supabase Auth (HS256, secret partagé).

---

## Démarrage rapide (mode TEST — Supabase Cloud)

1. **Créer un projet Supabase Cloud**, puis récupérer dans *Project Settings* :
   - `Project URL`, `anon key`, `service_role key`
   - *Database* → *Connection string* (URI)
   - *API* → *JWT Settings* → **JWT Secret**
2. **Configurer l'environnement** :
   ```bash
   cp .env.example .env
   # renseigner SUPABASE_*, DATABASE_URL, NEXT_PUBLIC_SUPABASE_*
   ```
3. **Initialiser le stockage** : exécuter `supabase/migrations/0001_storage_buckets.sql`
   dans l'éditeur SQL Supabase (crée les buckets `public-media` et `legal-docs`).
4. **Lancer la plateforme** :
   ```bash
   docker compose up --build
   ```
   - Frontend : http://localhost:3000
   - API : http://localhost:8000/api/v1 · Docs : http://localhost:8000/api/docs
   - Les migrations Django et le jeu de démonstration (`SEED_DEMO=true`) s'exécutent
     automatiquement au démarrage.

> Sans `.env` configuré, le **frontend reste fonctionnel** : il affiche des
> données de démonstration tant que l'API n'est pas joignable.

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../.env | xargs)   # ou définir les variables à la main
python manage.py migrate
python manage.py seed_demo                # données de démonstration
python manage.py runserver                # http://localhost:8000
celery -A config worker -l info           # (autre terminal) e-mails async
```

### Frontend

```bash
cd frontend
npm install
npm run dev                                # http://localhost:3000
npm run build && npm run typecheck         # vérifications de prod
```

---

## Supabase self-hosted (production / local complet)

```bash
# Renseigner POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY dans .env
docker compose -f docker-compose.supabase.yml up -d   # Postgres, Auth, REST, Storage, Studio, Kong
docker compose up --build                             # front + back + worker + redis
```

- API Supabase (Kong) : http://localhost:8000 · Studio : http://localhost:3001
- Pour la stack complète (Realtime, Edge Functions, Analytics), partir du dépôt
  officiel `supabase/supabase` (dossier `docker/`).

---

## Espaces fonctionnels (cahier des charges v2)

| Espace                  | Accès            | Fonctions clés |
| ----------------------- | ---------------- | -------------- |
| **Public**              | Sans inscription | Catalogue d'appels validés, filtres, détail (vidéo, progression), don Mobile Money / carte, anonymat, partage |
| **Service Social Hôpital** | Partenaire certifié (MFA) | Création d'appels médicaux, profil patient minimal, suivi, demande de déblocage |
| **ONG**                 | Partenaire certifié (MFA) | Caisses de projets, mises à jour de terrain, rapports d'impact publics, déblocage par tranches |
| **Admin plateforme**    | Administrateur   | Certification des organisations, modération, validation des déblocages, finances/commissions, audit |

### Sécurité & confidentialité (cœur du modèle)

- **Profil patient minimal** : prénom + initiale, âge, situation générale. Aucun
  diagnostic ni n° de dossier. Contacts du tuteur dans une table privée séparée.
- **Niveaux d'affichage** (`display_level` 1/2/3) décidés **côté serveur** : la vue
  publique ne renvoie jamais la photo originale ni la vidéo pour les niveaux
  inférieurs (floutage des mineurs par défaut).
- **Déblocage encadré** : demande partenaire → validation admin → instruction
  bancaire (chèque conditionné / virement) → rapport public d'utilisation.
- **JWT vérifiés** côté Django ; rôles portés par `app_metadata.role` (modifiable
  uniquement via `service_role`).

---

## Structure du dépôt

```
Africoeur/
├── docker-compose.yml             # app : backend, worker, frontend, redis (Supabase Cloud)
├── docker-compose.supabase.yml    # Supabase self-hosted (Postgres, Auth, REST, Storage, Kong, Studio)
├── .env.example
├── backend/                       # Django + DRF + Celery
│   ├── config/                    # settings, urls, celery, wsgi/asgi
│   └── apps/
│       ├── accounts/              # profils, rôles, authentification JWT Supabase
│       ├── organizations/         # hôpitaux & ONG (certification, plan Free/Premium)
│       ├── campaigns/             # appels à l'aide, mises à jour, rapports d'utilisation
│       ├── patients/              # profil patient minimal + contacts privés
│       ├── donations/             # dons, passerelles de paiement, webhooks, reçus e-mail
│       ├── disbursements/         # workflow de déblocage des fonds
│       └── notifications/         # e-mails (Celery) + journal
├── frontend/                      # Next.js 14 (App Router) + Tailwind + next-intl
│   ├── messages/{fr,en}.json      # traductions
│   └── src/
│       ├── app/[locale]/          # pages localisées (accueil, appels, détail, ONG, login, dashboard)
│       ├── components/            # layout, campaigns, media, auth, dashboard
│       └── lib/                   # api (repli démo), supabase, utils, i18n
└── supabase/
    ├── migrations/0001_storage_buckets.sql
    └── kong.yml
```

---

## Écarts assumés vs cahier des charges

| Cahier des charges            | Choix ici                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| Notifications SMS             | **E-mail uniquement** (demande explicite)                  |
| Hébergement (Hetzner…)        | **Non couvert** ; dockerisation prête pour tout hôte       |
| 2FA **SMS** (login partenaire)| **MFA TOTP** natif Supabase (gratuit, plus sûr)            |
| Cloudflare Stream / Mux       | **Supabase Storage** + lecture progressive `<video>`       |
| NestJS                        | **Django** (préférence exprimée)                           |

Coûts incompressibles : commissions des passerelles de paiement (CinetPay /
Campay / Flutterwave), inhérentes au modèle métier.
