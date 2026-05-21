from pathlib import Path
from datetime import datetime
from typing import Optional

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
)

from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)

from reportlab.lib.enums import (
    TA_CENTER,
    TA_LEFT,
)

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from core.logging_config import (
    logging,
)

logger = logging.getLogger(__name__)


class PDFGenerator:

    """
    Production-grade PDF generator.

    Responsibilities:
    - Render formatted report text into PDFs
    - Handle layout consistency
    - Ensure future extensibility
    """

    OUTPUT_DIR = "generated_reports"

    # =====================================================
    # PUBLIC GENERATOR
    # =====================================================

    @classmethod
    def generate(
        cls,
        *,
        content: str,
        filename: Optional[str] = None,
    ) -> str:

        """
        Generate PDF report.

        Returns:
            Generated PDF file path.
        """

        try:

            # =============================================
            # CREATE OUTPUT DIRECTORY
            # =============================================

            output_dir = Path(
                cls.OUTPUT_DIR
            )

            output_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            # =============================================
            # SAFE FILENAME
            # =============================================

            if not filename:

                timestamp = (
                    datetime.utcnow()
                    .strftime(
                        "%Y%m%d_%H%M%S"
                    )
                )

                filename = (
                    f"report_{timestamp}"
                )

            if not filename.endswith(
                ".pdf"
            ):

                filename += ".pdf"

            file_path = (
                output_dir / filename
            )

            # =============================================
            # CREATE DOCUMENT
            # =============================================

            document = SimpleDocTemplate(
                str(file_path),
                pagesize=A4,
                rightMargin=40,
                leftMargin=40,
                topMargin=50,
                bottomMargin=40,
            )

            # =============================================
            # STYLES
            # =============================================

            styles = cls._build_styles()

            # =============================================
            # BUILD STORY
            # =============================================

            story = []

            for line in content.splitlines():

                stripped_line = (
                    line.strip()
                )

                # -----------------------------------------
                # EMPTY LINES
                # -----------------------------------------

                if not stripped_line:

                    story.append(
                        Spacer(1, 10)
                    )

                    continue

                # -----------------------------------------
                # SECTION DIVIDERS
                # -----------------------------------------

                if (
                    stripped_line.startswith("=")
                    and len(stripped_line) > 20
                ):

                    story.append(
                        Spacer(1, 12)
                    )

                    continue

                # -----------------------------------------
                # TITLES
                # -----------------------------------------

                if cls._is_title(
                    stripped_line
                ):

                    story.append(
                        Paragraph(
                            stripped_line,
                            styles["title"],
                        )
                    )

                    story.append(
                        Spacer(1, 14)
                    )

                    continue

                # -----------------------------------------
                # SECTION HEADERS
                # -----------------------------------------

                if cls._is_section_header(
                    stripped_line
                ):

                    story.append(
                        Paragraph(
                            stripped_line,
                            styles["heading"],
                        )
                    )

                    story.append(
                        Spacer(1, 10)
                    )

                    continue

                # -----------------------------------------
                # NORMAL PARAGRAPH
                # -----------------------------------------

                story.append(
                    Paragraph(
                        stripped_line,
                        styles["body"],
                    )
                )

                story.append(
                    Spacer(1, 8)
                )

            # =============================================
            # BUILD PDF
            # =============================================

            document.build(
                story
            )

            logger.info(
                "PDF report generated successfully",
                extra={
                    "file_path": str(
                        file_path
                    ),
                },
            )

            return str(file_path)

        except Exception:

            logger.exception(
                "Failed to generate PDF report"
            )

            raise

    # =====================================================
    # STYLE SYSTEM
    # =====================================================

    @classmethod
    def _build_styles(
        cls,
    ):

        styles = (
            getSampleStyleSheet()
        )

        styles.add(

            ParagraphStyle(
                name="title",

                parent=styles["Heading1"],

                fontSize=20,

                leading=24,

                alignment=TA_CENTER,

                textColor=colors.HexColor(
                    "#1F2937"
                ),

                spaceAfter=20,
            )
        )

        styles.add(

            ParagraphStyle(
                name="heading",

                parent=styles["Heading2"],

                fontSize=14,

                leading=18,

                alignment=TA_LEFT,

                textColor=colors.HexColor(
                    "#111827"
                ),

                spaceBefore=10,

                spaceAfter=10,
            )
        )

        styles.add(

            ParagraphStyle(
                name="body",

                parent=styles["BodyText"],

                fontSize=11,

                leading=18,

                alignment=TA_LEFT,

                textColor=colors.black,
            )
        )

        return styles

    # =====================================================
    # TITLE DETECTION
    # =====================================================

    @classmethod
    def _is_title(
        cls,
        line: str,
    ) -> bool:

        return (
            line.isupper()
            and len(line.split()) > 2
        )

    # =====================================================
    # SECTION HEADER DETECTION
    # =====================================================

    @classmethod
    def _is_section_header(
        cls,
        line: str,
    ) -> bool:

        headers = {
            "SUMMARY",
            "STRENGTHS",
            "WEAKNESSES",
            "RECOMMENDATIONS",
            "AREAS TO IMPROVE",
            "OBSERVATIONS",
            "PERFORMANCE ANALYSIS",
        }

        return (
            line.upper()
            in headers
        )