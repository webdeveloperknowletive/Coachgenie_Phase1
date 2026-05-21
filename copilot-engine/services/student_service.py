# ai/services/student_service.py

from __future__ import annotations

import logging
from uuid import UUID
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from schemas.request_context import RequestContext

from schemas.student_schema import (
    StudentPerformanceReport,
    WeakSubjectAnalysis,
    StudentRiskAssessment,
    ParentFriendlyReport,
    AttendanceAnalysisReport,
    ImprovementTrendReport,
    StudentSummaryReport,
)

from agents.student_agent import StudentAgent

from dependencies.student_dependencies import (
    get_student_agent,
)

from dependencies.auth_dependencies import (
    get_request_context,
)

from exceptions.student_exceptions import (
    StudentAgentError,
    StudentAnalysisError,
    StudentDataFetchError,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/students",
    tags=["Student AI Services"],
)


# ==========================================================
# PERFORMANCE REPORT
# ==========================================================

@router.get(
    "/{student_id}/performance-report",
    response_model=StudentPerformanceReport,
    status_code=status.HTTP_200_OK,
)
async def generate_student_performance_report(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> StudentPerformanceReport:

    logger.info(
        "Performance report API called",
        extra={
            "student_id": str(student_id),
            "request_id": context.request_id,
            "user_id": str(context.user_id),
        },
    )

    try:
        response = await student_agent.generate_student_performance_report(
            student_id=student_id,
            context=context,
        )

        return response

    except StudentDataFetchError as exc:
        logger.exception(
            "Student data fetch failure",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    except StudentAnalysisError as exc:
        logger.exception(
            "Student analysis failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except StudentAgentError as exc:
        logger.exception(
            "Student agent failure",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Student AI agent failed",
        ) from exc


# ==========================================================
# WEAK SUBJECT ANALYSIS
# ==========================================================

@router.get(
    "/{student_id}/weak-subjects",
    response_model=WeakSubjectAnalysis,
    status_code=status.HTTP_200_OK,
)
async def analyze_weak_subjects(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> WeakSubjectAnalysis:

    try:
        response = await student_agent.analyze_weak_subjects(
            student_id=student_id,
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Weak subject analysis endpoint failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Weak subject analysis failed",
        ) from exc


# ==========================================================
# ATTENDANCE ANALYSIS
# ==========================================================

@router.get(
    "/{student_id}/attendance-analysis",
    response_model=AttendanceAnalysisReport,
    status_code=status.HTTP_200_OK,
)
async def analyze_attendance(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> AttendanceAnalysisReport:

    try:
        response = await student_agent.analyze_attendance(
            student_id=student_id,
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Attendance analysis endpoint failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Attendance analysis failed",
        ) from exc


# ==========================================================
# IMPROVEMENT TRENDS
# ==========================================================

@router.get(
    "/{student_id}/improvement-trends",
    response_model=ImprovementTrendReport,
    status_code=status.HTTP_200_OK,
)
async def analyze_improvement_trends(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> ImprovementTrendReport:

    try:
        response = await student_agent.analyze_improvement_trends(
            student_id=student_id,
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Improvement trend endpoint failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Improvement trend analysis failed",
        ) from exc


# ==========================================================
# STUDENT SUMMARY
# ==========================================================

@router.get(
    "/{student_id}/summary",
    response_model=StudentSummaryReport,
    status_code=status.HTTP_200_OK,
)
async def generate_student_summary(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> StudentSummaryReport:

    try:
        response = await student_agent.generate_student_summary(
            student_id=student_id,
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Student summary endpoint failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Student summary generation failed",
        ) from exc


# ==========================================================
# PARENT REPORT
# ==========================================================

@router.get(
    "/{student_id}/parent-report",
    response_model=ParentFriendlyReport,
    status_code=status.HTTP_200_OK,
)
async def generate_parent_report(
    student_id: UUID,
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> ParentFriendlyReport:

    try:
        response = await student_agent.generate_parent_report(
            student_id=student_id,
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Parent report endpoint failed",
            extra={
                "student_id": str(student_id),
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Parent report generation failed",
        ) from exc


# ==========================================================
# INTERVENTION DETECTION
# ==========================================================

@router.get(
    "/intervention-students",
    response_model=List[StudentRiskAssessment],
    status_code=status.HTTP_200_OK,
)
async def detect_students_needing_intervention(
    context: RequestContext = Depends(get_request_context),
    student_agent: StudentAgent = Depends(get_student_agent),
) -> List[StudentRiskAssessment]:

    try:
        response = await student_agent.detect_students_needing_intervention(
            context=context,
        )

        return response

    except Exception as exc:
        logger.exception(
            "Intervention detection endpoint failed",
            extra={
                "request_id": context.request_id,
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to detect students needing intervention",
        ) from exc