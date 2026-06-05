# ai/dependencies/student_dependencies.py

from copilot_engine.agents.student_agent import StudentAgent

from copilot_engine.dependencies.model_dependencies import (
    get_model_router,
)

from copilot_engine.dependencies.tool_dependencies import (
    get_performance_tool,
    get_attendance_tool,
    get_risk_tool,
    get_summary_tool,
)


class ObservabilityService:
    """
    Temporary observability service.
    Replace later with:
    - OpenTelemetry
    - Langfuse
    - Helicone
    - Datadog
    """

    pass


def get_student_agent() -> StudentAgent:

    return StudentAgent(
        model_router=get_model_router(),

        observability_service=ObservabilityService(),

        performance_tool=get_performance_tool(),

        attendance_tool=get_attendance_tool(),

        risk_tool=get_risk_tool(),

        summary_tool=get_summary_tool(),
    )