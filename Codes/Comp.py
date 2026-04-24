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
df = pd.read_excel("Computer.xlsx")


# -------------------------
# mapping columns to degree item codes
# -------------------------
degree_mapping = {
    "Final": 766,
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

        is_final = True if code == 29 else False

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
        "semesterCode": 1,
        "branchCode": 1,
        "facultyCode": 2,
        "subjectCode": 233,
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
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiVmlldyBTdHVkZW50IFN1YmplY3QgR3JhZGVzIiwiVmlldyBTdWJqZWN0cyBSZWdpc3RyYXRpb24iLCJBZGQgQW5kIEVkaXQgU3ViamVjdCBSZWdpc3RyYXRpb24iLCJWaWV3IFN0dWRlbnQgR1BBIiwiQWRkIGFuZCBFZGl0IFRpbWV0YWJsZSIsIkFkZCBBbmQgRWRpdCBTdXBlciBBY2FkZW1pYyBBZHZpc29yIiwiRGVsZXRlIFN1cGVyIEFjYWRlbWljIEFkdmlzb3IiLCJTdHVkZW50IFN0YXRpc3RpY3MgKFJlcG9ydCkiLCJTdWJqZWN0IFJlZ2lzdHJhdGlvbiBMaXN0IChSZXBvcnQpIiwiVmlldyBTdHVkZW50IFN1YmplY3QgRGVncmVlcyIsIkFkZCBBbmQgRWRpdCBTdHVkZW50IFN1YmplY3QgRGVncmVlcyIsIkRlbGV0ZSBTdHVkZW50IFN1YmplY3QgRGVncmVlcyIsIlZpZXcgU3ViamVjdHMgSW50ZXJzZWN0aW9uIChSZXBvcnQpIiwiU3RhdGlzdGljcyBGb3IgQ291cnNlIEdyYWRlcyAoUmVwb3J0KSIsIlZpZXcgUmVzdWx0cyBsaXN0IChSZXBvcnQpIiwiQWNhZGVtaWMgUmVzdWx0IiwiVmlldyBTdHVkZW50IERlZ3JlZXMgKFJlcG9ydCkiLCJTdHVkZW50cyBDR1BBIChSZXBvcnQpIiwiUHJldmlldyBTdHVkZW50IEdQQSIsIkZhY3VsdGllcyBJbiBDb250cm9sIiwiUmVnaXN0cmF0aW9uIENvdW50IChSZXBvcnQpIiwiU3ViamVjdCBTdGF0aXN0aWNzIChSZXBvcnQpIiwiU3VwZXIgU3ViamVjdHMgUmVnaXN0cmF0aW9uIEFkbWluIiwiU3R1ZGVudCBHUEEgUHVibGlzaCIsIlN1cGVyIFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiUHVibGlzaCBHcmFkZXMiXSwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiI0ZWNiNjc3Yy01YTEyLTQyNjQtOTg5Ni0yMzU0MzJkODJmZDkiLCJpc1N0dWRlbnQiOiJGYWxzZSIsImlzUG9zdEFkbWlzc2lvbiI6IkZhbHNlIiwiZW1haWxUeXBlIjoiZW1wbG95ZWUiLCJVc2VyTW9vZGxlQ29kZSI6IiIsImV4cCI6MTc3MTg0OTY3MywiaXNzIjoiQlVDQXBwIiwiYXVkIjoiQlVDQ29uc3VtZXJzIn0.764uQygp7V229SGCeAVFFyF6IEwarosYb4glNdpy3k0"
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

