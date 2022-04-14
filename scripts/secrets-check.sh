echo "================================================================"
echo "== Secret detecion check"
echo "================================================================"

#list of vulnerabilities to exclude from check
exclude='d2eacde6c7111f5ad9fc9d0a0d1ac71e4506add6dda336578338967b40c5b483\|6e830d2aba4a97be0404517ea190587e01526c61de482d86466eaa5fba705e2a\|67d7dd94172923331e1a3edf280a2c35390b77f3e4bbb37838f4959e007a3a6f\|';

vulnerabilities=`cat gl-secret-detection-report.json | grep "\"id\"" | grep -v $exclude | grep -v gitleaks | tr -s [:space:]`;

if [ "$vulnerabilities" ]; then
  echo "ERROR: Revert vulnerabilities$vulnerabilities otherwise exclude by adding to secret-check.sh exclude list";
  exit 1;
else
  echo "SUCCESS";
fi
