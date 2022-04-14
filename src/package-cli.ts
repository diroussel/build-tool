#!/usr/bin/env node
import yargs from 'yargs';

import { genMappingsModule } from './mappings/generate-lambda-mappings-cli-module';
import { genHandlerModule } from './handler/generate-lambda-handler-cli-module';
import { zipPackageModule } from './zip-package/zip-package-cli-module';
import { copyFilesModule } from './copier/copy-files-cli-module';

async function main(argv: string[]) {
  await yargs(argv.slice(2))
    .scriptName('lambda-package')
    .usage('$0 <command> [args]')
    .command(genMappingsModule)
    .command(genHandlerModule)
    .command(zipPackageModule)
    .command(copyFilesModule)
    .help()
    .strict()
    .demandCommand(1, 'You need at specify a command')
    .parse();
}

main(process.argv)
  .then(() => {
    console.log('done');
  })
  .catch((error) => {
    console.error('failed:', error);
    process.exit(1);
  });
