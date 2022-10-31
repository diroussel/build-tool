import { readFileSync } from 'fs';

export type Manifest = Record<string, string>;

function readManifestSync(manifestPath: string): Manifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
}

export { readManifestSync };
