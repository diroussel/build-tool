# setting the script to fail & exit if a command fails and there is an unset variable.
set -eu
set -o pipefail

CODEARTIFACT_DOMAIN="repo"
CODEARTIFACT_DOMAIN_OWNER=$POPH_MGMT_ACCOUNT
CODEARTIFACT_NAMESPACE="riskstrat"
CODEARTIFACT_PACKAGE="lambda-package-tool"

# Check if package has been published.
echo "Checking latest version of @${CODEARTIFACT_NAMESPACE}/${CODEARTIFACT_PACKAGE}"

# Get package versions and check if version was correctly incremented.
LATEST_PUBLISHED_VERSION=$(aws codeartifact list-package-versions \
                              --domain ${CODEARTIFACT_DOMAIN} \
                              --domain-owner ${CODEARTIFACT_DOMAIN_OWNER} \
                              --format npm \
                              --repository ${PRIVATE_CODE_REPOSITORY:-private_staging} \
                              --namespace ${CODEARTIFACT_NAMESPACE} \
                              --package ${CODEARTIFACT_PACKAGE} \
                              | jq -r '.defaultDisplayVersion')

echo "Latest version of @${CODEARTIFACT_NAMESPACE}/${CODEARTIFACT_PACKAGE} is $LATEST_PUBLISHED_VERSION"

PACKAGE_VERSION="$(jq '.version' package.json)"

if [[ "${LATEST_PUBLISHED_VERSION}" == "${PACKAGE_VERSION}" ]]; then
  echo "Package version not updated. Increment the version in the package.json to continue."
  exit
else
  echo "Success. Package version incremented correctly."
fi

# If package has not yet been published, ignore version check.
echo "Version Check Complete."
