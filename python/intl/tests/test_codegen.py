import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from intl import Intl
from intl.codegen import generate

PYRIGHT = Path(sys.argv.pop(1)).resolve()
CATALOG = {
    "cart.total": {"defaultMessage": "{count, plural, other {# items}}"},
    "empty": {"defaultMessage": "Hello"},
    "event": {"defaultMessage": "{d, date} {d, time}"},
    "mixed": {"defaultMessage": "{n, number} {n, date}"},
    "select": {"defaultMessage": "{kind, select, other {{name}}}"},
    "quoted": {"defaultMessage": "'{escaped}' '<b>' {name}"},
}


class CodegenTest(unittest.TestCase):
    def write_module(self, root: Path) -> None:
        implementation, declarations = generate(CATALOG)
        (root / "messages.py").write_text(implementation)
        (root / "messages.pyi").write_text(declarations)

    def check_types(self, source: str) -> dict:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_module(root)
            (root / "case.py").write_text(source)
            import intl

            config = {
                "include": ["case.py"],
                "extraPaths": [str(Path(intl.__file__).parent.parent)],
                "pythonVersion": "3.12",
                "typeCheckingMode": "basic",
                "reportMissingModuleSource": False,
            }
            (root / "pyrightconfig.json").write_text(json.dumps(config))
            result = subprocess.run(
                [str(PYRIGHT), "--project", str(root), "--outputjson"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertIn(result.returncode, (0, 1), result.stderr or result.stdout)
            return json.loads(result.stdout)

    def test_static_contracts(self):
        good = """from datetime import date, datetime
from intl import Intl
from messages import cart_total, empty, event, mixed, select, quoted
def render(intl: Intl) -> None:
    cart_total(intl, values={"count": 2})
    empty(intl)
    event(intl, values={"d": date(2026, 1, 1)})
    event(intl, values={"d": datetime(2026, 1, 1)})
    event(intl, values={"d": 0})
    mixed(intl, values={"n": 0})
    select(intl, values={"kind": "other", "name": "Ada"})
    quoted(intl, values={"name": "Ada"})
"""
        result = self.check_types(good)
        self.assertEqual(result["summary"]["errorCount"], 0, result)

        bad = """from intl import Intl
from messages import cart_total, empty, event, mixed, quoted, _cart_totalValues
def render(intl: Intl, values: _cart_totalValues) -> None:
    cart_total(intl)  # error
    cart_total(intl, values={})  # error
    cart_total(intl, values={"count": "two"})  # error
    cart_total(intl, values={"count": 2, "extra": 0})  # error
    empty(intl, values={"extra": 0})  # error
    event(intl, values={"d": "today"})  # error
    mixed(intl, values={"n": "today"})  # error
    quoted(intl, values={"name": "Ada", "escaped": 2})  # error
    values["count"] = 2  # error
"""
        result = self.check_types(bad)
        errors = [d for d in result["generalDiagnostics"] if d["severity"] == "error"]
        expected = {i for i, line in enumerate(bad.splitlines()) if "# error" in line}
        self.assertEqual({d["range"]["start"]["line"] for d in errors}, expected, result)
        self.assertTrue(all(d["file"].endswith("case.py") for d in errors), result)

    def test_generated_runtime_uses_catalog_and_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_module(root)
            spec = importlib.util.spec_from_file_location("messages", root / "messages.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            intl = Intl(["en"], "en", {"en": {"cart.total": "{count} translated"}})
            self.assertEqual(module.cart_total(intl, values={"count": 2}), "2 translated")
            self.assertEqual(module.empty(intl), "Hello")
            self.assertEqual(module.quoted(intl, values={"name": "Ada"}), "{escaped} <b> Ada")

    def test_rejects_invalid_catalogs_and_tags(self):
        for catalog in [
            {"bad": "{n, plural, other {"},
            {"rich": "<b>Hello</b>"},
            {"a-b": "One", "a.b": "Two"},
            {"bad": {"defaultMessage": 42}},
            {"bad": {"defaultMessage": "Hi", "description": {}}},
            {"date": "Reserved"},
            {"int": "{n, number}"},
        ]:
            with self.subTest(catalog=catalog):
                with self.assertRaises(ValueError):
                    generate(catalog)

    def test_deterministic_and_escaped_output(self):
        self.assertEqual(generate(CATALOG), generate(dict(reversed(list(CATALOG.items())))))
        implementation, declarations = generate({"0 bad-id": "'Quote'\n{class}"})
        self.assertIn("def message_0_bad_id(", implementation)
        self.assertIn("'class': ReadOnly[", declarations)
        compile(implementation, "messages.py", "exec")


    def test_cli_preserves_existing_output_on_invalid_input(self):
        from unittest.mock import patch
        from intl.codegen import main

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "catalog.json"
            output = root / "messages.py"
            source.write_text(json.dumps(CATALOG))
            with patch.object(sys, "argv", ["intl.codegen", str(source), "--out", str(output)]):
                main()
            before = output.read_text(), output.with_suffix(".pyi").read_text()
            self.assertEqual(before, generate(CATALOG))
            source.write_text(json.dumps({"bad": "{n"}))
            with patch.object(sys, "argv", ["intl.codegen", str(source), "--out", str(output)]):
                with self.assertRaises(SystemExit):
                    main()
            self.assertEqual(before, (output.read_text(), output.with_suffix(".pyi").read_text()))


if __name__ == "__main__":
    unittest.main()
