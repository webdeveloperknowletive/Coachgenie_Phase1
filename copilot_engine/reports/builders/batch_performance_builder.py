from datetime import datetime

from copilot_engine.llm.providers.groq_client import (
    GroqProvider,
)

from copilot_engine.reports.prompts.batch_prompts import (
    BATCH_PERFORMANCE_PROMPT,
)

from copilot_engine.reports.schemas.report_schema import (
    ReportSchema,
    ReportMetadata,
    ReportSection,
)


class BatchPerformanceReportBuilder:

    def __init__(self):

        self.provider = GroqProvider()

    async def build(
        self,
        batch_data: dict,
    ) -> ReportSchema:

        prompt = BATCH_PERFORMANCE_PROMPT.format(
            batch_data=batch_data
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
            title="Batch Performance Intelligence Report",

            summary="AI-generated batch analysis report.",

            metadata=ReportMetadata(
                generated_at=datetime.utcnow(),
                report_type="batch_performance",
            ),

            sections=[
                ReportSection(
                    title="Batch Intelligence",
                    content=ai_response,
                )
            ],
        )