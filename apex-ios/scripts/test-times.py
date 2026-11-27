#!/usr/bin/env python3
"""The time report every simulator test run ends with (scripts/sim-tests.sh).

    test-times.py TESTS_JSON CEILING_FILE [--enforce] [--main MAIN_TESTS_JSON]

TESTS_JSON is the output of `xcrun xcresulttool get test-results tests --path <bundle> --compact`. CEILING_FILE
(scripts/gate-ceiling.txt) holds `#` comment lines and one number above zero: the most seconds the tests may take in
all.

Prints the total test time, its share of the ceiling and the five slowest tests. Over 80% of the ceiling it warns.
Over the ceiling it says so, and exits 1 only with --enforce: CI passes that flag, and a local run never fails on
time. It always exits 1 when no test ran, when a test did not pass, and when one test took over 60 s.
With --main the second line is the change against main's total: MAIN_TESTS_JSON is the TESTS_JSON of the run that
last passed the gate on main. A file that is missing or cannot be read makes that line say unknown, nothing more.
Run with `python3 -I`. Standard library only.
"""

import argparse
import json
import math
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


def tests_in(path):
    """Every test case in a results file."""
    return [case for node in json.loads(path.read_text()).get("testNodes", []) for case in test_cases(node)]


def seconds(test):
    return test.get("durationInSeconds", 0)


def change_against_main(main_results, total):
    """The report's line for this run's total against the total in main's results file."""
    try:
        main_total = sum(seconds(test) for test in tests_in(main_results))
    except (OSError, ValueError, AttributeError, TypeError):  # whatever is wrong with the file, only this line says so
        return "change against main: unknown (no gate results for main)"
    change = round(total - main_total, 1) + 0.0  # adding 0.0 turns -0.0 into 0.0, so no change prints as +0.0
    return f"change against main: {change:+.1f} s (main {main_total:.1f} s)"


def ceiling_in(path):
    """The one number in the ceiling file, or None when there is no file or no one number above zero in it."""
    try:
        numbers = [line for line in path.read_text().split("\n") if line.strip() and not line.startswith("#")]
        ceiling = float(numbers[0]) if len(numbers) == 1 else None
    except (OSError, ValueError):
        return None
    return ceiling if ceiling is not None and math.isfinite(ceiling) and ceiling > 0 else None


def main(arguments):
    parser = argparse.ArgumentParser(usage="test-times.py TESTS_JSON CEILING_FILE [--enforce] [--main MAIN_TESTS_JSON]")
    parser.add_argument("results", type=pathlib.Path)
    parser.add_argument("ceiling_file", type=pathlib.Path)
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--main", type=pathlib.Path)
    options = parser.parse_args(arguments)
    ceiling_file = options.ceiling_file

    ceiling = ceiling_in(ceiling_file)
    if ceiling is None:
        print(f"error: {ceiling_file} must hold one number above zero, the ceiling in seconds")
        return 1
    tests = tests_in(options.results)
    if not tests:
        print("error: no test ran, so this run proves nothing")
        return 1

    total = sum(seconds(test) for test in tests)
    share = total / ceiling
    print(f"test time: {total:.1f} s of a {ceiling:g} s ceiling ({share:.0%}) · {len(tests)} tests")
    if options.main:
        print(change_against_main(options.main, total))
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
        failed = failed or options.enforce
    elif share > WARN_SHARE:
        print(f"warning: the tests use over {WARN_SHARE:.0%} of the ceiling")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
