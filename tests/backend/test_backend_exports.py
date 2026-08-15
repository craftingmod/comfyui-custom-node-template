import asyncio
from pathlib import Path

from conftest import load_package_from_path

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_INIT_PATH = REPO_ROOT / "backend" / "__init__.py"


def test_backend_package_exports_v3_extension():
  module = load_package_from_path(
    "backend_package",
    BACKEND_INIT_PATH,
    repo_root=REPO_ROOT,
  )

  extension = module.TemplateExtension()

  assert asyncio.run(extension.get_node_list()) == [module.ExampleNormalizeTextNode]
  assert module.__all__ == [
    "ExampleNormalizeTextNode",
    "TemplateExtension",
  ]
