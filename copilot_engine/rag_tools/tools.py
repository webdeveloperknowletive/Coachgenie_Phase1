tools = [
    
    {
        "type": "PerformanceTool",
        "description": "Fetches deterministic student performance data, validates API responses, and returns typed schemas. Does NOT generate AI insights or call LLMs.",
        "parameters": {
            "student_id": "UUID",
            "course_id": "UUID",
            "subjects": "List of subjects to fetch performance data for (e.g., ['Math', 'Science'])",
            "time_frame": "Time frame for performance data (e.g., 'last_month', 'last_quarter')",
            "data_format": "Format of the returned data (e.g., 'JSON', 'CSV')",
            "validation_rules": "Check for subject-specific performance thresholds (e.g., 'Math score > 80%') and return validation results, also, include a summary of the student's performance trends over the specified time frame."
        }
    },
    
    {
        "type": "AttendanceTool",
        "description": "Fetches deterministic student attendance data, validates API responses, and returns typed schemas. Does NOT generate AI insights or call LLMs.",
        "parameters": {
            "student_id": "UUID",
            "course_id": "UUID",
            "time_frame": "Time frame for attendance data (e.g., 'last_month', 'last_quarter')",
            "data_format": "Format of the returned data (e.g., 'JSON', 'CSV')",
            "validation_rules": "Check for attendance thresholds (e.g., 'Attendance > 90%') and return validation results, also, include a summary of the student's attendance trends over the specified time frame.",
            "absenteism_reasons": "Fetch and categorize reasons for absences (e.g., 'Sick leave', 'Family emergency') and include this information in the attendance report."
        }
    }
]