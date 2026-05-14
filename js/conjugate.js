const Conjugate = (() => {
  const PRONOUNS = ['yo', 'tú', 'él/ella/Ud.', 'nosotros(as)', 'ellos(as)/Uds.'];
  let queue = [];
  let current = 0;
  let correct = 0;
  let answered = false;

  function load() {
    const sel = document.getElementById('conj-verb-select');
    sel.innerHTML = CONJUGATION_DATA.map(v =>
      `<option value="${v.infinitive}">${v.infinitive} — ${v.english}</option>`
    ).join('');
  }

  function start() {
    const sel = document.getElementById('conj-verb-select');
    const chosen = [...sel.selectedOptions].map(o => o.value);
    const verbs = chosen.length
      ? CONJUGATION_DATA.filter(v => chosen.includes(v.infinitive))
      : CONJUGATION_DATA;

    const sizeVal = document.querySelector('input[name="conj-size"]:checked').value;

    const all = [];
    for (const verb of verbs) {
      for (const pronoun of PRONOUNS) {
        all.push({ verb, pronoun, form: verb.forms[pronoun] });
      }
    }

    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    const size = sizeVal === 'all' ? all.length : Math.min(parseInt(sizeVal), all.length);
    queue = all.slice(0, size);
    current = 0;
    correct = 0;
    answered = false;

    App.setView('conjugate-screen');
    renderCard();
  }

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  function renderCard() {
    const item = queue[current];
    document.getElementById('conj-verb-display').textContent = `${item.verb.infinitive} — ${item.verb.english}`;
    document.getElementById('conj-pronoun').textContent = item.pronoun;
    document.getElementById('conj-counter').textContent = `${current + 1} / ${queue.length}`;
    document.getElementById('conj-progress').value = current;
    document.getElementById('conj-progress').max = queue.length;
    document.getElementById('conj-answer').value = '';
    document.getElementById('conj-answer').disabled = false;
    document.getElementById('conj-feedback').innerHTML = '';
    document.getElementById('conj-btn').textContent = 'Check';
    document.getElementById('conj-btn').onclick = handleBtn;
    answered = false;

    const answerEl = document.getElementById('conj-answer');
    answerEl.onkeyup = e => { if (e.key === 'Enter') handleBtn(); };
    setTimeout(() => answerEl.focus(), 50);
  }

  function handleBtn() {
    if (answered) {
      current++;
      if (current >= queue.length) showSummary();
      else renderCard();
      return;
    }

    const item = queue[current];
    const userAnswer = document.getElementById('conj-answer').value.trim();
    const isCorrect = norm(userAnswer) === norm(item.form);

    if (isCorrect) correct++;

    const color = isCorrect ? 'var(--green)' : 'var(--red)';
    const label = isCorrect ? '✓ Correct' : '✗ Incorrect';
    document.getElementById('conj-feedback').innerHTML = `
      <div style="color:${color};font-weight:700;font-size:1.1rem">${label}</div>
      <div style="font-size:1.4rem;font-weight:700;margin-top:6px">${item.form}</div>
    `;

    document.getElementById('conj-answer').disabled = true;
    document.getElementById('conj-btn').textContent = current + 1 < queue.length ? 'Next →' : 'Finish';
    answered = true;

    const answerEl = document.getElementById('conj-answer');
    answerEl.onkeyup = e => { if (e.key === 'Enter') handleBtn(); };
  }

  function showSummary() {
    App.setView('conjugate-summary');
    const pct = queue.length ? Math.round(correct / queue.length * 100) : 0;
    document.getElementById('conj-summary-text').innerHTML =
      `<p>${correct} / ${queue.length} correct (${pct}%)</p>`;
  }

  return { load, start };
})();

window.Conjugate = Conjugate;
