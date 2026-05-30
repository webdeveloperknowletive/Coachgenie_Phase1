# copilot_engine/routes/report_routes.py
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
import os

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
        
# @router.post("/student-performance")
# async def generate_student_performance_report(
#     payload: StudentReportRequest,
# ):

#     pdf_path = await ReportService.generate_student_report(
#         student_data=payload.student_data,
#     )

#     return {
#         "success": True,
#         "pdf_url": pdf_path,
#     }
    
# @router.post("/student-performance")
# async def generate_student_performance_report(
#     payload: StudentReportRequest,
# ):

#     try:

#         logger.info(
#             f"Incoming payload: {payload.dict()}"
#         )

#         logger.info(
#             f"Student data: {payload.student_data}"
#         )

#         if not payload.student_data:

#             raise HTTPException(
#                 status_code=400,
#                 detail="student_data is empty",
#             )

#         pdf_path = await ReportService.generate_student_report(
#             student_data=payload.student_data,
#         )

#         return {
#             "success": True,
#             "pdf_url": pdf_path,
#         }

#     except Exception as e:

#         logger.exception(
#             "Student report generation failed"
#         )

#         raise HTTPException(
#             status_code=500,
#             detail=str(e),
#         )

# @router.post("/student-performance")
# async def generate_student_performance_report(
#     payload: StudentReportRequest,
# ):

#     try:

#         logger.info(
#             f"FULL PAYLOAD: {payload.dict()}"
#         )

#         if not payload.student_data:

#             raise HTTPException(
#                 status_code=400,
#                 detail="student_data is empty",
#             )

#         pdf_path = await ReportService.generate_student_report(
#             student_data=payload.student_data,
#         )

#         logger.info(
#             f"Generated PDF: {pdf_path}"
#         )

#         return {
#             "success": True,
#             "pdf_url": pdf_path,
#         }

#     except Exception as e:

#         logger.exception(
#             "REPORT GENERATION FAILED"
#         )

#         raise HTTPException(
#             status_code=500,
#             detail=str(e),
#         )

# @router.post("/attendance-report")
# async def generate_attendance_report(
#     payload: AttendanceReportRequest,
# ):

#     pdf_path = await ReportService.generate_attendance_report(
#         attendance_data=payload.attendance_data,
#     )

#     return {
#         "success": True,
#         "pdf_url": pdf_path,
#     }
    
# @router.post("/batch-performance")
# async def generate_batch_performance_report(
#     payload: BatchReportRequest,
# ):

#     pdf_path = await ReportService.generate_batch_report(
#         batch_data=payload.batch_data,
#     )

#     return {
#         "success": True,
#         "pdf_url": pdf_path,
#     }


@router.post("/student-performance")
async def generate_student_performance_report(
    payload: StudentReportRequest,
):

    try:

        logger.info(
            f"FULL PAYLOAD: {payload.dict()}"
        )

        if not payload.student_data:

            raise HTTPException(
                status_code=400,
                detail="student_data is empty",
            )

        pdf_path = await ReportService.generate_student_report(
            student_data=payload.student_data,
        )

        logger.info(
            f"Generated PDF: {pdf_path}"
        )

        print("FINAL PDF PATH:", pdf_path)
        print("EXISTS:", os.path.exists(pdf_path))

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename="student-report.pdf",
        )

    except Exception as e:

        logger.exception(
            "REPORT GENERATION FAILED"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/attendance-report")
async def generate_attendance_report(
    payload: AttendanceReportRequest,
):

    pdf_path = await ReportService.generate_attendance_report(
        attendance_data=payload.attendance_data,
    )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path),
    )


from fastapi.responses import FileResponse
import os


@router.post("/batch-performance")
async def generate_batch_performance_report(
    payload: BatchReportRequest,
):

    try:

        pdf_path = await ReportService.generate_batch_report(
            batch_data=payload.batch_data,
        )

        print("PDF PATH:", pdf_path)

        if not os.path.exists(pdf_path):

            raise Exception(
                f"PDF file not found: {pdf_path}"
            )

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=os.path.basename(pdf_path),
        )

    except Exception as e:

        print("BATCH REPORT ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )