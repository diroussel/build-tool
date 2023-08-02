import fs from 'fs';
import fsPromises from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import jszip from 'jszip';
import { ZipArgs, zipFiles } from '../../zip-package/zip-package-lib';

async function readZipEntries(resultZipFile: string) {
  const zipContents = await fsPromises.readFile(resultZipFile);
  const zip = await jszip.loadAsync(zipContents);
  return Object.keys(zip.files);
}

describe('zip-package', () => {
  let tmpDir: string;
  let outputDir: string;

  const baseOptions: ZipArgs = {
    files: ['src/__test__/zip-package/zip-test-fixture/**'],
    baseDir: null,
    outputDir,
    zipFile: '',
    component: undefined,
    componentVersion: undefined,
    stripPrefix: true,
    exclude: [],
    addDeployScript: false,
    generateLambdaHandlers: false,
    processNextJsStaticFiles: false,
    stripHtmlExtension: false,
    manifestPath: '',
    lambdaGroupName: '',
    debug: false,
    buildId: '',
  };

  beforeAll(() => {
    // determine overall temp folder
    tmpDir = fs.mkdtempSync(join(tmpdir(), 'zip-package-test'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  beforeEach(() => {
    // Coorce the type, as we don't have a published type
    const exp = expect as unknown as {
      getState: () => { currentTestName: string };
    };

    // Create temp folder just for this test case, based on the test name
    const testname = exp.getState().currentTestName.replaceAll(/\s/g, '_');
    outputDir = join(tmpDir, testname);
    fs.mkdirSync(outputDir);
  });

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV }; // make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });

  it('should copy all files', async () => {
    // Given
    const opts = { ...baseOptions, outputDir };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['file1.txt', 'folder1']);
    expect(fs.readdirSync(join(outputDir, 'folder1'))).toEqual([
      'file2.md',
      'file3.notimportant.md',
    ]);
  });

  it('should zip all files', async () => {
    // Given
    const opts = { ...baseOptions, outputDir, zipFile: 'theOutput.zip' };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['theOutput.zip']);
    expect(await readZipEntries(join(outputDir, 'theOutput.zip'))).toEqual([
      'file1.txt',
      'folder1/',
      'folder1/file2.md',
      'folder1/file3.notimportant.md',
    ]);
  });

  it('should be able to exclude files', async () => {
    // Given
    const opts = {
      ...baseOptions,
      outputDir,
      zipFile: 'theOutput.zip',
      exclude: ['**/*.notimportant*'],
    };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['theOutput.zip']);
    expect(await readZipEntries(join(outputDir, 'theOutput.zip'))).toEqual([
      'file1.txt',
      'folder1/',
      'folder1/file2.md',
    ]);
  });

  it('should include metadata', async () => {
    // Given
    const opts = { ...baseOptions, outputDir, componentVersion: '56.34' };
    process.env.CI_COMMIT_SHA = '315c11e90374a8a30a4eb220e759db7580562046';
    process.env.CI_COMMIT_REF_NAME = 'feature/some-excellent-feature';
    process.env.CI_PIPELINE_URL = 'pipeline-url';

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual([
      'artifact-metadata.json',
      'file1.txt',
      'folder1',
    ]);

    const expectedMetadata = {
      version: '56.34',
      git_commit_ref: 'feature/some-excellent-feature',
      git_commit_hash: '315c11e90374a8a30a4eb220e759db7580562046',
      build_pipeline_url: 'pipeline-url',
    };

    const metadata = await fsPromises.readFile(
      join(outputDir, 'artifact-metadata.json'),
      // eslint-disable-next-line unicorn/prefer-json-parse-buffer
      'utf8'
    );
    expect(JSON.parse(metadata)).toEqual(expectedMetadata);
  });

  it('should process nextjs static files', async () => {
    // Given
    const opts = {
      ...baseOptions,
      files: [
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/serverless/pages/+(page)/**',
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/+(static)/**',
      ],
      outputDir,
      zipFile: 'theOutput.zip',
      processNextJsStaticFiles: true,
      stripHtmlExtension: true,
    };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['theOutput.zip']);
    expect(await readZipEntries(join(outputDir, 'theOutput.zip'))).toEqual([
      '_next/static/chunks/4139-8ffbec7fbdc1e439a90c.js',
      'page/',
      'page/index',
      'static/',
      'static/chunks/',
    ]);
  });
  it('should process nextjs static files without striping .html', async () => {
    // Given
    const opts = {
      ...baseOptions,
      files: [
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/serverless/pages/+(page)/**',
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/+(static)/**',
      ],
      outputDir,
      zipFile: 'theOutput.zip',
      processNextJsStaticFiles: true,
      stripHtmlExtension: false,
    };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['theOutput.zip']);
    expect(await readZipEntries(join(outputDir, 'theOutput.zip'))).toEqual([
      '_next/static/chunks/4139-8ffbec7fbdc1e439a90c.js',
      'page/',
      'page/index.html',
      'static/',
      'static/chunks/',
    ]);
  });

  it('should process nextjs manifest', async () => {
    // Given
    const opts = {
      ...baseOptions,
      baseDir: 'src/__test__/zip-package/example-nextjs-build-fixture/',
      files: [
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/serverless/**/*.js',
      ],
      outputDir,
      zipFile: 'theOutput.zip',
      generateLambdaHandlers: true,
      manifestPath:
        'src/__test__/zip-package/example-nextjs-build-fixture/.next/serverless/pages-manifest.json',
      buildId: 'theBuildId23',
    };

    // When
    await zipFiles(opts);

    // Then
    expect(fs.readdirSync(outputDir)).toEqual(['theOutput.zip']);
    expect(await readZipEntries(join(outputDir, 'theOutput.zip'))).toEqual([
      'handlers/_error.js',
      'handlers/ras/journey1.js',
      'handlers/ras/journey1/check-your-answers.js',
      'handlers/ras/journey1/form-page.js',
      'handlers/ras/journey1/result.js',
      'handlers/ras/journey2/[pageId].js',
      'lambda-mappings.json',
    ]);
  });
});
