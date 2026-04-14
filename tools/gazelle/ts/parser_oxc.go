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
//	│                  │ ──────────────>│   length-prefixed proto  │
//	│ OxcParser struct │ <──────────────│   oxc parse + rayon      │
//	└──────────────────┘                └──────────────────────────┘
//
// Communication protocol:
//   - Each frame: [4-byte big-endian u32 length][protobuf payload of that length]
//   - Request/Response defined in crates/ts_import_extractor/proto/message.proto
//
// Binary location: discovered via Bazel runfiles (github.com/bazelbuild/rules_go/go/runfiles).
package ts

import (
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"

	pb "github.com/nicolo-ribaudo/formatjs/crates/ts_import_extractor/proto"

	"github.com/bazelbuild/rules_go/go/runfiles"
	"google.golang.org/protobuf/proto"
)

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
	req := &pb.Request{Id: p.nextID, Files: files}

	if err := p.writeFrame(req); err != nil {
		return nil, err
	}

	resp, err := p.readFrame()
	if err != nil {
		return nil, err
	}

	switch data := resp.Data.(type) {
	case *pb.Response_Error:
		return nil, fmt.Errorf("oxc parser error: %s", data.Error.Message)
	case *pb.Response_Result:
		result := make(map[string][]string, len(data.Result.Imports))
		for _, fi := range data.Result.Imports {
			result[fi.File] = fi.ImportPaths
		}
		return result, nil
	default:
		return nil, fmt.Errorf("unexpected response type")
	}
}

// writeFrame marshals the request to protobuf and writes it as a length-prefixed frame.
func (p *OxcParser) writeFrame(req *pb.Request) error {
	payload, err := proto.Marshal(req)
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

// readFrame reads a length-prefixed protobuf frame from stdout and unmarshals it.
func (p *OxcParser) readFrame() (*pb.Response, error) {
	var lenBuf [4]byte
	if _, err := io.ReadFull(p.stdout, lenBuf[:]); err != nil {
		return nil, fmt.Errorf("read response length: %w", err)
	}
	respLen := binary.BigEndian.Uint32(lenBuf[:])
	respBuf := make([]byte, respLen)
	if _, err := io.ReadFull(p.stdout, respBuf); err != nil {
		return nil, fmt.Errorf("read response payload: %w", err)
	}

	var resp pb.Response
	if err := proto.Unmarshal(respBuf, &resp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}
	return &resp, nil
}
