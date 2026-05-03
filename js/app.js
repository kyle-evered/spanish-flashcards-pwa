const App = (() => {
  const views = ['study-setup', 'flashcard-screen', 'summary-screen', 'cards-view'];

  function setView(id) {
    views.forEach(v => document.getElementById(v).style.display = v === id ? '' : 'none');
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function setNav(id) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  async function init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }

    // Nav
    document.getElementById('nav-study').onclick = () => { setNav('nav-study'); showStudySetup(); };
    document.getElementById('nav-cards').onclick = () => { setNav('nav-cards'); showCards(); };

    // Study setup
    document.getElementById('start-btn').onclick = startSession;

    // Flashcard
    document.getElementById('fc-exit').onclick = () => setView('study-setup');

    // Summary
    document.getElementById('summary-again').onclick = () => setView('study-setup');

    // Cards
    document.getElementById('add-card-btn').onclick = Editor.showAddForm;
    document.getElementById('import-btn').onclick = () => document.getElementById('csv-input').click();
    document.getElementById('csv-input').onchange = e => {
      if (e.target.files[0]) Editor.handleImport(e.target.files[0]);
      e.target.value = '';
    };
    document.getElementById('remove-dupes-btn').onclick = Editor.handleRemoveDupes;
    document.getElementById('editor-search').oninput = Editor.render;
    document.getElementById('editor-tag-filter').onchange = Editor.render;
    document.getElementById('card-form-save').onclick = Editor.save;
    document.getElementById('card-form-cancel').onclick = Editor.closeForm;

    showStudySetup();
    await seedIfEmpty();
    await showStudySetup(); // refresh after seed so tags populate
  }

  async function showStudySetup() {
    setNav('nav-study');
    setView('study-setup');
    const cards = await DB.getAllCards();
    const tags = [...new Set(cards.flatMap(c => c.tags))].sort();
    const tagSelect = document.getElementById('tag-select');
    tagSelect.innerHTML = tags.map(t => `<option value="${t}">${t}</option>`).join('');
    document.getElementById('study-card-count').textContent = `${cards.length} cards available`;

    const total = cards.length;
    document.getElementById('size-all-label').textContent = `All (${total})`;
  }

  async function startSession() {
    const cards = await DB.getAllCards();
    const direction = document.querySelector('input[name="direction"]:checked').value;
    const weakOnly = document.getElementById('weak-toggle').checked;
    const tagSelect = document.getElementById('tag-select');
    const focusTags = [...tagSelect.selectedOptions].map(o => o.value);
    const size = document.querySelector('input[name="size"]:checked').value;
    await Flashcard.start({ cards, direction, weakOnly, focusTags, size });
  }

  async function showCards() {
    setView('cards-view');
    await Editor.load();
  }

  return { setView, showToast, init };
})();

document.addEventListener('DOMContentLoaded', App.init);
window.App = App;