const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// =========================================================
// TYPES
// =========================================================

export interface AIReportResponse {
  success?: boolean;

  report_url?: string;

  pdf_url?: string;

  download_url?: string;

  message?: string;

  report_type?: string;
}

// =========================================================
// INTERNAL FETCH WRAPPER
// =========================================================

async function postRequest<T>(
  endpoint: string
): Promise<T> {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  if (!response.ok) {

    let errorMessage =
      "Failed to generate report.";

    try {

      const errorData =
        await response.json();

      errorMessage =
        errorData?.detail ||
        errorMessage;

    } catch {
      // ignore parsing failure
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// =========================================================
// STUDENT PERFORMANCE REPORT
// =========================================================

export async function generateStudentPerformanceReport(
  studentId: string
): Promise<AIReportResponse> {

  return postRequest<AIReportResponse>(
    `/ai-reports/students/${studentId}/performance`
  );
}

// =========================================================
// ATTENDANCE REPORT
// =========================================================

export async function generateAttendanceEngagementReport(
  studentId: string
): Promise<AIReportResponse> {

  return postRequest<AIReportResponse>(
    `/ai-reports/students/${studentId}/attendance-engagement`
  );
}

// =========================================================
// BATCH PERFORMANCE REPORT
// =========================================================

export async function generateBatchPerformanceReport(
  batchId: string
): Promise<AIReportResponse> {

  return postRequest<AIReportResponse>(
    `/ai-reports/batches/${batchId}/performance`
  );
}