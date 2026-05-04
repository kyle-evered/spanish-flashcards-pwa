const Feedback = (() => {
  function esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function showModal(id) { document.getElementById(id).style.display = 'flex'; }
  function hideModal(id) { document.getElementById(id).style.display = 'none'; }

  async function submit() {
    const text = document.getElementById('feedback-text').value.trim();
    if (!text) return;
    await DB.addFeedback(text);
    hideModal('feedback-modal');
    App.showToast('Thanks for the feedback!');
  }

  async function showAdmin() {
    const entries = await DB.getAllFeedback();
    const list = document.getElementById('admin-feedback-list');
    if (!entries.length) {
      list.innerHTML = '<p style="color:var(--muted)">No feedback yet.</p>';
    } else {
      list.innerHTML = [...entries].reverse().map(e => `
        <div style="border-bottom:1px solid var(--border);padding:10px 0">
          <div style="font-size:0.75rem;color:var(--muted)">${new Date(e.ts).toLocaleString()}</div>
          <div style="margin-top:4px;white-space:pre-wrap">${esc(e.text)}</div>
        </div>`).join('');
    }
    showModal('admin-modal');
  }

  function download(entries) {
    const body = entries.map(e =>
      `[${new Date(e.ts).toLocaleString()}]\n${e.text}`
    ).join('\n\n---\n\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })),
      download: 'feedback.txt'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    document.getElementById('feedback-btn').onclick = () => {
      document.getElementById('feedback-text').value = '';
      showModal('feedback-modal');
      setTimeout(() => document.getElementById('feedback-text').focus(), 50);
    };
    document.getElementById('feedback-cancel').onclick = () => hideModal('feedback-modal');
    document.getElementById('feedback-submit').onclick = submit;
    document.getElementById('admin-close').onclick = () => hideModal('admin-modal');
    document.getElementById('admin-download').onclick = async () =>
      download(await DB.getAllFeedback());

    // Tap logo 5 times quickly to open admin panel
    let taps = 0, timer;
    document.querySelector('.nav-logo').addEventListener('click', () => {
      clearTimeout(timer);
      if (++taps >= 5) { taps = 0; showAdmin(); return; }
      timer = setTimeout(() => { taps = 0; }, 2000);
    });
  }

  return { init };
})();
