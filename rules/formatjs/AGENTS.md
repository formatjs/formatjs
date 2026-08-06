# Repository guidance

## Releases

Follow [docs/releasing.md](docs/releasing.md).

- Release Please opens or updates the version bump PR after commits land on
  `main`. Merge that PR to publish automatically.
- Before merging, confirm `main` CI and Verify Hooks are green, no release run
  is active, and the proposed version is expected.
- `GH_RELEASE_TOKEN` and `BCR_PUBLISH_TOKEN` must be Classic PATs with `repo`
  and `workflow` scopes. The BCR token must be able to push to
  `formatjs/bazel-central-registry` and open the upstream PR.
- Do not invent a version or push a tag. Merging a major version PR is explicit
  confirmation of the major release.
- Release Please tags trigger `release.yaml` automatically. Dispatch it only to
  recover an existing tag. Use `publish.yaml` only to retry BCR publication for
  an existing release.
- Monitor the workflow through the GitHub release and BCR handoff. Tag creation
  alone is not completion.
- If the BCR push rejects the token, rotate the secret and retry `publish.yaml`
  with the existing tag. Do not rerun Release Please or create another tag.
