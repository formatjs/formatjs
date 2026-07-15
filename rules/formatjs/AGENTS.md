# Repository guidance

## Releases

Follow [docs/releasing.md](docs/releasing.md).

- Use `.github/workflows/tag.yaml` as the normal release entrypoint. Dispatch it
  on `main` without inputs; it chooses the version from Conventional Commits.
- Before dispatching, confirm `main` CI and Verify Hooks are green, no tag or
  release run is active, the latest tag/release is known, and
  `BCR_PUBLISH_TOKEN` is a Classic PAT with `repo` and `workflow` scopes that
  can push to `formatjs/bazel-central-registry` and open the upstream PR.
- Do not invent a version or push a tag for a normal patch or minor release.
- Use `release.yaml` only to recover an existing tag that was not released. Use
  `publish.yaml` only to retry BCR publication for an existing release.
- A major version requires explicit confirmation. The tag workflow may create
  the tag, but intentionally skips the release and BCR jobs for a major bump.
- Monitor the workflow through the GitHub release and BCR handoff. Tag creation
  alone is not completion.
- If the BCR push rejects the token, rotate the secret and retry `publish.yaml`
  with the existing tag. Do not rerun the tag or release jobs.
