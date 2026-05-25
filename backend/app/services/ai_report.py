import logging

from typing import Dict, Any

from fastapi import HTTPException

from app.services.copilot_client import (
    CopilotClient,
)

from app.services.student import (
    get_students,
    get_student
)

from app.services.attendance import (
    get_student_summary
)

from app.services.exam import (
    get_exams,
    get_exam,
)

from app.services.batch import (
    get_batches,
    get_batches_for_student
)

from app.services.fee import (
    get_all_invoices,
    get_student_invoices,
)

logger = logging.getLogger(__name__)


class AIReportService:

    """
    AI Report orchestration layer.

    Responsibilities:
    - Fetch dashboard data
    - Build AI-ready payloads
    - Call Copilot Engine
    - Return generated report metadata
    """

    # =====================================================
    # STUDENT PERFORMANCE REPORT
    # =====================================================

    @staticmethod
    async def generate_student_performance_report(
        *,
        student_id: str,
    ) -> Dict[str, Any]:

        try:

            logger.info(
                "Generating student performance report",
                extra={
                    "student_id": student_id,
                },
            )

            # =========================================
            # FETCH DATA
            # =========================================

            student = (
                await get_student
                .get_student_by_id(
                    student_id
                )
            )

            if not student:

                raise HTTPException(
                    status_code=404,
                    detail="Student not found.",
                )

            attendance = (
                await get_student_summary
                .get_student_attendance(
                    student_id
                )
            )

            exams = (
                await get_exam
                .get_student_exam_results(
                    student_id
                )
            )

            fees = (
                await get_student_invoices
                .get_student_fee_summary(
                    student_id
                )
            )

            # =========================================
            # BUILD PAYLOAD
            # =========================================

            payload = {
                "student": student,
                "attendance": attendance,
                "exams": exams,
                "fees": fees,
            }

            # =========================================
            # CALL AI ENGINE
            # =========================================

            response = (
                await CopilotClient
                .generate_student_performance_report(
                    payload=payload,
                )
            )

            logger.info(
                "Student performance report generated",
                extra={
                    "student_id": student_id,
                },
            )

            return response

        except HTTPException:

            raise

        except Exception:

            logger.exception(
                "Failed to generate student report"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate "
                    "student performance report."
                ),
            )

    # =====================================================
    # ATTENDANCE & ENGAGEMENT REPORT
    # =====================================================

    @staticmethod
    async def generate_attendance_engagement_report(
        *,
        student_id: str,
    ) -> Dict[str, Any]:

        try:

            logger.info(
                "Generating attendance report",
                extra={
                    "student_id": student_id,
                },
            )

            # =========================================
            # FETCH DATA
            # =========================================

            student = (
                await get_student
                .get_student_by_id(
                    student_id
                )
            )

            attendance = (
                await get_student_summary
                .get_student_attendance(
                    student_id
                )
            )

            exams = (
                await get_exam
                .get_student_exam_results(
                    student_id
                )
            )

            payload = {
                "student": student,
                "attendance": attendance,
                "exams": exams,
            }

            # =========================================
            # AI ENGINE
            # =========================================

            response = (
                await CopilotClient
                .generate_attendance_report(
                    payload=payload,
                )
            )

            logger.info(
                "Attendance report generated",
                extra={
                    "student_id": student_id,
                },
            )

            return response

        except Exception:

            logger.exception(
                "Failed attendance report generation"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate "
                    "attendance report."
                ),
            )

    # =====================================================
    # BATCH PERFORMANCE REPORT
    # =====================================================

    @staticmethod
    async def generate_batch_performance_report(
        *,
        batch_id: str,
    ) -> Dict[str, Any]:

        try:

            logger.info(
                "Generating batch performance report",
                extra={
                    "batch_id": batch_id,
                },
            )

            # =========================================
            # FETCH DATA
            # =========================================

            batch = (
                await get_batches
                .get_batch_by_id(
                    batch_id
                )
            )

            if not batch:

                raise HTTPException(
                    status_code=404,
                    detail="Batch not found.",
                )

            students = (
                await get_batches_for_student
                .get_batch_students(
                    batch_id
                )
            )

            exams = (
                await get_exam
                .get_batch_exam_results(
                    batch_id
                )
            )

            attendance = (
                await get_student_summary
                .get_batch_attendance(
                    batch_id
                )
            )

            payload = {
                "batch": batch,
                "students": students,
                "exams": exams,
                "attendance": attendance,
            }

            # =========================================
            # AI ENGINE
            # =========================================

            response = (
                await CopilotClient
                .generate_batch_performance_report(
                    payload=payload,
                )
            )

            logger.info(
                "Batch report generated",
                extra={
                    "batch_id": batch_id,
                },
            )

            return response

        except Exception:

            logger.exception(
                "Failed batch report generation"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to generate "
                    "batch performance report."
                ),
            )