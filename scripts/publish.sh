# setting the script to fail & exit if a command fails and there is an unset variable.
set -eu
set -o pipefail

CODEARTIFACT_DOMAIN="repo"
CODEARTIFACT_DOMAIN_OWNER=$POPH_MGMT_ACCOUNT
CODEARTIFACT_NAMESPACE="riskstrat"
CODEARTIFACT_PACKAGE="lambda-package-tool"

echo "============= Publishing to AWS CodeArtifact ${PRIVATE_CODE_REPOSITORY} repo =============="

echo "Login to aws codeartifact"
aws codeartifact login --tool npm --repository $PRIVATE_CODE_REPOSITORY --domain $CODEARTIFACT_DOMAIN --domain-owner $CODEARTIFACT_DOMAIN_OWNER

# For commits which are not merging to main (and therefore going to staging repo), 
# delete the previously published package version so that development work can 
# proceed without incrementing version number

if [[ "${PRIVATE_CODE_REPOSITORY}" == "private_staging" ]]; then

  # Check if package has been published.
  PUBLISHED_PACKAGES=$(aws codeartifact list-packages --domain ${CODEARTIFACT_DOMAIN} --repository ${PRIVATE_CODE_REPOSITORY} --domain-owner ${CODEARTIFACT_DOMAIN_OWNER} | jq '.packages')

  for row in $(echo "${PUBLISHED_PACKAGES}" | jq -c '.[]'); do 
    NAMESPACE=$(jq -r '.namespace' <<< $row)
    PACKAGE=$(jq -r '.package' <<< $row)


    #   # If package has been published.
    if [[ "@${NAMESPACE}/${PACKAGE}" == "@${CODEARTIFACT_NAMESPACE}/${CODEARTIFACT_PACKAGE}" ]]; then

      echo "Package previously published. Checking version numbers."

      # Get latest published version.
      LATEST_PUBLISHED_VERSION=$(aws codeartifact list-package-versions \
                                    --domain ${CODEARTIFACT_DOMAIN} \
                                    --domain-owner ${CODEARTIFACT_DOMAIN_OWNER} \
                                    --format npm \
                                    --repository ${PRIVATE_CODE_REPOSITORY} \
                                    --namespace ${CODEARTIFACT_NAMESPACE} \
                                    --package ${CODEARTIFACT_PACKAGE} \
                                    | jq -r '.defaultDisplayVersion')

      # Get current package version.
      PACKAGE_VERSION=$(jq -r '.version' package.json)

      # If package version currently exists, delete the package before publishing
      if [[ "${LATEST_PUBLISHED_VERSION}" == "${PACKAGE_VERSION}" ]]; then
        echo "Deleting previously published package from staging"
        echo "Version to be deleted: $PACKAGE_VERSION"

        aws codeartifact delete-package-versions \
        --domain $CODEARTIFACT_DOMAIN \
        --domain-owner $CODEARTIFACT_DOMAIN_OWNER \
        --format npm \
        --repository $PRIVATE_CODE_REPOSITORY \
        --namespace ${CODEARTIFACT_NAMESPACE} \
        --package $CODEARTIFACT_PACKAGE \
        --versions $PACKAGE_VERSION

      else
        echo "Version does not yet exist. Proceeding to publish."
      fi

    fi

  done

fi

echo "Publishing ..."

npm publish

echo "Success! Packages in repository:"

aws codeartifact list-packages \
--domain $CODEARTIFACT_DOMAIN \
--domain-owner $CODEARTIFACT_DOMAIN_OWNER \
--repository $PRIVATE_CODE_REPOSITORY 
