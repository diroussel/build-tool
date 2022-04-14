# Functions to help handle STS manipulation of IAM credentials for
# the Population Health project.
#
# IMPORTANT: You MUST have your NHS Identities AWS credentials set up in your
#            ~/.aws/credentials file and it MUST be named [nhsd].
#
# Functions:
# ----------
#   setpoph [dev|test|prod|mgmt] [role-name]        (defaults are: dev, POPHEALTHCIAccess)
#   setriskstrat [dev|test|prod|mgmt] [role-name]   (defaults are: dev, RISKSTRATCIAccess)
#   unsetsts                                        (return to nhslogin with MFA intact)
#   unsetmfa                                        (return to nhslogin with no MFA)
#   getenvvars                                      (lists export commands to replicate the current AWS_* env vars)
#   unsetenvvars                                    (lists unset command to remove all AWS_* env vars)
#   assumerole role-name [account-id]               (default is: current account id)
#
# You should only have to set your mfa token once every 12 hours in a shell session.
# You can switch accounts & roles as many times as you please without re-entering your mfa
# If your mfa expires you will be prompted to enter it again

# shellcheck disable=SC2120
# shellcheck disable=SC2207

declare red="\033[0;31m";
declare green="\033[0;32m";
declare yellow="\033[0;33m";
declare cyan="\033[0;36m";
declare nc="\033[0m"; # No Color
declare bold="\033[1m";
declare white_on_red="\033[1;41m\033[1;37m"

declare NHSD_PROFILE_NAME="nhsd";
declare NHSD_DEFAULT_REGION="eu-west-2";

declare riskstrat_dev="751902686284";
declare riskstrat_mgmt="819123826806";
declare riskstrat_test="257178764781";
declare riskstrat_prod="705329605474";

declare pophealth_dev="575129834016";
declare pophealth_mgmt="228692257010";
declare pophealth_test="794756455358";
declare pophealth_prod="958915793494";



function setpoph() {
  _setaccount "pophealth" "${1:-dev}" "${2:-POPHEALTHCIAccess}";
}

function setriskstrat() {
  _setaccount "riskstrat" "${1:-dev}" "${2:-RISKSTRATCIAccess}";
}

function unsetsts() {
  unset AWS_ACCESS_KEY_ID;
  unset AWS_SECRET_ACCESS_KEY;
  unset AWS_SESSION_TOKEN;
  unset AWS_ROLE;
  export AWS_PROFILE=nhsd;
}

function unsetmfa() {
  unsetsts;
  unset AWS_MFA_EXPIRY;
  rm ~/.aws/mfa_cache;
}

function getenvvars() {
  env | grep -E "^AWS_(ACCESS|SECRET|SESSION|MFA)(.*)=" | sed -E "s/^AWS(.*)/export AWS\1;/";
  if [[ -z "${1:-}" ]]; then
    aws sts get-caller-identity --query "{Account: Account, Arn: Arn}" --output table;
  fi;
}

function unsetenvvars() {
  echo -e "unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_SESSION_EXPIRY";
}

function assumerole(){

  declare -a session_tokens;

  local role="${1}";
  if [ -z "${2}" ]; then
    local aws_account_id="$(aws sts get-caller-identity --output text --query Account)";
  else
	  local aws_account_id="${2}"
  fi

  session_tokens=($(aws sts assume-role \
    --role-arn "arn:aws:iam::${aws_account_id}:role/${role}" \
    --role-session-name "${USER}-${HOSTNAME}" \
    --query Credentials \
    --output text; ));

  if ! [ "${?}" -eq 0 ]; then
    echo "STS Assume Role Request Failed" >&2;
    return 1;
  fi;

  # Set the environment credentials specifically for this command
  # and execute the command
  export AWS_ACCESS_KEY_ID="${session_tokens[$((0 + SHELL_INDEX_INCREMENT))]}";
  export AWS_SECRET_ACCESS_KEY="${session_tokens[$((2 + SHELL_INDEX_INCREMENT))]}";
  export AWS_SESSION_TOKEN="${session_tokens[$((3 + SHELL_INDEX_INCREMENT))]}";
  export AWS_SESSION_EXPIRY="${session_tokens[$((1 + SHELL_INDEX_INCREMENT))]}";
  export AWS_ACCOUNT_ID="${aws_account_id}";

  if [[ -n "${AWS_ACCESS_KEY_ID}" && -n "${AWS_SECRET_ACCESS_KEY}" && -n "${AWS_SESSION_TOKEN}" ]]; then
    export AWS_ROLE="${role}"
    echo -e "${bold}Succeessfully assumed the ${yellow}${role}${nc} ${bold}role.${nc}\n";
    return 0;
  else
    echo -e "${red}STS Assume Role Failed${nc}\n" >&2;
    return 1;
  fi;
}

