const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_URL = "postgresql://florentpostgree:laureenqWeR55t@212.227.84.152:5432/contentpropostgree";
const DATE = "2026-03-20"; // Hardcoded as per user request
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

async function runBackup() {
  console.log("--- STARTING BACKUP ---");
  
  try {
    // 1. Database Backup
    console.log("Dumping database...");
    const sqlFile = path.join(BACKUP_DIR, `db_backup_${DATE}.sql`);
    // Note: We use pg_dump. If not in path, it might fail.
    try {
      execSync(`pg_dump "${DB_URL}" > "${sqlFile}"`);
      console.log("DB Backup Success:", sqlFile);
    } catch (e) {
      console.error("pg_dump failed. Make sure postgres tools are installed.");
      console.error(e.message);
    }

    // 2. Code Backup
    console.log("Squeezing code into ZIP...");
    const zipFile = path.join(BACKUP_DIR, `code_backup_${DATE}.zip`);
    // Using powershell's Compress-Archive for windows compatibility
    const exclude = [".next", "node_modules", ".git", "backups", "tmp"].join("','");
    const psCommand = `powershell -Command "Get-ChildItem -Path . -Exclude '${exclude}' | Compress-Archive -DestinationPath '${zipFile}' -Force"`;
    
    console.log("Running compression...");
    execSync(psCommand, { cwd: path.join(__dirname, '..') });
    console.log("Code Backup Success:", zipFile);

    console.log("--- BACKUP COMPLETED LOCALLY ---");
    console.log("Location:", BACKUP_DIR);
    
  } catch (err) {
    console.error("Backup process failed:", err.message);
  }
}

runBackup();
