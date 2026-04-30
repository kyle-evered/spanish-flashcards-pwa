function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function gradeAnswer(userAnswer, expected) {
  const u = normalize(userAnswer);
  const alternatives = expected.replace(/;/g, ',').split(',').map(s => normalize(s.trim())).filter(Boolean);
  const stripped = alternatives.map(a => a.startsWith('to ') ? a.slice(3) : a);
  const all = [...new Set([...alternatives, ...stripped])];

  if (all.includes(u)) return 'correct';

  const tolerance = Math.min(3, Math.floor(Math.max(...all.map(a => a.length)) / 6));
  const minDist = Math.min(...all.map(a => levenshtein(u, a)));

  if (minDist === 0) return 'correct';
  if (minDist <= tolerance) return 'close';
  return 'incorrect';
}

window.gradeAnswer = gradeAnswer;
