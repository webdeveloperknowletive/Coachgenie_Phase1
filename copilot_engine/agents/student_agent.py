# ai/agents/student_agent.py

from __future__ import annotations

import logging
from uuid import UUID
from typing import List

from copilot_engine.schemas.student_schema import (
    StudentPerformanceReport,
    WeakSubjectAnalysis,
    StudentRiskAssessment,
    ParentFriendlyReport,
    AttendanceAnalysisReport,
    ImprovementTrendReport,
    StudentSummaryReport,
    RawStudentAnalytics,
    AIStudentInsights,
)

from copilot_engine.schemas.request_context import RequestContext

from copilot_engine.tools.student.performance_tool import PerformanceTool
from copilot_engine.tools.student.attendance_tools import AttendanceTool
from copilot_engine.tools.student.risk_tool import RiskTool
from copilot_engine.tools.student.summary_tool import SummaryTool

from copilot_engine.prompts.student.student_prompts import (
    build_performance_analysis_prompt,
    build_parent_report_prompt,
    build_weak_subject_prompt,
    build_attendance_prompt,
    build_improvement_prompt,
    build_student_summary_prompt,
)

from copilot_engine.guardrails.output_validator import validate_llm_response

from copilot_engine.observability.decorators import track_agent_execution

from copilot_engine.exceptions.student_exceptions import (
    StudentAgentError,
    StudentDataFetchError,
    StudentAnalysisError,
)

from copilot_engine.repositories.report_repository import (
    ReportRepository,
)

logger = logging.getLogger(__name__)


