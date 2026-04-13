// main.rs — Long-lived subprocess for extracting TypeScript imports.
//
// This binary is spawned by the Go gazelle plugin (tools/gazelle/ts/parser_oxc.go)
// and stays alive for the entire gazelle run. Communication is over stdin/stdout
// using length-prefixed JSON frames.
//
// Frame format: [4-byte big-endian u32 length][JSON payload of that length]
//
// Protocol:
//   Request:  {"id": N, "files": ["path/to/file.ts", ...]}
//   Response: {"id": N, "imports": [{"file": "path.ts", "importPaths": ["react", ...]}, ...]}
//   Error:    {"id": N, "error": "message"}
//
// Files within a request are parsed in parallel using rayon. The binary exits
// when stdin is closed (Go side closes stdin when gazelle finishes).

use ts_import_extractor::extract_imports_from_file;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};

#[derive(Deserialize)]
struct Request {
    id: u32,
    files: Vec<String>,
}

#[derive(Serialize)]
struct Response {
    id: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    imports: Option<Vec<FileImports>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileImports {
    file: String,
    import_paths: Vec<String>,
}

fn main() {
    let stdin = std::io::stdin();
    let stdout = std::io::stdout();

    let mut stream = Vec::with_capacity(16 * 1024);
    let mut buf = [0u8; 8 * 1024];

    loop {
        let n = stdin.lock().read(&mut buf).unwrap_or(0);
        if n == 0 {
            break;
        }
        stream.extend_from_slice(&buf[..n]);

        // Process all complete frames in the stream.
        loop {
            if stream.len() < 4 {
                break;
            }
            let len = u32::from_be_bytes([stream[0], stream[1], stream[2], stream[3]]) as usize;
            if stream.len() < 4 + len {
                break;
            }

            let frame = &stream[4..4 + len];
            let request: Request = match serde_json::from_slice(frame) {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("ts_import_extractor: invalid request: {e}");
                    stream.drain(..4 + len);
                    continue;
                }
            };
            stream.drain(..4 + len);

            let response = handle_request(request);
            let payload = serde_json::to_vec(&response).unwrap();

            let mut out = stdout.lock();
            out.write_all(&(payload.len() as u32).to_be_bytes()).unwrap();
            out.write_all(&payload).unwrap();
            out.flush().unwrap();
        }
    }
}

fn handle_request(req: Request) -> Response {
    let results: Result<Vec<FileImports>, String> = req
        .files
        .par_iter()
        .map(|file| {
            extract_imports_from_file(file).map(|import_paths| FileImports {
                file: file.clone(),
                import_paths,
            })
        })
        .collect();

    match results {
        Ok(imports) => Response {
            id: req.id,
            imports: Some(imports),
            error: None,
        },
        Err(e) => Response {
            id: req.id,
            imports: None,
            error: Some(e),
        },
    }
}
