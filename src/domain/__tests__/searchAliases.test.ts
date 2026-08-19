import { describe, expect, it } from 'vitest';
import { matchesSearchQuery, relatedAliases } from '../searchAliases';

describe('search aliases', () => {
  it('connects Korean terms embedded in a bean name to its English alias', () => {
    expect(matchesSearchQuery('Ethiopia', relatedAliases('테스트 에티오피아'))).toBe(true);
  });

  it('connects Korean equipment aliases to the catalog name', () => {
    expect(matchesSearchQuery('코만단테', ['Comandante C40', ...relatedAliases('Comandante C40')])).toBe(true);
  });
});
