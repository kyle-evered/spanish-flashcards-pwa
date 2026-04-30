function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const pairs = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = cols[idx] || '');
    if (!row.spanish || !row.english) continue;
    pairs.push({
      spanish: row.spanish,
      english: row.english,
      notes: row.notes || '',
      tags: row.tags ? row.tags.split('|').map(t => t.trim()).filter(Boolean) : [],
    });
  }
  return pairs;
}

async function importCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const pairs = parseCSV(e.target.result);
        const result = await DB.bulkCreateCards(pairs);
        resolve(result);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

window.importCSV = importCSV;
