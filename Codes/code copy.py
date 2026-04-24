from numbers import Number
from pathlib import Path
import json
import math
from typing import Any

import numpy as np
import pandas as pd
import requests


CONFIG = {
    "input_filename": "IT MID.xlsx",
    "output_filename": "grades_api.json",
    "json_invalid_number_replacement": 0,
    "request_timeout_seconds": 30,
    "api": {
        "url": "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiVmlldyBTdHVkZW50IEVkdS4gQ2xlYXJpbmciLCJBZGQgQW5kIEVkaXQgU3R1ZGVudCBFZHUuIENsZWFyaW5nIiwiVmlldyBTdHVkZW50IFN1YmplY3QgR3JhZGVzIiwiVmlldyBTdWJqZWN0cyBSZWdpc3RyYXRpb24iLCJBZGQgQW5kIEVkaXQgU3ViamVjdCBSZWdpc3RyYXRpb24iLCJWaWV3IFN0dWRlbnQgR1BBIiwiQWRkIGFuZCBFZGl0IFRpbWV0YWJsZSIsIkFkZCBBbmQgRWRpdCBTdXBlciBBY2FkZW1pYyBBZHZpc29yIiwiRGVsZXRlIFN1cGVyIEFjYWRlbWljIEFkdmlzb3IiLCJTdHVkZW50IFN0YXRpc3RpY3MgKFJlcG9ydCkiLCJWaWV3IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiQWRkIEFuZCBFZGl0IFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiRGVsZXRlIFN0dWRlbnQgU3ViamVjdCBEZWdyZWVzIiwiVmlldyBTdWJqZWN0cyBJbnRlcnNlY3Rpb24gKFJlcG9ydCkiLCJTdGF0aXN0aWNzIEZvciBDb3Vyc2UgR3JhZGVzIChSZXBvcnQpIiwiVmlldyBSZXN1bHRzIGxpc3QgKFJlcG9ydCkiLCJBY2FkZW1pYyBSZXN1bHQiLCJWaWV3IFN0dWRlbnQgRGVncmVlcyAoUmVwb3J0KSIsIlN0dWRlbnRzIENHUEEgKFJlcG9ydCkiLCJQcmV2aWV3IFN0dWRlbnQgR1BBIiwiRmFjdWx0aWVzIEluIENvbnRyb2wiLCJSZWdpc3RyYXRpb24gQ291bnQgKFJlcG9ydCkiLCJTdWJqZWN0IFN0YXRpc3RpY3MgKFJlcG9ydCkiLCJTdXBlciBTdWJqZWN0cyBSZWdpc3RyYXRpb24gQWRtaW4iLCJTdHVkZW50IEdQQSBQdWJsaXNoIiwiU3VwZXIgU3R1ZGVudCBTdWJqZWN0IERlZ3JlZXMiLCJQdWJsaXNoIEdyYWRlcyJdLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjRlY2I2NzdjLTVhMTItNDI2NC05ODk2LTIzNTQzMmQ4MmZkOSIsImlzU3R1ZGVudCI6IkZhbHNlIiwiaXNQb3N0QWRtaXNzaW9uIjoiRmFsc2UiLCJlbWFpbFR5cGUiOiJlbXBsb3llZSIsIlVzZXJNb29kbGVDb2RlIjoiIiwiZXhwIjoxNzc2OTU4NTA4LCJpc3MiOiJCVUNBcHAiLCJhdWQiOiJCVUNDb25zdW1lcnMifQ.uuwz99_x1IG5YCFKkBx75Vovr7UBdSDjOf3-UId3q0U",
        "authorization_prefix": "Bearer",
        "content_type": "application/json",
    },
    "columns": {
        "student_code": "StudentID",
    },
    "subject": {
        "subjectCode": 117,
        "degree_mapping": {
            "Mid term": 1103,
            "Final": 1106,
            "Att": 1104,
            "Quiz": 1102,
        },
        "final_degree_item_codes": [30],
    },
    "metadata": {
        "academicYearCode": 2025,
        "semesterCode": 5,
        "branchCode": 1,
        "facultyCode": 2,
        "sectionCode": 3,
        "studentCode": None,
        "lang": "ar",
        "orderBy": 1,
        "committeDegree": 0,
        "secondLangCode": 0,
    },
    "student_defaults": {
        "studentName": None,
        "total": 0,
        "gradeLetter": "F",
        "isIC": False,
        "canSaveDegree": False,
        "point": "0",
        "subjectRepeatedTimes": 0,
        "subjectStatusCode": 1,
    },
}


