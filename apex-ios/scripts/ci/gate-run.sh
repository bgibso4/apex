#!/usr/bin/env bash
# Which CI run passed the gate on exactly a commit's files (.github/workflows/ios.yml, the `plan` job).
#   gate-run.sh <sha>   prints the ID of the newest run of ios.yml that concluded success, with its job named `gate`
#                       successful, on a head commit whose tree is <sha>'s tree, and exits 0. Otherwise it prints
#                       nothing, says why in one warning on stderr and exits 1.
# Two questions come here. A push to main asks whether its files already passed, so the gate can be skipped. And a
# gate run asks which run holds main's test times, to show the change against main.
# Why the tree: a pull request's run tests the pull request merged into main. When the pull request was up to date
# with main, its merge commit has the head's tree, so those files were already tested. A pull request that was
# behind main merges to a tree no run has seen, and the answer is no.
# One known gap, which GitHub's API gives no cheap way to close: a pull request tested while behind main by a
# commit, that commit then reverted on main, and the pull request merged with no new push. The merge has the head's
# tree and counts, though the run tested the head with that commit.
# A run is never counted on a guess: when GitHub cannot be asked the answer is no. It looks at pull request runs and
# push runs alike, newest first, the last 50 successful ones.
# Reads GITHUB_REPOSITORY; calls the GitHub API through gh (GH_TOKEN; the job needs `actions: read`). APEX_GH is a
# seam for the bats tests.
set -uo pipefail
gh="${APEX_GH:-gh}"
sha="${1:?usage: gate-run.sh <sha>}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must name the repository, as owner/name}"

no() {
	echo "warning: $1" >&2
	exit 1
}

tree="$(git rev-parse --verify --quiet "$sha^{tree}")" || no "$sha is not a commit here"
# status=success asks GitHub for 50 successful runs, not the last 50 of any kind; the select is what the tests hold.
runs="$("$gh" api "repos/$repo/actions/workflows/ios.yml/runs?status=success&per_page=50" \
	--jq '.workflow_runs[] | select(.conclusion == "success") | "\(.id) \(.head_commit.tree_id)"')" ||
	no "GitHub could not list the runs of ios.yml"

while read -r id run_tree; do
	[ "$run_tree" = "$tree" ] || continue
	gate="$("$gh" api "repos/$repo/actions/runs/$id/jobs" --jq '.jobs[] | select(.name == "gate") | .conclusion')" ||
		no "GitHub could not list the jobs of run $id"
	if [ "$gate" = success ]; then
		echo "$id"
		exit 0
	fi
done <<<"$runs"
no "no run of ios.yml passed the gate on the files of $sha"
