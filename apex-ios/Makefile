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

.PHONY: setup sim boot generate build check-fast-scheme fast lint format test-hooks test-scripts test-lint unused unused-run \
	ci-checks affected retest gate snapshots-record compare run device design-import mocks

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

# The generated project is gitignored, so the pins for the app's packages (swift-snapshot-testing and what it needs)
# live in the tracked ./Package.resolved. XcodeGen cannot carry that file, so `generate` copies it to where Xcode
# reads it, and every build refuses to resolve to anything else (XCB_FLAGS). After changing a package's version in
# project.yml: build once without the flag, then copy $(RESOLVED_DEST)/Package.resolved back here and commit it.
RESOLVED_DEST := $(PROJECT)/project.xcworkspace/xcshareddata/swiftpm
# Flags for every xcodebuild call (and Periphery's build).
XCB_FLAGS     := -onlyUsePackageVersionsFromResolvedFile

# Boot this checkout's simulator and leave it running. A test run that finds it shut down boots it and shuts it
# down again: measured on 2026-11-27, that turns an 11 s run into one of 55 s.
boot: sim
	@xcrun simctl boot '$(SIM_DEVICE)' 2>/dev/null || true

# Everything generated: the tokens (design/tokens.json to Generated/Tokens.swift), the wordmark's font and logo mark
# (copied from the export only when they differ: a rewritten file would recompile Screens), then the Xcode project
# and its package pins.
GENERATED_RESOURCES := Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Resources
generate:
	@command -v xcodegen >/dev/null || { echo "error: xcodegen is missing. Install it: brew install xcodegen" >&2; exit 1; }
	swift scripts/generate-tokens.swift
	@mkdir -p $(GENERATED_RESOURCES) && for file in Exo2-ExtraBold.ttf logo-mark.png; do \
		cmp -s design/export/$$file $(GENERATED_RESOURCES)/$$file || cp design/export/$$file $(GENERATED_RESOURCES)/$$file; \
	done
	xcodegen generate --quiet
	@mkdir -p $(RESOLVED_DEST) && cp Package.resolved $(RESOLVED_DEST)/Package.resolved

build: sim generate
	scripts/build-fingerprint.sh forget
	set -o pipefail; xcodebuild $(XCB_FLAGS) build -project $(PROJECT) -scheme Apex \
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
	fp="$$(scripts/hooks/swift-fingerprint.sh)"; set -o pipefail; xcodebuild $(XCB_FLAGS) test -project $(PROJECT) -scheme Fast \
		-destination 'platform=macOS' -derivedDataPath $(DERIVED) | $(BEAUTIFY) && \
		scripts/hooks/swift-fingerprint.sh record "$$fp"

SWIFT_DIRS := App Packages/ApexKit/Sources Packages/ApexKit/Tests SnapshotTests UITests

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
	periphery scan -- -destination '$(SIM_DEST)' $(XCB_FLAGS)

# Everything CI's `checks` job runs (.github/workflows/ios.yml). `fast` is the Mac slice: it compiles for macOS every
# module the Fast scheme's tests reach, so UIKit or an iOS-only API in one of them fails here. SwiftUI compiles on
# macOS, so only the lint rule catches that import.
# It starts by regenerating: a committed Generated/ file that differs from what its source gives fails here.
# The map check fails when scripts/test-map.txt names a test class that does not exist or leaves one out.
ci-checks: generate
	@[ -z "$$(git status --porcelain -- ':(glob)**/Generated/**')" ] || \
		{ echo "error: generated files differ from the committed ones: run make -C apex-ios generate and commit" >&2; exit 1; }
	scripts/affected-tests.sh --check-map
	$(MAKE) --no-print-directory lint test-hooks test-scripts test-lint fast unused-run

# Simulator test runs, all through scripts/sim-tests.sh. It builds once, runs the tests without building again and
# appends a line per run to .build/test-runs.log.
#   make retest ONLY="<Target/Class[/test]> …"  while fixing: no build; refuses when the sources changed since the last one
#   make affected                               at the end of a task: the classes the branch's changes touch
#                                               (scripts/test-map.txt; BASE=<ref>, default origin/main)
#   make gate                                   before a pull request: every simulator test
#   make snapshots-record [ONLY=…]              rewrites each picture's reference that fails or is missing. A non-zero
#                                               exit is expected: the library reports recording as a failure. Run
#                                               `make retest ONLY=<the classes>` to confirm green
SIM_TESTS = ONLY='$(ONLY)' BASE='$(BASE)' SIM_DEST='$(SIM_DEST)' XCB_FLAGS='$(XCB_FLAGS)' PROJECT='$(PROJECT)' \
	DERIVED='$(DERIVED)' scripts/sim-tests.sh

affected: boot generate
	@$(SIM_TESTS) affected

retest: boot
	@$(SIM_TESTS) retest

gate: boot generate
	@$(SIM_TESTS) gate

snapshots-record: boot generate
	@$(SIM_TESTS) record

# A designed state's recorded picture beside its mock, for the eye: build/compare/<state>.png. Open it.
compare:
	@[ -n "$(STATE)" ] || { echo "usage: make compare STATE=<designed state, such as home.noProgram>" >&2; exit 1; }
	@swift scripts/compare-snapshot.swift "$(STATE)"

# Run on this checkout's simulator, in a designed state when one is named (`STATE=home.noProgram`). The simulator is
# named, never `booted`: another worktree's simulator may be booted too.
run: build boot
	xcrun simctl install '$(SIM_DEVICE)' '$(APP_PRODUCT)'
	xcrun simctl launch --terminate-running-process '$(SIM_DEVICE)' $(BUNDLE_ID) $(if $(STATE),-State $(STATE))

# Build for a connected iPhone and install it. Needs the phone plugged in, unlocked and trusted.
device: generate
	set -o pipefail; xcodebuild $(XCB_FLAGS) build -project $(PROJECT) -scheme Apex \
		-destination 'generic/platform=iOS' -derivedDataPath $(DERIVED) -allowProvisioningUpdates | $(BEAUTIFY)
	xcrun devicectl device install app --device "$(DEVICE)" '$(DEVICE_PRODUCT)'
	xcrun devicectl device process launch --device "$(DEVICE)" $(BUNDLE_ID)

# Replace design/export with a new export (design/README.md), list what that changed against git (`??` is a new
# file, ` D` a removed one, ` M` a changed one, `!!` one an ignore rule would keep out of git), then render the
# reference images again.
design-import:
	@[ -n "$(ZIP)" ] || { echo "usage: make design-import ZIP=<path to the export zip>" >&2; exit 1; }
	python3 -I scripts/design-import.py "$(ZIP)" design/export
	@git -c core.quotePath=false status --short --untracked-files=all --ignored -- design/export
	@$(MAKE) --no-print-directory mocks

# Render the reference image of every designed state in design/states.json, or of one (`STATE=home.noProgram`).
# Needs Google Chrome and the network: the demos load React from unpkg. Never run in CI; the images are committed.
mocks:
	python3 -I scripts/render-mocks.py design/states.json design/mocks $(STATE)
