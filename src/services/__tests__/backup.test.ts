import { describe, expect, it } from 'vitest';
import { parseBackupArchive, summarizeBackup } from '../backup';

const emptyBackup = {
  format: 'beanfold-backup',
  version: 1,
  exportedAt: '2026-08-18T10:00:00.000Z',
  data: {
    settings: [], user_equipment: [], beans: [], recipes: [], brew_sessions: [], cups: [], inventory_events: [],
  },
};

describe('backup archive', () => {
  it('accepts a complete v1 archive and summarizes it', () => {
    const archive = parseBackupArchive(JSON.stringify({
      ...emptyBackup,
      data: {
        ...emptyBackup.data,
        settings: [{ key: 'haptics', value: 'true', updated_at: '2026-08-18T10:00:00.000Z' }],
      },
    }));
    expect(summarizeBackup(archive)).toMatchObject({ settings: 1, beans: 0, cups: 0 });
  });

  it('rejects files with an unknown format or incomplete row', () => {
    expect(() => parseBackupArchive(JSON.stringify({ ...emptyBackup, format: 'other' }))).toThrow('지원하지 않는 백업 파일');
    expect(() => parseBackupArchive(JSON.stringify({ ...emptyBackup, data: { ...emptyBackup.data, settings: [{ key: 'haptics' }] } }))).toThrow('settings 데이터에 필요한 값이 없어요');
  });
});
