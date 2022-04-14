import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { copyFileWithGulp, CopyFileOptions } from '../../copier/copy-files-lib';

describe('copier', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(join(tmpdir(), 'copier-test'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('should copy all files', async () => {
    const outputDir: string = join(tmpDir, 'test1');
    fs.mkdirSync(outputDir);

    // Given
    const opts: CopyFileOptions = {
      files: ['src/__test__/copier/copy-test-fixture/**'],
      outputPath: outputDir,
      debug: false,
      exclude: [],
      stripPrefix: true,
    };

    // When
    await copyFileWithGulp(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['file1.txt', 'folder1']);
    expect(fs.readdirSync(join(outputDir, 'folder1'))).toEqual([
      'file2.md',
      'file3.notimportant.md',
    ]);
  });
});
