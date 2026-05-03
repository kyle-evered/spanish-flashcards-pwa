const DB_NAME = 'SpanishTutor';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('cards')) {
        const cards = db.createObjectStore('cards', { keyPath: 'id' });
        cards.createIndex('spanish', 'spanish', { unique: false });
      }
      if (!db.objectStoreNames.contains('results')) {
        const results = db.createObjectStore('results', { keyPath: 'id' });
        results.createIndex('card_id', 'card_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function uuid() {
  return crypto.randomUUID();
}

function tx(storeName, mode = 'readonly') {
  return _db.transaction(storeName, mode).objectStore(storeName);
}

function all(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(store, obj) {
  return new Promise((resolve, reject) => {
    const req = store.put(obj);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function del(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Cards ──────────────────────────────────────────────────────────────────

async function getAllCards() {
  await openDB();
  const cards = await all(tx('cards'));
  return cards.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function createCard({ spanish, english, notes = '', tags = [] }) {
  await openDB();
  const card = { id: uuid(), spanish, english, notes, tags, created_at: new Date().toISOString() };
  await put(tx('cards', 'readwrite'), card);
  return card;
}

async function updateCard(id, fields) {
  await openDB();
  const store = tx('cards', 'readwrite');
  const card = await new Promise((res, rej) => {
    const r = store.get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const updated = { ...card, ...fields };
  await put(tx('cards', 'readwrite'), updated);
  return updated;
}

async function deleteCard(id) {
  await openDB();
  await del(tx('cards', 'readwrite'), id);
}

async function bulkCreateCards(pairs) {
  await openDB();
  const existing = await getAllCards();
  const existingSpanish = new Set(existing.map(c => c.spanish.toLowerCase()));
  let imported = 0, skipped = 0;
  for (const p of pairs) {
    if (!p.spanish || !p.english) { skipped++; continue; }
    if (existingSpanish.has(p.spanish.toLowerCase())) { skipped++; continue; }
    await createCard(p);
    existingSpanish.add(p.spanish.toLowerCase());
    imported++;
  }
  return { imported, skipped };
}

async function removeDuplicates() {
  await openDB();
  const cards = await getAllCards();
  const seen = new Map();
  const toDelete = [];
  for (const card of cards) {
    const key = card.spanish.toLowerCase();
    if (seen.has(key)) toDelete.push(card.id);
    else seen.set(key, card.id);
  }
  for (const id of toDelete) await deleteCard(id);
  return toDelete.length;
}

// ── Results ────────────────────────────────────────────────────────────────

async function recordResult(cardId, correct, responseMs) {
  await openDB();
  await put(tx('results', 'readwrite'), {
    id: uuid(), card_id: cardId, correct, response_ms: responseMs,
    answered_at: new Date().toISOString()
  });
}

async function getAllResults() {
  await openDB();
  return all(tx('results'));
}

async function getCardStats() {
  const results = await getAllResults();
  const stats = {};
  for (const r of results) {
    if (!stats[r.card_id]) stats[r.card_id] = { total: 0, correct: 0 };
    stats[r.card_id].total++;
    if (r.correct) stats[r.card_id].correct++;
  }
  for (const id in stats) {
    stats[id].accuracy = stats[id].correct / stats[id].total;
  }
  return stats;
}

async function getWeakCardIds(minAttempts = 2) {
  const stats = await getCardStats();
  return Object.entries(stats)
    .filter(([, s]) => s.total >= minAttempts && s.accuracy < 0.75)
    .sort(([, a], [, b]) => a.accuracy - b.accuracy)
    .map(([id]) => id);
}

// ── Settings ───────────────────────────────────────────────────────────────

async function getSetting(key) {
  await openDB();
  return new Promise((resolve, reject) => {
    const r = tx('settings').get(key);
    r.onsuccess = () => resolve(r.result ? r.result.value : null);
    r.onerror = () => reject(r.error);
  });
}

async function setSetting(key, value) {
  await openDB();
  await put(tx('settings', 'readwrite'), { key, value });
}

window.DB = {
  getAllCards, createCard, updateCard, deleteCard, bulkCreateCards, removeDuplicates,
  recordResult, getCardStats, getWeakCardIds,
  getSetting, setSetting
};
