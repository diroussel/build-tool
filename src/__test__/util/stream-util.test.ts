import { PassThrough, Readable } from 'stream';
import File from 'vinyl';
import { sortFiles, teeStream, logHash } from '../../util/stream-util';

describe('sortFiles', () => {
  it('should sort files based on path', (cb) => {
    const stream = sortFiles();
    const files: File[] = [];
    stream
      .on('data', (file: File) => {
        files.push(file);
      })
      .on('error', (err) => {
        expect(err).toBe(false);
      })
      .on('end', () => {
        expect(files[0].path).toEqual(expect.stringMatching(/index-1/));
        expect(files[1].path).toEqual(expect.stringMatching(/index-2/));
        expect(files[2].path).toEqual(expect.stringMatching(/index-5/));
        cb();
      });

    stream.write(
      new File({
        path: './index-5.js',
        contents: Buffer.from('data'),
      })
    );
    stream.write(
      new File({
        path: './index-2.js',
        contents: Buffer.from('data'),
      })
    );
    stream.write(
      new File({
        path: './index-1.js',
        contents: Buffer.from('data'),
      })
    );
    stream.end();
  });
});

export async function stream2buffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks = new Array<Buffer>();
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) =>
      reject(new Error(`error converting stream - ${err}`))
    );
  });
}

export async function objectStreamToArray(stream: Readable): Promise<File[]> {
  return new Promise<File[]>((resolve, reject) => {
    const files = [];
    stream.on('data', (file) => files.push(file));
    stream.on('end', () => resolve(files));
    stream.on('error', (err) =>
      reject(new Error(`error converting stream - ${err}`))
    );
  });
}

describe('teeStream', () => {
  it('copies data into two streams', async () => {
    const inStream = Readable.from(['Hello', ' ', 'World']);
    const out1 = new PassThrough();

    const out2 = teeStream(inStream, out1);

    expect((await stream2buffer(out1)).toString()).toEqual('Hello World');
    expect((await stream2buffer(out2)).toString()).toEqual('Hello World');
  });
});

describe('logHash', () => {
  it('passes through files unchanged', async () => {
    const file1 = new File({ path: 'file1', contents: Buffer.from('Hello') });
    const file2 = new File({ path: 'file2', contents: Buffer.from('World') });

    const logLines = [];
    const mockLogger = (msg: string) => logLines.push(msg);

    const inStream = new PassThrough({ objectMode: true });
    const outStream = inStream.pipe(logHash(mockLogger));
    inStream.push(file1);
    // eslint-disable-next-line unicorn/no-array-push-push
    inStream.push(file2);
    inStream.end();

    const results = await objectStreamToArray(outStream);
    expect(results).toEqual([file1, file2]);
    expect(logLines).toEqual([
      'SHA1 hash sum: f7ff9e8b7bb2e09b70935a5d785e0cc5d9d0abf0\tfile1',
      'SHA1 hash sum: 70c07ec18ef89c5309bbb0937f3a6342411e1fdd\tfile2',
    ]);
  });
});
