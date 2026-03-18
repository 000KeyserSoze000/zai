#!/usr/bin/env bun
/**
 * Database Configuration Script
 * 
 * This script configures the database based on DATABASE_PROVIDER environment variable.
 * 
 * Usage:
 *   bun run db:config          - Configure and push schema
 *   bun run db:config:check    - Check current configuration
 *   bun run db:config:switch   - Switch provider (interactive)
 * 
 * Supported providers:
 *   - sqlite     (Development)
 *   - postgresql (Production - Your server)
 *   - supabase   (Production - Managed PostgreSQL)
 *   - mysql      (Production - MySQL/MariaDB)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCHEMAS_DIR = path.join(__dirname, '../prisma');
const SCHEMA_FILE = path.join(SCHEMAS_DIR, 'schema.prisma');

const PROVIDERS = {
  sqlite: {
    file: 'schema.sqlite.prisma',
    description: 'SQLite (Development)',
    envExample: 'DATABASE_URL="file:./db/custom.db"',
  },
  postgresql: {
    file: 'schema.postgresql.prisma',
    description: 'PostgreSQL (Production)',
    envExample: 'DATABASE_URL="postgresql://user:password@localhost:5432/contentpro"',
  },
  supabase: {
    file: 'schema.postgresql.prisma',
    description: 'Supabase (Managed PostgreSQL)',
    envExample: 'DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"',
  },
  mysql: {
    file: 'schema.mysql.prisma',
    description: 'MySQL/MariaDB (Production)',
    envExample: 'DATABASE_URL="mysql://user:password@localhost:3306/contentpro"',
  },
};

function getCurrentProvider() {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
    const providerMatch = envContent.match(/DATABASE_PROVIDER=["']?(\w+)["']?/);
    return providerMatch ? providerMatch[1] : 'sqlite';
  } catch {
    return 'sqlite';
  }
}

function switchProvider(newProvider) {
  if (!PROVIDERS[newProvider]) {
    console.error(`❌ Provider "${newProvider}" not supported.`);
    console.log(`Supported providers: ${Object.keys(PROVIDERS).join(', ')}`);
    process.exit(1);
  }

  const providerConfig = PROVIDERS[newProvider];
  const sourceFile = path.join(SCHEMAS_DIR, providerConfig.file);

  // Check if source schema exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Schema file not found: ${providerConfig.file}`);
    process.exit(1);
  }

  // Copy schema
  fs.copyFileSync(sourceFile, SCHEMA_FILE);
  console.log(`✅ Schema switched to: ${providerConfig.description}`);

  // Update .env file
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add DATABASE_PROVIDER
  if (envContent.includes('DATABASE_PROVIDER=')) {
    envContent = envContent.replace(
      /DATABASE_PROVIDER=["']?\w+["']?/,
      `DATABASE_PROVIDER="${newProvider}"`
    );
  } else {
    envContent = `DATABASE_PROVIDER="${newProvider}"\n` + envContent;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ .env updated with DATABASE_PROVIDER="${newProvider}"`);
  
  return true;
}

function pushSchema() {
  console.log('\n📦 Pushing schema to database...');
  try {
    execSync('bun run db:push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed successfully!');
  } catch (error) {
    console.error('❌ Failed to push schema');
    process.exit(1);
  }
}

function showStatus() {
  const currentProvider = getCurrentProvider();
  const providerConfig = PROVIDERS[currentProvider];
  
  console.log('\n📊 Database Configuration Status\n');
  console.log(`Provider: ${currentProvider}`);
  console.log(`Type: ${providerConfig?.description || 'Unknown'}`);
  console.log(`\nExample connection string:`);
  console.log(`  ${providerConfig?.envExample || 'N/A'}`);
  console.log('\nAvailable providers:');
  
  Object.entries(PROVIDERS).forEach(([key, config]) => {
    const marker = key === currentProvider ? '✓' : ' ';
    console.log(`  ${marker} ${key.padEnd(12)} - ${config.description}`);
  });
}

function showHelp() {
  console.log(`
📚 Database Configuration Help

Commands:
  bun run db:config         Configure and push schema
  bun run db:config:status  Show current configuration
  bun run db:config:switch <provider>  Switch to new provider

Providers:
  sqlite     - Local development (file-based)
  postgresql - PostgreSQL on your server
  supabase   - Supabase managed PostgreSQL
  mysql      - MySQL/MariaDB

Examples:
  bun run db:config:switch postgresql
  bun run db:config:switch supabase
  bun run db:config:switch mysql

After switching, update your .env file with the correct DATABASE_URL.
`);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'status':
  case 'check':
    showStatus();
    break;
    
  case 'switch':
    const newProvider = args[1];
    if (!newProvider) {
      console.error('❌ Please specify a provider');
      showHelp();
      process.exit(1);
    }
    switchProvider(newProvider);
    break;
    
  case 'push':
    pushSchema();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    // Default: show status and optionally switch
    showStatus();
    if (args[0] && PROVIDERS[args[0]]) {
      console.log(`\n🔄 Switching to ${args[0]}...`);
      switchProvider(args[0]);
    }
}
