from comfy_api.latest import ComfyExtension, io

from .nodes.example_normalize_text import ExampleNormalizeTextNode


class TemplateExtension(ComfyExtension):
  async def get_node_list(self) -> list[type[io.ComfyNode]]:
    return [ExampleNormalizeTextNode]


__all__ = [
  "ExampleNormalizeTextNode",
  "TemplateExtension",
]
