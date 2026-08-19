import type { SQLiteDatabase } from 'expo-sqlite';
import { emptyTasteValues, type BeanLot, type BrewSession, type Cup, type Gear, type Recipe, type Satisfaction, type TasteValues } from '@/domain/types';
import { aliasesFor, matchesSearchQuery, normalizeSearchText, relatedAliases } from '@/domain/searchAliases';
import { createId } from '@/utils/id';

type Row = Record<string, string | number | null>;

export type AnalyticsEventName =
  | 'bean_add_started' | 'bean_add_completed' | 'bean_search' | 'bean_photo_added'
  | 'recipe_viewed' | 'recipe_guided_created' | 'recipe_manual_created' | 'recipe_saved'
  | 'brew_started' | 'brew_paused' | 'brew_resumed' | 'brew_step_skipped' | 'brew_completed' | 'brew_abandoned'
  | 'cup_recorded' | 'feedback_submitted' | 'journal_viewed' | 'compare_started' | 'compare_completed'
  | 'taste_profile_viewed' | 'gear_added' | 'gear_custom_created';

export type InventoryEvent = {
  id: string;
  beanId: string;
  cupId: string | null;
  kind: 'brew' | 'adjustment';
  deltaG: number;
  remainingWeightG: number;
  note: string;
  createdAt: string;
};

