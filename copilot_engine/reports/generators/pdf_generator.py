# # copilot_engine/reports/generators/pdf_generator.py
# from pathlib import Path
# from datetime import datetime
# from typing import Optional, List
# from fastapi import HTTPException
# from reportlab.lib.styles import StyleSheet1
# from reportlab.lib import colors
# from reportlab.lib.enums import TA_CENTER, TA_LEFT
# import markdown2

# from reportlab.platypus import (
#     SimpleDocTemplate,
#     Paragraph,
#     Spacer,
#     PageBreak,
# )

# from reportlab.lib.styles import (
#     getSampleStyleSheet,
#     ParagraphStyle,
# )

# from reportlab.lib.enums import (
#     TA_CENTER,
#     TA_LEFT,
# )

# from reportlab.lib.pagesizes import A4
# from reportlab.lib import colors

# from reportlab.pdfbase import pdfmetrics
# from reportlab.pdfbase.ttfonts import TTFont

# from copilot_engine.core.logging_config import (
#     logging,
# )

# logger = logging.getLogger(__name__)


# class PDFGenerator:

#     """
#     Production-grade PDF generator.

#     Responsibilities:
#     - Render formatted report text into PDFs
#     - Handle layout consistency
#     - Ensure future extensibility
#     """

#     OUTPUT_DIR = "generated_reports"

#     # =====================================================
#     # PUBLIC GENERATOR
#     # =====================================================

#     @classmethod
#     def generate(
#         cls,
#         *,
#         content: str,
#         filename: Optional[str] = None,
#     ) -> str:

#         """
#         Generate PDF report.

#         Returns:
#             Generated PDF file path.
#         """

#         try:

#             # =====================================================
#             # OUTPUT DIRECTORY (SAFE)
#             # =====================================================
#             BASE_DIR = Path.cwd()

#             output_dir = (
#                 BASE_DIR / cls.OUTPUT_DIR
#             )
#             output_dir.mkdir(parents=True, exist_ok=True)

#             # =====================================================
#             # SAFE FILENAME GENERATION
#             # =====================================================
#             if not filename:
#                 timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
#                 filename = f"report_{timestamp}"

#             if not filename.endswith(".pdf"):
#                 filename += ".pdf"

#             file_path = output_dir / filename

#             # =====================================================
#             # DOCUMENT SETUP (ISOLATED PER REQUEST)
#             # =====================================================
#             document = SimpleDocTemplate(
#                 str(file_path),
#                 pagesize=A4,
#                 rightMargin=40,
#                 leftMargin=40,
#                 topMargin=50,
#                 bottomMargin=40,
#             )

#             # =====================================================
#             # FRESH STYLES (NO GLOBAL MUTATION)
#             # =====================================================
#             styles = cls._build_styles()

#             # =====================================================
#             # STORY BUILDING
#             # =====================================================
#             story: List = []

#             for line in content.splitlines():

#                 line = line.strip()

#                 # -------------------------
#                 # EMPTY LINE
#                 # -------------------------
#                 if not line:
#                     story.append(Spacer(1, 10))
#                     continue

#                 # -------------------------
#                 # SECTION DIVIDER
#                 # -------------------------
#                 if line.startswith("=") and len(line) > 20:
#                     story.append(Spacer(1, 12))
#                     continue

#                 # -------------------------
#                 # TITLE
#                 # -------------------------
#                 if cls._is_title(line):
#                     story.append(
#                         Paragraph(line, styles["CustomTitle"])
#                     )
#                     story.append(Spacer(1, 14))
#                     continue

#                 # -------------------------
#                 # HEADING
#                 # -------------------------
#                 if cls._is_section_header(line):
#                     story.append(
#                         Paragraph(line, styles["CustomHeading"])
#                     )
#                     story.append(Spacer(1, 10))
#                     continue

