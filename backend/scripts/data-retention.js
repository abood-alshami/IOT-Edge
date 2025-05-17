// Data Retention and Archiving Script for sensor_data
// Usage: node backend/scripts/data-retention.js [--months=N] [--archive] [--dry-run]

import { query } from '../utils/database.js';
import process from 'process';

// Parse CLI arguments
const args = process.argv.slice(2);
let months = 12;
let archive = false;
let dryRun = false;

args.forEach(arg => {
  if (arg.startsWith('--months=')) months = parseInt(arg.split('=')[1], 10);
  if (arg === '--archive') archive = true;
  if (arg === '--dry-run') dryRun = true;
});

const retentionDate = new Date();
retentionDate.setMonth(retentionDate.getMonth() - months);
const retentionDateStr = retentionDate.toISOString().slice(0, 19).replace('T', ' ');

async function main() {
  try {
    if (archive) {
      // Archive mode: move old records to sensor_data_archive, then delete
      console.log(`[INFO] Archiving sensor_data older than ${months} months (before ${retentionDateStr})`);
      if (!dryRun) {
        // Create archive table if not exists
        await query(`CREATE TABLE IF NOT EXISTS sensor_data_archive LIKE sensor_data`);
        // Insert old records into archive
        const insertRes = await query(
          `INSERT INTO sensor_data_archive SELECT * FROM sensor_data WHERE timestamp < ?`,
          [retentionDateStr]
        );
        console.log(`[INFO] Archived ${insertRes.affectedRows || 0} records.`);
      } else {
        const count = await query(`SELECT COUNT(*) as cnt FROM sensor_data WHERE timestamp < ?`, [retentionDateStr]);
        console.log(`[DRY RUN] Would archive ${count[0].cnt} records.`);
      }
    }
    // Delete old records
    console.log(`[INFO] Deleting sensor_data older than ${months} months (before ${retentionDateStr})`);
    if (!dryRun) {
      const delRes = await query(`DELETE FROM sensor_data WHERE timestamp < ?`, [retentionDateStr]);
      console.log(`[INFO] Deleted ${delRes.affectedRows || 0} records.`);
    } else {
      const count = await query(`SELECT COUNT(*) as cnt FROM sensor_data WHERE timestamp < ?`, [retentionDateStr]);
      console.log(`[DRY RUN] Would delete ${count[0].cnt} records.`);
    }
    console.log('[DONE] Data retention/archiving complete.');
  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  }
}

main(); 