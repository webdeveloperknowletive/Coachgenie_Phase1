from typing import Optional
from ..agents.student_agent import StudentAgent
from copilot_engine.core.model_router import ModelRouter
from copilot_engine.guardrails.input_validator import InputValidator
from copilot_engine.guardrails.output_validator import OutputValidator
import structlog

logger = structlog.get_logger()

class CopilotOrchestrator:
    def __init__(self):
        self.model_router = ModelRouter()
        self.input_validator = InputValidator()
        self.output_validator = OutputValidator()
        self.student_agent = StudentAgent(model_router=self.model_router)

    async def handle_chat(
        self,
        message: str,
        context: dict,           # serialized institute data from frontend
        tenant_id: str,
        user_id: str,
        session_id: Optional[str] = None,
    ) -> dict:
        # 1. Validate input
        validated = self.input_validator.validate(message)
        if not validated.is_valid:
            return {"type": "error", "message": validated.rejection_reason}

        # 2. Classify intent
        intent = self._classify_intent(message)

        # 3. Route
        if intent == "report" and context.get("student_id"):
            result = await self.student_agent.generate_performance_report(
                student_id=context["student_id"],
                tenant_id=tenant_id,
            )
            return {"type": "report", "data": result}
        else:
            # Free-form chat with institute context injected
            result = await self._handle_freeform_chat(message, context)
            return {"type": "chat", "message": result}

    def _classify_intent(self, message: str) -> str:
        report_keywords = [
            "report", "generate", "performance", "growth card",
            "parent report", "risk", "analysis", "analyse", "analyze"
        ]
        msg_lower = message.lower()
        if any(kw in msg_lower for kw in report_keywords):
            return "report"
        return "chat"

    async def _handle_freeform_chat(self, message: str, context: dict) -> str:
        from copilot_engine.prompts.system.prompt import COPILOT_CHAT_SYSTEM_PROMPT
        context_block = self._serialize_context(context)
        prompt = f"{context_block}\n\nUser question: {message}"
        return await self.model_router.generate(
            prompt=prompt,
            system_prompt=COPILOT_CHAT_SYSTEM_PROMPT,
        )

    def _serialize_context(self, context: dict) -> str:
        lines = ["## Institute context (use this data to answer):"]
        if context.get("students"):
            lines.append(f"Total students: {len(context['students'])}")
        if context.get("fees_overdue"):
            lines.append(f"Overdue fees: {context['fees_overdue']}")
        if context.get("attendance_today"):
            lines.append(f"Today's attendance: {context['attendance_today']}%")
        if context.get("pending_leads"):
            lines.append(f"Pending leads: {context['pending_leads']}")
        return "\n".join(lines)