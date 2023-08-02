/* eslint-disable @typescript-eslint/no-base-to-string */
import File from 'vinyl';
import {
  generateLambdaHandler,
  generateHandlers,
} from '../../handler/generate-lambda-handler';
import { readManifestSync } from '../../next-build/manifest';

describe('generateLambdaHandler', () => {
  it('should match expected output', () => {
    const content = generateLambdaHandler(
      '/handlers/_error.js',
      '/pages/_error.js'
    );
    expect(content).toMatchSnapshot();
  });
});

describe('generateHandlers', () => {
  it('should match expected output', (done) => {
    const content = [];
    const manifest = readManifestSync(
      'src/__test__/testdata/test1-pages-manifest.json'
    );
    const stream = generateHandlers(manifest, false);
    stream.on('data', (file: File) => {
      content.push({
        handlerPath: file.relative,
        content: file.contents.toString(),
      });
    });
    stream.on('end', () => {
      expect(content).toMatchSnapshot();
      done();
    });
    stream.end();
  });

  it('should match expected output 2', (done) => {
    const content = [];
    const manifest = readManifestSync(
      'src/__test__/testdata/test2-pages-manifest.json'
    );
    const stream = generateHandlers(manifest, false);
    // eslint-disable-next-line sonarjs/no-identical-functions
    stream.on('data', (file: File) => {
      content.push({
        handlerPath: file.relative,
        content: file.contents.toString(),
      });
    });
    stream.on('end', () => {
      expect(content).toMatchSnapshot();
      done();
    });
    stream.end();
  });
});
