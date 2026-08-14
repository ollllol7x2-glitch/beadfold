const boilerplate = /^(coffee|specialty coffee|roasted coffee|원두커피|스페셜티 커피|net wt|내용량|roasted in|product of)$/i;

export function parseBeanLabelText(value) {
  const fullText = value.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const lines = fullText.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const roastDate = firstMatch(fullText, [
    /(?:roast(?:ed)?\s*date|roasting\s*date|로스팅\s*날짜|로스팅일)\s*[:：]?\s*(20\d{2}[./-]\d{1,2}[./-]\d{1,2})/i,
    /\b(20\d{2}[./-]\d{1,2}[./-]\d{1,2})\b/,
  ]);
  const roastLevel = detectRoastLevel(fullText);
  const roaster = firstMatch(fullText, [/(?:roaster|roasted\s*by|로스터|로스팅\s*회사)\s*[:：]?\s*([^\n]{2,64})/i]);
  const notes = firstMatch(fullText, [/(?:tasting\s*notes?|flavour\s*notes?|flavor\s*notes?|notes?|테이스팅\s*노트|향미)\s*[:：]?\s*([^\n]{2,100})/i]);
  const beanName = firstMatch(fullText, [/(?:coffee\s*name|bean\s*name|원두명|커피명)\s*[:：]?\s*([^\n]{2,80})/i]) ?? guessBeanName(lines);

  const candidates = compact({
    beanName,
    roaster: cleanValue(roaster),
    roastDate: normalizeDate(roastDate),
    roastLevel,
    tastingNotes: notes ? cleanValue(notes).split(/[,/·]/).map((note) => note.trim()).filter((note) => note.length > 1).slice(0, 6) : undefined,
  });
  const populated = Object.values(candidates).filter(Boolean).length;
  return { fullText, confidence: Math.min(0.95, 0.35 + populated * 0.12 + Math.min(lines.length, 6) * 0.03), candidates };
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] ?? match[0];
  }
  return undefined;
}

function detectRoastLevel(text) {
  const normalized = text.toLowerCase();
  if (/중강배전|medium\s*-?\s*dark/.test(normalized)) return 'medium-dark';
  if (/중약배전|medium\s*-?\s*light/.test(normalized)) return 'medium-light';
  if (/약배전|light\s*roast/.test(normalized)) return 'light';
  if (/중배전|medium\s*roast/.test(normalized)) return 'medium';
  if (/강배전|dark\s*roast/.test(normalized)) return 'dark';
  return undefined;
}

function guessBeanName(lines) {
  return lines.find((line) => {
    const normalized = line.toLowerCase();
    return line.length >= 3 && line.length <= 60 && !boilerplate.test(normalized) && !/\d{2,}|https?:|www\.|@/.test(normalized);
  });
}

function normalizeDate(value) {
  if (!value) return undefined;
  const parts = value.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
  return parts ? `${parts[1]}-${parts[2].padStart(2, '0')}-${parts[3].padStart(2, '0')}` : undefined;
}

function cleanValue(value) {
  return value?.replace(/\s+/g, ' ').replace(/[|]/g, ' ').trim();
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ''));
}
