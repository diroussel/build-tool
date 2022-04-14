# setting the script to fail & exit if a command fails and there is an unset variable.
set -eu
set -o pipefail

CODEARTIFACT_DOMAIN="repo"
CODEARTIFACT_DOMAIN_OWNER=$POPH_MGMT_ACCOUNT
CODEARTIFACT_REPOSITORY_PUBLISHED="private_published"
CODEARTIFACT_PACKAGE="riskstrat-lambda-package-tool"

# Check if package has been published.
PUBLISHED_PACKAGES=$(aws codeartifact list-packages --domain ${CODEARTIFACT_DOMAIN} --repository ${CODEARTIFACT_REPOSITORY_PUBLISHED} --domain-owner ${CODEARTIFACT_DOMAIN_OWNER} | jq '.packages')

# If package has been published.
if [[ "${PUBLISHED_PACKAGES[*]})" =~ "${CODEARTIFACT_PACKAGE}" ]]; then

  # Get package versions and check if version was correctly incremented.
  PUBLISHED_PACKAGE_VERSIONS="$(aws codeartifact list-package-versions \
                                --domain ${CODEARTIFACT_DOMAIN} \
                                --domain-owner ${CODEARTIFACT_DOMAIN_OWNER} \
                                --format npm \
                                --repository ${CODEARTIFACT_REPOSITORY_PUBLISHED} \
                                --package ${CODEARTIFACT_PACKAGE})"

  LATEST_PUBLISHED_VERSION="$(jq '.defaultDisplayVersion' <<< ${PUBLISHED_PACKAGE_VERSIONS})"
  PACKAGE_VERSION="$(jq '.version' package.json)"

  if [[ "${LATEST_PUBLISHED_VERSION}" == "${PACKAGE_VERSION}" ]]; then
    echo "Package version not updated. Increment the version in the package.json to continue."
    exit
  else
    echo "Success. Package version incremented correctly."
  fi

# If package has not yet been published, ignore version check.
else
  echo "Success. Package not yet published."
fi
