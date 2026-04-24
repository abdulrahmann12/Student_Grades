from numbers import Number

import pandas as pd
import json
import requests
import math
import numpy as np

def clean_json(obj):
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0
        return obj
    elif isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    else:
        return obj


def normalize_degree_value(value):
    if pd.isna(value):
        return 0

    if isinstance(value, Number) and not isinstance(value, bool):
        numeric_value = float(value)
        if math.isnan(numeric_value) or math.isinf(numeric_value):
            return 0
        return int(numeric_value) if numeric_value.is_integer() else numeric_value

    if isinstance(value, str):
        stripped_value = value.strip()
        if not stripped_value:
            return 0
        try:
            numeric_value = float(stripped_value)
        except ValueError:
            return 0
        return int(numeric_value) if numeric_value.is_integer() else numeric_value

    return 0


# -------------------------
# Read Sheet
# -------------------------
#  Excel
df = pd.read_excel("Hr.xlsx")


# -------------------------
# mapping columns to degree item codes
# -------------------------
degree_mapping = {
    "Mid": 274,
    "Final": 30,
    "Att": 276,
    "Quiz": 277,
}

# -------------------------
# JSON For Each Student
# -------------------------
result_list = []

for index, row in df.iterrows():
    details = []
    total = 0
    for col, code in degree_mapping.items():
        degree = normalize_degree_value(row[col])

        total += degree

        is_final = True if code == 30 else False

        details.append({
            "subjectDegreeItemCode": code,
            "studentDegree": degree,
            "isFinal": is_final
        })

    student_json = {
        "studentCode": row["StudentID"],
                # قيمة افتراضية بدل null
        "studentName": None,  # اسم الطالب
        "total": 0,
        "gradeLetter": "F",
        "isIC": False,
        "canSaveDegree": False  ,
        "point": "0",                 # float بدل string
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
        "semesterCode": 5,
        "branchCode": 1,
        "facultyCode": 2,
        "subjectCode": 203,
        "sectionCode": 3,
        "studentCode": None,
        "lang": "ar",
        "orderBy": 1,
        "committeDegree": 0,
        "secondLangCode": 0
    },
    "studentSubjectDegreeMain": result_list
}
final_json = clean_json(final_json)

# -------------------------
# Write to JSON File
# -------------------------

url = "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiVmlldyBTdHVkZW50IFN1YmplY3QgR3JhZGVzIiwiVmlldyBTdWJqZWN0cyBSZWdpc3RyYXRpb24iLCJBZGQgQW5kIEVkaXQgU3ViamVjdCBSZWdpc3RyYXRpb24iLCJWaWV3IFN0dWRlbnQgR1BBIiwiQWRkIEFuZCBFZGl0IFN1cGVyIEFjYWRlbWljIEFkdmlzb3IiLCJEZWxldGUgU3VwZXIgQWNhZGVtaWMgQWR2aXNvciIsIlN1YmplY3QgUmVnaXN0cmF0aW9uIExpc3QgKFJlcG9ydCkiLCJWaWV3IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiQWRkIEFuZCBFZGl0IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiRGVsZXRlIFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiVmlldyBSZXN1bHRzIGxpc3QgKFJlcG9ydCkiLCJQcmV2aWV3IFN0dWRlbnQgR1BBIiwiRmFjdWx0aWVzIEluIENvbnRyb2wiLCJSZWdpc3RyYXRpb24gQ291bnQgKFJlcG9ydCkiLCJTdWJqZWN0IFN0YXRpc3RpY3MgKFJlcG9ydCkiLCJTdXBlciBTdWJqZWN0cyBSZWdpc3RyYXRpb24gQWRtaW4iLCJTdHVkZW50IEdQQSBQdWJsaXNoIiwiU3VwZXIgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJQdWJsaXNoIEdyYWRlcyJdLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjRlY2I2NzdjLTVhMTItNDI2NC05ODk2LTIzNTQzMmQ4MmZkOSIsImlzU3R1ZGVudCI6IkZhbHNlIiwiaXNQb3N0QWRtaXNzaW9uIjoiRmFsc2UiLCJlbWFpbFR5cGUiOiJlbXBsb3llZSIsIlVzZXJNb29kbGVDb2RlIjoiIiwiZXhwIjoxNzY5MDAyNjE4LCJpc3MiOiJCVUNBcHAiLCJhdWQiOiJCVUNDb25zdW1lcnMifQ._LJNx3efg2brONsnbiwYFdryJ8xGXun4UBrtjDYP-zg"
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

# for i, student in enumerate(result_list, start=1):
#     single_payload = {
#         "studentSubjectDegreeAdd": {
#             "academicYearCode": 2025,
#             "semesterCode": 1,
#             "branchCode": 1,
#             "facultyCode": 2,
#             "subjectCode": 95,
#             "sectionCode": 3,
#             "studentCode": student["studentCode"],  # مهم
#             "lang": "ar",
#             "orderBy": 1,
#             "committeDegree": 0,
#             "secondLangCode": 0
#         },
#         "studentSubjectDegreeMain": [student]  # طالب واحد فقط
#     }

#     single_payload = clean_json(single_payload)

#     try:
#         response = requests.post(url, json=single_payload, headers=headers)
#         response.raise_for_status()
#         print(f"✅ ({i}) Student {student['studentCode']} sent successfully")
#     except requests.exceptions.RequestException as e:
#         print(f"❌ ({i}) Error for student {student['studentCode']}: {e}")

