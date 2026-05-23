from copilot_engine.reports.prompts.student_prompts import (
    STUDENT_PERFORMANCE_PROMPT,
)

from copilot_engine.llm.providers.groq_client import (
    GroqProvider,
)

from copilot_engine.reports.schemas.report_schema import (
    ReportSchema,
    ReportMetadata,
    ReportSection,
)

from datetime import datetime


class StudentPerformanceReportBuilder:

    def __init__(self):

        self.provider = GroqProvider()

    async def build(
        self,
        student_data: dict,
    ) -> ReportSchema:

        prompt = STUDENT_PERFORMANCE_PROMPT.format(
            student_data=student_data
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
            title="Student Performance Intelligence Report",

            summary="AI-generated academic performance analysis.",

            metadata=ReportMetadata(
                generated_at=datetime.utcnow(),
                report_type="student_performance",
            ),

            sections=[
                ReportSection(
                    title="Performance Intelligence",
                    content=ai_response,
                )
            ],
        )