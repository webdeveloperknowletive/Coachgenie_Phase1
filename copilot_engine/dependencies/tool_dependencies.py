# ai/dependencies/tool_dependencies.py

from copilot_engine.tools.student.performance_tool import (
    PerformanceTool,
)

from copilot_engine.tools.student.attendance_tools import (
    AttendanceTool,
)

from copilot_engine.tools.student.risk_tool import (
    RiskTool,
)

from copilot_engine.tools.student.summary_tool import (
    SummaryTool,
)

from copilot_engine.dependencies.service_dependencies import (
    get_backend_client,
)


def get_performance_tool() -> PerformanceTool:

    return PerformanceTool(
        backend_client=get_backend_client()
    )


def get_attendance_tool() -> AttendanceTool:

    return AttendanceTool(
        backend_client=get_backend_client()
    )


def get_risk_tool() -> RiskTool:

    return RiskTool(
        backend_client=get_backend_client()
    )


def get_summary_tool() -> SummaryTool:

    return SummaryTool(
        backend_client=get_backend_client()
    )