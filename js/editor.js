const Editor = (() => {
  let allCards = [];
  let editingId = null;

  async function load() {
    allCards = await DB.getAllCards();
    render();
  }

  function render() {
    const search = document.getElementById('editor-search').value.toLowerCase();
    const tagFilter = document.getElementById('editor-tag-filter').value;

    const filtered = allCards.filter(c =>
      (!search || c.spanish.toLowerCase().includes(search) || c.english.toLowerCase().includes(search)) &&
      (!tagFilter || c.tags.includes(tagFilter))
    );

    // Update tag filter options
    const allTags = [...new Set(allCards.flatMap(c => c.tags))].sort();
    const tagSelect = document.getElementById('editor-tag-filter');
    const currentVal = tagSelect.value;
    tagSelect.innerHTML = '<option value="">All tags</option>' +
      allTags.map(t => `<option value="${t}" ${t === currentVal ? 'selected' : ''}>${t}</option>`).join('');

    document.getElementById('editor-count').textContent = `${filtered.length} cards`;

    const list = document.getElementById('card-list');
    list.innerHTML = filtered.map(card => `
      <div class="card-row" data-id="${card.id}">
        <div class="card-row-main">
          <span class="card-spanish">${card.spanish}</span>
          <span class="card-arrow">→</span>
          <span class="card-english">${card.english}</span>
          ${card.tags.length ? `<span class="card-tags">${card.tags.map(t => `<span class="tag">${t}</span>`).join('')}</span>` : ''}
        </div>
        <div class="card-row-actions">
          <button onclick="Editor.edit('${card.id}')" class="btn-sm">Edit</button>
          <button onclick="Editor.remove('${card.id}')" class="btn-sm btn-danger">✕</button>
        </div>
      </div>
    `).join('');
  }

  function showAddForm() {
    editingId = null;
    document.getElementById('card-form-title').textContent = 'Add Card';
    document.getElementById('card-form-spanish').value = '';
    document.getElementById('card-form-english').value = '';
    document.getElementById('card-form-tags').value = '';
    document.getElementById('card-form-notes').value = '';
    document.getElementById('card-form-modal').style.display = 'flex';
    document.getElementById('card-form-spanish').focus();
  }

  async function edit(id) {
    editingId = id;
    const card = allCards.find(c => c.id === id);
    if (!card) return;
    document.getElementById('card-form-title').textContent = 'Edit Card';
    document.getElementById('card-form-spanish').value = card.spanish;
    document.getElementById('card-form-english').value = card.english;
    document.getElementById('card-form-tags').value = card.tags.join(', ');
    document.getElementById('card-form-notes').value = card.notes;
    document.getElementById('card-form-modal').style.display = 'flex';
  }

  async function save() {
    const spanish = document.getElementById('card-form-spanish').value.trim();
    const english = document.getElementById('card-form-english').value.trim();
    if (!spanish || !english) return;
    const tags = document.getElementById('card-form-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const notes = document.getElementById('card-form-notes').value.trim();

    if (editingId) {
      await DB.updateCard(editingId, { spanish, english, tags, notes });
    } else {
      await DB.createCard({ spanish, english, tags, notes });
    }
    closeForm();
    await load();
  }

  function closeForm() {
    document.getElementById('card-form-modal').style.display = 'none';
  }

  async function remove(id) {
    if (!confirm('Delete this card?')) return;
    await DB.deleteCard(id);
    await load();
  }

  async function handleImport(file) {
    try {
      const { imported, skipped } = await importCSV(file);
      let msg = `Imported ${imported} card${imported !== 1 ? 's' : ''}.`;
      if (skipped) msg += ` Skipped ${skipped} duplicate${skipped !== 1 ? 's' : ''}.`;
      App.showToast(msg);
      await load();
    } catch (e) {
      App.showToast('Import failed: ' + e.message);
    }
  }

  async function handleRemoveDupes() {
    const count = await DB.removeDuplicates();
    if (count === 0) { App.showToast('No duplicates found.'); return; }
    if (confirm(`Found ${count} duplicate(s). Remove them?`)) {
      App.showToast(`Removed ${count} duplicate(s).`);
      await load();
    }
  }

  return { load, render, showAddForm, edit, save, closeForm, remove, handleImport, handleRemoveDupes };
})();

window.Editor = Editor;