REQUIRED_CONFIG_PATHS = (
    ("input_filename",),
    ("output_filename",),
    ("json_invalid_number_replacement",),
    ("request_timeout_seconds",),
    ("api", "url"),
    ("api", "token"),
    ("api", "authorization_prefix"),
    ("api", "content_type"),
    ("columns", "student_code"),
    ("subject", "subjectCode"),
    ("subject", "degree_mapping"),
    ("subject", "final_degree_item_codes"),
    ("metadata", "academicYearCode"),
    ("metadata", "semesterCode"),
    ("metadata", "branchCode"),
    ("metadata", "facultyCode"),
    ("metadata", "sectionCode"),
    ("metadata", "studentCode"),
    ("metadata", "lang"),
    ("metadata", "orderBy"),
    ("metadata", "committeDegree"),
    ("metadata", "secondLangCode"),
    ("student_defaults", "studentName"),
    ("student_defaults", "total"),
    ("student_defaults", "gradeLetter"),
    ("student_defaults", "isIC"),
    ("student_defaults", "canSaveDegree"),
    ("student_defaults", "point"),
    ("student_defaults", "subjectRepeatedTimes"),
    ("student_defaults", "subjectStatusCode"),
)


def clean_json(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {key: clean_json(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [clean_json(value) for value in obj]
    if isinstance(obj, (float, np.floating)):
        if math.isnan(obj) or math.isinf(obj):
            return CONFIG["json_invalid_number_replacement"]
        return float(obj)
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    return obj


def validate_config(config: dict[str, Any]) -> None:
    missing_paths = []

    for path in REQUIRED_CONFIG_PATHS:
        current = config
        for key in path:
            if not isinstance(current, dict) or key not in current:
                missing_paths.append(".".join(path))
                break
            current = current[key]
        else:
            if isinstance(current, str) and not current.strip():
                missing_paths.append(".".join(path))

    if missing_paths:
        raise KeyError(
            "CONFIG is missing required values: " + ", ".join(sorted(set(missing_paths)))
        )

    degree_mapping = config["subject"]["degree_mapping"]
    if not isinstance(degree_mapping, dict) or not degree_mapping:
        raise ValueError("CONFIG['subject']['degree_mapping'] must be a non-empty dictionary.")

    if not all(isinstance(column_name, str) and column_name for column_name in degree_mapping):
        raise ValueError("All degree_mapping keys must be non-empty Excel column names.")

    if not all(isinstance(item_code, int) for item_code in degree_mapping.values()):
        raise ValueError("All degree_mapping values must be integers.")

    final_degree_item_codes = config["subject"]["final_degree_item_codes"]
    if not isinstance(final_degree_item_codes, (list, tuple, set)) or not final_degree_item_codes:
        raise ValueError(
            "CONFIG['subject']['final_degree_item_codes'] must be a non-empty list, tuple, or set."
        )

    if not all(isinstance(item_code, int) for item_code in final_degree_item_codes):
        raise ValueError("All final degree item codes must be integers.")


def read_excel(filename: str) -> pd.DataFrame:
    excel_path = Path(filename)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")

    try:
        return pd.read_excel(excel_path)
    except ValueError as exc:
        raise ValueError(f"Excel file is malformed or unreadable: {excel_path}. {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error while reading Excel file {excel_path}: {exc}") from exc


def normalize_student_code(student_code: Any, row_number: int) -> Any:
    if pd.isna(student_code):
        raise ValueError(f"Missing student code in Excel row {row_number}.")

    if isinstance(student_code, (np.integer, np.int64)):
        return int(student_code)

    if isinstance(student_code, (float, np.floating)) and float(student_code).is_integer():
        return int(student_code)

    return student_code


def normalize_degree_value(value: Any, column_name: str, student_code: Any, config: dict[str, Any]) -> int | float:
    if pd.isna(value):
        return config["json_invalid_number_replacement"]

    if isinstance(value, Number) and not isinstance(value, bool):
        numeric_value = float(value)
        if math.isnan(numeric_value) or math.isinf(numeric_value):
            return config["json_invalid_number_replacement"]
        return int(numeric_value) if numeric_value.is_integer() else numeric_value

    if isinstance(value, str):
        stripped_value = value.strip()
        if not stripped_value:
            return config["json_invalid_number_replacement"]
        try:
            numeric_value = float(stripped_value)
        except ValueError:
            return config["json_invalid_number_replacement"]
        return int(numeric_value) if numeric_value.is_integer() else numeric_value

    return config["json_invalid_number_replacement"]


def build_student_payload(df: pd.DataFrame, config: dict[str, Any]) -> list[dict[str, Any]]:
    student_code_column = config["columns"]["student_code"]
    degree_mapping = config["subject"]["degree_mapping"]
    final_degree_item_codes = set(config["subject"]["final_degree_item_codes"])
    required_columns = [student_code_column, *degree_mapping.keys()]
    missing_columns = [column_name for column_name in required_columns if column_name not in df.columns]

    if missing_columns:
        raise ValueError(
            "Excel file is missing required columns: " + ", ".join(sorted(missing_columns))
        )

    student_defaults = config["student_defaults"]
    result_list = []

    for row_index, row in df.iterrows():
        row_number = row_index + 2
        student_code = normalize_student_code(row[student_code_column], row_number)
        details = []

        for column_name, degree_item_code in degree_mapping.items():
            degree_value = normalize_degree_value(row[column_name], column_name, student_code, config)
            details.append(
                {
                    "subjectDegreeItemCode": degree_item_code,
                    "studentDegree": degree_value,
                    "isFinal": degree_item_code in final_degree_item_codes,
                }
            )

        student_json = {
            "studentCode": student_code,
            "studentName": student_defaults["studentName"],
            "total": student_defaults["total"],
            "gradeLetter": student_defaults["gradeLetter"],
            "isIC": student_defaults["isIC"],
            "canSaveDegree": student_defaults["canSaveDegree"],
            "point": student_defaults["point"],
            "subjectRepeatedTimes": student_defaults["subjectRepeatedTimes"],
            "subjectStatusCode": student_defaults["subjectStatusCode"],
            "details": details,
        }

        result_list.append(student_json)

    return result_list


def build_request_payload(student_payload: list[dict[str, Any]], config: dict[str, Any]) -> dict[str, Any]:
    final_json = {
        "studentSubjectDegreeAdd": {
            **config["metadata"],
            "subjectCode": config["subject"]["subjectCode"],
        },
        "studentSubjectDegreeMain": student_payload,
    }
    return clean_json(final_json)


def write_json_file(payload: dict[str, Any], filename: str) -> None:
    output_path = Path(filename)

    try:
        with output_path.open("w", encoding="utf-8") as file_handle:
            json.dump(payload, file_handle, ensure_ascii=False, indent=2)
    except OSError as exc:
        raise OSError(f"Failed to write JSON output file {output_path}: {exc}") from exc

    print(f"JSON file '{output_path.name}' has been created successfully.")


def send_request(payload: dict[str, Any], config: dict[str, Any]) -> requests.Response:
    api_config = config["api"]
    token = api_config["token"].strip()
    authorization_prefix = api_config["authorization_prefix"].strip()
    authorization_value = token

    if not token.lower().startswith(f"{authorization_prefix.lower()} "):
        authorization_value = f"{authorization_prefix} {token}"

    headers = {
        "Content-Type": api_config["content_type"],
        "Authorization": authorization_value,
    }

    try:
        response = requests.post(
            api_config["url"],
            json=payload,
            headers=headers,
            timeout=config["request_timeout_seconds"],
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        response_text = exc.response.text if exc.response is not None else "No response body returned."
        raise RuntimeError(f"API request failed with status {status_code}: {response_text}") from exc
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Error sending data to API: {exc}") from exc

    try:
        response_body = response.json()
    except ValueError:
        response_body = response.text

    print(f"Data sent successfully. Status code: {response.status_code}")
    print(f"Response: {response_body}")
    return response


def main(config: dict[str, Any]) -> int:
    try:
        validate_config(config)
        df = read_excel(config["input_filename"])
        result_list = build_student_payload(df, config)
        payload = build_request_payload(result_list, config)
        write_json_file(payload, config["output_filename"])
        send_request(payload, config)
    except (KeyError, ValueError, FileNotFoundError, OSError, RuntimeError) as exc:
        print(f"Error: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(CONFIG))

