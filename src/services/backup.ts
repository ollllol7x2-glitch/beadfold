import type { SQLiteDatabase } from 'expo-sqlite';

type BackupValue = string | number | null;
type BackupRow = Record<string, BackupValue>;

const backupTables = {
  settings: ['key', 'value', 'updated_at'],
  user_equipment: ['id', 'catalog_id', 'category', 'name', 'brand', 'is_primary', 'is_custom', 'metadata_json', 'created_at'],
  beans: ['id', 'name', 'roaster', 'country', 'region', 'farm', 'variety', 'process', 'altitude', 'roast_date', 'roast_level', 'initial_weight_g', 'remaining_weight_g', 'storage_type', 'state', 'archived_from_state', 'tasting_notes_json', 'description', 'image_uri', 'created_at', 'updated_at'],
  recipes: ['id', 'bean_id', 'type', 'name', 'recipe_json', 'version', 'archived', 'created_at', 'updated_at'],
  brew_sessions: ['id', 'bean_id', 'recipe_id', 'status', 'recipe_snapshot_json', 'bean_snapshot_json', 'started_at', 'step_index', 'step_started_at', 'paused_at', 'paused_duration_ms', 'completed_at', 'created_at'],
  cups: ['id', 'brew_session_id', 'bean_id', 'kind', 'bean_name', 'bean_snapshot_json', 'recipe_snapshot_json', 'satisfaction', 'flavor_tags_json', 'taste_json', 'memo', 'image_uri', 'cafe_name', 'drink_name', 'created_at', 'updated_at'],
  inventory_events: ['id', 'bean_id', 'cup_id', 'kind', 'delta_g', 'remaining_weight_g', 'note', 'created_at'],
} as const;

type BackupTable = keyof typeof backupTables;
type BackupData = { [K in BackupTable]: BackupRow[] };

export type BackupArchive = {
  format: 'beanfold-backup';
  version: 1;
  exportedAt: string;
  data: BackupData;
};

export type BackupSummary = Record<BackupTable, number>;

const tableNames = Object.keys(backupTables) as BackupTable[];

function isBackupValue(value: unknown): value is BackupValue {
  return value == null || typeof value === 'string' || typeof value === 'number';
}

function rowForTable(value: unknown, table: BackupTable): BackupRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${table} 데이터 형식이 올바르지 않아요.`);
  const row = value as Record<string, unknown>;
  const clean: BackupRow = {};
  for (const column of backupTables[table]) {
    const field = row[column];
    if (field === undefined || !isBackupValue(field)) throw new Error(`${table} 데이터에 필요한 값이 없어요.`);
    clean[column] = field;
  }
  return clean;
}

export function parseBackupArchive(source: string): BackupArchive {
  let parsed: unknown;
  try { parsed = JSON.parse(source); } catch { throw new Error('백업 파일을 읽을 수 없어요.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('BEANFOLD 백업 파일이 아니에요.');
  const archive = parsed as Partial<BackupArchive>;
  if (archive.format !== 'beanfold-backup' || archive.version !== 1 || !archive.data || typeof archive.data !== 'object') throw new Error('지원하지 않는 백업 파일이에요.');
  const data = {} as BackupData;
  for (const table of tableNames) {
    const rows = (archive.data as Partial<BackupData>)[table];
    if (!Array.isArray(rows)) throw new Error(`${table} 데이터가 빠져 있어요.`);
    data[table] = rows.map((row) => rowForTable(row, table));
  }
  return { format: 'beanfold-backup', version: 1, exportedAt: typeof archive.exportedAt === 'string' ? archive.exportedAt : '', data };
}

export function summarizeBackup(archive: BackupArchive): BackupSummary {
  return Object.fromEntries(tableNames.map((table) => [table, archive.data[table].length])) as BackupSummary;
}

export async function createBackupArchive(db: SQLiteDatabase): Promise<BackupArchive> {
  const data = {} as BackupData;
  for (const table of tableNames) {
    const columns = backupTables[table].join(', ');
    data[table] = await db.getAllAsync<BackupRow>(`SELECT ${columns} FROM ${table}`);
  }
  return { format: 'beanfold-backup', version: 1, exportedAt: new Date().toISOString(), data };
}

export async function restoreBackupArchive(db: SQLiteDatabase, archive: BackupArchive): Promise<BackupSummary> {
  const validated = parseBackupArchive(JSON.stringify(archive));
  await db.withTransactionAsync(async () => {
    for (const table of [...tableNames].reverse()) await db.runAsync(`DELETE FROM ${table}`);
    for (const table of tableNames) {
      const columns = backupTables[table];
      const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of validated.data[table]) await db.runAsync(statement, ...columns.map((column) => row[column]!));
    }
  });
  return summarizeBackup(validated);
}
