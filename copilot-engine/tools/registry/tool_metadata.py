# ai/tools/registry/tool_metadata.py

from dataclasses import dataclass
from typing import List


@dataclass
class ToolMetadata:

    name: str

    description: str

    category: str

    version: str = "1.0.0"

    enabled: bool = True

    tags: List[str] = None