export async function trackEvent(db: SQLiteDatabase, name: AnalyticsEventName, payload: Record<string, string | number | boolean | null> = {}) {
  await db.runAsync(
    'INSERT INTO analytics_events (name, payload_json, created_at) VALUES (?, ?, ?)',
    name, JSON.stringify(payload), new Date().toISOString(),
  );
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || !value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

const boolean = (value: unknown) => Number(value) === 1;

function beanFromRow(row: Row): BeanLot {
  return {
    id: String(row.id), name: String(row.name), roaster: String(row.roaster), country: String(row.country),
    region: String(row.region), farm: String(row.farm), variety: String(row.variety), process: String(row.process),
    altitude: String(row.altitude), roastDate: row.roast_date ? String(row.roast_date) : null,
    roastLevel: String(row.roast_level) as BeanLot['roastLevel'], initialWeightG: Number(row.initial_weight_g),
    remainingWeightG: Number(row.remaining_weight_g), storageType: String(row.storage_type),
    state: String(row.state) as BeanLot['state'], tastingNotes: parseJson<string[]>(row.tasting_notes_json, []),
    description: String(row.description), imageUri: row.image_uri ? String(row.image_uri) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

function sessionFromRow(row: Row): BrewSession {
  return {
    id: String(row.id), beanId: String(row.bean_id), recipeId: row.recipe_id ? String(row.recipe_id) : null,
    status: String(row.status) as BrewSession['status'], recipeSnapshot: parseJson<Recipe>(row.recipe_snapshot_json, {} as Recipe),
    beanSnapshot: parseJson<BeanLot>(row.bean_snapshot_json, {} as BeanLot), startedAt: Number(row.started_at),
    stepIndex: Number(row.step_index), stepStartedAt: Number(row.step_started_at), pausedAt: row.paused_at == null ? null : Number(row.paused_at),
    pausedDurationMs: Number(row.paused_duration_ms), completedAt: row.completed_at == null ? null : Number(row.completed_at),
    createdAt: String(row.created_at),
  };
}

function cupFromRow(row: Row): Cup {
  return {
    id: String(row.id), brewSessionId: row.brew_session_id ? String(row.brew_session_id) : null,
    beanId: row.bean_id ? String(row.bean_id) : null, kind: String(row.kind) as Cup['kind'], beanName: String(row.bean_name),
    beanSnapshot: parseJson<BeanLot | null>(row.bean_snapshot_json, null),
    recipeSnapshot: parseJson<Recipe | null>(row.recipe_snapshot_json, null),
    satisfaction: row.satisfaction ? String(row.satisfaction) as Satisfaction : null,
    flavorTags: parseJson<string[]>(row.flavor_tags_json, []), taste: parseJson<TasteValues>(row.taste_json, emptyTasteValues()),
    memo: String(row.memo), imageUri: row.image_uri ? String(row.image_uri) : null,
    cafeName: String(row.cafe_name), drinkName: String(row.drink_name),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

function inventoryEventFromRow(row: Row): InventoryEvent {
  return {
    id: String(row.id), beanId: String(row.bean_id), cupId: row.cup_id ? String(row.cup_id) : null,
    kind: String(row.kind) as InventoryEvent['kind'], deltaG: Number(row.delta_g), remainingWeightG: Number(row.remaining_weight_g),
    note: String(row.note), createdAt: String(row.created_at),
  };
}

export async function getSetting(db: SQLiteDatabase, key: string, fallback = ''): Promise<string> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? fallback;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key, value, now,
  );
}

export async function listKnowledge(db: SQLiteDatabase, category: string, query = '') {
  return db.getAllAsync<{ id: string; name: string; parent_name: string | null }>(
    `SELECT id, name, parent_name FROM knowledge_items
     WHERE category = ? AND (? = '' OR name LIKE '%' || ? || '%') ORDER BY name LIMIT 80`,
    category, query, query,
  );
}

export type KnowledgeSearchSuggestion = { id: string; name: string; parentName: string | null; aliases: string[] };

export async function searchKnowledgeSuggestions(db: SQLiteDatabase, category: string, query: string, parentName?: string): Promise<KnowledgeSearchSuggestion[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; parent_name: string | null; aliases_json: string }>(
    `SELECT id, name, parent_name, aliases_json FROM knowledge_items
     WHERE category = ? AND (? = '' OR parent_name = ?) ORDER BY name`,
    category, parentName ?? '', parentName ?? '',
  );
  const normalizedQuery = normalizeSearchText(query);
  return rows.map((row) => ({ id: row.id, name: row.name, parentName: row.parent_name, aliases: parseJson<string[]>(row.aliases_json, []) }))
    .filter((item) => matchesSearchQuery(query, [item.name, ...item.aliases]))
    .sort((a, b) => Number(!normalizeSearchText(a.name).startsWith(normalizedQuery)) - Number(!normalizeSearchText(b.name).startsWith(normalizedQuery)) || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export async function matchKnowledgeFromLabel(db: SQLiteDatabase, label: string) {
  const rows = await db.getAllAsync<{ id: string; category: string; name: string; parent_name: string | null; aliases_json: string }>(
    `SELECT id, category, name, parent_name, aliases_json FROM knowledge_items
     WHERE category IN ('country','region','variety','process') ORDER BY length(name) DESC`,
  );
  const normalized = normalizeSearchText(label);
  return rows.filter((row) => [row.name, ...parseJson<string[]>(row.aliases_json, [])].some((term) => normalized.includes(normalizeSearchText(term))));
}

export type BeanSearchSuggestion = { bean: BeanLot; matchedBy: string };

export type BeanTemplateSuggestion = { id: string; name: string; country: string; region: string; variety: string; process: string; aliases: string[]; description: string };

export const defaultBeanTemplateSuggestions: BeanTemplateSuggestion[] = [
  { id: 'template-ethiopia-yirgacheffe-washed', name: '예가체프 워시드', country: 'Ethiopia', region: 'Yirgacheffe', variety: 'Heirloom', process: 'Washed', aliases: ['Ethiopia Yirgacheffe Washed', '에티오피아 예가체프 워시드'], description: 'Ethiopia · Yirgacheffe · Washed' },
  { id: 'template-ethiopia-guji-natural', name: '구지 내추럴', country: 'Ethiopia', region: 'Guji', variety: 'Heirloom', process: 'Natural', aliases: ['Ethiopia Guji Natural', '에티오피아 구지 내추럴'], description: 'Ethiopia · Guji · Natural' },
  { id: 'template-colombia-huila-washed', name: '우일라 워시드', country: 'Colombia', region: 'Huila', variety: 'Castillo', process: 'Washed', aliases: ['Colombia Huila Washed', '콜롬비아 우일라 워시드'], description: 'Colombia · Huila · Washed' },
  { id: 'template-guatemala-antigua-washed', name: '안티구아 워시드', country: 'Guatemala', region: 'Antigua', variety: 'Bourbon', process: 'Washed', aliases: ['Guatemala Antigua Washed', '과테말라 안티구아 워시드'], description: 'Guatemala · Antigua · Washed' },
  { id: 'template-kenya-nyeri-washed', name: '니에리 워시드', country: 'Kenya', region: 'Nyeri', variety: 'SL28', process: 'Washed', aliases: ['Kenya Nyeri Washed', '케냐 니에리 워시드'], description: 'Kenya · Nyeri · Washed' },
  { id: 'template-brazil-cerrado-natural', name: '세하도 내추럴', country: 'Brazil', region: 'Cerrado Mineiro', variety: 'Mundo Novo', process: 'Natural', aliases: ['Brazil Cerrado Natural', '브라질 세하도 내추럴'], description: 'Brazil · Cerrado Mineiro · Natural' },
];

export async function searchBeanTemplateSuggestions(db: SQLiteDatabase, query = ''): Promise<BeanTemplateSuggestion[]> {
  let rows: { id: string; name: string; country: string; region: string; variety: string; process: string; aliases_json: string; description: string }[] = [];
  try {
    rows = await db.getAllAsync<{ id: string; name: string; country: string; region: string; variety: string; process: string; aliases_json: string; description: string }>('SELECT * FROM bean_templates ORDER BY name');
  } catch {
    // The first render can precede a local schema migration. The curated fallback keeps search usable.
  }
  const normalizedQuery = normalizeSearchText(query);
  const templates = rows.length ? rows.map((row) => ({ id: row.id, name: row.name, country: row.country, region: row.region, variety: row.variety, process: row.process, aliases: parseJson<string[]>(row.aliases_json, []), description: row.description })) : defaultBeanTemplateSuggestions;
  return templates
    .filter((item) => !query || matchesSearchQuery(query, [item.name, item.country, item.region, item.variety, item.process, ...item.aliases, ...relatedAliases([item.name, item.country, item.region, item.variety, item.process].join(' '))]))
    .sort((a, b) => Number(!normalizeSearchText(a.name).startsWith(normalizedQuery)) - Number(!normalizeSearchText(b.name).startsWith(normalizedQuery)) || a.name.localeCompare(b.name))
    .slice(0, 5);
}

/** Searches only saved beans. Equipment and the knowledge catalog never enter these results. */
export async function searchBeanSuggestions(db: SQLiteDatabase, query: string, excludedId?: string): Promise<BeanSearchSuggestion[]> {
  const beans = await listBeans(db, true);
  const results = beans.flatMap((bean) => {
    const terms = [bean.name, bean.roaster, bean.country, bean.region, bean.variety, bean.process, ...relatedAliases([bean.name, bean.roaster, bean.country, bean.region, bean.variety, bean.process].join(' ')), ...aliasesFor(bean.country), ...aliasesFor(bean.region), ...aliasesFor(bean.variety), ...aliasesFor(bean.process)];
    const matchedBy = terms.find((term) => matchesSearchQuery(query, [term]));
    return bean.id !== excludedId && matchedBy ? [{ bean, matchedBy }] : [];
  });
  const normalizedQuery = normalizeSearchText(query);
  return results.sort((a, b) => {
    const aName = normalizeSearchText(a.bean.name);
    const bName = normalizeSearchText(b.bean.name);
    return Number(!aName.startsWith(normalizedQuery)) - Number(!bName.startsWith(normalizedQuery)) || b.bean.updatedAt.localeCompare(a.bean.updatedAt);
  }).slice(0, 5);
}

export async function listCatalogGear(db: SQLiteDatabase, category?: Gear['category']): Promise<Gear[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT id, category, name, brand, metadata_json FROM equipment_catalog
     WHERE (? IS NULL OR category = ?) ORDER BY category, brand, name`,
    category ?? null, category ?? null,
  );
  return rows.map((row) => ({
    id: String(row.id), category: String(row.category) as Gear['category'], name: String(row.name), brand: String(row.brand),
    isPrimary: false, isCustom: false, metadata: parseJson(row.metadata_json, {}),
  }));
}

export async function listUserGear(db: SQLiteDatabase): Promise<Gear[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM user_equipment ORDER BY category, is_primary DESC, name');
  return rows.map((row) => ({
    id: String(row.id), category: String(row.category) as Gear['category'], name: String(row.name), brand: String(row.brand),
    isPrimary: boolean(row.is_primary), isCustom: boolean(row.is_custom), metadata: parseJson(row.metadata_json, {}),
  }));
}

export type GearSearchSuggestion = { gear: Gear; matchedBy: string };

/** Searches only the equipment catalog; user-owned equipment is intentionally excluded to prevent duplicates. */
export async function searchGearSuggestions(db: SQLiteDatabase, category: Gear['category'], query: string, ownedNames: string[]): Promise<GearSearchSuggestion[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT id, category, name, brand, metadata_json, aliases_json FROM equipment_catalog WHERE category = ? ORDER BY brand, name`,
    category,
  );
  const owned = new Set(ownedNames.map(normalizeSearchText));
  const results = rows.flatMap((row) => {
    const gear: Gear = { id: String(row.id), category: String(row.category) as Gear['category'], name: String(row.name), brand: String(row.brand), isPrimary: false, isCustom: false, metadata: parseJson(row.metadata_json, {}) };
    if (owned.has(normalizeSearchText(gear.name))) return [];
    const terms = [gear.name, gear.brand, ...parseJson<string[]>(row.aliases_json, [])];
    const matchedBy = terms.find((term) => matchesSearchQuery(query, [term]));
    return matchedBy ? [{ gear, matchedBy }] : [];
  });
  const normalizedQuery = normalizeSearchText(query);
  return results.sort((a, b) => Number(!normalizeSearchText(a.gear.name).startsWith(normalizedQuery)) - Number(!normalizeSearchText(b.gear.name).startsWith(normalizedQuery))).slice(0, 5);
}

export async function addUserGear(db: SQLiteDatabase, gear: Omit<Gear, 'id'>): Promise<Gear> {
  const id = createId('gear');
  if (gear.isPrimary) await db.runAsync('UPDATE user_equipment SET is_primary = 0 WHERE category = ?', gear.category);
  await db.runAsync(
    `INSERT INTO user_equipment (id, category, name, brand, is_primary, is_custom, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, gear.category, gear.name, gear.brand, gear.isPrimary ? 1 : 0, gear.isCustom ? 1 : 0,
    JSON.stringify(gear.metadata), new Date().toISOString(),
  );
  await trackEvent(db, gear.isCustom ? 'gear_custom_created' : 'gear_added', { category: gear.category });
  return { ...gear, id };
}

export async function setPrimaryGear(db: SQLiteDatabase, id: string, category: Gear['category']) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE user_equipment SET is_primary=0 WHERE category=?', category);
    await db.runAsync('UPDATE user_equipment SET is_primary=1 WHERE id=? AND category=?', id, category);
  });
}

export async function renameUserGear(db: SQLiteDatabase, id: string, name: string) {
  const normalized = name.trim();
  if (!normalized) throw new Error('장비 이름을 입력해주세요.');
  await db.runAsync('UPDATE user_equipment SET name=? WHERE id=? AND is_custom=1', normalized, id);
}

export async function deleteUserGear(db: SQLiteDatabase, id: string) {
  await db.withTransactionAsync(async () => {
    const target = await db.getFirstAsync<{ category: Gear['category']; is_primary: number }>(
      'SELECT category, is_primary FROM user_equipment WHERE id=?', id,
    );
    if (!target) return;
    await db.runAsync('DELETE FROM user_equipment WHERE id=?', id);
    if (Number(target.is_primary) === 1) {
      const next = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM user_equipment WHERE category=? ORDER BY created_at, name LIMIT 1', target.category,
      );
      if (next) await db.runAsync('UPDATE user_equipment SET is_primary=1 WHERE id=?', next.id);
    }
  });
}

export async function listBeans(db: SQLiteDatabase, includeArchived = false): Promise<BeanLot[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM beans WHERE (? = 1 OR state != 'archived') ORDER BY updated_at DESC`, includeArchived ? 1 : 0,
  );
  return rows.map(beanFromRow);
}

export async function getBean(db: SQLiteDatabase, id: string): Promise<BeanLot | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM beans WHERE id = ?', id);
  return row ? beanFromRow(row) : null;
}

export type BeanDraft = Omit<BeanLot, 'id' | 'createdAt' | 'updatedAt'>;

export async function createBean(db: SQLiteDatabase, draft: BeanDraft): Promise<BeanLot> {
  const id = createId('bean');
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO beans (
      id, name, roaster, country, region, farm, variety, process, altitude, roast_date, roast_level,
      initial_weight_g, remaining_weight_g, storage_type, state, tasting_notes_json, description, image_uri,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, draft.name.trim(), draft.roaster.trim(), draft.country.trim(), draft.region.trim(), draft.farm.trim(),
    draft.variety.trim(), draft.process.trim(), draft.altitude.trim(), draft.roastDate, draft.roastLevel,
    draft.initialWeightG, draft.remainingWeightG, draft.storageType, draft.state,
    JSON.stringify(draft.tastingNotes), draft.description.trim(), draft.imageUri, now, now,
  );
  await trackEvent(db, 'bean_add_completed', { bean_id: id, entry: 'manual' });
  return { ...draft, id, createdAt: now, updatedAt: now };
}

export async function updateBean(db: SQLiteDatabase, bean: BeanLot): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE beans SET name=?, roaster=?, country=?, region=?, farm=?, variety=?, process=?, altitude=?, roast_date=?,
      roast_level=?, initial_weight_g=?, remaining_weight_g=?, storage_type=?, state=?, tasting_notes_json=?,
      description=?, image_uri=?, updated_at=? WHERE id=?`,
    bean.name, bean.roaster, bean.country, bean.region, bean.farm, bean.variety, bean.process, bean.altitude,
    bean.roastDate, bean.roastLevel, bean.initialWeightG, bean.remainingWeightG, bean.storageType, bean.state,
    JSON.stringify(bean.tastingNotes), bean.description, bean.imageUri, now, bean.id,
  );
}

export async function adjustBeanInventory(db: SQLiteDatabase, beanId: string, remainingWeightG: number) {
  const nextWeight = Number(remainingWeightG.toFixed(1));
  if (!Number.isFinite(nextWeight) || nextWeight < 0 || nextWeight > 10000) throw new Error('남은 양을 0g부터 10,000g 사이로 입력해주세요.');
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<Row>('SELECT * FROM beans WHERE id=?', beanId);
    if (!row) throw new Error('원두를 찾지 못했어요.');
    const bean = beanFromRow(row);
    const deltaG = Number((nextWeight - bean.remainingWeightG).toFixed(1));
    if (deltaG === 0) return;
    const now = new Date().toISOString();
    const state = nextWeight === 0 ? 'finished' : bean.state === 'finished' ? 'opened' : bean.state;
    await db.runAsync('UPDATE beans SET remaining_weight_g=?, state=?, updated_at=? WHERE id=?', nextWeight, state, now, beanId);
    await db.runAsync(
      `INSERT INTO inventory_events (id, bean_id, cup_id, kind, delta_g, remaining_weight_g, note, created_at)
       VALUES (?, ?, NULL, 'adjustment', ?, ?, '', ?)`,
      createId('inventory'), beanId, deltaG, nextWeight, now,
    );
  });
}

export async function listInventoryEvents(db: SQLiteDatabase, beanId: string): Promise<InventoryEvent[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM inventory_events WHERE bean_id=? ORDER BY created_at DESC', beanId);
  return rows.map(inventoryEventFromRow);
}

export async function archiveBean(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `UPDATE beans
     SET archived_from_state=CASE WHEN state='archived' THEN archived_from_state ELSE state END,
         state='archived', updated_at=?
     WHERE id=?`,
    new Date().toISOString(), id,
  );
}

export async function restoreBean(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `UPDATE beans SET state=COALESCE(archived_from_state, 'unspecified'), archived_from_state=NULL, updated_at=? WHERE id=?`,
    new Date().toISOString(), id,
  );
}

export async function deleteBean(db: SQLiteDatabase, id: string) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM inventory_events WHERE bean_id=?', id);
    await db.runAsync('UPDATE cups SET bean_id=NULL, brew_session_id=NULL WHERE bean_id=?', id);
    await db.runAsync('UPDATE recipes SET archived=1, bean_id=NULL, updated_at=? WHERE bean_id=?', new Date().toISOString(), id);
    await db.runAsync('DELETE FROM brew_sessions WHERE bean_id=?', id);
    await db.runAsync('DELETE FROM beans WHERE id=?', id);
  });
}

export async function saveRecipe(db: SQLiteDatabase, recipe: Recipe): Promise<void> {
  const now = new Date().toISOString();
  const stored = { ...recipe, updatedAt: now };
  const existed = await db.getFirstAsync<{ id: string }>('SELECT id FROM recipes WHERE id=?', recipe.id);
  await db.runAsync(
    `INSERT INTO recipes (id, bean_id, type, name, recipe_json, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET bean_id=excluded.bean_id, type=excluded.type, name=excluded.name,
       recipe_json=excluded.recipe_json, version=excluded.version, archived=0, updated_at=excluded.updated_at`,
    stored.id, stored.beanId, stored.type, stored.name, JSON.stringify(stored), stored.ruleVersion, stored.createdAt, now,
  );
  await trackEvent(db, 'recipe_saved', { recipe_id: recipe.id, type: recipe.type });
  if (!existed && recipe.type === 'manual') await trackEvent(db, 'recipe_manual_created', { recipe_id: recipe.id });
}

export async function getRecipe(db: SQLiteDatabase, id: string): Promise<Recipe | null> {
  const row = await db.getFirstAsync<{ recipe_json: string }>('SELECT recipe_json FROM recipes WHERE id=? AND archived=0', id);
  return row ? parseJson<Recipe>(row.recipe_json, null as never) : null;
}

export async function listRecipes(db: SQLiteDatabase, beanId?: string): Promise<Recipe[]> {
  const rows = await db.getAllAsync<{ recipe_json: string }>(
    `SELECT recipe_json FROM recipes WHERE archived=0 AND (? IS NULL OR bean_id=?) ORDER BY updated_at DESC`,
    beanId ?? null, beanId ?? null,
  );
  return rows.map((row) => parseJson<Recipe>(row.recipe_json, null as never)).filter(Boolean);
}

export async function deleteRecipe(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE recipes SET archived=1, updated_at=? WHERE id=?', new Date().toISOString(), id);
}

export async function duplicateRecipe(db: SQLiteDatabase, recipe: Recipe): Promise<Recipe> {
  const now = new Date().toISOString();
  const copy = { ...recipe, id: createId('recipe'), name: `${recipe.name} 복사본`, type: 'manual' as const, createdAt: now, updatedAt: now };
  await saveRecipe(db, copy);
  return copy;
}

export async function startBrew(db: SQLiteDatabase, bean: BeanLot, recipe: Recipe, now = Date.now()): Promise<BrewSession> {
  const session: BrewSession = {
    id: createId('brew'), beanId: bean.id, recipeId: recipe.id, status: 'ready', recipeSnapshot: recipe,
    beanSnapshot: bean, startedAt: now, stepIndex: 0, stepStartedAt: now, pausedAt: null,
    pausedDurationMs: 0, completedAt: null, createdAt: new Date(now).toISOString(),
  };
  await db.runAsync(
    `INSERT INTO brew_sessions (id, bean_id, recipe_id, status, recipe_snapshot_json, bean_snapshot_json,
      started_at, step_index, step_started_at, paused_at, paused_duration_ms, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.beanId, session.recipeId, session.status, JSON.stringify(recipe), JSON.stringify(bean),
    session.startedAt, session.stepIndex, session.stepStartedAt, null, 0, null, session.createdAt,
  );
  return session;
}

export async function getBrewSession(db: SQLiteDatabase, id: string): Promise<BrewSession | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM brew_sessions WHERE id=?', id);
  return row ? sessionFromRow(row) : null;
}

export async function getInterruptedBrew(db: SQLiteDatabase): Promise<BrewSession | null> {
  const row = await db.getFirstAsync<Row>(
    `SELECT * FROM brew_sessions WHERE status IN ('ready','active','paused') ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? sessionFromRow(row) : null;
}

export async function updateBrewSession(db: SQLiteDatabase, session: BrewSession) {
  const previous = await db.getFirstAsync<{ status: string; step_index: number }>('SELECT status, step_index FROM brew_sessions WHERE id=?', session.id);
  await db.runAsync(
    `UPDATE brew_sessions SET status=?, started_at=?, step_index=?, step_started_at=?, paused_at=?, paused_duration_ms=?, completed_at=? WHERE id=?`,
    session.status, session.startedAt, session.stepIndex, session.stepStartedAt, session.pausedAt, session.pausedDurationMs,
    session.completedAt, session.id,
  );
  if (previous?.status === 'ready' && session.status === 'active') await trackEvent(db, 'brew_started', { brew_id: session.id, recipe_type: session.recipeSnapshot.type });
  if (previous?.status !== session.status && session.status === 'paused') await trackEvent(db, 'brew_paused', { brew_id: session.id });
  if (previous?.status === 'paused' && session.status === 'active') await trackEvent(db, 'brew_resumed', { brew_id: session.id });
  if (previous && session.stepIndex > previous.step_index) await trackEvent(db, 'brew_step_skipped', { brew_id: session.id, step: session.stepIndex });
}

export async function abandonBrew(db: SQLiteDatabase, id: string) {
  await db.runAsync(`UPDATE brew_sessions SET status='abandoned' WHERE id=? AND status!='completed'`, id);
  await trackEvent(db, 'brew_abandoned', { brew_id: id });
}

export async function completeBrew(db: SQLiteDatabase, sessionId: string, completedAt = Date.now()): Promise<Cup> {
  let completedCup: Cup | null = null;
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<Row>('SELECT * FROM cups WHERE brew_session_id=?', sessionId);
    if (existing) {
      completedCup = cupFromRow(existing);
      return;
    }
    const row = await db.getFirstAsync<Row>('SELECT * FROM brew_sessions WHERE id=?', sessionId);
    if (!row) throw new Error('브루잉 세션을 찾을 수 없어요.');
    const session = sessionFromRow(row);
    const beanRow = await db.getFirstAsync<Row>('SELECT * FROM beans WHERE id=?', session.beanId);
    if (!beanRow) throw new Error('원두를 찾을 수 없어요.');
    const currentBean = beanFromRow(beanRow);
    const nextWeight = Math.max(0, Number((currentBean.remainingWeightG - session.recipeSnapshot.doseG).toFixed(1)));
    const nextState = nextWeight === 0 ? 'finished' : currentBean.state === 'unspecified' ? 'opened' : currentBean.state;
    const nowIso = new Date(completedAt).toISOString();
    const cup: Cup = {
      id: createId('cup'), brewSessionId: sessionId, beanId: session.beanId, kind: 'home',
      beanName: session.beanSnapshot.name, beanSnapshot: session.beanSnapshot, recipeSnapshot: session.recipeSnapshot,
      satisfaction: null, flavorTags: [], taste: emptyTasteValues(), memo: '', imageUri: null, cafeName: '', drinkName: '',
      createdAt: nowIso, updatedAt: nowIso,
    };
    await db.runAsync(
      `UPDATE brew_sessions SET status='completed', completed_at=? WHERE id=?`, completedAt, sessionId,
    );
    await db.runAsync(
      `UPDATE beans SET remaining_weight_g=?, state=?, updated_at=? WHERE id=?`, nextWeight, nextState, nowIso, session.beanId,
    );
    await db.runAsync(
      `INSERT INTO cups (id, brew_session_id, bean_id, kind, bean_name, bean_snapshot_json, recipe_snapshot_json,
        satisfaction, flavor_tags_json, taste_json, memo, image_uri, cafe_name, drink_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      cup.id, cup.brewSessionId, cup.beanId, cup.kind, cup.beanName, JSON.stringify(cup.beanSnapshot),
      JSON.stringify(cup.recipeSnapshot), null, '[]', JSON.stringify(cup.taste), '', null, '', '', nowIso, nowIso,
    );
    await db.runAsync(
      `INSERT INTO inventory_events (id, bean_id, cup_id, kind, delta_g, remaining_weight_g, note, created_at)
       VALUES (?, ?, ?, 'brew', ?, ?, '', ?)`,
      createId('inventory'), session.beanId, cup.id, -session.recipeSnapshot.doseG, nextWeight, nowIso,
    );
    await trackEvent(db, 'brew_completed', { brew_id: sessionId, cup_id: cup.id });
    await trackEvent(db, 'cup_recorded', { cup_id: cup.id, kind: 'home' });
    completedCup = cup;
  });
  if (!completedCup) throw new Error('완료 기록을 만들지 못했어요.');
  return completedCup;
}

