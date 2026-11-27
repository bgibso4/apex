# Run as `make -C apex-ios <target>` from the repo root.
#
# The pinned simulator: an iPhone 17 on iOS 27.0, named for this checkout, so two worktrees never share one.
# `make sim` creates it on demand. CI uses the image's `iPhone 17`.
CHECKOUT   := $(notdir $(shell git rev-parse --show-toplevel))
SIM_DEVICE ?= APEX $(CHECKOUT) iPhone 17
SIM_MODEL  := iPhone 17
SIM_OS     ?= 27.0

PROJECT  := Apex.xcodeproj
DERIVED  := $(CURDIR)/.build/DerivedData
SIM_DEST := platform=iOS Simulator,name=$(SIM_DEVICE),OS=$(SIM_OS)
BEAUTIFY := xcbeautify

.PHONY: setup sim generate fast

# Fail loudly, with the install command, when a required tool is missing.
setup:
	@missing=0; for tool in xcodegen swiftlint xcbeautify jq bats periphery; do \
		command -v $$tool >/dev/null || { echo "missing: brew install $$tool"; missing=1; }; \
	done; [ $$missing -eq 0 ] || exit 1
	@$(MAKE) --no-print-directory sim generate

# Create this checkout's simulator when it is missing.
sim:
	@xcrun simctl list devices 'iOS $(SIM_OS)' | grep -qF '    $(SIM_DEVICE) (' || \
		xcrun simctl create '$(SIM_DEVICE)' '$(SIM_MODEL)' com.apple.CoreSimulator.SimRuntime.iOS-$(subst .,-,$(SIM_OS))

generate:
	@command -v xcodegen >/dev/null || { echo "error: xcodegen is missing. Install it: brew install xcodegen" >&2; exit 1; }
	xcodegen generate --quiet

# The Mac-only loop: no simulator.
fast: generate
	set -o pipefail; xcodebuild test -project $(PROJECT) -scheme Fast \
		-destination 'platform=macOS' -derivedDataPath $(DERIVED) | $(BEAUTIFY)
