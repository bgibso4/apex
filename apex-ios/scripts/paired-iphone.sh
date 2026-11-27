#!/usr/bin/env bash
# The iPhone `make device` installs on when DEVICE is not given: the one physical iPhone paired with this Mac.
#   paired-iphone.sh    prints its identifier (devicectl takes it for --device)
# With no paired iPhone, or more than one, it fails and says what to do. A phone's name is no use as a default:
# "Ben’s iPhone" has a typographic apostrophe, and devicectl matches the whole name.
set -euo pipefail

list="$(mktemp)"
trap 'rm -f "$list"' EXIT
xcrun devicectl list devices --json-output "$list" >/dev/null

# One line per phone: identifier, tab, name.
phones="$(jq -r '.result.devices[]
	| select(.hardwareProperties.reality == "physical" and .hardwareProperties.deviceType == "iPhone"
		and .connectionProperties.pairingState == "paired")
	| "\(.identifier)\t\(.deviceProperties.name)"' "$list")"

case "$(printf '%s' "$phones" | grep -c . || true)" in
1) printf '%s\n' "$phones" | cut -f1 ;;
0)
	echo "error: no paired iPhone. Plug it in, unlock it and tap Trust; \`xcrun devicectl list devices\` shows it." >&2
	exit 1
	;;
*)
	echo "error: more than one paired iPhone. Name one with DEVICE=<name>:" >&2
	printf '%s\n' "$phones" | cut -f2 >&2
	exit 1
	;;
esac
