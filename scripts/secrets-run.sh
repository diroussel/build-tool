echo "================================================================"
echo "== Secret detecion run"
echo "================================================================"

if [ -n "$CI_COMMIT_TAG" ]; then 
 echo "Skipping Secret Detection for tags. No code changes have occurred."; 
 exit 0; 
fi

git fetch origin $CI_DEFAULT_BRANCH $CI_COMMIT_REF_NAME
git log --left-right --cherry-pick --pretty=format:"%H" refs/remotes/origin/$CI_DEFAULT_BRANCH...refs/remotes/origin/$CI_COMMIT_REF_NAME > "$CI_COMMIT_SHA"_commit_list.txt

export SECRET_DETECTION_COMMITS_FILE="$CI_COMMIT_SHA"_commit_list.txt

# run the gitleaks analyzer shipped with the following gitlab docker image "registry.gitlab.com/gitlab-org/security-products/analyzers/secrets:3" 
/analyzer run

rm "$CI_COMMIT_SHA"_commit_list.txt

report="gl-secret-detection-report.json";
cat "$report";
