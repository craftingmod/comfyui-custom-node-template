import asyncio
from pathlib import Path

from conftest import load_package_from_path

REPO_ROOT = Path(__file__).resolve().parents[2]
ENTRYPOINT_PATH = REPO_ROOT / "__init__.py"


def test_python_lane_can_load_v3_extension_via_entrypoint():
  module = load_package_from_path(
    "template_entrypoint_backend_compat",
    ENTRYPOINT_PATH,
    repo_root=REPO_ROOT,
  )
  extension = asyncio.run(module.comfy_entrypoint())
  node_classes = asyncio.run(extension.get_node_list())
  output = node_classes[0].execute(" one \n\n two \n three ")

  assert output.values == ("one two three",)
  assert module.WEB_DIRECTORY == "./dist"
  assert module.__all__ == [
    "WEB_DIRECTORY",
    "ExampleNormalizeTextNode",
    "TemplateExtension",
    "comfy_entrypoint",
  ]
