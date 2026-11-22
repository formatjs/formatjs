"""Check the frozen requirement identities and their live source bindings."""

from collections import Counter
import csv
from functools import cache
import hashlib
import json
from pathlib import Path
import re


AUDITS = Path(__file__).resolve().parent
ROOT = AUDITS.parents[1]
FROZEN = {
    "core": (4808, "2e3f434da4173771d44a3c3c325643f40286790a169aec6bab1866d614706b01"),
    "amendment": (1057, "ecd96b0bd513c71d588d1b53ca09568f12f78505842c16123bfcd21252bd2ce1"),
}
IDENTITY_FIELDS = ("id", "section", "anchor", "kind", "requirement_text", "snapshot_location")


def rows(name):
    with (AUDITS / name).open() as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def manifest(name):
    return json.loads((AUDITS / name).read_text())


@cache
def source(name):
    return (ROOT / name).read_bytes()


@cache
def lines(name):
    return source(name).decode().splitlines()


def validate_hashes(hashes):
    for file, expected in hashes.items():
        assert hashlib.sha256(source(file)).hexdigest() == expected, file


def validate_ranges(value):
    for location in filter(None, value.split("; ")):
        file, _, extent = location.rpartition(":")
        first, _, last = extent.partition("-")
        assert 1 <= int(first) <= int(last or first) <= len(lines(file)), location


def validate_requirements():
    conditional = {}
    for scope, (count, expected_hash) in FROZEN.items():
        register = rows(f"temporal-{scope}-requirement-checklist.tsv")
        identity = [[row[field] for field in IDENTITY_FIELDS] for row in register]
        payload = json.dumps(identity, ensure_ascii=False, separators=(",", ":")).encode()
        assert len(register) == len({row["id"] for row in register}) == count, scope
        assert hashlib.sha256(payload).hexdigest() == expected_hash, scope
        for row in register:
            validate_ranges(row["implementation_locations"])
            if row["kind"] == "algorithm_step" and row["review_status"] == "conditional":
                conditional[row["id"]] = scope
        summary = manifest(f"temporal-{scope}-requirement-checklist-summary.json")
        assert summary["review_status_counts"] == Counter(r["review_status"] for r in register)

    open_rows = rows("temporal-remaining-condition-steps.tsv")
    assert len(open_rows) == len(conditional)
    assert {r["id"]: r["scope"] for r in open_rows} == conditional
    for row in open_rows:
        validate_ranges(row["implementation_locations"])

    summary = manifest("temporal-conditional-families-summary.json")
    grouped = []
    classifications = Counter()
    groups = rows("temporal-conditional-families.tsv")
    assert len(groups) == summary["families"]
    assert len(conditional) == summary["algorithm_rows"]
    for group in groups:
        members = group["row_ids"].split("; ")
        assert len(members) == int(group["count"]), group["family"]
        scopes = Counter(conditional[member] for member in members)
        assert scopes["core"] == int(group["core_count"]), group["family"]
        assert scopes["amendment"] == int(group["amendment_count"]), group["family"]
        grouped.extend(members)
        classifications[group["classification"]] += len(members)
    assert len(grouped) == len(conditional) and set(grouped) == conditional.keys()
    assert classifications == summary["classification_counts"]
    deferred = set(summary["scope_decision"]["deferred_requirement_ids"])
    assert deferred <= conditional.keys()
    assert len(deferred) == summary["scope_decision"]["deferred_algorithm_rows"]
    active = conditional.keys() - deferred
    assert len(active) == summary["scope_decision"]["active_conditional_algorithm_rows"]
    validate_hashes(summary["input_files"])


def validate_helper_bindings():
    queue = rows("temporal-helper-annotation-queue.tsv")
    mapping = rows("temporal-helper-code-spec-map.tsv")
    summary = manifest("temporal-helper-annotation-summary.json")
    coverage = Counter(r["annotation_coverage"] for r in queue)
    assert len(queue) == len(mapping) == summary["inventory_rows"]
    assert coverage == summary["annotation_coverage"]
    assert Counter(r["mapping_status"] for r in queue) == summary["mapping_status"]
    for index, (row, owner) in enumerate(zip(queue, mapping, strict=True), 1):
        assert int(row["inventory_row"]) == index
        assert all(row[key] == owner[key] for key in ("file", "symbol", "kind", "mapping_status"))
        if row["annotation_coverage"] == "retired_callback":
            assert not row["current_locations"] and not row["numbered_anchors"], index
            continue
        validate_ranges(row["current_locations"])
        assert row["source_sha256"] == owner["source_sha256"], index
        assert row["source_sha256"] == summary["source_hashes"][row["file"]], index
        if row["annotation_coverage"] == "direct_numbered":
            for anchor in row["numbered_anchors"].split("|"):
                number, sections = anchor.split(":")
                number = int(number)
                file_lines = lines(row["file"])
                assert 1 <= number <= len(file_lines), (index, anchor)
                cited = re.findall(r"§\s*(\d+(?:\.\d+)+)", file_lines[number - 1])
                assert set(sections.split(",")) <= set(cited), (index, anchor)

    residual = rows("temporal-helper-residual-owners.tsv")
    expected = [
        (r["inventory_row"], r["current_locations"], r["symbol"])
        for r in queue
        if r["annotation_coverage"] == "no_numbered_anchor"
    ]
    assert expected == [(r["inventory_row"], r["current_location"], r["symbol"]) for r in residual]
    validate_hashes(summary["source_hashes"])


def main():
    validate_requirements()
    validate_helper_bindings()
    for name in (
        "temporal-public-code-spec-map-manifest.json",
        "temporal-amendment-review-source-manifest.json",
        "temporal-public-inline-comment-map.json",
    ):
        data = manifest(name)
        validate_hashes(data["source_files"])
        for entry in data.get("entries", []):
            validate_ranges("; ".join(entry["comment_locations"]))
            for location in entry["comment_locations"]:
                file, _, extent = location.rpartition(":")
                first, _, last = extent.partition("-")
                comments = "\n".join(lines(file)[int(first) - 1 : int(last or first)])
                cited = re.findall(r"§\s*(\d+(?:\.\d+)+)", comments)
                assert entry["section"] in cited, (entry["section"], location)
    for row in rows("temporal-public-code-spec-map.tsv"):
        validate_ranges(row["code_ranges"])
    print("Verified frozen Temporal checklist, condition groups, source hashes and inline bindings")


if __name__ == "__main__":
    main()
