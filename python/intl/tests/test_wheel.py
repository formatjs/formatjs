"""Exercise code generation through the assembled wheel, without source imports."""
import importlib
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path


def check_wheel(root: Path) -> None:
    sys.path.insert(0, str(root))
    intl = importlib.import_module("intl")
    codegen = importlib.import_module("intl.codegen")
    assert Path(intl.__file__).is_relative_to(root)
    assert Path(codegen.__file__).is_relative_to(root)
    source, stub = codegen.generate({"total": "{n, number}"})
    assert "ReadOnly[int | float]" in stub
    namespace = {}
    exec(compile(source, "messages.py", "exec"), namespace)
    formatter = intl.Intl(["en"], "en", {"en": {}})
    assert namespace["total"](formatter, values={"n": 12}) == "12"
    catalog = intl.MessageCatalog({"en-us": {"hello": "Hello"}})
    assert catalog.negotiate(["en-US"], "en-US") == "en-US"
    assert intl.Intl(["en-US"], "en-US", catalog).format_message("hello") == "Hello"


if __name__ == "__main__":
    wheel = Path(sys.argv[1])
    if wheel.is_dir():
        check_wheel(wheel)
    else:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with zipfile.ZipFile(wheel) as archive:
                archive.extractall(root)
            # Windows releases the imported DLL only after the child exits.
            subprocess.run([sys.executable, __file__, str(root)], check=True)
