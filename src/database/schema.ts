import type { SQLiteDatabase } from 'expo-sqlite';

const countries = [
  'Ethiopia', 'Kenya', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda', 'DR Congo', 'Yemen',
  'Brazil', 'Colombia', 'Peru', 'Bolivia', 'Ecuador', 'Venezuela', 'Costa Rica', 'Panama',
  'Guatemala', 'El Salvador', 'Honduras', 'Nicaragua', 'Mexico', 'Dominican Republic',
  'Jamaica', 'Haiti', 'India', 'Indonesia', 'Vietnam', 'Thailand', 'China', 'Papua New Guinea',
];

const regions: Record<string, string[]> = {
  Ethiopia: ['Guji', 'Yirgacheffe', 'Sidama', 'Jimma', 'Limu', 'Harrar'],
  Kenya: ['Nyeri', 'Kirinyaga', 'Embu', 'Kiambu', 'Murang’a'],
  Rwanda: ['Nyamasheke', 'Huye', 'Gakenke', 'Karongi'],
  Burundi: ['Kayanza', 'Ngozi', 'Muyinga'],
  Brazil: ['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Mantiqueira de Minas'],
  Colombia: ['Huila', 'Nariño', 'Cauca', 'Tolima', 'Antioquia', 'Sierra Nevada'],
  Peru: ['Cajamarca', 'Cusco', 'Junín'],
  Panama: ['Boquete', 'Volcán', 'Renacimiento'],
  Guatemala: ['Antigua', 'Huehuetenango', 'Atitlán', 'Cobán'],
  CostaRica: ['Tarrazú', 'West Valley', 'Central Valley'],
  Indonesia: ['Aceh Gayo', 'Toraja', 'Java', 'Flores'],
};

const varieties = [
  'Arabica', 'Typica', 'Bourbon', 'Caturra', 'Catuai', 'Catimor', 'SL28', 'SL34', 'Ruiru 11',
  'Batian', 'Gesha', 'Pacamara', 'Maragogipe', 'Mundo Novo', 'Yellow Bourbon', 'Pink Bourbon',
  '74110', '74112', 'Heirloom', 'Castillo', 'Colombia', 'Tabi', 'Java', 'Wush Wush', 'Sidra',
];

const processes = [
  'Washed', 'Natural', 'Honey', 'Yellow Honey', 'Red Honey', 'Black Honey', 'Pulped Natural',
  'Wet Hulled', 'Anaerobic Natural', 'Anaerobic Washed', 'Carbonic Maceration', 'Thermal Shock',
];

const flavors = [
  'Floral', 'Jasmine', 'Rose', 'Bergamot', 'Black tea', 'Fruity', 'Peach', 'Apricot', 'Apple',
  'Pear', 'Orange', 'Lemon', 'Lime', 'Grapefruit', 'Berry', 'Strawberry', 'Blueberry', 'Cherry',
  'Grape', 'Tropical', 'Mango', 'Pineapple', 'Juicy', 'Sweet', 'Honey', 'Brown sugar', 'Caramel',
  'Chocolate', 'Cocoa', 'Clean', 'Creamy', 'Nutty', 'Almond', 'Hazelnut', 'Roasty', 'Funky',
  'Spice', 'Cinnamon', 'Vanilla', 'Herbal', 'Stone fruit', 'Citrus', 'Dried fruit', 'Molasses',
];

