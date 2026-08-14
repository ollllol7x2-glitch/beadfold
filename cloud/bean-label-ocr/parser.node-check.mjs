import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBeanLabelText } from './parser.mjs';

test('parses labeled bean packaging fields', () => {
  const result = parseBeanLabelText('Bean Name: Ethiopia Guji\nRoaster: Beanfold\nRoast Date: 2026.08.12\nMedium Light Roast\nTasting Notes: Jasmine, Peach, Black tea');
  assert.equal(result.candidates.beanName, 'Ethiopia Guji');
  assert.equal(result.candidates.roaster, 'Beanfold');
  assert.equal(result.candidates.roastDate, '2026-08-12');
  assert.equal(result.candidates.roastLevel, 'medium-light');
  assert.deepEqual(result.candidates.tastingNotes, ['Jasmine', 'Peach', 'Black tea']);
});
