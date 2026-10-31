import json
import subprocess
import unittest
from unittest.mock import patch

from tools.ci import buildbuddy_status as status


SHA = "a" * 40


def payload(state, context="Verify hooks", creator=status.BOT):
    return {
        "statuses": [{"context": context, "state": state, "creator": {"login": creator}}]
    }


class BuildBuddyStatusTest(unittest.TestCase):
    def test_requires_exact_context_and_buildbuddy_sender(self):
        self.assertIsNone(
            status.latest_status(payload("success", creator="someone"), "Verify hooks")
        )
        self.assertIsNone(
            status.latest_status(
                payload("success", context="Test all targets"), "Verify hooks"
            )
        )

    def test_deleted_or_missing_status_creator_cannot_pass(self):
        response = payload("success")
        response["statuses"][0]["creator"] = None
        self.assertIsNone(status.latest_status(response, "Verify hooks"))

    @patch.object(status.time, "sleep")
    @patch.object(status, "fetch_status")
    def test_waits_for_success_on_exact_head(self, fetch, sleep):
        fetch.side_effect = [{"statuses": []}, payload("pending"), payload("success")]
        status.wait("formatjs/formatjs", SHA, "Verify hooks")
        self.assertEqual(fetch.call_count, 3)
        fetch.assert_called_with("formatjs/formatjs", SHA)
        self.assertEqual(sleep.call_count, 2)

    @patch.object(status, "fetch_status")
    def test_failures_errors_missing_and_untrusted_statuses_cannot_pass(self, fetch):
        for state in ["failure", "error"]:
            fetch.return_value = payload(state)
            with self.assertRaises(RuntimeError):
                status.wait("formatjs/formatjs", SHA, "Verify hooks")
        for response in [
            {"statuses": []}, payload("pending"), payload("success", creator="someone")
        ]:
            fetch.return_value = response
            with self.assertRaises(TimeoutError):
                status.wait("formatjs/formatjs", SHA, "Verify hooks", timeout=0)

    @patch.object(status, "fetch_status")
    def test_api_failure_does_not_pass(self, fetch):
        fetch.side_effect = subprocess.CalledProcessError(1, "gh")
        with self.assertRaises(subprocess.CalledProcessError):
            status.wait("formatjs/formatjs", SHA, "Verify hooks")

    @patch.object(status.subprocess, "check_output", return_value='[[]]')
    def test_fetch_is_bound_to_source_sha(self, run):
        status.fetch_status("formatjs/formatjs", SHA)
        self.assertEqual(
            run.call_args.args[0][-1],
            f"repos/formatjs/formatjs/commits/{SHA}/statuses?per_page=100",
        )

    def test_newer_failure_cannot_be_overridden_by_old_success(self):
        response = {"statuses": payload("failure")["statuses"] + payload("success")["statuses"]}
        self.assertEqual(status.latest_status(response, "Verify hooks")["state"], "failure")

    @patch.object(status.subprocess, "check_output")
    def test_pagination_retains_statuses_beyond_first_page(self, run):
        run.return_value = json.dumps([
            payload("success", context="Other check")["statuses"],
            payload("failure")["statuses"]
        ])
        result = status.latest_status(status.fetch_status("formatjs/formatjs", SHA), "Verify hooks")
        self.assertEqual(result["state"], "failure")

    def test_invalid_inputs_fail_before_request(self):
        for repo, sha in [("formatjs/formatjs", "main"), ("../formatjs", SHA)]:
            with self.assertRaises(ValueError):
                status.wait(repo, sha, "Verify hooks")
        with self.assertRaises(ValueError):
            status.latest_status(payload("unknown"), "Verify hooks")


if __name__ == "__main__":
    unittest.main()