#======= PRIVATE FUNCTIONS ========

function is_zsh() {
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    return 0;
  else
    return 1;
  fi;
}

function _setaccount() {
  local acctprefix="${1:-}_";
  local requestedacct="${acctprefix}${2:-dev}";
  local requestedrole="${3:-NHSDAdminRole}";
  local acct;
  if is_zsh; then
    acct="$(echo ${(P)requestedacct})";
  else
    acct="$(echo ${!requestedacct})";
  fi;
  echo -e "\n${cyan}Using account:${nc} ${yellow}${requestedacct}${nc} (${yellow}${acct}${nc}) role: ${yellow}${requestedrole}${nc}\n";
  export AWS_PROFILE="${NHSD_PROFILE_NAME}";
  export AWS_DEFAULT_REGION="${NHSD_DEFAULT_REGION}";
  export AWS_ACCOUNT_NAME="${requestedacct}";
  if _checkmfa; then
    _restoremfa;
  else
    _mfa && _cachemfa;
  fi;
  assumerole "${requestedrole}" "${acct}";
  unset AWS_PROFILE;
}


# Authenticate with an MFA Token Code
function _mfa() {
  local save_region=$AWS_DEFAULT_REGION;

  # Remove any environment variables previously set by sts()
  unsetsts;

  # Get UserName
  if [[ -z "${1:-}" ]]; then
    local user_name="$(aws iam get-user --output text --query 'User.UserName')";
  else
    local user_name="${1}";
  fi;

  # Get MFA Serial
  # Assumes "iam list-mfa-devices" is permitted without MFA
  mfa_serial="$(aws iam list-mfa-devices --user-name "${user_name}" --query 'MFADevices[*].SerialNumber' --output text)";
  if ! [ "${?}" -eq 0 ]; then
    echo "Failed to retrieve MFA serial number" >&2;
    return 1;
  fi;

  # Read the token from the console
  echo -n "MFA Token Code: ";
  read token_code;

  # Call STS to get the session credentials
  # Assumes "sts get-session-token" is permitted without MFA
  session_tokens=($(aws sts get-session-token --token-code "${token_code}" --serial-number "${mfa_serial}" --output text));
  if ! [ "${?}" -eq 0 ]; then
    echo -e "STS MFA Request Failed\n" >&2;
    return 1;
  fi;

  # Set the environment credentials specifically for this command
  # and execute the command
  export AWS_ACCESS_KEY_ID="${session_tokens[$((1 + SHELL_INDEX_INCREMENT))]}";
  export AWS_SECRET_ACCESS_KEY="${session_tokens[$((3 + SHELL_INDEX_INCREMENT))]}";
  export AWS_SESSION_TOKEN="${session_tokens[$((4 + SHELL_INDEX_INCREMENT))]}";
  export AWS_MFA_EXPIRY="${session_tokens[$((2 + SHELL_INDEX_INCREMENT))]}";
  export AWS_DEFAULT_REGION="${save_region}";

  if [[ -n "${AWS_ACCESS_KEY_ID}" && -n "${AWS_SECRET_ACCESS_KEY}" && -n "${AWS_SESSION_TOKEN}" ]]; then
    echo -e "MFA Succeeded. With great power comes great responsibility...\n";
    return 0;
  else
    echo -e "MFA Failed\n" >&2;
    return 1;
  fi;
}

# successful MFA creds are cached to a file in the .aws directory
function _cachemfa() {
  export MFA_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}";
  export MFA_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}";
  export MFA_SESSION_TOKEN="${AWS_SESSION_TOKEN}";
  export MFA_MFA_EXPIRY="${AWS_MFA_EXPIRY}";
  getenvvars suppress_sts_call > ~/.aws/mfa_cache;
}

# thow away current AWS creds and go back to the creds originally used for MFA auth
function _restoremfa() {
  unsetsts;
  export AWS_ACCESS_KEY_ID="${MFA_ACCESS_KEY_ID}"
  export AWS_SECRET_ACCESS_KEY="${MFA_SECRET_ACCESS_KEY}"
  export AWS_SESSION_TOKEN="${MFA_SESSION_TOKEN}"
  export AWS_MFA_EXPIRY="${MFA_MFA_EXPIRY}"
}

# zsh date functions are different from bash.
# return expiry seconds based on the right functions for the shell
function _get_expiry_seconds() {
  local now_in_utc_epoch expiry_in_utc_epoch expire_seconds;
  if is_zsh; then
    now_in_utc_epoch=$(strftime -r "%Y-%m-%dT%H:%M:%S" "$(TZ=Europe/London date -r "${EPOCHSECONDS}" -u "+%FT%T")" 2>/dev/null);
    expiry_in_utc_epoch=$(strftime -r "%Y-%m-%dT%H:%M:%S" "${1}" 2>/dev/null);
    expire_seconds=$(( ${expiry_in_utc_epoch} - ${now_in_utc_epoch} ));
  else
    expire_seconds=$(( $(date -d "${1}" +%s) - $(date +%s) ));
  fi;
  echo ${expire_seconds};
  return 0;
}

