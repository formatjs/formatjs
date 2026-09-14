"""Exercise code generation through the assembled wheel, without source imports."""
import importlib
import sys
import tempfile
import zipfile
from pathlib import Path

wheel = Path(sys.argv[1])
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    with zipfile.ZipFile(wheel) as archive:
        archive.extractall(root)
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
