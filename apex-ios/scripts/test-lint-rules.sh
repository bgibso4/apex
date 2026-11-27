#!/bin/bash
# Positive fixtures (scripts/lint-fixtures/<rule>*.swift) each hold exactly one violation; assert
# SwiftLint reports that rule. Negative fixtures (scripts/lint-negatives/<rule>*.swift) must not
# trigger the rule. Fixtures are excluded from normal lint, so each is copied into a temp tree
# (under a Packages/ path, or the module path a rule is scoped to, so path-scoped rules apply) and linted with the
# repo config alone. The UI-import fixture lands in a module no list mentions: a new module is covered by default.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fail=0

lint_fixture() { # file -> swiftlint output
    local name dir
    name="$(basename "$1" .swift)"
    case "$name" in
    *_in_design_system) dir="$tmp/$name/Packages/ApexKit/Sources/Screens/DesignSystem" ;;
    *_in_core) dir="$tmp/$name/Packages/ApexKit/Sources/Core" ;;
    no_raw_*) dir="$tmp/$name/Packages/ApexKit/Sources/Screens/Home" ;;
    *_in_screens_tests) dir="$tmp/$name/Packages/ApexKit/Tests/ScreensTests" ;;
    *_in_screens) dir="$tmp/$name/Packages/ApexKit/Sources/Screens" ;;
    no_ui_imports_in_mac_modules*) dir="$tmp/$name/Packages/ApexKit/Sources/NewModule" ;;
    *) dir="$tmp/$name/Packages/Fixture/Sources" ;;
    esac
    mkdir -p "$dir"
    cp "$1" "$dir/"
    (cd "$tmp/$name" && swiftlint lint --no-cache --config "$root/.swiftlint.yml" --quiet Packages 2>&1)
}

for rule in no_print try_optional_needs_reason no_shared_in_package disable_needs_reason no_ui_imports_in_mac_modules \
    no_raw_color no_raw_font no_raw_animation; do
    for file in "$root"/scripts/lint-fixtures/"$rule"*.swift; do
        out="$(lint_fixture "$file")"
        if grep -q "($rule)" <<<"$out"; then
            echo "PASS $(basename "$file")"
        else
            echo "FAIL $(basename "$file")"; echo "$out" | sed 's/^/    /'
            fail=1
        fi
    done
    for file in "$root"/scripts/lint-negatives/"$rule"*.swift; do
        [ -e "$file" ] || continue
        out="$(lint_fixture "$file")"
        if grep -q "($rule)" <<<"$out"; then
            echo "FAIL (negative) $(basename "$file")"; echo "$out" | sed 's/^/    /'
            fail=1
        else
            echo "PASS (negative) $(basename "$file")"
        fi
    done
done
exit $fail
