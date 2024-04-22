#!/usr/bin/env node

import process from 'node:process';
import yargs, { type Argv } from 'yargs';
import { genMappingsModule } from './mappings/generate-lambda-mappings-cli-module';
import {
  type GenHandlerArgs,
  genHandlerModule,
} from './handler/generate-lambda-handler-cli-module';
import { zipPackageModule } from './zip-package/zip-package-cli-module';
import { copyFilesModule } from './copier/copy-files-cli-module';
import { type ZipArgs } from './zip-package/zip-package-lib';
import { type CopyFileOptions } from './copier/copy-files-lib';

type AllArgs = ZipArgs & CopyFileOptions & GenHandlerArgs;

async function main(argv: string[]) {
  await (yargs(argv.slice(2)) as Argv<AllArgs>)
    .scriptName('lambda-package')
    .usage('$0 <command> [args]')
    .command(genMappingsModule)
    .command(genHandlerModule)
    .command(zipPackageModule)
    .command(copyFilesModule)
    .help()
    .strict()
    .demandCommand(1, 'You need at specify a command')
    .parseAsync();
}

main(process.argv)
  .then(() => {
    console.log('done');
  })
  .catch((error) => {
    console.error('failed:', error);
    process.exit(1);
  });
