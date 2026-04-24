import pandas as pd
import json


# -------------------------
# Read Sheet
# -------------------------
#  Excel
df = pd.read_excel("aaa.xlsx")


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
        total += degree
        is_final = True if code in [48, 197] else False   # final exam or final project
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
with open("grades_api.json", "w", encoding="utf-8") as f:
    json.dump(final_json, f, ensure_ascii=False, indent=2)

print("JSON file 'grades_api.json' has been created successfully.")