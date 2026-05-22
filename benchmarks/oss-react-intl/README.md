# OSS React Intl Benchmark

This benchmark runs `formatjs extract` against pinned open-source React Intl
repositories vendored through `MODULE.bazel`.

| Corpus | Pinned commit | Source files | Messages |
| --- | --- | ---: | ---: |
| `mattermost/mattermost` | `44ba06ee3c8b` | 3,923 | 7,514 |
| `elastic/kibana` | `3f2705aeaf48` | 91,482 | 10,811 |
| `mattermost/desktop` | `e6994098ac3a` | 306 | 211 |

```sh
RAYON_NUM_THREADS=8 bazel run -c opt //benchmarks/oss-react-intl:benchmark
```

The benchmark runs the Rust CLI by default. Set `INCLUDE_TS_CLI=1` to also run
the TypeScript CLI on the same corpora.
