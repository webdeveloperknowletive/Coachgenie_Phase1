# ai/tools/registry/base_tool.py

from abc import ABC, abstractmethod

from typing import (
    Dict,
    Any,
)


class BaseTool(ABC):

    """
    Abstract base class for all tools.
    """

    name: str
    description: str

    @abstractmethod
    async def execute(
        self,
        **kwargs,
    ) -> Dict[str, Any]:

        raise NotImplementedError