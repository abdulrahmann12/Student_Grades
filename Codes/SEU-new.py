import pandas as pd
import json
import requests


# -------------------------
# Read Sheet
# -------------------------
#  Excel
df = pd.read_excel("IT.xlsx")


# -------------------------
# mapping columns to degree item codes
# -------------------------
degree_mapping = {
    "Quiz": 195,
    "Mid": 47,
    "Lab": 269,
    "Final": 48,
    "Project": 197
}

# -------------------------
# JSON For Each Student
# -------------------------
result_list = []

for index, row in df.iterrows():
    details = []
    total = 0
    for col, code in degree_mapping.items():
        degree = row[col]

        # handle NaN or non-numeric values
        if pd.isna(degree):
            degree = 0
        else:   
            degree = float(degree)

        total += degree

        is_final = False #True if code in [48, 197] else False   # final exam or final project
        details.append({
            "subjectDegreeItemCode": code,
            "studentDegree": degree,
            "isFinal": is_final
        })

    student_json = {
        "studentCode": row["StudentID"],
        "facultyCode": None,
        "sectionCode": None,
        "studentName": None,
        "total": total,
        "gradeLetter": "F",
        "isIC": False,
        "canSaveDegree": True,
        "point": "0.00",
        "subjectRepeatedTimes": 0,
        "subjectStatusCode": 1,
        "details": details
    }

    result_list.append(student_json)

# -------------------------
# Final JSON Structure
# -------------------------
final_json = {
    "studentSubjectDegreeAdd": {
        "academicYearCode": 2025,
        "semesterCode": 1,
        "branchCode": 1,
        "facultyCode": 2,
        "subjectCode": 117,
        "sectionCode": 3,
        "studentCode": None,
        "lang": "ar",
        "orderBy": 1,
        "committeDegree": 0,
        "secondLangCode": 0
    },
    "studentSubjectDegreeMain": result_list
}

# -------------------------
# Write to JSON File
# -------------------------
url = "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiVmlldyBTdHVkZW50IFN1YmplY3QgR3JhZGVzIiwiVmlldyBTdWJqZWN0cyBSZWdpc3RyYXRpb24iLCJBZGQgQW5kIEVkaXQgU3ViamVjdCBSZWdpc3RyYXRpb24iLCJWaWV3IFN0dWRlbnQgR1BBIiwiQWRkIEFuZCBFZGl0IFN1cGVyIEFjYWRlbWljIEFkdmlzb3IiLCJEZWxldGUgU3VwZXIgQWNhZGVtaWMgQWR2aXNvciIsIlN1YmplY3QgUmVnaXN0cmF0aW9uIExpc3QgKFJlcG9ydCkiLCJWaWV3IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiQWRkIEFuZCBFZGl0IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiRGVsZXRlIFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiVmlldyBSZXN1bHRzIGxpc3QgKFJlcG9ydCkiLCJQcmV2aWV3IFN0dWRlbnQgR1BBIiwiRmFjdWx0aWVzIEluIENvbnRyb2wiLCJSZWdpc3RyYXRpb24gQ291bnQgKFJlcG9ydCkiLCJTdWJqZWN0IFN0YXRpc3RpY3MgKFJlcG9ydCkiLCJTdXBlciBTdWJqZWN0cyBSZWdpc3RyYXRpb24gQWRtaW4iLCJTdHVkZW50IEdQQSBQdWJsaXNoIiwiU3VwZXIgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJQdWJsaXNoIEdyYWRlcyJdLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjRlY2I2NzdjLTVhMTItNDI2NC05ODk2LTIzNTQzMmQ4MmZkOSIsImlzU3R1ZGVudCI6IkZhbHNlIiwiaXNQb3N0QWRtaXNzaW9uIjoiRmFsc2UiLCJlbWFpbFR5cGUiOiJlbXBsb3llZSIsIlVzZXJNb29kbGVDb2RlIjoiIiwiZXhwIjoxNzY4NjY1NDM4LCJpc3MiOiJCVUNBcHAiLCJhdWQiOiJCVUNDb25zdW1lcnMifQ.llfeuMapSSMG6k-hUCgcO_pm99f8yoFJ7ht1409hiGs"
}

try:
    response = requests.post(url, json=final_json, headers=headers)
    response.raise_for_status()
    print(f"Data sent successfully. Status code: {response.status_code}")
    print(f"Response: {response.json()}")
except requests.exceptions.RequestException as e:
    print(f"Error sending data to API: {e}")

# Optionally, also save to file
with open("grades_api.json", "w", encoding="utf-8") as f:
    json.dump(final_json, f, ensure_ascii=False, indent=2)

print("JSON file 'grades_api.json' has been created successfully.")