class StudentAgent:
    """
    Enterprise-grade Student AI Agent.

    Responsibilities:
    - Coordinate deterministic student analytics
    - Build AI reasoning context
    - Call LLM safely through model router
    - Validate structured outputs
    - Return enterprise-safe reports

    IMPORTANT:
    This class DOES NOT:
    - directly manipulate DB
    - directly call raw APIs
    - contain business calculation logic
    """

    def __init__(
        self,
        model_router,
        observability_service,
        performance_tool: PerformanceTool,
        attendance_tool: AttendanceTool,
        risk_tool: RiskTool,
        summary_tool: SummaryTool,
        report_repository: ReportRepository,
    ) -> None:

        self.model_router = model_router
        self.observability = observability_service

        self.performance_tool = performance_tool
        self.attendance_tool = attendance_tool
        self.risk_tool = risk_tool
        self.summary_tool = summary_tool
        self.report_repository = report_repository

    # ==========================================================
    # PUBLIC METHODS
    # ==========================================================

    @track_agent_execution("student_performance_report")
    async def generate_student_performance_report(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> StudentPerformanceReport:

        logger.info(
            "Generating student performance report",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
                "user_id": str(context.user_id),
            },
        )

        try:

            # ---------------------------------------------------------
            # STEP 1: Fetch raw backend data
            # ---------------------------------------------------------

            raw_data = await self._fetch_student_performance_data(
                student_id=student_id,
                context=context,
            )

            # ---------------------------------------------------------
            # STEP 2: Generate AI insights
            # ---------------------------------------------------------

            ai_insights = await self._generate_performance_insights(
                raw_data=raw_data,
                context=context,
            )

            # ---------------------------------------------------------
            # STEP 3: Build validated final report
            # ---------------------------------------------------------

            final_report = StudentPerformanceReport(
                student_id=student_id,
                raw_metrics=raw_data,
                ai_insights=ai_insights,
            )

            # ---------------------------------------------------------
            # STEP 4: Persist generated report
            # ---------------------------------------------------------

            saved_report = await self.report_repository.create_report(
                student_id=student_id,
                report_type="performance_report",
                generated_by=context.user_id,
                summary=ai_insights.motivational_feedback,
                report_json=final_report.model_dump(
                    mode="json"
                ),
            )

            # ---------------------------------------------------------
            # STEP 5: Attach persisted report ID
            # ---------------------------------------------------------

            final_report.report_id = saved_report.id

            logger.info(
                "Student performance report generated successfully",
                extra={
                    "student_id": str(student_id),
                    "report_id": str(saved_report.id),
                    "request_id": context.request_id,
                },
            )

            return final_report

        except Exception as error:

            logger.exception(
                "Failed to generate student performance report",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                    "error": str(error),
                },
            )

            raise StudentAgentError(
                    "Failed to generate performance report"
                ) from error

    @track_agent_execution("weak_subject_analysis")
    async def analyze_weak_subjects(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> WeakSubjectAnalysis:

        try:
            raw_data = await self.performance_tool.get_subject_performance(
                student_id=student_id,
                context=context,
            )

            prompt = build_weak_subject_prompt(raw_data)

            llm_response = await self.model_router.generate(
                task="weak_subject_analysis",
                prompt=prompt,
                temperature=0.2,
                max_tokens=1200,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=WeakSubjectAnalysis,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Weak subject analysis failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Weak subject analysis failed"
            ) from exc

    @track_agent_execution("attendance_analysis")
    async def analyze_attendance(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> AttendanceAnalysisReport:

        try:
            attendance_data = await self.attendance_tool.get_attendance_metrics(
                student_id=student_id,
                context=context,
            )

            prompt = build_attendance_prompt(attendance_data)

            llm_response = await self.model_router.generate(
                task="attendance_analysis",
                prompt=prompt,
                temperature=0.1,
                max_tokens=1000,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=AttendanceAnalysisReport,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Attendance analysis failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Attendance analysis failed"
            ) from exc

    @track_agent_execution("student_risk_detection")
    async def detect_students_needing_intervention(
        self,
        context: RequestContext,
    ) -> List[StudentRiskAssessment]:

        try:
            risk_data = await self.risk_tool.get_risk_candidates(
                context=context,
            )

            prompt = (
                "Analyze the following students and identify "
                "which students require academic intervention.\n\n"
                f"{risk_data}"
            )

            llm_response = await self.model_router.generate(
                task="student_risk_detection",
                prompt=prompt,
                temperature=0.1,
                max_tokens=2000,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=List[StudentRiskAssessment],
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Student intervention detection failed",
                extra={
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Failed to detect intervention students"
            ) from exc

    @track_agent_execution("parent_report_generation")
    async def generate_parent_report(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> ParentFriendlyReport:

        try:
            raw_data = await self.summary_tool.get_complete_student_summary(
                student_id=student_id,
                context=context,
            )

            prompt = build_parent_report_prompt(raw_data)

            llm_response = await self.model_router.generate(
                task="parent_report",
                prompt=prompt,
                temperature=0.3,
                max_tokens=1500,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=ParentFriendlyReport,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Parent report generation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Failed to generate parent report"
            ) from exc

    @track_agent_execution("student_improvement_analysis")
    async def analyze_improvement_trends(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> ImprovementTrendReport:

        try:
            trend_data = await self.performance_tool.get_improvement_trends(
                student_id=student_id,
                context=context,
            )

            prompt = build_improvement_prompt(trend_data)

            llm_response = await self.model_router.generate(
                task="improvement_analysis",
                prompt=prompt,
                temperature=0.2,
                max_tokens=1200,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=ImprovementTrendReport,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Improvement trend analysis failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Improvement trend analysis failed"
            ) from exc

    @track_agent_execution("student_summary_generation")
    async def generate_student_summary(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> StudentSummaryReport:

        try:
            student_summary = await self.summary_tool.get_complete_student_summary(
                student_id=student_id,
                context=context,
            )

            prompt = build_student_summary_prompt(student_summary)

            llm_response = await self.model_router.generate(
                task="student_summary",
                prompt=prompt,
                temperature=0.3,
                max_tokens=1200,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=StudentSummaryReport,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "Student summary generation failed",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Student summary generation failed"
            ) from exc

    # ==========================================================
    # PRIVATE METHODS
    # ==========================================================

    async def _fetch_student_performance_data(
        self,
        student_id: UUID,
        context: RequestContext,
    ) -> RawStudentAnalytics:

        try:
            performance_metrics = await self.performance_tool.get_student_performance(
                student_id=student_id,
                context=context,
            )

            attendance_metrics = await self.attendance_tool.get_attendance_metrics(
                student_id=student_id,
                context=context,
            )

            combined_data = RawStudentAnalytics(
                performance=performance_metrics,
                attendance=attendance_metrics,
            )

            return combined_data

        except Exception as exc:
            logger.exception(
                "Failed to fetch student analytics data",
                extra={
                    "student_id": str(student_id),
                    "request_id": context.request_id,
                },
            )

            raise StudentDataFetchError(
                "Unable to fetch student analytics"
            ) from exc

    async def _generate_performance_insights(
        self,
        raw_data: RawStudentAnalytics,
        context: RequestContext,
    ) -> AIStudentInsights:

        try:
            prompt = build_performance_analysis_prompt(raw_data)

            llm_response = await self.model_router.generate(
                task="student_performance_analysis",
                prompt=prompt,
                temperature=0.2,
                max_tokens=1800,
            )

            validated_output = validate_llm_response(
                response=llm_response,
                schema=AIStudentInsights,
            )

            return validated_output

        except Exception as exc:
            logger.exception(
                "AI insight generation failed",
                extra={
                    "request_id": context.request_id,
                },
            )

            raise StudentAnalysisError(
                "Failed to generate AI insights"
            ) from exc