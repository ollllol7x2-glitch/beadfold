/** Korean and English search terms resolve to the same curated coffee item. */
export const searchAliases: Record<string, string[]> = {
  Ethiopia: ['에티오피아'], Kenya: ['케냐'], Rwanda: ['르완다'], Burundi: ['부룬디'], Tanzania: ['탄자니아'], Uganda: ['우간다'], 'DR Congo': ['콩고', '콩고민주공화국'], Yemen: ['예멘'],
  Brazil: ['브라질'], Colombia: ['콜롬비아'], Peru: ['페루'], Bolivia: ['볼리비아'], Ecuador: ['에콰도르'], Venezuela: ['베네수엘라'], 'Costa Rica': ['코스타리카'], Panama: ['파나마'],
  Guatemala: ['과테말라'], 'El Salvador': ['엘살바도르'], Honduras: ['온두라스'], Nicaragua: ['니카라과'], Mexico: ['멕시코'], 'Dominican Republic': ['도미니카공화국'],
  Jamaica: ['자메이카'], Haiti: ['아이티'], India: ['인도'], Indonesia: ['인도네시아'], Vietnam: ['베트남'], Thailand: ['태국'], China: ['중국'], 'Papua New Guinea': ['파푸아뉴기니'],
  Guji: ['구지'], Yirgacheffe: ['예가체프'], Sidama: ['시다마'], Harrar: ['하라르'], Antigua: ['안티구아'], Huehuetenango: ['우에우에테낭고'], Atitlán: ['아티틀란'], Cobán: ['코반'],
  Arabica: ['아라비카'], Typica: ['티피카'], Bourbon: ['버번'], Caturra: ['카투라'], Catuai: ['카투아이'], Catimor: ['카티모르'], Gesha: ['게샤'], Pacamara: ['파카마라'], Heirloom: ['헤어룸'], Castillo: ['카스티요'],
  Washed: ['워시드'], Natural: ['내추럴'], Honey: ['허니'], 'Yellow Honey': ['옐로 허니'], 'Red Honey': ['레드 허니'], 'Black Honey': ['블랙 허니'], 'Pulped Natural': ['펄프드 내추럴'],
  'Wet Hulled': ['웻 헐드'], 'Anaerobic Natural': ['무산소 내추럴', '애너로빅 내추럴'], 'Anaerobic Washed': ['무산소 워시드', '애너로빅 워시드'], 'Carbonic Maceration': ['카보닉 매서레이션'], 'Thermal Shock': ['서멀 쇼크'],
  'Comandante C40': ['코만단테 C40', '코만단테'], 'Timemore C2': ['타임모어 C2', '타임모어'], '1Zpresso ZP6': ['1Z프레소 ZP6', '원젯프레소 ZP6'], 'Fellow Ode Gen 2': ['펠로우 오드 2세대', '펠로우 오드'],
  'Hario V60 02': ['하리오 V60 02', '하리오 V60'], 'Kalita Wave 185': ['칼리타 웨이브 185'], 'Origami M': ['오리가미 M'], 'April Brewer': ['에이프릴 브루어'],
  'V60 Paper 02': ['V60 필터 02', '하리오 V60 필터'], 'CAFEC Abaca': ['카펙 아바카'], 'Kalita Wave 185 Paper': ['칼리타 웨이브 185 필터'],
  'Fellow Stagg EKG': ['펠로우 스태그 EKG'], 'Brewista Artisan': ['브뤼스타 아티산'], 'Hario Drip Scale': ['하리오 드립 스케일'], 'Acaia Pearl': ['아카이아 펄'],
  'Balanced Water': ['밸런스드 워터'], 'Soft Water': ['연수'], 'Mineral-rich Water': ['경수'],
};

export function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase().replace(/[\s\-_·.,/()[\]]/g, '');
}

export function aliasesFor(value: string) {
  return searchAliases[value] ?? [];
}

/** Finds curated terms embedded in a free-form name, e.g. `테스트 에티오피아` → `Ethiopia`. */
export function relatedAliases(value: string) {
  const normalizedValue = normalizeSearchText(value);
  return Object.entries(searchAliases).flatMap(([canonical, aliases]) => {
    const terms = [canonical, ...aliases];
    return terms.some((term) => normalizedValue.includes(normalizeSearchText(term))) ? terms : [];
  });
}

export function matchesSearchQuery(query: string, terms: (string | null | undefined)[]) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  return terms.filter(Boolean).some((term) => normalizeSearchText(term!).includes(normalizedQuery));
}
