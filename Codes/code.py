import base64
import binascii
from numbers import Number
import json
import math
import os
from pathlib import Path
import time
from typing import Any

import numpy as np
import pandas as pd
import requests


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE_CANDIDATES = (PROJECT_ROOT / ".env", SCRIPT_DIR / ".env")


CONFIG = {
    "input_filename": "IT MID.xlsx",
    "output_filename": "grades_api.json",
    "json_invalid_number_replacement": 0,
    "request_timeout_seconds": 30,
    "api": {
        "url": "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1",
        "authorization_prefix": "Bearer",
        "content_type": "application/json",
    },
    "auth": {
        "login_url": "https://api.seu.edu.eg/api/auth/login",
        "username": "",
        "password": "",
        "token_cache_file": "token.json",
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
    ("api", "authorization_prefix"),
    ("api", "content_type"),
    ("auth", "login_url"),
    ("auth", "username"),
    ("auth", "password"),
    ("auth", "token_cache_file"),
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


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    try:
        lines = env_path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise OSError(f"Failed to read environment file {env_path}: {exc}") from exc

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        os.environ[key] = value.strip().strip("\"'")


def load_auth_credentials(config: dict[str, Any]) -> None:
    for env_path in ENV_FILE_CANDIDATES:
        load_env_file(env_path)

    auth_config = config["auth"]
    auth_config["username"] = os.getenv("AUTH_USERNAME", "").strip()
    auth_config["password"] = os.getenv("AUTH_PASSWORD", "").strip()


def decode_jwt_payload(token: str) -> dict[str, Any]:
    token_parts = token.split(".")
    if len(token_parts) != 3:
        raise ValueError("Authentication token is not a valid JWT.")

    payload_segment = token_parts[1]
    padding = "=" * (-len(payload_segment) % 4)

    try:
        payload_bytes = base64.urlsafe_b64decode(payload_segment + padding)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except (ValueError, json.JSONDecodeError, binascii.Error) as exc:
        raise ValueError("Failed to decode JWT payload from authentication token.") from exc

    if not isinstance(payload, dict):
        raise ValueError("JWT payload must decode to a JSON object.")

    return payload


def get_token_expiration(token: str) -> int:
    payload = decode_jwt_payload(token)
    expiration = payload.get("exp")

    if not isinstance(expiration, int):
        raise ValueError("Authentication token is missing a valid exp claim.")

    return expiration


def resolve_token_cache_path(config: dict[str, Any]) -> Path:
    cache_path = Path(config["auth"]["token_cache_file"])
    if cache_path.is_absolute():
        return cache_path
    return SCRIPT_DIR / cache_path


def load_cached_token(config: dict[str, Any]) -> str | None:
    cache_path = resolve_token_cache_path(config)
    if not cache_path.exists():
        return None

    try:
        with cache_path.open("r", encoding="utf-8") as file_handle:
            cache_payload = json.load(file_handle)
    except (OSError, json.JSONDecodeError):
        return None

    if not isinstance(cache_payload, dict):
        return None

    token = cache_payload.get("token")
    expiration = cache_payload.get("exp")

    if not isinstance(token, str) or not token.strip():
        return None

    if not isinstance(expiration, int):
        try:
            expiration = get_token_expiration(token)
        except ValueError:
            return None

    if int(time.time()) >= expiration:
        return None

    return token


def write_token_cache(config: dict[str, Any], token: str, refresh_token: str, expiration: int) -> None:
    cache_path = resolve_token_cache_path(config)
    cache_payload = {
        "token": token,
        "refreshToken": refresh_token,
        "exp": expiration,
    }

    try:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with cache_path.open("w", encoding="utf-8") as file_handle:
            json.dump(cache_payload, file_handle, ensure_ascii=False, indent=2)
    except OSError as exc:
        raise OSError(f"Failed to write token cache file {cache_path}: {exc}") from exc


def get_auth_token(config: dict[str, Any]) -> str:
    load_auth_credentials(config)

    cached_token = load_cached_token(config)
    if cached_token is not None:
        return cached_token

    auth_config = config["auth"]
    if not auth_config["login_url"].strip():
        raise RuntimeError("Authentication login_url is missing from CONFIG['auth'].")
    if not auth_config["username"] or not auth_config["password"]:
        raise RuntimeError(
            "Authentication credentials are missing. Set AUTH_USERNAME and AUTH_PASSWORD in your environment or .env file."
        )

    request_body = {
        "username": auth_config["username"],
        "password": auth_config["password"],
    }

    try:
        response = requests.post(
            auth_config["login_url"],
            json=request_body,
            timeout=config["request_timeout_seconds"],
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        response_text = exc.response.text if exc.response is not None else "No response body returned."
        raise RuntimeError(
            f"Authentication failed with status {status_code}: {response_text}"
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Error sending authentication request: {exc}") from exc

    try:
        response_body = response.json()
    except ValueError as exc:
        raise RuntimeError("Authentication response did not contain valid JSON.") from exc

    if not isinstance(response_body, dict):
        raise RuntimeError("Authentication response must be a JSON object.")

    if response_body.get("valid") is False:
        raise RuntimeError("Authentication failed: API returned valid=false.")

    token = response_body.get("token")
    refresh_token = response_body.get("refreshToken")
    if not isinstance(token, str) or not token.strip():
        raise RuntimeError("Authentication response did not include a token.")
    if not isinstance(refresh_token, str) or not refresh_token.strip():
        raise RuntimeError("Authentication response did not include a refreshToken.")

    expiration = get_token_expiration(token)
    write_token_cache(config, token, refresh_token, expiration)
    return token


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
    token = get_auth_token(config).strip()
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
        load_auth_credentials(config)
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