export async function recordCupFeedback(
  db: SQLiteDatabase,
  cupId: string,
  feedback: { satisfaction: Satisfaction; flavorTags: string[]; taste: TasteValues; memo: string; imageUri: string | null },
) {
  await db.runAsync(
    `UPDATE cups SET satisfaction=?, flavor_tags_json=?, taste_json=?, memo=?, image_uri=?, updated_at=? WHERE id=?`,
    feedback.satisfaction, JSON.stringify(feedback.flavorTags), JSON.stringify(feedback.taste), feedback.memo, feedback.imageUri,
    new Date().toISOString(), cupId,
  );
  await trackEvent(db, 'feedback_submitted', { cup_id: cupId, satisfaction: feedback.satisfaction });
}

export async function updateCafeCup(
  db: SQLiteDatabase,
  cupId: string,
  input: Pick<Cup, 'beanName' | 'cafeName' | 'drinkName' | 'satisfaction' | 'flavorTags' | 'memo' | 'imageUri'>,
) {
  await db.runAsync(
    `UPDATE cups
     SET bean_name=?, cafe_name=?, drink_name=?, satisfaction=?, flavor_tags_json=?, memo=?, image_uri=?, updated_at=?
     WHERE id=? AND kind='cafe'`,
    input.beanName, input.cafeName, input.drinkName, input.satisfaction,
    JSON.stringify(input.flavorTags), input.memo, input.imageUri, new Date().toISOString(), cupId,
  );
}

