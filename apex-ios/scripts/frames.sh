#!/usr/bin/env bash
# A contact sheet of frames from a simulator recording, to check a motion's order and timing against its Motion
# tile (`make frames STATE=<name> [DURATION=<seconds>]`).
#   frames.sh STATE [DURATION]
# Installs the built app, records the simulator, launches the app in the designed state, waits DURATION seconds
# (default 2), stops the recording and tiles it at 10 frames a second, in reading order, into
# build/frames/<state>.png. Prints that path. The first frames show what was on screen before the launch.
# Reads SIM_DEVICE APP_PRODUCT BUNDLE_ID from the environment (the Makefile exports them).
set -euo pipefail
frames_per_second=10
columns=5
frame_width=300 # pixels: five across is 1500, small enough to open and large enough to read

state="${1:-}"
duration="${2:-2}"
if [ -z "$state" ] || ! [[ "$duration" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
	echo "usage: frames.sh STATE [DURATION in seconds]" >&2
	exit 64
fi
command -v ffmpeg >/dev/null || { echo "error: ffmpeg is missing. Install it: brew install ffmpeg" >&2; exit 1; }
cd "$(git rev-parse --show-toplevel)/apex-ios"

movie=".build/frames/$state.mov"
sheet="build/frames/$state.png"
mkdir -p .build/frames build/frames
rm -f "$movie"

xcrun simctl install "$SIM_DEVICE" "$APP_PRODUCT"
xcrun simctl terminate "$SIM_DEVICE" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl io "$SIM_DEVICE" recordVideo --codec h264 --force "$movie" >"$movie.log" 2>&1 &
recorder=$!
# The recorder says when its first frame is in: launching before that would lose the start of the motion.
for _ in $(seq 100); do
	grep -q "Recording started" "$movie.log" && break
	kill -0 "$recorder" 2>/dev/null || { cat "$movie.log" >&2; echo "error: the recording did not start" >&2; exit 1; }
	sleep 0.1
done
xcrun simctl launch "$SIM_DEVICE" "$BUNDLE_ID" -State "$state" >/dev/null
sleep "$duration"
running="$(xcrun simctl spawn "$SIM_DEVICE" launchctl list | grep -c "$BUNDLE_ID" || true)"
kill -INT "$recorder"
wait "$recorder" || true
if [ "$running" -eq 0 ]; then
	echo "error: the app stopped. Is $state a designed state? make run STATE=$state says which exist." >&2
	exit 1
fi

frames="$(awk -v d="$duration" -v f="$frames_per_second" 'BEGIN { printf "%d", d * f }')"
rows=$(((frames + columns - 1) / columns))
ffmpeg -loglevel error -y -i "$movie" \
	-vf "fps=$frames_per_second,scale=$frame_width:-1,tile=${columns}x${rows}" -frames:v 1 "$sheet"
echo "$PWD/$sheet"
