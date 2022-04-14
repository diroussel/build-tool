# Build Tool

This tool provides a command line interface to package built nextJS artifacts into 
component zip files which can be deployed to AWS Lambda.

## Use

The entry point for this tool is at `src/package-cli.ts`. The following commands can be run from the directory of your built files:

```
  lambda-package generate-lambda-mappings         # Generate json mapping file that is
                                                  # passed to terraform deployment code

  lambda-package generate-lambda-handlers         # Generate wrapper handler function
                                                  # that uses a handler adaptor to be
                                                  # able to pass AWS lambda events to
                                                  # nextjs serverless handler functions

  lambda-package zip-package [files..]            # Add all files and folders listed in
                                                  # [files..] to the <output> zip, with
                                                  # optional include and exclude regular
                                                  # expressions.

  lambda-package copy-files [files..]             # Copy all files and folders listed in
                                                  # [files..] to the <outputPath>, with
                                                  # optional exclude glob expressions.

```
