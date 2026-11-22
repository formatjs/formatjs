from hashlib import file_digest, sha256
from json import JSONDecoder, loads
from mmap import ACCESS_READ, mmap
from pathlib import Path
from subprocess import check_output
from sys import argv


def digest(path):
    with path.open("rb") as artifact:
        return file_digest(artifact, "sha256").hexdigest()


def main(manifest, compiled, packed):
    line = next(
        entry for entry in manifest.read_text().splitlines()
        if entry.startswith("_main/native/hermes/hermes_runner ")
    )
    runner = Path(line.split(" ", 1)[1])
    runner_hash = digest(runner)
    assert runner_hash == "383bbd1a09c1ad7a823491dfc357e0e2a3f07bff0d399dbbb92c320b944d4e8a"

    compiled_json = compiled.read_bytes()
    compiled_hash = sha256(compiled_json).hexdigest()
    assert compiled_hash == "27c865546d28bf55197ca487c8c5763ad3fe3877ceebad6546c69e8cf86e7ebf"
    packed_hash = digest(packed)
    assert packed_hash == "c62e83781c612170917463fac92be16e174510edfc6a84c66bcec67dc10beb0d"

    with runner.open("rb") as artifact, mmap(artifact.fileno(), 0, access=ACCESS_READ) as binary:
        embedded = binary.find(compiled_json)
        assert embedded >= 0, "Compiled timezone JSON is absent from the runner"
        assert binary.find(compiled_json, embedded + len(compiled_json)) == -1

    packed_object, _ = JSONDecoder().raw_decode(packed.read_text().split("} = ", 1)[1])
    assert packed_object == loads(compiled_json)
    dependencies = check_output(["readelf", "-d", str(runner)], text=True)
    assert not any("libicu" in line for line in dependencies.splitlines() if "NEEDED" in line)
    print("Hermes executable SHA-256", runner_hash)
    print("Embedded timezone JSON SHA-256", compiled_hash)
    print("Embedded timezone JSON file offset", embedded)
    print("Certified TypeScript timezone pack SHA-256", packed_hash)
    print("Decoded packed data identical, no linked ICU shared libraries")


if __name__ == "__main__":
    main(*map(Path, argv[1:]))
