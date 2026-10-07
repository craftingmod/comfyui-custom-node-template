import sys
import types
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pytest

ROOT_INIT_PATH = Path(__file__).resolve().parent / "__init__.py"


def _install_comfy_api_test_stub() -> None:
  try:
    import comfy_api.latest  # noqa: F401

    return
  except ModuleNotFoundError:
    pass

  class ComfyNode:
    pass

  class ComfyExtension:
    pass

  class StringInput:
    def __init__(self, input_id: str, **kwargs):
      self.id = input_id
      for key, value in kwargs.items():
        setattr(self, key, value)

  class StringOutput:
    def __init__(self, **kwargs):
      for key, value in kwargs.items():
        setattr(self, key, value)

  class String:
    Input = StringInput
    Output = StringOutput

  class Schema:
    def __init__(self, **kwargs):
      for key, value in kwargs.items():
        setattr(self, key, value)

  class NodeOutput:
    def __init__(self, *values):
      self.values = values

  io_module = types.ModuleType("comfy_api.latest.io")
  io_module.__dict__.update(
    ComfyNode=ComfyNode, NodeOutput=NodeOutput, Schema=Schema, String=String
  )

  latest_module = types.ModuleType("comfy_api.latest")
  latest_module.__dict__.update(ComfyExtension=ComfyExtension, io=io_module)

  comfy_api_module = types.ModuleType("comfy_api")
  comfy_api_module.__dict__["latest"] = latest_module

  sys.modules["comfy_api"] = comfy_api_module
  sys.modules["comfy_api.latest"] = latest_module
  sys.modules["comfy_api.latest.io"] = io_module


def _preload_root_entrypoint_for_pytest() -> None:
  # Keep pytest collection on the supported package-style loading path.
  spec = spec_from_file_location(
    "__init__",
    ROOT_INIT_PATH,
    submodule_search_locations=[str(ROOT_INIT_PATH.parent)],
  )
  assert spec is not None
  assert spec.loader is not None

  module = module_from_spec(spec)
  sys.modules["__init__"] = module
  spec.loader.exec_module(module)


def load_package_from_path(
  module_name: str,
  module_path: Path,
  *,
  repo_root: Path,
  blocked_top_levels: tuple[str, ...] = ("backend",),
) -> types.ModuleType:
  assert module_path.exists(), f"Expected module at {module_path}"

  spec = spec_from_file_location(
    module_name,
    module_path,
    submodule_search_locations=[str(module_path.parent)],
  )
  assert spec is not None
  assert spec.loader is not None

  module = module_from_spec(spec)
  original_sys_path = sys.path[:]
  original_modules = {
    name: sys.modules[name]
    for name in tuple(sys.modules)
    if any(
      name == top_level or name.startswith(f"{top_level}.")
      for top_level in blocked_top_levels
    )
  }
  sys.modules[module_name] = module
  for name in original_modules:
    sys.modules.pop(name, None)
  for top_level in blocked_top_levels:
    # Python supports None here to block imports; typeshed only models modules.
    sys.modules[top_level] = None  # ty: ignore[invalid-assignment]

  try:
    sys.path = [
      entry for entry in original_sys_path if Path(entry or ".").resolve() != repo_root
    ]
    try:
      spec.loader.exec_module(module)
    except ModuleNotFoundError as exc:
      pytest.fail(f"Package import failed: {exc}")
  finally:
    sys.path = original_sys_path
    for top_level in blocked_top_levels:
      sys.modules.pop(top_level, None)
    sys.modules.update(original_modules)

  return module


_install_comfy_api_test_stub()
_preload_root_entrypoint_for_pytest()
