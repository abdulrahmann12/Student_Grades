import pandas as pd
import json
import requests

# -------------------------
# Read Sheet
# -------------------------
df = pd.read_excel("Eng Abbelrahman Vs. SEU.xlsx")

# -------------------------
# mapping columns to degree item codes
# -------------------------
degree_mapping = {
    "MT": 210,
    "CW": 212
}

# -------------------------
# JSON For Each Student
# -------------------------
result_list = []

# تجربة إرسال طالب واحد فقط
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

        is_final = True if code == 211 else False   # final exam or final project
        details.append({
            "subjectDegreeItemCode": code,
            "studentDegree": degree,
            "isFinal": is_final
        })

    student_json = {
        "studentCode": int(row["StudentID"]),
        "facultyCode": 1,               # قيمة افتراضية بدل null
        "sectionCode": 1,               # قيمة افتراضية بدل null
        "studentName": None,  # اسم الطالب
        "total": total,
        "gradeLetter": "Fail",
        "isIC": False,
        "canSaveDegree": True  ,
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
        "facultyCode": 1,
        "subjectCode": 359,
        "sectionCode": 1,
        "studentCode": None,
        "lang": "ar",
        "orderBy": 1,
        "committeDegree": 0,
        "secondLangCode": 0
    },
    "studentSubjectDegreeMain": result_list
}

# -------------------------
# API Request
# -------------------------
url = "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiVmlldyBTdHVkZW50IFN1YmplY3QgR3JhZGVzIiwiVmlldyBTdHVkZW50IEdQQSIsIlZpZXcgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJBZGQgQW5kIEVkaXQgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJEZWxldGUgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJWaWV3IFJlc3VsdHMgbGlzdCAoUmVwb3J0KSIsIlByZXZpZXcgU3R1ZGVudCBHUEEiLCJGYWN1bHRpZXMgSW4gQ29udHJvbCIsIlN1YmplY3QgU3RhdGlzdGljcyAoUmVwb3J0KSIsIlN0dWRlbnQgR1BBIFB1Ymxpc2giLCJTdXBlciBTdHVkZW50IFN1YmplY3QgRGVncmVlcyIsIlB1Ymxpc2ggR3JhZGVzIiwiTm90IEVkaXQgSW4gRmluYWwgRGVncmVlIl0sImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiMjU1YTY4YmUtNGMxNy00NDZkLTlkNWItNTAwZmY3ZjFmMTAzIiwiaXNTdHVkZW50IjoiRmFsc2UiLCJpc1Bvc3RBZG1pc3Npb24iOiJGYWxzZSIsImVtYWlsVHlwZSI6ImVtcGxveWVlIiwiVXNlck1vb2RsZUNvZGUiOiIiLCJleHAiOjE3Njg0OTQ3ODMsImlzcyI6IkJVQ0FwcCIsImF1ZCI6IkJVQ0NvbnN1bWVycyJ9.LM3HMAIzyofiYZ1d76apxvEqPPdeWY1iJdyVqyZ5TIk"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
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