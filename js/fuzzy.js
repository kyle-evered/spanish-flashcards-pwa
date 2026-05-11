function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

function expand(str) {
  const variants = [str];

  // Strip leading articles: el, la, los, las, un, una
  const articleMatch = str.match(/^(el|la|los|las|un|una) (.+)$/);
  if (articleMatch) variants.push(articleMatch[2]);

  // Strip leading "to " for verbs
  if (str.startsWith('to ')) variants.push(str.slice(3));

  // Strip leading "to be " for tener expressions (e.g. "to be hungry" → "hungry")
  if (str.startsWith('to be ')) variants.push(str.slice(6));

  // Expand o(a) ending → both "alto" and "alta"
  const oaMatch = str.match(/^(.+?)o\(a\)(.*)$/);
  if (oaMatch) {
    variants.push(oaMatch[1] + 'o' + oaMatch[2]);
    variants.push(oaMatch[1] + 'a' + oaMatch[2]);
  }

  // Also handle plain -o ending → accept -a as well (e.g. user types "alta" for "alto")
  if (!oaMatch && str.endsWith('o')) {
    variants.push(str.slice(0, -1) + 'a');
  }

  return [...new Set(variants)];
}

function gradeAnswer(userAnswer, expected) {
  const u = normalize(userAnswer);
  const baseAlts = expected.replace(/;/g, ',').split(',').map(s => normalize(s.trim())).filter(Boolean);
  const all = [...new Set(baseAlts.flatMap(expand))];

  if (all.includes(u)) return 'correct';

  const tolerance = Math.min(3, Math.floor(Math.max(...all.map(a => a.length)) / 6));
  const minDist = Math.min(...all.map(a => levenshtein(u, a)));

  if (minDist === 0) return 'correct';
  if (minDist <= tolerance) return 'close';
  return 'incorrect';
}

window.gradeAnswer = gradeAnswer;
