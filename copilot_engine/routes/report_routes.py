import logging

from pathlib import Path

from pydantic import BaseModel

from fastapi import (
    APIRouter,
    HTTPException,
)

from fastapi.responses import (
    FileResponse,
)

from copilot_engine.reports.schemas.report_schema import (
    ReportSchema,
)

from copilot_engine.reports.services.report_service import (
    ReportService,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

class StudentReportRequest(BaseModel):
    student_data: dict


class AttendanceReportRequest(BaseModel):
    attendance_data: dict


class BatchReportRequest(BaseModel):
    batch_data: dict
# =========================================================
# GENERATE PDF REPORT
# =========================================================

@router.post("/generate-pdf")
async def generate_pdf_report(
    report: ReportSchema,
):

    """
    Generate downloadable PDF report.
    """

    try:

        logger.info(
            "Received PDF report request",
            extra={
                "report_title": (
                    report.title
                ),
                "report_type": (
                    report.metadata.report_type
                ),
            },
        )

        # =============================================
        # GENERATE PDF
        # =============================================

        pdf_file_path = (

            ReportService
            .generate_pdf_report(
                report=report,
            )

        )

        file_path = Path(
            pdf_file_path
        )

        # =============================================
        # VALIDATE FILE
        # =============================================

        if not file_path.exists():

            raise HTTPException(
                status_code=500,
                detail=(
                    "Generated PDF file "
                    "does not exist."
                ),
            )

        logger.info(
            "Returning generated PDF",
            extra={
                "file_path": str(
                    file_path
                ),
            },
        )

        # =============================================
        # DOWNLOAD RESPONSE
        # =============================================

        return {
            "success": True,
            "report_url": pdf_file_path,
        }

    except HTTPException:

        raise

    except Exception:

        logger.exception(
            "Failed to generate PDF report"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "PDF report."
            ),
        )
        
@router.post("/student-performance")
async def generate_student_performance_report(
    payload: StudentReportRequest,
):

    pdf_path = await ReportService.generate_student_report(
        student_data=payload.student_data,
    )

    return {
        "success": True,
        "pdf_url": pdf_path,
    }
    
@router.post("/attendance-report")
async def generate_attendance_report(
    payload: AttendanceReportRequest,
):

    pdf_path = await ReportService.generate_attendance_report(
        attendance_data=payload.attendance_data,
    )

    return {
        "success": True,
        "pdf_url": pdf_path,
    }
    
@router.post("/batch-performance")
async def generate_batch_performance_report(
    payload: BatchReportRequest,
):

    pdf_path = await ReportService.generate_batch_report(
        batch_data=payload.batch_data,
    )

    return {
        "success": True,
        "pdf_url": pdf_path,
    }