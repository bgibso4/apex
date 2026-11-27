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

BUNDLE_ID      := com.cadre.apex
APP_PRODUCT    := $(DERIVED)/Build/Products/Debug-iphonesimulator/Apex.app
DEVICE_PRODUCT := $(DERIVED)/Build/Products/Debug-iphoneos/Apex.app
# Name, UDID or serial of the target iPhone (see `xcrun devicectl list devices`).
DEVICE         ?= iPhone

.PHONY: setup sim generate build fast lint format test-lint unused unused-run run device

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

build: sim generate
	set -o pipefail; xcodebuild build -project $(PROJECT) -scheme Apex \
		-destination '$(SIM_DEST)' -derivedDataPath $(DERIVED) | $(BEAUTIFY)

# The Mac-only loop: no simulator.
fast: generate
	set -o pipefail; xcodebuild test -project $(PROJECT) -scheme Fast \
		-destination 'platform=macOS' -derivedDataPath $(DERIVED) | $(BEAUTIFY)

SWIFT_DIRS := App Packages/ApexKit/Sources Packages/ApexKit/Tests

# swift-format owns formatting; SwiftLint owns everything else. Both are strict.
lint:
	swiftlint lint --strict --quiet
	swift format lint --strict --recursive $(SWIFT_DIRS)

format:
	swift format format --in-place --recursive $(SWIFT_DIRS)

# Fixture tests for the SwiftLint custom rules.
test-lint:
	scripts/test-lint-rules.sh

# Dead-code scan (.periphery.yml, strict). Builds with its own derived data, on this checkout's simulator.
unused: generate unused-run

unused-run: sim
	periphery scan -- -destination '$(SIM_DEST)'

# Run on this checkout's simulator. Named, never `booted`: another worktree's simulator may be booted too.
run: build
	xcrun simctl boot '$(SIM_DEVICE)' 2>/dev/null || true
	xcrun simctl install '$(SIM_DEVICE)' '$(APP_PRODUCT)'
	xcrun simctl launch '$(SIM_DEVICE)' $(BUNDLE_ID)

# Build for a connected iPhone and install it. Needs the phone plugged in, unlocked and trusted.
device: generate
	set -o pipefail; xcodebuild build -project $(PROJECT) -scheme Apex \
		-destination 'generic/platform=iOS' -derivedDataPath $(DERIVED) -allowProvisioningUpdates | $(BEAUTIFY)
	xcrun devicectl device install app --device "$(DEVICE)" '$(DEVICE_PRODUCT)'
	xcrun devicectl device process launch --device "$(DEVICE)" $(BUNDLE_ID)
