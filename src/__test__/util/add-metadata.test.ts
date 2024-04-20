import { Buffer } from 'node:buffer';
import process from 'node:process';
import { PassThrough } from 'node:stream';
import File from 'vinyl';
import addMetadata from '../../util/add-metadata';
import { objectStreamToArray } from './stream-util.test';

describe('addMetadata', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old env
  });

  it('adds metadata file and also passes existing file', async () => {
    process.env.CI_COMMIT_SHA = '315c11e90374a8a30a4eb220e759db7580562046';
    process.env.CI_COMMIT_REF_NAME = 'feature/some-excellent-feature';
    process.env.CI_PIPELINE_URL = 'pipeline-url';

    const expectedMetadata = {
      version: '2.3.4',
      git_commit_ref: 'feature/some-excellent-feature',
      git_commit_hash: '315c11e90374a8a30a4eb220e759db7580562046',
      build_pipeline_url: 'pipeline-url',
    };

    const file1 = new File({ path: 'file1', contents: Buffer.from('Hello') });
    const expectedMetadataFile = new File({
      path: 'artifact-metadata.json',
      contents: Buffer.from(JSON.stringify(expectedMetadata, null, 2)),
    });

    const inStream = new PassThrough({ objectMode: true });
    const outStream = inStream.pipe(addMetadata('2.3.4'));
    inStream.push(file1);
    inStream.end();

    const FileToSimple = (file: File) => ({
      name: file.relative,

      content: file.contents.toString(),
    });

    const results = await objectStreamToArray(outStream);
    expect(results.map((element) => FileToSimple(element))).toEqual(
      [expectedMetadataFile, file1].map((element) => FileToSimple(element))
    );
  });
});
