# Run as `make -C apex-ios <target>` from the repo root.
#
# The pinned simulator: an iPhone 17 on iOS 27.0, named for this checkout, so two worktrees never share one.
# `make sim` creates it on demand. CI uses the image's `iPhone 17`.
# The checkout's folder name, from this Makefile's own folder: no git call, so it is right under a git hook too.
CHECKOUT   := $(notdir $(patsubst %/,%,$(dir $(CURDIR))))
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

.PHONY: setup sim generate build check-fast-scheme fast lint format test-hooks test-scripts test-lint unused unused-run \
	ci-checks run device design-import

# Fail loudly, with the install command, when a required tool is missing. Then install the git pre-commit hook:
# a copy of scripts/pre-commit-wrapper in the shared hooks folder, which every branch and worktree uses.
setup:
	@missing=0; for tool in xcodegen swiftlint xcbeautify jq bats periphery; do \
		command -v $$tool >/dev/null || { echo "missing: brew install $$tool"; missing=1; }; \
	done; [ $$missing -eq 0 ] || exit 1
	@hooks="$$(git rev-parse --path-format=absolute --git-path hooks)"; mkdir -p "$$hooks" && \
		install -m 755 scripts/pre-commit-wrapper "$$hooks/pre-commit"
	@$(MAKE) --no-print-directory sim generate

# Create this checkout's simulator when it is missing.
sim:
	@xcrun simctl list devices 'iOS $(SIM_OS)' | grep -qF '    $(SIM_DEVICE) (' || \
		xcrun simctl create '$(SIM_DEVICE)' '$(SIM_MODEL)' com.apple.CoreSimulator.SimRuntime.iOS-$(subst .,-,$(SIM_OS))

# Everything generated: the tokens (design/tokens.json to Generated/Tokens.swift), then the Xcode project.
generate:
	@command -v xcodegen >/dev/null || { echo "error: xcodegen is missing. Install it: brew install xcodegen" >&2; exit 1; }
	swift scripts/generate-tokens.swift
	xcodegen generate --quiet

build: sim generate
	set -o pipefail; xcodebuild build -project $(PROJECT) -scheme Apex \
		-destination '$(SIM_DEST)' -derivedDataPath $(DERIVED) | $(BEAUTIFY)

# The Fast scheme's test list (project.yml) is written by hand. A package test target left out of it would run
# nowhere and nothing else would say so, so every one but ScreensTests (simulator only) must be in the scheme.
check-fast-scheme: generate
	@for target in $$(perl -0ne 'print "$$1\n" while /\.testTarget\(\s*name:\s*"(\w+)"/g' Packages/ApexKit/Package.swift); do \
		[ "$$target" = ScreensTests ] || grep -qF 'BlueprintName = "'"$$target"'"' $(PROJECT)/xcshareddata/xcschemes/Fast.xcscheme || \
			{ echo "error: $$target is not in the Fast scheme. Add it under schemes.Fast.test.targets in project.yml." >&2; exit 1; }; \
	done

# The Mac-only loop: no simulator. A pass records the sources' fingerprint as it was before the run, which is what
# the stop gate compares against (scripts/hooks/stop-gate.sh).
fast: check-fast-scheme
	fp="$$(scripts/hooks/swift-fingerprint.sh)"; set -o pipefail; xcodebuild test -project $(PROJECT) -scheme Fast \
		-destination 'platform=macOS' -derivedDataPath $(DERIVED) | $(BEAUTIFY) && \
		scripts/hooks/swift-fingerprint.sh record "$$fp"

SWIFT_DIRS := App Packages/ApexKit/Sources Packages/ApexKit/Tests

# swift-format owns formatting; SwiftLint owns everything else. Both are strict.
lint:
	swiftlint lint --strict --quiet
	swift format lint --strict --recursive $(SWIFT_DIRS)

format:
	swift format format --in-place --recursive $(SWIFT_DIRS)

# Unit tests for the Claude Code hook scripts.
test-hooks:
	bats scripts/hooks/tests

# Unit tests for the design tools in scripts/.
test-scripts:
	bats scripts/tests

# Fixture tests for the SwiftLint custom rules.
test-lint:
	scripts/test-lint-rules.sh

# Dead-code scan (.periphery.yml, strict). Builds with its own derived data, on this checkout's simulator.
unused: generate unused-run

unused-run: sim
	periphery scan -- -destination '$(SIM_DEST)'

# Everything CI's `checks` job runs (.github/workflows/ios.yml). `fast` is the Mac slice: it compiles for macOS every
# module the Fast scheme's tests reach, so UIKit or an iOS-only API in one of them fails here. SwiftUI compiles on
# macOS, so only the lint rule catches that import.
# It starts by regenerating: a committed Generated/ file that differs from what its source gives fails here.
ci-checks: generate
	@[ -z "$$(git status --porcelain -- ':(glob)**/Generated/**')" ] || \
		{ echo "error: generated files differ from the committed ones: run make -C apex-ios generate and commit" >&2; exit 1; }
	$(MAKE) --no-print-directory lint test-hooks test-scripts test-lint fast unused-run

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

# Replace design/export with a new export (design/README.md), then list what that changed against git:
# `??` is a new file, ` D` a removed one, ` M` a changed one.
design-import:
	@[ -n "$(ZIP)" ] || { echo "usage: make design-import ZIP=<path to the export zip>" >&2; exit 1; }
	python3 -I scripts/design-import.py "$(ZIP)" design/export
	@git -c core.quotePath=false status --short --untracked-files=all -- design/export