#                 # -------------------------
#                 # BODY TEXT
#                 # -------------------------
#                 story.append(
#                     Paragraph(line, styles["CustomBody"])
#                 )
#                 story.append(Spacer(1, 8))

#             # =====================================================
#             # BUILD PDF
#             # =====================================================
#             document.build(story)

#             # =====================================================
#             # LOG SUCCESS
#             # =====================================================
#             logger.info(
#                 "PDF report generated successfully",
#                 extra={"file_path": str(file_path)},
#             )

#             return str(
#                 file_path.resolve()
#             )

#         except Exception as e:

#             # =====================================================
#             # LOG FULL TRACE (CRITICAL FOR DEBUGGING)
#             # =====================================================
#             logger.exception("Failed to generate PDF report")

#             # DO NOT expose internal errors in production
#             raise HTTPException(
#                 status_code=500,
#                 detail="PDF generation failed. Check server logs."
#             )

#     # =====================================================
#     # STYLE SYSTEM
#     # =====================================================

#     @classmethod
#     def _build_styles(cls):

#         # ✅ fully isolated stylesheet
#         styles = StyleSheet1()

#         # Title
#         styles.add(ParagraphStyle(
#             name="CustomTitle",
#             fontSize=20,
#             leading=24,
#             alignment=TA_CENTER,
#             textColor=colors.HexColor("#1F2937"),
#             spaceAfter=20,
#         ))

#         # Heading
#         styles.add(ParagraphStyle(
#             name="CustomHeading",
#             fontSize=14,
#             leading=18,
#             alignment=TA_LEFT,
#             textColor=colors.HexColor("#111827"),
#             spaceBefore=10,
#             spaceAfter=10,
#         ))

#         # Body
#         styles.add(ParagraphStyle(
#             name="CustomBody",
#             fontSize=11,
#             leading=18,
#             alignment=TA_LEFT,
#             textColor=colors.black,
#         ))

#         return styles

#     # =====================================================
#     # TITLE DETECTION
#     # =====================================================

#     @classmethod
#     def _is_title(
#         cls,
#         line: str,
#     ) -> bool:

#         return (
#             line.isupper()
#             and len(line.split()) > 2
#         )

#     # =====================================================
#     # SECTION HEADER DETECTION
#     # =====================================================

#     @classmethod
#     def _is_section_header(
#         cls,
#         line: str,
#     ) -> bool:

#         headers = {
#             "SUMMARY",
#             "STRENGTHS",
#             "WEAKNESSES",
#             "RECOMMENDATIONS",
#             "AREAS TO IMPROVE",
#             "OBSERVATIONS",
#             "PERFORMANCE ANALYSIS",
#         }

#         return (
#             line.upper()
#             in headers
#         )

# copilot_engine/reports/generators/pdf_generator.py

from pathlib import Path
from datetime import datetime
from typing import Optional, List

from fastapi import HTTPException

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)

from reportlab.lib.styles import (
    StyleSheet1,
    ParagraphStyle,
)

from reportlab.lib.pagesizes import A4

from reportlab.lib.enums import (
    TA_CENTER,
    TA_LEFT,
)

from reportlab.lib import colors

import markdown2

from copilot_engine.core.logging_config import (
    logging,
)

logger = logging.getLogger(__name__)


