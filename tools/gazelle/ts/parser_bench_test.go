package ts

import (
	"os"
	"path/filepath"
	"testing"
)

// collectTSFiles walks the packages directory and collects .ts/.tsx files.
func collectTSFiles(b *testing.B, root string, limit int) []string {
	b.Helper()
	var files []string
	_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		if len(files) >= limit {
			return filepath.SkipAll
		}
		if isTypeScriptFile(info.Name()) && !isTestFile(path) {
			files = append(files, path)
		}
		return nil
	})
	return files
}

func BenchmarkOxc(b *testing.B) {
	root := os.Getenv("FORMATJS_BENCH_ROOT")
	if root == "" {
		b.Skip("set FORMATJS_BENCH_ROOT to repo root to run benchmarks")
	}
	files := collectTSFiles(b, filepath.Join(root, "packages"), 200)
	if len(files) == 0 {
		b.Skip("no TypeScript files found")
	}

	p, err := newOxcParser()
	if err != nil {
		b.Skipf("oxc parser not available: %v", err)
	}
	defer p.Close()

	b.Logf("Benchmarking %d files", len(files))
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := p.ExtractImports(files)
		if err != nil {
			b.Fatalf("oxc parse error: %v", err)
		}
	}
}
