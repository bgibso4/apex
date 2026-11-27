#!/usr/bin/env bats

# scripts/paired-iphone.sh: which iPhone `make device` installs on when DEVICE is not given. xcrun is a stub that
# writes the devices in $DEVICES where devicectl is told to. Every `[[ ]]` below ends in `|| false`: on macOS's
# bash 3.2 a failing `[[ ]]` that is not a test's last command does not fail the test.
SCRIPTS="$BATS_TEST_DIRNAME/.."

setup() {
  mkdir -p "$BATS_TEST_TMPDIR/bin"
  cat >"$BATS_TEST_TMPDIR/bin/xcrun" <<'STUB'
#!/usr/bin/env bash
[ "$1 $2 $3 $4" = "devicectl list devices --json-output" ] || { echo "unexpected: $*" >&2; exit 2; }
printf '{"result": {"devices": [%s]}}' "$DEVICES" >"$5"
STUB
  chmod +x "$BATS_TEST_TMPDIR/bin/xcrun"
  PATH="$BATS_TEST_TMPDIR/bin:$PATH"
}

# device NAME ID REALITY TYPE PAIRING: one entry of devicectl's list.
device() {
  printf '{"identifier": "%s", "deviceProperties": {"name": "%s"}, "hardwareProperties": {"reality": "%s", "deviceType": "%s"}, "connectionProperties": {"pairingState": "%s"}}' \
    "$2" "$1" "$3" "$4" "$5"
}

SIMULATOR="$(device "APEX apex iPhone 17" SIM-1 simulated iPhone paired)"
PHONE="$(device "Ben’s iPhone" PHONE-1 physical iPhone paired)"

@test "the one paired iPhone is found among simulators, a watch and an unpaired phone" {
  export DEVICES="$SIMULATOR, $PHONE, $(device Watch WATCH-1 physical appleWatch paired), $(device Old PHONE-0 physical iPhone unpaired)"
  run "$SCRIPTS/paired-iphone.sh"
  [ "$status" -eq 0 ]
  [ "$output" = PHONE-1 ]
}

@test "with no paired iPhone it fails and says what to do" {
  export DEVICES="$SIMULATOR"
  run "$SCRIPTS/paired-iphone.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == "error: no paired iPhone"* ]] || false
}

@test "with two paired iPhones it fails and names both" {
  export DEVICES="$PHONE, $(device "Spare iPhone" PHONE-2 physical iPhone paired)"
  run "$SCRIPTS/paired-iphone.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"DEVICE="*"Ben’s iPhone"*"Spare iPhone"* ]] || false
}
