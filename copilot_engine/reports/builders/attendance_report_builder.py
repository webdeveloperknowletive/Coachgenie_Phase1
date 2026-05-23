from datetime import datetime

from copilot_engine.llm.providers.groq_client import (
    GroqProvider,
)

from copilot_engine.reports.prompts.attendance_prompts import (
    ATTENDANCE_REPORT_PROMPT,
)

from copilot_engine.reports.schemas.report_schema import (
    ReportSchema,
    ReportMetadata,
    ReportSection,
)


class AttendanceReportBuilder:

    def __init__(self):

        self.provider = GroqProvider()

    async def build(
        self,
        attendance_data: dict,
    ) -> ReportSchema:

        prompt = ATTENDANCE_REPORT_PROMPT.format(
            attendance_data=attendance_data
        )

        ai_response = await self.provider.generate(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
        )

        return ReportSchema(
            title="Attendance & Engagement Report",

            summary="AI-generated attendance intelligence report.",

            metadata=ReportMetadata(
                generated_at=datetime.utcnow(),
                report_type="attendance_report",
            ),

            sections=[
                ReportSection(
                    title="Attendance Intelligence",
                    content=ai_response,
                )
            ],
        )