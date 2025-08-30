# 🌸 Nail Studio RO - API Backend

API backend pour le système de gestion de salon d'ongles avec interface client et admin.

## 🚀 Installation et Configuration

### Prérequis
- Node.js (version 16 ou supérieure)
- MySQL (version 8.0 ou supérieure)
- npm ou yarn

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration de la base de données

#### Option A: Configuration automatique
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier le fichier .env avec vos paramètres MySQL
# Puis initialiser la base de données
node database/init.js
```

#### Option B: Configuration manuelle
1. Créer une base de données MySQL nommée `zenshe_spa`
2. Importer le schéma depuis `database/schema.sql`
3. Configurer le fichier `.env` avec vos paramètres

### 3. Variables d'environnement

Modifiez le fichier `.env` selon votre configuration :

```env
# Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=zenshe_spa
DB_PORT=4306

# Configuration du serveur
PORT=5000
NODE_ENV=development

# JWT Secret (changez cette valeur en production)
JWT_SECRET=votre_secret_jwt_très_sécurisé

# Configuration CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Démarrage du serveur

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Structure de la Base de Données

### Tables Principales

#### 🎯 **clients**
- Informations des clients du salon
- Historique des visites et préférences

#### 👩‍💼 **administrateurs**
- Comptes administrateurs avec rôles
- Gestion des permissions (super_admin, admin, employe)

#### 💅 **services**
- Catalogue des services proposés
- Prix, durées, catégories

#### 📅 **reservations**
- Gestion des rendez-vous
- Statuts, notes, satisfaction client

#### 📦 **inventaire**
- Gestion du stock de produits
- Alertes de stock bas, traçabilité

#### 🏷️ **categories_services**
- Organisation des services par catégorie
- Thèmes de couleurs personnalisés

### Tables de Configuration

#### ⚙️ **parametres_salon**
- Informations générales du salon
- Horaires, coordonnées, thème

#### 🕐 **creneaux_horaires**
- Heures d'ouverture par jour
- Planning de disponibilité

#### 🚫 **fermetures_exceptionnelles**
- Jours fériés et fermetures
- Congés et événements spéciaux

## 🛠️ API Endpoints

### Routes Publiques (`/api/public/`)
- `GET /categories` - Liste des catégories de services
- `GET /services` - Catalogue des services
- `GET /salon-info` - Informations du salon
- `GET /horaires` - Horaires d'ouverture
- `GET /avis` - Avis clients visibles

### Authentification (`/api/auth/`)
- `POST /login` - Connexion administrateur
- `POST /logout` - Déconnexion
- `GET /me` - Profil utilisateur connecté
- `PUT /change-password` - Changement de mot de passe

### Réservations (`/api/reservations/`)
- `POST /` - Créer une réservation
- `GET /:id` - Détails d'une réservation
- `POST /check-availability` - Vérifier disponibilité
- `GET /available-slots/:date/:serviceId` - Créneaux disponibles
- `PUT /:id/cancel` - Annuler une réservation

### Administration (`/api/admin/`) 🔒
- `GET /dashboard` - Statistiques générales
- `GET /stats` - Statistiques détaillées
- `GET /reservations` - Gestion des réservations
- `PATCH /reservations/:id/statut` - Modifier statut réservation
- `GET /salon/parametres` - Paramètres du salon
- `PUT /salon/parametres` - Modifier paramètres

### Gestion Clients (`/api/clients/`) 🔒
- `GET /` - Liste des clients (pagination)
- `GET /:id` - Profil client détaillé
- `GET /:id/reservations` - Historique client
- `POST /` - Créer un client
- `PUT /:id` - Modifier un client
- `DELETE /:id` - Supprimer un client

### Gestion Services (`/api/services/`) 🔒
- `GET /` - Liste des services admin
- `GET /:id` - Détails service
- `POST /` - Créer un service
- `PUT /:id` - Modifier un service
- `DELETE /:id` - Supprimer un service

### Inventaire (`/api/inventaire/`) 🔒
- `GET /` - Liste des produits (filtres, pagination)
- `GET /:id` - Détails produit
- `POST /` - Ajouter un produit
- `PUT /:id` - Modifier un produit
- `PATCH /:id/quantite` - Ajuster stock
- `DELETE /:id` - Supprimer un produit
- `GET /alertes/stock` - Alertes de stock
- `GET /stats/general` - Statistiques inventaire

## 🔐 Authentification et Sécurité

### Système d'Authentification
- JWT (JSON Web Tokens) pour l'authentification
- Cookies HTTPOnly pour la sécurité
- Hashage des mots de passe avec bcrypt

### Rôles et Permissions
- **super_admin** : Accès complet, gestion des utilisateurs
- **admin** : Gestion quotidienne, statistiques
- **employe** : Consultation, modifications limitées

### Middleware de Sécurité
- Validation des données d'entrée
- Protection CORS configurée
- Sanitisation des inputs utilisateur

## 📱 Compte Administrateur par Défaut

Après l'initialisation de la base de données :

**Email :** `admin@salon-ongles.fr`  
**Mot de passe :** `admin123456`

⚠️ **Important :** Changez ce mot de passe dès la première connexion !

## 🎨 Thème et Couleurs

Le système utilise un thème rose et girly par défaut :
- **Couleur principale :** `#FF1493` (Deep Pink)
- **Couleur secondaire :** `#FFB6C1` (Light Pink)
- **Couleurs d'accent :** `#DA70D6`, `#DDA0DD`

## 📋 Gestion des Statuts

### Statuts des Réservations
- `en_attente` - Nouvelle réservation
- `confirmee` - Confirmée par l'admin
- `en_cours` - Rendez-vous en cours
- `terminee` - Service terminé
- `annulee` - Annulée
- `no_show` - Client absent

### Statuts du Stock
- `OK` - Stock suffisant
- `ALERTE` - Stock bas (≤ minimum)
- `RUPTURE` - Rupture de stock (= 0)

## 🔧 Scripts Utiles

```bash
# Initialiser la base de données
node database/init.js

# Démarrer en mode développement
npm run dev

# Démarrer en mode production
npm start

# Vérifier la santé de l'API
curl http://localhost:5000/api/health
```

## 📝 Logs et Monitoring

L'API génère des logs pour :
- Connexions à la base de données
- Requêtes HTTP avec timestamps
- Erreurs et exceptions
- Actions d'authentification

## 🚨 Gestion des Erreurs

Codes de réponse HTTP standardisés :
- `200` - Succès
- `201` - Créé avec succès
- `400` - Erreur de validation
- `401` - Non authentifié
- `403` - Permissions insuffisantes
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## 📞 Support et Contact

Pour toute question technique concernant l'API, consultez les logs d'erreur ou vérifiez la connexion à la base de données avec `/api/health`.

---

**🌸 Nail Studio RO API** - Développé avec amour pour les professionnels de la beauté
