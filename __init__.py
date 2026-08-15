from .backend import ExampleNormalizeTextNode, TemplateExtension

WEB_DIRECTORY = "./dist"


async def comfy_entrypoint() -> TemplateExtension:
  return TemplateExtension()


__all__ = [
  "WEB_DIRECTORY",
  "ExampleNormalizeTextNode",
  "TemplateExtension",
  "comfy_entrypoint",
]
