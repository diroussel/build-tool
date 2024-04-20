import { PassThrough, type Duplex } from 'node:stream';
import type File from 'vinyl';

/**
 * A stream pass through that adds extra files in
 * @param files An array of Vinyl files, to be added to the stream
 * @returns {Duplex} an object stream
 */
export default function addFiles(files: File[]): Duplex {
  const passThrough = new PassThrough({ objectMode: true });

  for (const fileToInject of files) {
    passThrough.push(fileToInject);
  }

  return passThrough;
}
