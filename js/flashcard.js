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
  let weakPref = false;
  let cardStats = {};

  // Mastery mode
  let mastery = false;
  let masteryQueue = [];
  let masteryQueueIndex = 0;
  let masteryRound = 0;
  let masteryCorrectThisRound = new Set();
  let masteryInitialCount = 0;
  let masteryTotalMastered = 0;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function weightedPick() {
    const weights = pool.map(card => {
      if (weakPref) {
        const s = cardStats[card.id];
        const acc = s ? s.accuracy : 0;
        return 3 - 2 * acc;
      }
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

  async function start({ cards, direction, weakOnly, weakPreferred, focusTags, size, mastery: isMastery }) {
    mode = direction;
    let filtered = [...cards];

    if (weakOnly) {
      const weakIds = new Set(await DB.getWeakCardIds());
      filtered = filtered.filter(c => weakIds.has(c.id));
      if (!filtered.length) { App.showToast('No weak cards yet — keep studying!'); return; }
    }

    if (focusTags && focusTags.length > 0) {
      filtered = filtered.filter(c => focusTags.some(t => c.tags.includes(t)));
      if (!filtered.length) { App.showToast('No cards found for selected tags.'); return; }
    }

    if (!filtered.length) { App.showToast('No cards to study.'); return; }

    weakPref = !!weakPreferred;
    cardStats = weakPref ? await DB.getCardStats() : {};

    mastery = !!isMastery;
    answeredCount = 0;
    results = [];

    if (mastery) {
      const sizeLimit = (size === 'all' || size === 'endless')
        ? filtered.length
        : Math.min(parseInt(size) || 20, filtered.length);
      const deck = shuffle([...filtered]).slice(0, sizeLimit);
      masteryInitialCount = deck.length;
      masteryQueue = deck;
      masteryQueueIndex = 0;
      masteryRound = 1;
      masteryCorrectThisRound = new Set();
      masteryTotalMastered = 0;
      advance();
      return;
    }

    pool = filtered;
    endless = size === 'endless';
    sessionLimit = size === 'all' ? filtered.length : Math.min(parseInt(size) || 20, filtered.length);
    sessionAccuracy = {};
    sessionCounts = {};
    advance();
  }

  function advance() {
    if (mastery) {
      if (masteryQueueIndex >= masteryQueue.length) {
        // End of round: remove mastered cards
        const remaining = masteryQueue.filter(c => !masteryCorrectThisRound.has(c.id));
        masteryTotalMastered += masteryCorrectThisRound.size;
        if (remaining.length === 0) {
          showSummary();
          return;
        }
        masteryQueue = shuffle(remaining);
        masteryQueueIndex = 0;
        masteryRound++;
        masteryCorrectThisRound = new Set();
      }
      currentCard = masteryQueue[masteryQueueIndex++];
      showSpanish = (mode === 'es_to_en') || (mode === 'mix' && answeredCount % 2 === 0);
      renderCard();
      return;
    }

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

    App.setView('flashcard-screen');
    document.getElementById('fc-prompt-lang').textContent = promptLang.toUpperCase();
    document.getElementById('fc-prompt').textContent = prompt;
    document.getElementById('fc-tags').textContent = '';
    document.getElementById('fc-stats').textContent = '';
    document.getElementById('fc-answer').value = '';
    document.getElementById('fc-answer').placeholder = `Type in ${answerLang}…`;
    document.getElementById('fc-answer').disabled = false;
    document.getElementById('fc-feedback').innerHTML = '';
    document.getElementById('fc-btn').textContent = 'Check';
    document.getElementById('fc-btn').onclick = () => checkAnswer();

    if (mastery) {
      document.getElementById('fc-counter').textContent =
        `Round ${masteryRound} · ${masteryQueueIndex} / ${masteryQueue.length}`;
    } else {
      document.getElementById('fc-counter').textContent =
        endless ? `${answeredCount} answered` : `${answeredCount} / ${sessionLimit}`;
    }

    const answerEl = document.getElementById('fc-answer');
    answerEl.setAttribute('enterkeyhint', 'done');
    answerEl.onkeydown = null;
    answerEl.onkeyup = e => { if (e.key === 'Enter') checkAnswer(); };

    const bar = document.getElementById('fc-progress');
    if (mastery) {
      bar.style.display = '';
      bar.value = masteryTotalMastered;
      bar.max = masteryInitialCount;
    } else if (endless) {
      bar.style.display = 'none';
    } else {
      bar.style.display = '';
      bar.value = answeredCount;
      bar.max = sessionLimit;
    }

    startTime = Date.now();
    setTimeout(() => document.getElementById('fc-answer').focus(), 50);

    const cardId = card.id;
    DB.getCardStats().then(stats => {
      if (currentCard.id !== cardId) return;
      const s = stats[cardId];
      if (s && s.total > 0) {
        const pct = Math.round(s.accuracy * 100);
        document.getElementById('fc-stats').textContent =
          `${s.total} attempt${s.total !== 1 ? 's' : ''} · ${pct}% accuracy`;
      }
    });
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

    if (mastery && correct) {
      masteryCorrectThisRound.add(card.id);
    }

    // Update session accuracy (used by weakPref weighting)
    const prev = sessionCounts[card.id] || 0;
    const prevCorrect = Math.round((sessionAccuracy[card.id] || 0) * prev);
    sessionCounts[card.id] = prev + 1;
    sessionAccuracy[card.id] = (prevCorrect + (correct ? 1 : 0)) / (prev + 1);

    if (weakPref) {
      if (!cardStats[card.id]) cardStats[card.id] = { total: 0, correct: 0, accuracy: 0 };
      const cs = cardStats[card.id];
      cs.total++;
      if (correct) cs.correct++;
      cs.accuracy = cs.correct / cs.total;
    }

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
    if (mastery) {
      document.getElementById('summary-text').innerHTML =
        `<p>${masteryInitialCount} cards mastered in ${masteryRound} round${masteryRound !== 1 ? 's' : ''}</p>` +
        `<p style="margin-top:6px;color:var(--muted)">${correct} / ${total} correct overall (${pct}%)</p>`;
    } else {
      document.getElementById('summary-text').textContent = `${correct} / ${total} correct (${pct}%)`;
    }
  }

  return { start };
})();

window.Flashcard = Flashcard;