export async function deleteCup(db: SQLiteDatabase, cupId: string) {
  await db.runAsync('DELETE FROM cups WHERE id=?', cupId);
}

export async function createCafeCup(
  db: SQLiteDatabase,
  input: { beanName: string; cafeName: string; drinkName: string; satisfaction: Satisfaction; flavorTags: string[]; memo: string; imageUri: string | null },
): Promise<Cup> {
  const now = new Date().toISOString();
  const cup: Cup = {
    id: createId('cup'), brewSessionId: null, beanId: null, kind: 'cafe', beanName: input.beanName,
    beanSnapshot: null, recipeSnapshot: null, satisfaction: input.satisfaction, flavorTags: input.flavorTags,
    taste: emptyTasteValues(), memo: input.memo, imageUri: input.imageUri, cafeName: input.cafeName, drinkName: input.drinkName,
    createdAt: now, updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO cups (id, brew_session_id, bean_id, kind, bean_name, bean_snapshot_json, recipe_snapshot_json,
      satisfaction, flavor_tags_json, taste_json, memo, image_uri, cafe_name, drink_name, created_at, updated_at)
     VALUES (?, NULL, NULL, 'cafe', ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    cup.id, cup.beanName, cup.satisfaction, JSON.stringify(cup.flavorTags), JSON.stringify(cup.taste), cup.memo,
    cup.imageUri, cup.cafeName, cup.drinkName, now, now,
  );
  await trackEvent(db, 'cup_recorded', { cup_id: cup.id, kind: 'cafe' });
  return cup;
}

export async function getCup(db: SQLiteDatabase, id: string): Promise<Cup | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM cups WHERE id=?', id);
  return row ? cupFromRow(row) : null;
}

export async function listCups(db: SQLiteDatabase, filters?: { kind?: Cup['kind']; beanId?: string }): Promise<Cup[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM cups WHERE (? IS NULL OR kind=?) AND (? IS NULL OR bean_id=?) ORDER BY created_at DESC`,
    filters?.kind ?? null, filters?.kind ?? null, filters?.beanId ?? null, filters?.beanId ?? null,
  );
  return rows.map(cupFromRow);
}