class PDFGenerator:

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

        try:

            # =====================================================
            # OUTPUT DIRECTORY
            # =====================================================

            BASE_DIR = Path.cwd()

            output_dir = BASE_DIR / cls.OUTPUT_DIR

            output_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            # =====================================================
            # FILENAME
            # =====================================================

            if not filename:

                timestamp = datetime.utcnow().strftime(
                    "%Y%m%d_%H%M%S"
                )

                filename = f"report_{timestamp}"

            if not filename.endswith(".pdf"):
                filename += ".pdf"

            file_path = output_dir / filename

            # =====================================================
            # DOCUMENT
            # =====================================================

            document = SimpleDocTemplate(
                str(file_path),
                pagesize=A4,
                rightMargin=40,
                leftMargin=40,
                topMargin=50,
                bottomMargin=40,
            )

            # =====================================================
            # STYLES
            # =====================================================

            styles = cls._build_styles()

            # =====================================================
            # MARKDOWN → HTML
            # =====================================================

            html_content = markdown2.markdown(content)

            # =====================================================
            # STORY
            # =====================================================

            story: List = []

            lines = html_content.split("\n")

            bullet_items = []

            for line in lines:

                line = line.strip()

                if not line:
                    continue

                # =================================================
                # H1 TITLE
                # =================================================

                if line.startswith("<h1>"):

                    text = (
                        line.replace("<h1>", "")
                        .replace("</h1>", "")
                    )

                    story.append(
                        Paragraph(
                            text,
                            styles["CustomTitle"],
                        )
                    )

                    story.append(
                        Spacer(1, 18)
                    )

                    continue

                # =================================================
                # H2 HEADINGS
                # =================================================

                if line.startswith("<h2>"):

                    text = (
                        line.replace("<h2>", "")
                        .replace("</h2>", "")
                    )

                    story.append(
                        Paragraph(
                            text,
                            styles["CustomHeading"],
                        )
                    )

                    story.append(
                        Spacer(1, 12)
                    )

                    continue

                # =================================================
                # BULLET POINTS
                # =================================================

                if "<li>" in line:

                    bullet_text = (
                        line.replace("<li>", "")
                        .replace("</li>", "")
                    )

                    bullet_items.append(
                        ListItem(
                            Paragraph(
                                bullet_text,
                                styles["CustomBody"],
                            )
                        )
                    )

                    continue

                # =================================================
                # CLOSE BULLET LIST
                # =================================================

                if bullet_items:

                    story.append(
                        ListFlowable(
                            bullet_items,
                            bulletType="bullet",
                            leftIndent=20,
                        )
                    )

                    story.append(
                        Spacer(1, 10)
                    )

                    bullet_items = []

                # =================================================
                # PARAGRAPHS
                # =================================================

                if line.startswith("<p>"):

                    text = (
                        line.replace("<p>", "")
                        .replace("</p>", "")
                    )

                    story.append(
                        Paragraph(
                            text,
                            styles["CustomBody"],
                        )
                    )

                    story.append(
                        Spacer(1, 10)
                    )

                    continue

            # =====================================================
            # FINAL BULLET FLUSH
            # =====================================================

            if bullet_items:

                story.append(
                    ListFlowable(
                        bullet_items,
                        bulletType="bullet",
                        leftIndent=20,
                    )
                )

            # =====================================================
            # BUILD PDF
            # =====================================================

            document.build(story)

            logger.info(
                "PDF generated successfully",
                extra={
                    "file_path": str(file_path),
                },
            )

            return str(
                file_path.resolve()
            )

        except Exception:

            logger.exception(
                "Failed to generate PDF report"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "PDF generation failed. "
                    "Check server logs."
                ),
            )

    # =====================================================
    # STYLES
    # =====================================================

    @classmethod
    def _build_styles(cls):

        styles = StyleSheet1()

        # =====================================================
        # TITLE
        # =====================================================

        styles.add(
            ParagraphStyle(
                name="CustomTitle",
                fontSize=22,
                leading=28,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#111827"),
                spaceAfter=20,
            )
        )

        # =====================================================
        # HEADINGS
        # =====================================================

        styles.add(
            ParagraphStyle(
                name="CustomHeading",
                fontSize=16,
                leading=22,
                alignment=TA_LEFT,
                textColor=colors.HexColor("#1F2937"),
                spaceBefore=10,
                spaceAfter=12,
            )
        )

        # =====================================================
        # BODY
        # =====================================================

        styles.add(
            ParagraphStyle(
                name="CustomBody",
                fontSize=11,
                leading=20,
                alignment=TA_LEFT,
                textColor=colors.black,
            )
        )

        return styles