# ContentPro - Plateforme SaaS de Création de Contenu IA

Application SaaS complète pour la création de contenu YouTube automatisée avec l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Content Studio** - Workflow complet de création de contenu
  - Génération de métadonnées (titres, descriptions, tags, hashtags)
  - Directions artistiques personnalisées
  - Génération de miniatures avec IA
  - Posts pour réseaux sociaux (LinkedIn, YouTube, TikTok, X, Instagram, Facebook, Threads, School)
  - Simulateur de prévisualisation sociale

- **Command Center** - Tableau de bord unifié
  - Marketing AI
  - Social Factory
  - Finance AI
  - Business Tools

- **Administration** - Gestion complète
  - Gestion des utilisateurs
  - Plans d'abonnement
  - Orchestrateur d'agents IA
  - Compétences (Skills) et outils
  - Planificateur de tâches
  - Observabilité et logs

## 📋 Prérequis

- Node.js 20+
- Bun (runtime recommandé)
- Base de données au choix (voir configuration ci-dessous)

## 🛠️ Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/contentpro.git
cd contentpro

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Initialiser la base de données
bun run db:push
bun run db:seed  # Optionnel: données de démonstration

# Lancer en développement
bun run dev
```

## ⚙️ Configuration Base de Données

### 🗄️ Multi-Database Support

ContentPro supporte plusieurs bases de données avec un système de configuration flexible:

| Provider | Usage | Description |
|----------|-------|-------------|
| `sqlite` | Développement | Base locale fichier, aucun serveur requis |
| `postgresql` | Production | PostgreSQL sur votre serveur |
| `supabase` | Production | PostgreSQL managé par Supabase |
| `mysql` | Production | MySQL ou MariaDB |

### Commandes de configuration

```bash
# Voir la configuration actuelle
bun run db:config

# Voir le statut détaillé
bun run db:config:status

# Changer de provider
bun run db:config:switch postgresql
bun run db:config:switch supabase
bun run db:config:switch mysql
bun run db:config:switch sqlite
```

### Variables d'environnement

```env
# Choisir le provider: sqlite, postgresql, supabase, mysql
DATABASE_PROVIDER="sqlite"

# SQLite (Développement)
DATABASE_URL="file:./db/custom.db"

# PostgreSQL (Production - Votre serveur)
# DATABASE_URL="postgresql://user:password@localhost:5432/contentpro"

# Supabase (Production - Managé)
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# MySQL/MariaDB (Production)
# DATABASE_URL="mysql://user:password@localhost:3306/contentpro"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-jwt-minimum-32-caracteres"

# API IA (z-ai-web-dev-sdk)
ZAI_API_KEY="votre-cle-api"
```

### 🔄 Migration entre providers

1. **Changer le provider**:
```bash
bun run db:config:switch postgresql
```

2. **Mettre à jour le .env** avec la nouvelle URL de connexion

3. **Pousser le schéma**:
```bash
bun run db:push
```

### 📊 Recommandations

| Environnement | Provider recommandé |
|---------------|---------------------|
| Développement local | SQLite |
| Production petit projet | Supabase (gratuit) |
| Production entreprise | PostgreSQL ou MySQL sur votre serveur |
| Infrastructure Plesk existante | MySQL/MariaDB |

## 📦 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Démarre le serveur de développement |
| `bun run build` | Build de production |
| `bun run start` | Démarre en mode production |
| `bun run lint` | Vérification ESLint |
| `bun run type-check` | Vérification TypeScript |
| `bun run db:push` | Pousse le schéma Prisma à la DB |
| `bun run db:migrate` | Crée une migration |
| `bun run db:studio` | Ouvre Prisma Studio |
| `bun run db:seed` | Peuple la DB avec des données de test |
| `bun run db:config` | Configuration base de données |
| `bun run db:config:status` | Statut configuration DB |
| `bun run db:config:switch <provider>` | Change de provider DB |

## 🏗️ Architecture

```
src/
├── app/                    # App Router Next.js
│   ├── api/               # Routes API
│   ├── admin/             # Pages administration
│   ├── command-center/    # Application principale
│   └── settings/          # Paramètres utilisateur
├── components/            # Composants React
│   └── ui/               # Composants shadcn/ui
├── lib/                   # Utilitaires et logique métier
│   ├── db.ts             # Client Prisma
│   ├── auth.ts           # Configuration NextAuth
│   ├── store.ts          # État global Zustand
│   └── types.ts          # Types TypeScript
├── hooks/                 # Hooks React personnalisés
└── prisma/               # Schémas et migrations
    ├── schema.prisma            # Schema actif
    ├── schema.sqlite.prisma     # SQLite
    ├── schema.postgresql.prisma # PostgreSQL/Supabase
    └── schema.mysql.prisma      # MySQL/MariaDB
```

## 🔐 Authentification

- Authentification par email/mot de passe
- Sessions JWT avec cookies sécurisés
- Rôles: ADMIN, CLIENT
- Protection des routes API

## 📊 Modèles de Données

### Modèles Principaux

- **User** - Utilisateurs avec rôles
- **Subscription** - Abonnements et plans
- **ContentSession** - Sessions de création de contenu
- **Agent** - Agents IA configurables
- **Skill** - Compétences avec prompts
- **ExecutionLog** - Logs d'exécution
- **EmailTemplate** - Templates d'emails
- **SupportTicket** - Tickets de support

## 🚢 Déploiement

### Vercel (Recommandé pour Supabase)

```bash
# Installer Vercel CLI
bun i -g vercel

# Déployer
vercel --prod
```

### Serveur VPS/Plesk avec MySQL/PostgreSQL

1. **Configurer la base de données**:
```bash
# Créer la base de données
mysql -u root -p -e "CREATE DATABASE contentpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Ou PostgreSQL
createdb contentpro
```

2. **Configurer l'application**:
```bash
# Changer de provider
bun run db:config:switch mysql  # ou postgresql

# Mettre à jour .env
DATABASE_URL="mysql://user:password@localhost:3306/contentpro"

# Pousser le schéma
bun run db:push
```

3. **Builder et démarrer**:
```bash
bun run build

# Avec PM2
pm2 start "bun run start" --name contentpro
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## 🧪 Tests

```bash
# Lancer les tests
bun test

# Tests avec couverture
bun test:coverage
```

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📧 Support

- Email: support@contentpro.fr
- Documentation: [docs.contentpro.fr](https://docs.contentpro.fr)

---

Développé avec ❤️ par ContentPro Team
