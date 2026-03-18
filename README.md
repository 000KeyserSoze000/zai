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
- Base de données (SQLite pour développement, PostgreSQL pour production)

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

## ⚙️ Configuration

### Variables d'environnement

```env
# Base de données
DATABASE_URL="file:./db/custom.db"  # SQLite
# DATABASE_URL="postgresql://user:password@localhost:5432/contentpro"  # PostgreSQL

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-jwt"

# API IA (z-ai-web-dev-sdk)
ZAI_API_KEY="votre-cle-api"

# Email (optionnel)
SMTP_ENABLED="false"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="password"
```

### Migration vers PostgreSQL (Production)

1. Modifier `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Mettre à jour `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/contentpro"
```

3. Pousser le schéma:
```bash
bun run db:push
```

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
└── prisma/               # Schéma et migrations
```

## 🔐 Authentification

- Authentification par email/mot de passe
- Sessions JWT avec cookies sécurisés
- Rôles: ADMIN, CLIENT
- Protection des routes API

## 📊 Base de Données

### Modèles Principaux

- **User** - Utilisateurs avec rôles
- **Subscription** - Abonnements et plans
- **ContentSession** - Sessions de création de contenu
- **Agent** - Agents IA configurables
- **Skill** - Compétences avec prompts
- **ExecutionLog** - Logs d'exécution

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
bun i -g vercel

# Déployer
vercel --prod
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

### Serveur VPS/Plesk

1. Builder l'application:
```bash
bun run build
```

2. Configurer les variables d'environnement
3. Utiliser PM2 pour la gestion de processus:
```bash
pm2 start "bun run start" --name contentpro
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
