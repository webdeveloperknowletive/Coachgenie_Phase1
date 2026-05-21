# ai/tools/registry/tool_registry.py

import logging
import time

from typing import (
    Dict,
    Any,
    List,
    Optional,
)

from tools.registry.base_tool import (
    BaseTool,
)

from tools.registry.tool_metadata import (
    ToolMetadata,
)

from observability.observability_service import (
    ObservabilityService,
)

from core.exception import (
    ToolNotFoundError,
    ToolExecutionError,
)

logger = logging.getLogger(__name__)


class ToolRegistry:

    """
    Enterprise Tool Registry.

    Responsibilities:
    - tool registration
    - dynamic tool lookup
    - tool execution
    - observability tracking
    - metadata management
    - tool orchestration
    """

    def __init__(self):

        self.tools: Dict[
            str,
            BaseTool
        ] = {}

        self.metadata: Dict[
            str,
            ToolMetadata
        ] = {}

        self.observability = (
            ObservabilityService()
        )

    # =====================================================
    # REGISTER TOOL
    # =====================================================

    def register_tool(
        self,
        tool: BaseTool,
        metadata: ToolMetadata,
    ) -> None:

        logger.info(
            "Registering tool",
            extra={
                "tool_name": metadata.name,
                "category": metadata.category,
            },
        )

        self.tools[
            metadata.name
        ] = tool

        self.metadata[
            metadata.name
        ] = metadata

    # =====================================================
    # GET TOOL
    # =====================================================

    def get_tool(
        self,
        tool_name: str,
    ) -> BaseTool:

        tool = self.tools.get(
            tool_name
        )

        if not tool:

            logger.error(
                "Tool not found",
                extra={
                    "tool_name": tool_name,
                },
            )

            raise ToolNotFoundError(
                message=(
                    f"Tool '{tool_name}' "
                    f"not found."
                )
            )

        return tool

    # =====================================================
    # EXECUTE TOOL
    # =====================================================

    async def execute_tool(
        self,
        tool_name: str,
        **kwargs,
    ) -> Dict[str, Any]:

        logger.info(
            "Executing tool",
            extra={
                "tool_name": tool_name,
            },
        )

        tool = self.get_tool(
            tool_name
        )

        start_time = time.perf_counter()

        try:

            result = await tool.execute(
                **kwargs
            )

            latency_ms = int(
                (
                    time.perf_counter()
                    - start_time
                )
                * 1000
            )

            self.observability.track_tool_execution(
                tool_name=tool_name,
                latency_ms=latency_ms,
                success=True,
                metadata={
                    "kwargs": list(
                        kwargs.keys()
                    ),
                },
            )

            logger.info(
                "Tool executed successfully",
                extra={
                    "tool_name": tool_name,
                    "latency_ms": latency_ms,
                },
            )

            return result

        except Exception as error:

            latency_ms = int(
                (
                    time.perf_counter()
                    - start_time
                )
                * 1000
            )

            self.observability.track_tool_execution(
                tool_name=tool_name,
                latency_ms=latency_ms,
                success=False,
                metadata={
                    "error": str(error),
                },
            )

            logger.exception(
                "Tool execution failed",
                extra={
                    "tool_name": tool_name,
                    "error": str(error),
                },
            )

            raise ToolExecutionError(
                message=(
                    f"Tool execution failed: "
                    f"{tool_name}"
                ),
                metadata={
                    "tool_name": tool_name,
                    "error": str(error),
                },
            ) from error

    # =====================================================
    # LIST TOOLS
    # =====================================================

    def list_tools(
        self,
    ) -> List[Dict[str, Any]]:

        return [
            {
                "name": metadata.name,
                "description": (
                    metadata.description
                ),
                "category": (
                    metadata.category
                ),
                "version": (
                    metadata.version
                ),
                "enabled": (
                    metadata.enabled
                ),
                "tags": metadata.tags,
            }
            for metadata in (
                self.metadata.values()
            )
        ]

    # =====================================================
    # TOOL EXISTS
    # =====================================================

    def tool_exists(
        self,
        tool_name: str,
    ) -> bool:

        return tool_name in self.tools

    # =====================================================
    # REMOVE TOOL
    # =====================================================

    def remove_tool(
        self,
        tool_name: str,
    ) -> None:

        if tool_name in self.tools:

            del self.tools[tool_name]

        if tool_name in self.metadata:

            del self.metadata[tool_name]

        logger.info(
            "Tool removed",
            extra={
                "tool_name": tool_name,
            },
        )

    # =====================================================
    # GET TOOL METADATA
    # =====================================================

    def get_tool_metadata(
        self,
        tool_name: str,
    ) -> Optional[ToolMetadata]:

        return self.metadata.get(
            tool_name
        )