const equipment = [
  ['grinder', 'Comandante C40', 'Comandante', '{"range":"stepped"}'],
  ['grinder', 'Timemore C2', 'Timemore', '{"range":"stepped"}'],
  ['grinder', '1Zpresso ZP6', '1Zpresso', '{"range":"stepped"}'],
  ['grinder', 'Fellow Ode Gen 2', 'Fellow', '{"range":"stepped"}'],
  ['dripper', 'Hario V60 02', 'Hario', '{"flow":"fast","capacity":500}'],
  ['dripper', 'Kalita Wave 185', 'Kalita', '{"flow":"slow","capacity":500}'],
  ['dripper', 'Origami M', 'Origami', '{"flow":"fast","capacity":500}'],
  ['dripper', 'April Brewer', 'April', '{"flow":"medium","capacity":500}'],
  ['filter', 'V60 Paper 02', 'Hario', '{"resistance":"medium"}'],
  ['filter', 'CAFEC Abaca', 'CAFEC', '{"resistance":"low"}'],
  ['filter', 'Kalita Wave 185 Paper', 'Kalita', '{"resistance":"medium"}'],
  ['kettle', 'Fellow Stagg EKG', 'Fellow', '{"temperature_control":true}'],
  ['kettle', 'Brewista Artisan', 'Brewista', '{"temperature_control":true}'],
  ['scale', 'Hario Drip Scale', 'Hario', '{"timer":true}'],
  ['scale', 'Acaia Pearl', 'Acaia', '{"timer":true}'],
  ['water', 'Balanced Water', 'BEANFOLD', '{"hardness":"balanced","tds":90}'],
  ['water', 'Soft Water', 'BEANFOLD', '{"hardness":"soft","tds":50}'],
  ['water', 'Mineral-rich Water', 'BEANFOLD', '{"hardness":"hard","tds":140}'],
] as const;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events(created_at DESC);

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_name TEXT,
      aliases_json TEXT NOT NULL DEFAULT '[]',
      verification_status TEXT NOT NULL DEFAULT 'verified',
      source_type TEXT NOT NULL DEFAULT 'curated',
      UNIQUE(category, name, parent_name)
    );

    CREATE INDEX IF NOT EXISTS knowledge_category_name_idx
      ON knowledge_items(category, name);

    CREATE TABLE IF NOT EXISTS equipment_catalog (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      verification_status TEXT NOT NULL DEFAULT 'curated'
    );

    CREATE TABLE IF NOT EXISTS user_equipment (
      id TEXT PRIMARY KEY NOT NULL,
      catalog_id TEXT REFERENCES equipment_catalog(id),
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      is_primary INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS beans (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      roaster TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      farm TEXT NOT NULL DEFAULT '',
      variety TEXT NOT NULL DEFAULT '',
      process TEXT NOT NULL DEFAULT '',
      altitude TEXT NOT NULL DEFAULT '',
      roast_date TEXT,
      roast_level TEXT NOT NULL,
      initial_weight_g REAL NOT NULL,
      remaining_weight_g REAL NOT NULL,
      storage_type TEXT NOT NULL DEFAULT 'bag',
      state TEXT NOT NULL DEFAULT 'opened',
      tasting_notes_json TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      image_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS beans_state_updated_idx ON beans(state, updated_at DESC);

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY NOT NULL,
      bean_id TEXT REFERENCES beans(id),
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      recipe_json TEXT NOT NULL,
      version TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS recipes_bean_idx ON recipes(bean_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS brew_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      bean_id TEXT NOT NULL REFERENCES beans(id),
      recipe_id TEXT REFERENCES recipes(id),
      status TEXT NOT NULL,
      recipe_snapshot_json TEXT NOT NULL,
      bean_snapshot_json TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      step_index INTEGER NOT NULL DEFAULT 0,
      step_started_at INTEGER NOT NULL,
      paused_at INTEGER,
      paused_duration_ms INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS brew_status_idx ON brew_sessions(status, started_at DESC);

    CREATE TABLE IF NOT EXISTS cups (
      id TEXT PRIMARY KEY NOT NULL,
      brew_session_id TEXT UNIQUE REFERENCES brew_sessions(id),
      bean_id TEXT REFERENCES beans(id),
      kind TEXT NOT NULL,
      bean_name TEXT NOT NULL,
      bean_snapshot_json TEXT,
      recipe_snapshot_json TEXT,
      satisfaction TEXT,
      flavor_tags_json TEXT NOT NULL DEFAULT '[]',
      taste_json TEXT NOT NULL DEFAULT '{}',
      memo TEXT NOT NULL DEFAULT '',
      cafe_name TEXT NOT NULL DEFAULT '',
      drink_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS cups_created_idx ON cups(created_at DESC);
    CREATE INDEX IF NOT EXISTS cups_bean_idx ON cups(bean_id, created_at DESC);
  `);

  const cupColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(cups)');
  if (!cupColumns.some((column) => column.name === 'image_uri')) {
    await db.execAsync('ALTER TABLE cups ADD COLUMN image_uri TEXT;');
  }

  const legacyTaste = JSON.stringify({ acidity: 3, sweetness: 3, body: 3, bitterness: 3, aroma: 3, aftertaste: 3, balance: 3 });
  const emptyTaste = JSON.stringify({ acidity: null, sweetness: null, body: null, bitterness: null, aroma: null, aftertaste: null, balance: null });
  await db.runAsync('UPDATE cups SET taste_json=? WHERE taste_json=?', emptyTaste, legacyTaste);

  await seedDatabase(db);
}

async function seedKnowledge(db: SQLiteDatabase, category: string, items: string[], parentName: string | null = null) {
  for (const name of items) {
    const id = `${category}-${(parentName ? `${parentName}-` : '')}${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.runAsync(
      `INSERT OR IGNORE INTO knowledge_items (id, category, name, parent_name) VALUES (?, ?, ?, ?)`,
      id, category, name, parentName,
    );
  }
}

async function seedDatabase(db: SQLiteDatabase) {
  const seeded = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_meta WHERE key = 'seed_version'`);
  if (seeded?.value === '2') return;

  await db.withTransactionAsync(async () => {
    await seedKnowledge(db, 'country', countries);
    for (const [country, items] of Object.entries(regions)) await seedKnowledge(db, 'region', items, country);
    await seedKnowledge(db, 'variety', varieties);
    await seedKnowledge(db, 'process', processes);
    await seedKnowledge(db, 'flavor', flavors);
    await seedKnowledge(db, 'roast', ['light', 'medium-light', 'medium', 'medium-dark', 'dark']);

    for (const [category, name, brand, metadata] of equipment) {
      const id = `catalog-${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await db.runAsync(
        `INSERT OR IGNORE INTO equipment_catalog (id, category, name, brand, metadata_json) VALUES (?, ?, ?, ?, ?)`,
        id, category, name, brand, metadata,
      );
    }
    await db.runAsync(
      `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('onboarding_complete', 'false', ?)`,
      new Date().toISOString(),
    );
    await db.runAsync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', '2')`);
  });
}
