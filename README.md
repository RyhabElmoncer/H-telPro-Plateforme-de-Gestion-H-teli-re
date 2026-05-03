# 🏨 HôtelPro — Plateforme de Gestion Hôtelière

> Plateforme web complète : Backend Node.js/Express · Frontend React.js · MongoDB · n8n

---

## 📋 Table des matières

1. [Architecture du projet](#architecture)
2. [Prérequis](#prérequis)
3. [Installation rapide](#installation)
4. [Configuration](#configuration)
5. [Démarrage](#démarrage)
6. [Comptes de démonstration](#comptes-démo)
7. [Fonctionnalités par acteur](#fonctionnalités)
8. [Configuration n8n](#n8n)
9. [Structure des fichiers](#structure)
10. [API Reference](#api)

---

## 🏗 Architecture {#architecture}

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│         React.js (port 3000)                         │
│   Cormorant Garamond + DM Sans | Style Luxe Hôtelier│
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST (Axios)
┌──────────────────────▼──────────────────────────────┐
│                    BACKEND                           │
│         Node.js / Express (port 5000)                │
│   JWT Auth · Helmet · Rate Limit · CORS              │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
┌──────────▼──────┐    ┌───────────▼──────────────────┐
│    MongoDB      │    │     n8n Workflows             │
│  (port 27017)   │    │  (port 5678) — Notifications  │
│  Mongoose ODM   │    │  Webhooks → Emails SMTP        │
└─────────────────┘    └──────────────────────────────┘
```

### Technologies utilisées

| Couche      | Technologie                              |
|-------------|------------------------------------------|
| Backend     | Node.js 18+, Express 4, Mongoose         |
| Frontend    | React 18, React Router v6, Axios         |
| Base données| MongoDB 6+                               |
| Auth        | JWT (jsonwebtoken), bcryptjs             |
| Graphiques  | Recharts                                 |
| Sécurité    | Helmet, cors, express-rate-limit         |
| Workflows   | n8n (notifications automatiques)         |

---

## ✅ Prérequis {#prérequis}

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** v18 ou supérieur → [nodejs.org](https://nodejs.org)
- **MongoDB** v6+ (local ou [MongoDB Atlas](https://cloud.mongodb.com))
- **npm** v8+ (inclus avec Node.js)
- **n8n** (optionnel, pour les notifications) → `npm install -g n8n`

Vérifiez vos versions :
```bash
node --version   # v18.x.x ou plus
npm --version    # 8.x.x ou plus
mongod --version # 6.x.x ou plus
```

---

## 🚀 Installation rapide {#installation}

### Étape 1 — Cloner / Extraire le projet

```bash
# Extraire l'archive ZIP
unzip hotel-platform.zip
cd hotel-platform
```

### Étape 2 — Installer toutes les dépendances

```bash
# Depuis la racine du projet (installe backend + frontend en une commande)
npm run install:all
```

Ou manuellement :
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Étape 3 — Configurer les variables d'environnement

```bash
cd backend
cp .env.example .env
```

Éditez le fichier `backend/.env` :
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/hotel_platform

# JWT (changez cette clé en production !)
JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe_ici
JWT_EXPIRE=30d

# Serveur
PORT=5000
NODE_ENV=development

# n8n (optionnel)
N8N_BASE_URL=http://localhost:5678

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:3000
```

### Étape 4 — Peupler la base de données

```bash
cd backend
npm run seed
```

Cette commande crée :
- Les comptes de démonstration
- 20 chambres variées (Singles, Doubles, Suites...)
- Des réservations d'exemple
- Des paiements de test

---

## ⚙️ Configuration {#configuration}

### Variables d'environnement backend (`backend/.env`)

| Variable         | Description                        | Défaut                              |
|------------------|------------------------------------|-------------------------------------|
| `MONGODB_URI`    | URI de connexion MongoDB           | `mongodb://localhost:27017/hotel_platform` |
| `JWT_SECRET`     | Clé secrète JWT (**à changer !**)  | —                                   |
| `JWT_EXPIRE`     | Durée de validité du token         | `30d`                               |
| `PORT`           | Port du serveur backend            | `5000`                              |
| `N8N_BASE_URL`   | URL du serveur n8n                 | `http://localhost:5678`             |
| `FRONTEND_URL`   | URL du frontend (CORS)             | `http://localhost:3000`             |

### Variables d'environnement frontend (`frontend/.env`)

Créez `frontend/.env` si besoin :
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook/hotel
```

---

## ▶️ Démarrage {#démarrage}

### Démarrage complet (recommandé)

```bash
# Depuis la racine — démarre backend + frontend simultanément
npm run dev
```

### Démarrage séparé

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

### Production

```bash
cd frontend && npm run build
cd backend && npm start
```

### Accès

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| Backend API| http://localhost:5000/api    |
| n8n        | http://localhost:5678        |

---

## 👥 Comptes de démonstration {#comptes-démo}

| Rôle            | Email                     | Mot de passe  |
|-----------------|---------------------------|---------------|
| 🔴 Admin        | admin@hotel.com           | Admin@123     |
| 🟡 Réceptionniste| receptionist@hotel.com   | Recep@123     |
| 🟢 Client       | jean@client.com           | Client@123    |
| 🟢 Client       | sophie@client.com         | Client@123    |

> **Note :** En mode développement, les comptes démo sont affichés directement sur la page de connexion.

---

## 🎭 Fonctionnalités par acteur {#fonctionnalités}

### 👤 Visiteur (non connecté)
- Consulter les chambres disponibles avec filtres
- Rechercher par dates, type, capacité, prix
- Voir le détail d'une chambre (équipements, photos, tarifs)
- S'inscrire ou se connecter

### 🛎 Client (connecté)
- Réserver une chambre (vérification disponibilité temps réel)
- Payer en ligne (carte simulée / espèces / virement)
- Consulter et gérer ses réservations
- Annuler une réservation
- Modifier son profil et mot de passe
- Recevoir des emails de confirmation (via n8n)

### 👔 Réceptionniste (accès configuré par l'admin)
Accès selon les permissions accordées par l'administrateur :
- ✅ Voir le tableau de bord (si permission `canViewDashboard`)
- ✅ Gérer les chambres (si permission `canManageRooms`)
- ✅ Gérer les réservations (si permission `canManageReservations`)
- ✅ Gérer les paiements (si permission `canManagePayments`)

### 👑 Administrateur (accès complet)
- **Dashboard** : statistiques en temps réel, graphiques revenus, taux d'occupation
- **Chambres** : créer, modifier, archiver/restaurer (≠ supprimer), suivi disponibilités
- **Réservations** : vue complète, modification des statuts (En attente → Confirmé → Arrivé → Parti)
- **Paiements** : historique complet, statistiques revenus
- **Utilisateurs** : créer du personnel, gérer les permissions des réceptionnistes, activer/désactiver
- **Notifications** : configurer n8n, envoyer des campagnes promotionnelles

---

## 📧 Configuration n8n {#n8n}

### Installation

```bash
# Installation globale
npm install -g n8n

# Démarrer n8n
n8n start
```

Accédez à http://localhost:5678

### Importer le workflow

1. Ouvrez n8n → **Workflows** → **Import from File**
2. Sélectionnez `n8n-workflows/hotel-notifications.json`
3. Le workflow contient 4 webhooks :
   - `POST /webhook/hotel-confirmation` → Email confirmation réservation
   - `POST /webhook/hotel-cancellation` → Email annulation
   - `POST /webhook/hotel-payment` → Email confirmation paiement
   - `POST /webhook/hotel-promo` → Email promotionnel

### Configurer l'email SMTP

Dans n8n :
1. **Settings** → **Credentials** → **Add Credential** → **Email (SMTP)**
2. Configurez avec vos paramètres SMTP (Gmail, Mailgun, etc.)
3. Assignez cette credential aux nœuds "Email Send"
4. Activez le workflow (toggle **Active**)

### Exemple avec Gmail

```
Host: smtp.gmail.com
Port: 587
User: votre@gmail.com
Password: [mot de passe d'application Google]
```

---

## 📁 Structure des fichiers {#structure}

```
hotel-platform/
├── package.json                    # Scripts racine (dev, install:all)
│
├── backend/
│   ├── .env.example               # Variables d'environnement exemple
│   ├── package.json
│   └── src/
│       ├── server.js              # Point d'entrée Express
│       ├── models/
│       │   ├── User.js            # Modèle utilisateur (rôles + permissions)
│       │   ├── Room.js            # Modèle chambre (isArchived)
│       │   ├── Reservation.js     # Modèle réservation
│       │   └── Payment.js         # Modèle paiement
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── roomController.js
│       │   ├── reservationController.js
│       │   ├── paymentController.js
│       │   ├── dashboardController.js
│       │   └── userController.js
│       ├── middleware/
│       │   └── auth.js            # protect, authorize, checkPermission
│       ├── routes/
│       │   ├── auth.js
│       │   ├── rooms.js
│       │   ├── reservations.js
│       │   ├── payments.js
│       │   ├── dashboard.js
│       │   ├── users.js
│       │   └── notifications.js
│       ├── services/
│       │   └── notificationService.js  # Appels webhooks n8n
│       └── utils/
│           └── seeder.js          # Données de démonstration
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js                 # Routing + routes protégées
│       ├── contexts/
│       │   └── AuthContext.js     # Contexte d'authentification
│       ├── services/
│       │   └── api.js             # Toutes les fonctions API (Axios)
│       ├── components/
│       │   ├── shared/Layout.js   # Layout public (navbar + footer)
│       │   └── admin/AdminLayout.js # Layout admin (sidebar)
│       └── pages/
│           ├── HomePage.js        # Page d'accueil
│           ├── RoomsPage.js       # Catalogue chambres avec filtres
│           ├── RoomDetailPage.js  # Détail chambre
│           ├── auth/
│           │   ├── LoginPage.js
│           │   └── RegisterPage.js
│           ├── client/
│           │   ├── BookingPage.js
│           │   ├── PaymentPage.js
│           │   ├── MyReservationsPage.js
│           │   └── ProfilePage.js
│           └── admin/
│               ├── AdminDashboard.js    # Stats + graphiques
│               ├── AdminRooms.js        # Gestion chambres
│               ├── AdminReservations.js # Gestion réservations
│               ├── AdminUsers.js        # Gestion utilisateurs
│               ├── AdminPayments.js     # Historique paiements
│               └── AdminNotifications.js # Config n8n + promos
│
└── n8n-workflows/
    └── hotel-notifications.json   # Workflow n8n à importer
```

---

## 🔌 API Reference {#api}

Base URL : `http://localhost:5000/api`

### Authentification

| Méthode | Endpoint              | Description              | Auth |
|---------|-----------------------|--------------------------|------|
| POST    | `/auth/register`      | Inscription client       | ❌   |
| POST    | `/auth/login`         | Connexion                | ❌   |
| GET     | `/auth/me`            | Profil courant           | ✅   |
| PUT     | `/auth/profile`       | Modifier profil          | ✅   |
| PUT     | `/auth/password`      | Changer mot de passe     | ✅   |

### Chambres

| Méthode | Endpoint                      | Description              | Auth      |
|---------|-------------------------------|--------------------------|-----------|
| GET     | `/rooms`                      | Liste chambres           | ❌        |
| GET     | `/rooms/available`            | Chambres disponibles     | ❌        |
| GET     | `/rooms/:id`                  | Détail chambre           | ❌        |
| POST    | `/rooms`                      | Créer chambre            | Admin     |
| PUT     | `/rooms/:id`                  | Modifier chambre         | Admin     |
| PATCH   | `/rooms/:id/archive`          | Archiver chambre         | Admin     |
| PATCH   | `/rooms/:id/restore`          | Restaurer chambre        | Admin     |

### Réservations

| Méthode | Endpoint                      | Description              | Auth      |
|---------|-------------------------------|--------------------------|-----------|
| POST    | `/reservations`               | Créer réservation        | Client    |
| GET     | `/reservations`               | Toutes réservations      | Admin     |
| GET     | `/reservations/my`            | Mes réservations         | Client    |
| PATCH   | `/reservations/:id/status`    | Changer statut           | Admin     |
| PATCH   | `/reservations/:id/cancel`    | Annuler                  | Client    |

### Paiements

| Méthode | Endpoint                      | Description              | Auth      |
|---------|-------------------------------|--------------------------|-----------|
| POST    | `/payments`                   | Traiter paiement         | Client    |
| GET     | `/payments`                   | Tous les paiements       | Admin     |
| GET     | `/payments/my`                | Mes paiements            | Client    |

### Simulation paiement carte

- **Carte acceptée** : numéro valide, derniers 4 chiffres ≠ 0000
- **Carte refusée** : derniers 4 chiffres = `0000`

---

## 🛡 Sécurité

- Mots de passe hashés avec **bcrypt** (12 rounds)
- Tokens JWT avec expiration configurable
- Rate limiting : 100 req/15min par IP
- Headers sécurisés avec **Helmet**
- CORS configuré par domaine

---

## 🐛 Dépannage

**MongoDB ne démarre pas**
```bash
# Vérifier si MongoDB tourne
sudo systemctl status mongod
# Démarrer MongoDB
sudo systemctl start mongod
```

**Port 5000 déjà utilisé**
```bash
# Trouver et tuer le processus
lsof -i :5000
kill -9 [PID]
```

**Erreur CORS**
Vérifiez que `FRONTEND_URL=http://localhost:3000` est bien défini dans `backend/.env`.

**n8n webhook ne fonctionne pas**
- Vérifiez que n8n est démarré sur le port 5678
- Vérifiez que le workflow est activé dans n8n
- Testez manuellement : `curl -X POST http://localhost:5678/webhook/hotel-confirmation`

---

## 📄 Licence

Projet développé à des fins éducatives et de démonstration.

---

*Généré avec ❤️ — HôtelPro v1.0*
