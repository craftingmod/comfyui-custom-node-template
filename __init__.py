# ComfyUI loads this file as a package with a runtime-assigned name.
from .backend import (  # ty: ignore[unresolved-import]
  ExampleNormalizeTextNode,
  TemplateExtension,
)

WEB_DIRECTORY = "./dist"


async def comfy_entrypoint() -> TemplateExtension:
  return TemplateExtension()


__all__ = [
  "WEB_DIRECTORY",
  "ExampleNormalizeTextNode",
  "TemplateExtension",
  "comfy_entrypoint",
]
