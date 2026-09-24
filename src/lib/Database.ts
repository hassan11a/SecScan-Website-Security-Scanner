import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'scanner.db');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    scan_id TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER,
    status TEXT NOT NULL DEFAULT 'in-progress',
    security_score INTEGER,
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    informational_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    findings TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_scans_scan_id ON scans(scan_id);
  CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
`);

export interface ScanRecord {
  id: string;
  scan_id: string;
  url: string;
  normalized_url: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  status: 'completed' | 'failed' | 'in-progress';
  security_score: number | null;
  total_checks: number;
  passed_checks: number;
  informational_count: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  findings: string | null;
  created_at: string;
}

export function createScan(record: Omit<ScanRecord, 'id' | 'created_at'>): string {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO scans (id, scan_id, url, normalized_url, start_time, end_time, duration, status, security_score, total_checks, passed_checks, informational_count, low_count, medium_count, high_count, findings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    record.scan_id,
    record.url,
    record.normalized_url,
    record.start_time,
    record.end_time,
    record.duration,
    record.status,
    record.security_score,
    record.total_checks,
    record.passed_checks,
    record.informational_count,
    record.low_count,
    record.medium_count,
    record.high_count,
    record.findings
  );
  return id;
}

export function updateScan(scanId: string, updates: Partial<ScanRecord>): void {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(scanId);
  
  const stmt = db.prepare(`UPDATE scans SET ${fields} WHERE scan_id = ?`);
  stmt.run(...values);
}

export function getScanByScanId(scanId: string): ScanRecord | null {
  const stmt = db.prepare('SELECT * FROM scans WHERE scan_id = ?');
  return stmt.get(scanId) as ScanRecord | null;
}

export function getScanById(id: string): ScanRecord | null {
  const stmt = db.prepare('SELECT * FROM scans WHERE id = ?');
  return stmt.get(id) as ScanRecord | null;
}

export function getAllScans(limit = 50, offset = 0): ScanRecord[] {
  const stmt = db.prepare('SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?');
  return stmt.all(limit, offset) as ScanRecord[];
}

export function getScansCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM scans');
  return (stmt.get() as { count: number }).count;
}

export function deleteScan(scanId: string): void {
  const stmt = db.prepare('DELETE FROM scans WHERE scan_id = ?');
  stmt.run(scanId);
}

export default db;