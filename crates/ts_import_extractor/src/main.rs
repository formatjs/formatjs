// main.rs — Long-lived subprocess for extracting TypeScript imports.
//
// Communication is over stdin/stdout using length-prefixed protobuf frames.
// Frame format: [4-byte big-endian u32 length][protobuf payload of that length]
//
// The binary exits when stdin is closed (Go side closes stdin when gazelle finishes).

use rayon::prelude::*;
use std::io::{Read, Write};
use ts_import_extractor::extract_imports_from_file;

// Generated protobuf types.
use message_proto::ts_import_extractor::{
    self as proto, response, ImportByFile, Response, ResponseError, ResponseResult,
};

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
            let request: proto::Request = match prost::Message::decode(frame) {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("ts_import_extractor: invalid request: {e}");
                    stream.drain(..4 + len);
                    continue;
                }
            };
            stream.drain(..4 + len);

            let response = handle_request(request);

            let mut payload = Vec::new();
            prost::Message::encode(&response, &mut payload).unwrap();

            // Write response frame. Exit cleanly on pipe errors.
            let mut out = stdout.lock();
            if out
                .write_all(&(payload.len() as u32).to_be_bytes())
                .and_then(|_| out.write_all(&payload))
                .and_then(|_| out.flush())
                .is_err()
            {
                return;
            }
        }
    }
}

fn handle_request(req: proto::Request) -> Response {
    let results: Result<Vec<ImportByFile>, String> = req
        .files
        .par_iter()
        .map(|file| {
            extract_imports_from_file(file).map(|import_paths| ImportByFile {
                file: file.clone(),
                import_paths,
            })
        })
        .collect();

    match results {
        Ok(imports) => Response {
            id: req.id,
            data: Some(response::Data::Result(ResponseResult { imports })),
        },
        Err(e) => Response {
            id: req.id,
            data: Some(response::Data::Error(ResponseError { message: e })),
        },
    }
}
