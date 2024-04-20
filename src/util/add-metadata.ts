import { Buffer } from 'node:buffer';
import process from 'node:process';
import { type Duplex } from 'node:stream';
import File from 'vinyl';
import addFiles from './add-file';

/**
 * Add a json file called artifact-metadata.json to the stream of files to be zipped
 * @param version The version number to put in the metadata
 * @returns {Duplex} an object stream
 */
export default function addMetadata(version: string): Duplex {
  const metadata = new File({
    cwd: '/',
    base: 'base',
    path: 'base/artifact-metadata.json',
    contents: Buffer.from(
      JSON.stringify(
        {
          version,
          git_commit_ref: process.env.CI_COMMIT_REF_NAME,
          git_commit_hash: process.env.CI_COMMIT_SHA,
          build_pipeline_url: process.env.CI_PIPELINE_URL,
        },
        null,
        2
      )
    ),
  });

  return addFiles([metadata]);
}
