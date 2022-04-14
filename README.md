# Riskstrat Lambda Packaging Tool

This tool provides a command line interface to package built nextJS artifacts into component zip files which can be deployed to AWS Lambda.

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

## Development

This repository is configured to deploy to AWS CodeArtifact. When making changes to this repository, and commits which are **not** merging into `main` will be result in a packaged artifact deployed to the `private_staging` CodeArtifact repository in the Population Health Management account. Commits to `main` will deploy to the `private_published` repository, which is then made available to consuming repositories.

Please follow the below process for making changes to this repository:

1. Create a new branch for your work

2. Increment the version number of this repository in the `package.json` based on your intended changes (following npm semantic versioning format). Note: Failure to do this will cause errors on your first commit as versions are checked as part of the pre-commit hook.

3. Make and test your changes.

4. If you haven't already, source the helper functions in `./scripts/aws_helper.sh` and use the `setpoph` command to authenticate with the Population Health AWS Account. This will allow commits to be checked for correct versioning.

5. Commit and push your changes. Completion of a successful pipeline will publish your changes to `private_staging` taking the version number you have set in the `package.json`. If there is already an existing version (e.g. from one of your earlier commits), the published version will be deleted and new version added.

6. Test your changes in a consuming repository.

- Change your consuming repository's `.npmrc` and `pre-install.js` to refer to the `private_staging` repository, so that you receive your latest changes.
- Increment the version of the package which your consuming repository is using.
- Run a `yarn install` to receive the latest package.
- Note: on each commit, you will need to remove and re-add this package to the consuming repository to regenerate its checksum in that repository. Failure to do so will cause yarn install commands to fail.

7. When ready, merge your changes into main. This will publish your changes as a new version of the package to the `private_published` repository

8. Revert your changes from step (6) in the consuming package so that it refers back to the `private_published` repository.
