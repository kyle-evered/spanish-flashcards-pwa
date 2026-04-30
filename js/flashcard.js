const Flashcard = (() => {
  let pool = [];
  let endless = false;
  let sessionLimit = 0;
  let answeredCount = 0;
  let sessionAccuracy = {};
  let sessionCounts = {};
  let currentCard = null;
  let showSpanish = true;
  let startTime = 0;
  let results = [];
  let mode = 'mix';

  function weightedPick() {
    const weights = pool.map(card => {
      const acc = sessionAccuracy[card.id];
      return acc === undefined ? 2.0 : (1.0 - acc + 0.1);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  async function start({ cards, direction, focus, focusTags, size }) {
    mode = direction;
    let filtered = [...cards];

    if (focus === 'weak') {
      const weakIds = new Set(await DB.getWeakCardIds());
      filtered = cards.filter(c => weakIds.has(c.id));
      if (!filtered.length) { App.showToast('No weak cards yet — keep studying!'); return; }
    } else if (focus === 'tag' && focusTags && focusTags.length > 0) {
      filtered = cards.filter(c => focusTags.some(t => c.tags.includes(t)));
      if (!filtered.length) { App.showToast('No cards found for selected tags.'); return; }
    }

    if (!filtered.length) { App.showToast('No cards to study.'); return; }

    pool = filtered;
    endless = size === 'endless';
    sessionLimit = size === 'all' ? filtered.length : Math.min(parseInt(size) || 20, filtered.length);
    answeredCount = 0;
    results = [];
    sessionAccuracy = {};
    sessionCounts = {};

    advance();
  }

  function advance() {
    if (!endless && answeredCount >= sessionLimit) {
      showSummary();
      return;
    }
    currentCard = weightedPick();
    showSpanish = (mode === 'es_to_en') || (mode === 'mix' && answeredCount % 2 === 0);
    renderCard();
  }

  function renderCard() {
    const card = currentCard;
    const prompt = showSpanish ? card.spanish : card.english;
    const promptLang = showSpanish ? 'Spanish' : 'English';
    const answerLang = showSpanish ? 'English' : 'Spanish';
    const progress = endless ? '' : `${answeredCount} / ${sessionLimit}`;

    App.setView('flashcard-screen');
    document.getElementById('fc-prompt-lang').textContent = promptLang.toUpperCase();
    document.getElementById('fc-prompt').textContent = prompt;
    document.getElementById('fc-tags').textContent = '';
    document.getElementById('fc-answer').value = '';
    document.getElementById('fc-answer').placeholder = `Type in ${answerLang}…`;
    document.getElementById('fc-answer').disabled = false;
    document.getElementById('fc-counter').textContent = endless ? `${answeredCount} answered` : progress;
    document.getElementById('fc-feedback').innerHTML = '';
    document.getElementById('fc-btn').textContent = 'Check';
    document.getElementById('fc-btn').onclick = () => checkAnswer();

    const answerEl = document.getElementById('fc-answer');
    answerEl.setAttribute('enterkeyhint', 'done');
    answerEl.onkeydown = null;
    answerEl.onkeyup = e => { if (e.key === 'Enter') checkAnswer(); };

    // Progress bar
    const bar = document.getElementById('fc-progress');
    if (endless) { bar.style.display = 'none'; }
    else { bar.style.display = ''; bar.value = answeredCount; bar.max = sessionLimit; }

    startTime = Date.now();
    setTimeout(() => document.getElementById('fc-answer').focus(), 50);
  }

  async function checkAnswer() {
    const card = currentCard;
    const expected = showSpanish ? card.english : card.spanish;
    const user = document.getElementById('fc-answer').value.trim();
    const result = user ? gradeAnswer(user, expected) : 'incorrect';
    const ms = Date.now() - startTime;
    const correct = result === 'correct' || result === 'close';

    await DB.recordResult(card.id, correct, ms);
    results.push({ card_id: card.id, correct });
    answeredCount++;

    // Update session accuracy
    const prev = sessionCounts[card.id] || 0;
    const prevCorrect = Math.round((sessionAccuracy[card.id] || 0) * prev);
    sessionCounts[card.id] = prev + 1;
    sessionAccuracy[card.id] = (prevCorrect + (correct ? 1 : 0)) / (prev + 1);

    // Feedback
    const colors = { correct: '#4caf7d', close: '#e0b84a', incorrect: '#e05c5c' };
    const labels = { correct: '✓ Correct', close: '≈ Close', incorrect: '✗ Incorrect' };
    document.getElementById('fc-feedback').innerHTML = `
      <div style="color:${colors[result]};font-weight:700;font-size:1.1rem">${labels[result]}</div>
      <div style="font-size:1.4rem;font-weight:700;margin-top:6px">${expected}</div>
      ${card.notes ? `<div style="color:gray;font-size:0.9rem;margin-top:4px">${card.notes}</div>` : ''}
    `;

    document.getElementById('fc-answer').disabled = true;
    document.getElementById('fc-btn').textContent = 'Next →';
    document.getElementById('fc-btn').onclick = () => advance();
    const ans = document.getElementById('fc-answer');
    ans.onkeydown = null;
    ans.onkeyup = e => { if (e.key === 'Enter') advance(); };
  }

  function showSummary() {
    const total = results.length;
    const correct = results.filter(r => r.correct).length;
    const pct = total ? Math.round(correct / total * 100) : 0;
    App.setView('summary-screen');
    document.getElementById('summary-text').textContent = `${correct} / ${total} correct (${pct}%)`;
  }

  return { start };
})();

window.Flashcard = Flashcard;