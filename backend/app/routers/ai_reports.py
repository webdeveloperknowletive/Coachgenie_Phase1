import logging

from fastapi import (
    APIRouter,
    HTTPException,
)

from app.services.ai_report import (
    AIReportService,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai-reports",
    tags=["AI Reports"],
)

# =========================================================
# STUDENT PERFORMANCE REPORT
# =========================================================

@router.post(
    "/students/{student_id}/performance",
)
async def generate_student_performance_report(
    student_id: str,
):

    """
    Generate AI-powered student
    performance intelligence report.
    """

    try:

        logger.info(
            "API request received for "
            "student performance report",
            extra={
                "student_id": student_id,
            },
        )

        response = (
            await AIReportService
            .generate_student_performance_report(
                student_id=student_id,
            )
        )

        return response

    except HTTPException:

        raise

    except Exception:

        logger.exception(
            "Student performance "
            "report route failure"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "student performance report."
            ),
        )


# =========================================================
# ATTENDANCE & ENGAGEMENT REPORT
# =========================================================

@router.post(
    "/students/{student_id}/attendance-engagement",
)
async def generate_attendance_engagement_report(
    student_id: str,
):

    """
    Generate attendance &
    engagement intelligence report.
    """

    try:

        logger.info(
            "API request received for "
            "attendance report",
            extra={
                "student_id": student_id,
            },
        )

        response = (
            await AIReportService
            .generate_attendance_engagement_report(
                student_id=student_id,
            )
        )

        return response

    except HTTPException:

        raise

    except Exception:

        logger.exception(
            "Attendance report "
            "route failure"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "attendance report."
            ),
        )


# =========================================================
# BATCH PERFORMANCE REPORT
# =========================================================

@router.post(
    "/batches/{batch_id}/performance",
)
async def generate_batch_performance_report(
    batch_id: str,
):

    """
    Generate AI-powered
    batch performance report.
    """

    try:

        logger.info(
            "API request received for "
            "batch performance report",
            extra={
                "batch_id": batch_id,
            },
        )

        response = (
            await AIReportService
            .generate_batch_performance_report(
                batch_id=batch_id,
            )
        )

        return response

    except HTTPException:

        raise

    except Exception:

        logger.exception(
            "Batch report route failure"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "batch performance report."
            ),
        )