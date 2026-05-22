import logging

from copilot_engine.llm.providers.groq_client import (
    GroqProvider,
)

from copilot_engine.llm.providers.base_provider import (
    LLMMessage,
)

logger = logging.getLogger(__name__)


class ChatOrchestrator:

    def __init__(self):

        self.provider = (
            GroqProvider()
        )

    async def generate_response(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> str:
        
        context_text = ""

        if context:

            context_text = f"""
            Institute Dashboard Data:

            {context}
            """

        messages = [

            LLMMessage(
                role="system",
                content=(
                    "You are Coach Genie AI, "
                    "an advanced AI copilot "
                    "for educational institutes.\n\n"

                    "Use the provided dashboard context "
                    "to generate accurate analytics, "
                    "student insights, financial summaries, "
                    "attendance analysis, and recommendations.\n\n"

                    f"{context_text}"
                ),
            ),

            LLMMessage(
                role="user",
                content=user_message,
            ),
        ]

        response = await self.provider.generate(
            messages=messages,
        )

        # ============================================
        # SIMPLE REPORT DETECTION
        # ============================================

        report_keywords = [
            "report",
            "pdf",
            "analysis report",
            "generate report",
            "download report",
        ]

        wants_report = any(
            keyword in user_message.lower()
            for keyword in report_keywords
        )

        # ============================================
        # REPORT RESPONSE
        # ============================================

        if wants_report:

            from copilot_engine.reports.generators.pdf_generator import (
                PDFGenerator,
            )

            pdf_url = PDFGenerator.generate(
                content=response,
            )

            return {
                "message": (
                    "Your PDF report has been generated successfully."
                ),

                "type": "report",

                "report_url": pdf_url,
            }

        # ============================================
        # NORMAL CHAT RESPONSE
        # ============================================

        return {
            "message": response,
            "type": "chat",
        }