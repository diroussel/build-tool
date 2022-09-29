import path from 'path';
import File from 'vinyl';
import { Duplex, PassThrough } from 'stream';
import { Manifest } from '../next-build/manifest';

export function generateLambdaHandler(
  handlerPath: string,
  pagePath: string
): string {
  // Note the code for '@sls-next/next-aws-lambda' module can be found here: https://github.com/serverless-nextjs/serverless-next.js/tree/master/packages/compat-layers/apigw-lambda-compat
  return `const page = require("./${path.relative(
    path.dirname(handlerPath),
    path.dirname(pagePath)
  )}/${path.basename(handlerPath)}");
const handlerFactory = require("@sls-next/next-aws-lambda");
const handler = handlerFactory(page);

module.exports.render = handler;
`;
}

export function generateHandlers(manifest: Manifest, debug: boolean): Duplex {
  const stream = new PassThrough({
    highWaterMark: 100,
    objectMode: true,
  });

  Object.entries(manifest)
    .filter(([, pagePath]) => pagePath.endsWith('.js'))
    .map(([key, pagePath]) => [key.replace(/\/$/, '/index'), pagePath])
    .map(([key, pagePath]) => {
      const handlerPath = `handlers${key}.js`;
      if (debug) {
        console.log(`Generating handler for ${key} to ${handlerPath}`);
      }
      const content = generateLambdaHandler(handlerPath, pagePath);
      return { key, content, handlerPath };
    })
    .forEach(({ content, handlerPath }) => {
      const file = new File({
        cwd: 'generated',
        base: 'generated',
        path: `generated/${handlerPath}`,
        contents: Buffer.from(content),
      });
      stream.push(file); // TODO: what if push() returns false?  How do we handle back pressure?
    });

  return stream;
}
