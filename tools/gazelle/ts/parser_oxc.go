// parser_oxc.go — Go client for the oxc-based TypeScript import extractor.
//
// This file manages the Rust subprocess (crates/ts_import_extractor)
// that parses TypeScript files using oxc and returns extracted import paths.
// The subprocess lifecycle is managed by lifeCycleManager (lifecycle.go).
//
// Architecture:
//
//	Go (gazelle plugin)                 Rust (ts_import_extractor)
//	┌──────────────────┐                ┌──────────────────────────┐
//	│ parser_oxc.go    │  stdin/stdout  │ main.rs                  │
//	│                  │ ──────────────>│   length-prefixed JSON   │
//	│ OxcParser struct │ <──────────────│   oxc parse + rayon      │
//	└──────────────────┘                └──────────────────────────┘
//
// Communication protocol:
//   - Each frame: [4-byte big-endian u32 length][JSON payload of that length]
//   - Request:  {"id": N, "files": ["path/to/file.ts", ...]}
//   - Response: {"id": N, "imports": [{"file": "...", "importPaths": [...]}, ...]}
//
// Binary location: discovered via Bazel runfiles (github.com/bazelbuild/rules_go/go/runfiles).
package ts

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"

	"github.com/bazelbuild/rules_go/go/runfiles"
)

// oxcRequest is the JSON request sent to the Rust subprocess.
type oxcRequest struct {
	ID    uint32   `json:"id"`
	Files []string `json:"files"`
}

// oxcResponse is the JSON response from the Rust subprocess.
type oxcResponse struct {
	ID      uint32           `json:"id"`
	Imports []oxcFileImports `json:"imports,omitempty"`
	Error   string           `json:"error,omitempty"`
}

// oxcFileImports holds the import paths extracted from a single file.
type oxcFileImports struct {
	File        string   `json:"file"`
	ImportPaths []string `json:"importPaths"`
}

// OxcParser manages a long-lived Rust subprocess for import extraction.
// All methods are serialized via the mutex since the subprocess communicates
// over a single stdin/stdout pair.
type OxcParser struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout io.Reader
	mu     sync.Mutex
	nextID uint32
}

// newOxcParser locates the Rust binary via Bazel runfiles and starts it as a subprocess.
// The binary's stderr is forwarded to the Go process's stderr for debugging.
func newOxcParser() (*OxcParser, error) {
	binPath := findOxcBinary()
	if binPath == "" {
		return nil, fmt.Errorf("ts_import_extractor binary not found in runfiles")
	}

	cmd := exec.Command(binPath)
	cmd.Stderr = os.Stderr

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("stdin pipe: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start %s: %w", binPath, err)
	}

	return &OxcParser{
		cmd:    cmd,
		stdin:  stdin,
		stdout: stdout,
	}, nil
}

// findOxcBinary locates the ts_import_extractor binary using Bazel runfiles.
// Override with FORMATJS_OXC_PARSER_BIN env var for testing outside Bazel.
// Returns empty string if the binary cannot be found.
func findOxcBinary() string {
	if bin := os.Getenv("FORMATJS_OXC_PARSER_BIN"); bin != "" {
		return bin
	}

	bin, err := runfiles.Rlocation("_main/crates/ts_import_extractor/bin")
	if err != nil {
		return ""
	}
	return bin
}

// Close shuts down the subprocess by closing stdin and waiting for exit.
func (p *OxcParser) Close() error {
	p.stdin.Close()
	return p.cmd.Wait()
}

// ExtractImports sends a batch of file paths to the Rust subprocess and returns
// the parsed imports. The result maps file paths to their import path lists.
func (p *OxcParser) ExtractImports(files []string) (map[string][]string, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.nextID++
	req := oxcRequest{ID: p.nextID, Files: files}

	if err := p.writeFrame(req); err != nil {
		return nil, err
	}

	resp, err := p.readFrame()
	if err != nil {
		return nil, err
	}

	if resp.Error != "" {
		return nil, fmt.Errorf("oxc parser error: %s", resp.Error)
	}

	result := make(map[string][]string, len(resp.Imports))
	for _, fi := range resp.Imports {
		result[fi.File] = fi.ImportPaths
	}
	return result, nil
}

// writeFrame marshals the request to JSON and writes it as a length-prefixed frame.
func (p *OxcParser) writeFrame(req oxcRequest) error {
	payload, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	var lenBuf [4]byte
	binary.BigEndian.PutUint32(lenBuf[:], uint32(len(payload)))
	if _, err := p.stdin.Write(lenBuf[:]); err != nil {
		return fmt.Errorf("write length: %w", err)
	}
	if _, err := p.stdin.Write(payload); err != nil {
		return fmt.Errorf("write payload: %w", err)
	}
	return nil
}

// readFrame reads a length-prefixed JSON frame from stdout and unmarshals it.
func (p *OxcParser) readFrame() (*oxcResponse, error) {
	var lenBuf [4]byte
	if _, err := io.ReadFull(p.stdout, lenBuf[:]); err != nil {
		return nil, fmt.Errorf("read response length: %w", err)
	}
	respLen := binary.BigEndian.Uint32(lenBuf[:])
	respBuf := make([]byte, respLen)
	if _, err := io.ReadFull(p.stdout, respBuf); err != nil {
		return nil, fmt.Errorf("read response payload: %w", err)
	}

	var resp oxcResponse
	if err := json.Unmarshal(respBuf, &resp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}
	return &resp, nil
}
