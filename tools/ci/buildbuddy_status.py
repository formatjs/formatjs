"""Wait for a BuildBuddy-owned status on the exact source commit."""

import argparse
import json
import re
import subprocess
import time


BOT = "buildbuddy-io[bot]"


def latest_status(payload, context):
    for status in payload["statuses"]:
        if (
            status.get("context") == context
            and (status.get("creator") or {}).get("login") == BOT
        ):
            if status["state"] not in {"pending", "success", "failure", "error"}:
                raise ValueError("Invalid BuildBuddy status state")
            return status
    return None


def fetch_status(repo, sha):
    output = subprocess.check_output(
        [
            "gh", "api", "--paginate", "--slurp",
            f"repos/{repo}/commits/{sha}/statuses?per_page=100",
        ],
        text=True,
        timeout=60,
    )
    return {
        "statuses": [status for page in json.loads(output) for status in page]
    }


def wait(repo, sha, context, timeout=1500, interval=15):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9][A-Za-z0-9_.-]*", repo):
        raise ValueError("Invalid repository")
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Invalid source commit SHA")
    deadline = time.monotonic() + timeout
    previous = None
    while True:
        status = latest_status(fetch_status(repo, sha), context)
        state = status["state"] if status else "missing"
        if state != previous:
            print(f"{context} on {sha}: {state}", flush=True)
            previous = state
        if state == "success":
            return
        if state in {"failure", "error"}:
            raise RuntimeError(f"BuildBuddy {context} failed: {status.get('target_url', '')}")
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError(f"Timed out waiting for BuildBuddy {context} on {sha}")
        time.sleep(min(interval, remaining))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--sha", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()
    wait(args.repo, args.sha, args.context)


if __name__ == "__main__":
    main()
