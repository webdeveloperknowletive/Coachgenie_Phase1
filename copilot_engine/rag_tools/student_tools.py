student_specific_tools = [
    
    {
        "type": "tool",
        "name": "student_info_tool",
        "description": "A tool to retrieve information about a student, such as their name, age, grade, and subjects they are enrolled in.",
        "parameters": {
            "student_id": {"type": "string", "description": "The ID of the student to retrieve information about."},
            "fields": {"type": "array", "description": "The specific fields of information to retrieve about the student (e.g., name, age, grade, subjects)."},
            "reports": {"type": "boolean", "description": "Whether to include the student's academic reports in the retrieved information."}
        },
    },
    
    {
        "type": "tool",
        "name": "student_performance_tool",
        "description": "A tool to analyze a student's performance based on their grades and attendance records.",
        "parameters": {
            "student_id": {"type": "string", "description": "The ID of the student to analyze."},
            "time_period": {"type": "string", "description": "The time period for which to analyze the student's performance (e.g., last semester, last year)."},
            "include_attendance": {"type": "boolean", "description": "Whether to include attendance records in the performance analysis."},
            "performance_metrics": {"type": "array", "description": "The specific performance metrics to analyze (e.g., average grade, grade improvement, attendance rate)."}
        },
    },
    
    {
        "type": "tool",
        "name": "student_fees_tool",
        "description": "A tool to retrieve information about a student's fee payments, including outstanding fees and payment history.",
        "parameters": {
            "student_id": {"type": "string", "description": "The ID of the student to retrieve fee information about."},
            "include_outstanding": {"type": "boolean", "description": "Whether to include information about outstanding fees."},
            "include_payment_history": {"type": "boolean", "description": "Whether to include the student's payment history."},
            "time_period": {"type": "string", "description": "The time period for which to retrieve fee information (e.g., last semester, last year)."},
            
        },
    }
]