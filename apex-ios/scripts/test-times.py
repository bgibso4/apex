#!/usr/bin/env python3
"""The time report every simulator test run ends with (scripts/sim-tests.sh).

    test-times.py TESTS_JSON CEILING_FILE [--enforce]

TESTS_JSON is the output of `xcrun xcresulttool get test-results tests --path <bundle> --compact`. CEILING_FILE
(scripts/gate-ceiling.txt) holds `#` comment lines and one number: the most seconds the tests may take in all.

Prints the total test time, its share of the ceiling and the five slowest tests. Over 80% of the ceiling it warns.
Over the ceiling it says so, and exits 1 only with --enforce: CI passes that flag, and a local run never fails on
time. It always exits 1 when no test ran, when a test did not pass, and when one test took over 60 s.
Run with `python3 -I`. Standard library only.
"""

import json
import pathlib
import sys

SLOWEST_SHOWN = 5
WARN_SHARE = 0.8
ONE_TEST_LIMIT = 60  # seconds: stops a hang, and one giant journey


def test_cases(node):
    """Every test case under a node of the result tree, however deep its suites nest."""
    if node.get("nodeType") == "Test Case":
        yield node
        return
    for child in node.get("children", []):
        yield from test_cases(child)


def ceiling_in(path):
    """The one number in the ceiling file, or None when there is no file or no one number in it."""
    try:
        numbers = [line for line in path.read_text().split("\n") if line.strip() and not line.startswith("#")]
        return float(numbers[0]) if len(numbers) == 1 else None
    except (OSError, ValueError):
        return None


def main(arguments):
    enforce = "--enforce" in arguments
    paths = [argument for argument in arguments if argument != "--enforce"]
    if len(paths) != 2:
        sys.exit("usage: test-times.py TESTS_JSON CEILING_FILE [--enforce]")
    results, ceiling_file = (pathlib.Path(path) for path in paths)

    ceiling = ceiling_in(ceiling_file)
    if ceiling is None:
        print(f"error: {ceiling_file} must hold one number, the ceiling in seconds")
        return 1
    tests = [case for node in json.loads(results.read_text()).get("testNodes", []) for case in test_cases(node)]
    if not tests:
        print("error: no test ran, so this run proves nothing")
        return 1

    def seconds(test):
        return test.get("durationInSeconds", 0)

    total = sum(seconds(test) for test in tests)
    share = total / ceiling
    print(f"test time: {total:.1f} s of a {ceiling:g} s ceiling ({share:.0%}) · {len(tests)} tests")
    print("slowest:")
    for test in sorted(tests, key=seconds, reverse=True)[:SLOWEST_SHOWN]:
        print(f"{seconds(test):6.1f} s  {test['nodeIdentifier']}")

    failed = False
    for test in tests:
        if test.get("result") != "Passed":
            print(f"error: {test['nodeIdentifier']} did not pass ({test.get('result')})")
            failed = True
        if seconds(test) > ONE_TEST_LIMIT:
            print(f"error: {test['nodeIdentifier']} took {seconds(test):.1f} s; one test may take {ONE_TEST_LIMIT} s")
            failed = True
    if share > 1:
        print(
            f"error: the tests are over the ceiling by {total - ceiling:.1f} s. Speed one up, move it to the Mac,"
            " or remove it; raising the ceiling needs Ben."
        )
        failed = failed or enforce
    elif share > WARN_SHARE:
        print(f"warning: the tests use over {WARN_SHARE:.0%} of the ceiling")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