# zsh date functions are different from bash.
# return expiry seconds display string based on the right functions for the shell
function _get_expiry_display() {
  if is_zsh; then
    echo "$(date -r "${expire_seconds}" -u "+%T" )";
  else
    echo "$(date -u -d @"${expire_seconds}" +"%Hh %Mm %Ss")";
  fi;
  return 0;
}

# returns 0 if we have cached MFA creds and they are still in date, otherwise returns 1.
# MFA creds may be cached in env vars or on disk. Env vars take precedence over disk.
# if you're using a new shell session you won't have any MFA env vars, so disk cache is used.
function _checkmfa() {
  local aws_mfa_expiry expire_seconds output;
  if [[ -z "${AWS_MFA_EXPIRY}" && -f ~/.aws/mfa_cache ]]; then
    echo -e "${white_on_red}restoring cached mfa session...${nc}";
    eval $(cat ~/.aws/mfa_cache);
    _cachemfa;
  fi;

  aws_mfa_expiry=${AWS_MFA_EXPIRY:="2021-01-01T00:00:00+00:00"};
  expire_seconds=$(_get_expiry_seconds "${aws_mfa_expiry}");

  if [ "${expire_seconds}" -gt 0 ]; then
    echo -e "${cyan}MFA TTL${nc}: ${green}$(_get_expiry_display)${nc} (as of $(date))\n";
    return 0;
  else
    echo -e "${white_on_red}MFA EXPIRED!${nc}\n";
    return 1;
  fi;
}

# Print current STS credentials status to the top right of the terminal
function _aws_clock_print() {

  if [ -n "${AWS_ROLE}" ]; then
    # If we have assumed an IAM role, print the role and the remaining time before credentials expire
    output="[ACCOUNT: ${AWS_ACCOUNT_NAME} ${AWS_ACCOUNT_ID}, ROLE: ${AWS_ROLE}";
    expire_seconds=$(_get_expiry_seconds "${AWS_SESSION_EXPIRY}");

    if [ "${expire_seconds}" -gt 0 ]; then
      output+=", SESSION TTL: $(_get_expiry_display)";
    else
      output+=", SESSION EXPIRED!";
    fi;
  else
    # If we haven't assumed an IAM role, print which AWS_PROFILE we are using (default if none set)

    output="[AWS_PROFILE: ";
    [ -n "${AWS_PROFILE}" ] && output+="${AWS_PROFILE}" || output+="default";

    if [ -n "${AWS_MFA_EXPIRY}" ]; then
      expire_seconds=$(_get_expiry_seconds "${AWS_SESSION_EXPIRY}");

      if [ "${expire_seconds}" -gt 0 ]; then
        output+=", MFA TTL: $(_get_expiry_display)";
      else
        output+=", MFA EXPIRED!";
      fi;
    fi;
  fi;

  output+="]";

  tput_x=$(( $(tput cols)-${#output} ));

  # If we have used tput to print longer output than we are about to print,
  # blank out the extra columns we previously wrote to
  if [ -n "${AWS_CLOCK_COLS_MIN}" ]; then
    if [ "${AWS_CLOCK_COLS_MIN}" -le ${tput_x} ]; then
      export AWS_CLOCK_BLANKING=$(( ${tput_x}-${AWS_CLOCK_COLS_MIN} ));
    else
      export AWS_CLOCK_COLS_MIN="${tput_x}";
    fi;
  else
    export AWS_CLOCK_COLS_MIN="${tput_x}";
  fi;

  tput sc;

  if [[ -n "${AWS_CLOCK_BLANKING}" && "${AWS_CLOCK_BLANKING}" -gt 0 ]]; then
    tput cup 0 "${AWS_CLOCK_COLS_MIN}";
    printf %${AWS_CLOCK_BLANKING}s
  else
    tput cup 0 "${tput_x}";
  fi;

  tput bold;
  echo -n "${output}";
  tput rc;
}

if is_zsh; then
  zmodload zsh/datetime;           # zsh date functions need to be loaded
  export SHELL_INDEX_INCREMENT=1;  # zsh arrays are 1-based rather than 0-based
  precmd() { _aws_clock_print; }   # zsh equivalent of PROMPT_COMMAND
else
  unset SHELL_INDEX_INCREMENT;
  export PROMPT_COMMAND="_aws_clock_print; ${PROMPT_COMMAND}";
fi;
