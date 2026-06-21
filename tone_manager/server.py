#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hmac
import json
import mimetypes
import os
import sqlite3
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
TONE_DIR = ROOT / "tone"
SNAPSHOT_DIR = TONE_DIR / "snapshots"
STATIC_DIR = Path(__file__).resolve().parent / "static"
DB_PATH = Path(__file__).resolve().parent / "data" / "tone_manager.sqlite3"
sys.path.insert(0, str(TONE_DIR))

from parse_tone_probe import parse_parameter, parse_recipe  # noqa: E402
from tone_probe import (  # noqa: E402
    DEFAULT_PARAMS,
    DEFAULT_SLOTS,
    ACTION_REGISTRY,
    discover_machines,
    machine_profiles_public,
    profile_for_key,
    probe_records,
    read_parameter,
    read_recipe,
    recipe_full_name,
    send_parameter,
    write_recipe,
)


DEFAULT_HOST = os.environ.get("TONE_HOST", "192.168.1.100")
DEFAULT_PORT = int(os.environ.get("TONE_PORT", "50000"))
DEFAULT_PROFILE = os.environ.get("TONE_PROFILE", "primary")
WRITE_ENABLED = os.environ.get("TONE_ENABLE_WRITES") == "1"
DEFAULT_BIND_HOST = "127.0.0.1"
REMOTE_WRITES_ALLOWED = os.environ.get("TONE_ALLOW_REMOTE_WRITES") == "1"
WRITE_TOKEN = os.environ.get("TONE_WRITE_TOKEN", "").strip()
SERVER_BIND_HOST = DEFAULT_BIND_HOST
DEFAULT_WRITABLE_SLOT_LABELS = "1,2,3,4"


def parse_writable_slots(value: str) -> set[int]:
    slots = set()
    for item in value.split(","):
        item = item.strip()
        if not item:
            continue
        label = int(item)
        if label < 1 or label > 4:
            raise ValueError("writable slot labels must be between 1 and 4")
        slots.add(label - 1)
    return slots


WRITABLE_SLOTS = parse_writable_slots(os.environ.get("TONE_WRITABLE_SLOTS", DEFAULT_WRITABLE_SLOT_LABELS))


def is_loopback_bind(host: str) -> bool:
    normalized = (host or "").strip().lower()
    return normalized in ("127.0.0.1", "localhost", "::1") or normalized.startswith("127.")


def remote_write_token_required() -> bool:
    return WRITE_ENABLED and not is_loopback_bind(SERVER_BIND_HOST)


def validate_bind_security(host: str) -> None:
    if not WRITE_ENABLED or is_loopback_bind(host):
        return
    if not REMOTE_WRITES_ALLOWED:
        raise RuntimeError(
            "refusing to start write-enabled server on a non-loopback host; "
            "bind to 127.0.0.1 or set TONE_ALLOW_REMOTE_WRITES=1 with TONE_WRITE_TOKEN"
        )
    if not WRITE_TOKEN:
        raise RuntimeError("remote write mode requires TONE_WRITE_TOKEN")


def slot_label(slot: int) -> int:
    return slot + 1


def now_slug() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                note TEXT NOT NULL,
                raw_path TEXT NOT NULL,
                parsed_path TEXT NOT NULL,
                parsed_json TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                name TEXT NOT NULL,
                recipe_type TEXT,
                origin_slot INTEGER,
                recipe_json TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS writes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                slot INTEGER NOT NULL,
                recipe_name TEXT NOT NULL,
                before_backup_id INTEGER,
                request_hex TEXT NOT NULL,
                response_hex TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ("target_host", DEFAULT_HOST))
        db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ("target_port", str(DEFAULT_PORT)))
        db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ("target_profile", DEFAULT_PROFILE))


def get_setting(key: str, default: str) -> str:
    with sqlite3.connect(DB_PATH) as db:
        row = db.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row[0] if row else default


def set_setting(key: str, value: str) -> None:
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )


def get_target() -> dict:
    profile = profile_for_key(get_setting("target_profile", DEFAULT_PROFILE))
    return {
        "host": get_setting("target_host", DEFAULT_HOST),
        "port": int(get_setting("target_port", str(DEFAULT_PORT))),
        "profile_key": profile.key,
        "model": profile.model,
        "recipe_supported": profile.recipe_supported,
        "slot_labels": [slot_label(slot) for slot in profile.slots],
        "verified": profile.verified,
    }


def set_target(host: str, port: int, profile_key: str | None = None) -> dict:
    if not host or any(ch.isspace() for ch in host):
        raise ValueError("invalid host")
    if port <= 0 or port > 65535:
        raise ValueError("invalid port")
    profile = profile_for_key(profile_key)
    if profile_key and profile.key == "unknown" and profile_key != "unknown":
        raise ValueError(f"unknown profile: {profile_key}")
    set_setting("target_host", host)
    set_setting("target_port", str(port))
    if profile_key:
        set_setting("target_profile", profile.key)
    return get_target()


def normalize_snapshot_path(value: str) -> str:
    legacy_dir = "cap" + "tures"
    normalized = value.replace(f"/tone/{legacy_dir}/", "/tone/snapshots/").replace(
        f"tone/{legacy_dir}/", "tone/snapshots/"
    )
    try:
        return str(Path(normalized).resolve().relative_to(ROOT))
    except (OSError, ValueError):
        return normalized


def normalize_backup_payload(data: dict) -> dict:
    source = data.get("source")
    if isinstance(source, str):
        data["source"] = normalize_snapshot_path(source)
    machine = data.get("machine")
    if isinstance(machine, dict):
        profile = profile_for_key(machine.get("profile_key"))
        machine["profile_key"] = profile.key
        machine["model"] = profile.model
        machine["recipe_supported"] = profile.recipe_supported
        machine["verified"] = profile.verified
    return data


def db_row_to_backup(row: sqlite3.Row, include_payload: bool = False) -> dict:
    item = {
        "id": row["id"],
        "created_at": row["created_at"],
        "note": row["note"],
        "raw_path": normalize_snapshot_path(row["raw_path"]),
        "parsed_path": normalize_snapshot_path(row["parsed_path"]),
    }
    if include_payload:
        item["data"] = normalize_backup_payload(json.loads(row["parsed_json"]))
    return item


def backup_payload_for_row(row: sqlite3.Row) -> dict:
    return normalize_backup_payload(json.loads(row["parsed_json"]))


def backup_matches_target(data: dict, require_all_slots: bool = False, require_parameters: bool = False) -> bool:
    target = get_target()
    machine = data.get("machine") or {}
    if machine.get("host") != target["host"] or int(machine.get("port", 0)) != target["port"]:
        return False
    if machine.get("profile_key") != target["profile_key"]:
        return False
    if require_parameters and not data.get("parameters"):
        return False
    if require_all_slots:
        expected_slots = set(profile_for_key(target["profile_key"]).slots)
        actual_slots = {int(recipe.get("slot")) for recipe in data.get("recipes", []) if recipe.get("slot") is not None}
        if not expected_slots.issubset(actual_slots):
            return False
    return True


def probe_machine(
    note: str = "manual backup",
    host: str | None = None,
    port: int | None = None,
    slots: list[int] | None = None,
    params: list[int] | None = None,
) -> dict:
    target = get_target()
    host = host or target["host"]
    port = port or target["port"]
    profile = profile_for_key(target.get("profile_key"))
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    ts = now_slug()
    records = probe_records(
        host,
        port,
        2.0,
        slots if slots is not None else list(profile.slots),
        params if params is not None else DEFAULT_PARAMS,
        profile.key,
    )

    raw_path = SNAPSHOT_DIR / f"tone-manager-probe-{ts}.json"
    raw_path.write_text(json.dumps(records, ensure_ascii=False, indent=2))

    parsed = {
        "source": str(raw_path),
        "machine": {
            "host": host,
            "port": port,
            "profile_key": profile.key,
            "model": profile.model,
            "recipe_supported": profile.recipe_supported,
            "verified": profile.verified,
        },
        "parameters": [parse_parameter(x) for x in records if x["kind"] == "read_parameter"],
        "recipes": [parse_recipe(x) for x in records if x["kind"] == "read_recipe"],
    }
    parsed_path = SNAPSHOT_DIR / f"tone-manager-recipes-{ts}.json"
    parsed_path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2))

    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        cur = db.execute(
            """
            INSERT INTO backups (created_at, note, raw_path, parsed_path, parsed_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (now_iso(), note, str(raw_path), str(parsed_path), json.dumps(parsed, ensure_ascii=False)),
        )
        backup_id = cur.lastrowid
        row = db.execute("SELECT * FROM backups WHERE id = ?", (backup_id,)).fetchone()
    return db_row_to_backup(row, include_payload=True)


def latest_backup(require_all_slots: bool = False, require_parameters: bool = False) -> dict | None:
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM backups ORDER BY id DESC LIMIT 100").fetchall()
    for row in rows:
        data = backup_payload_for_row(row)
        if backup_matches_target(data, require_all_slots=require_all_slots, require_parameters=require_parameters):
            item = db_row_to_backup(row, include_payload=False)
            item["data"] = data
            return item
    return None


def slot_labels_to_indexes(labels: list[int]) -> list[int]:
    slots = []
    for label in labels:
        if label < 1 or label > 4:
            raise RuntimeError("slot labels must be between 1 and 4")
        slots.append(label - 1)
    return slots


def backup_by_id(backup_id: int) -> dict:
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        row = db.execute("SELECT * FROM backups WHERE id = ?", (backup_id,)).fetchone()
    if not row:
        raise RuntimeError(f"backup not found: {backup_id}")
    return db_row_to_backup(row, include_payload=False)


def list_backups() -> list[dict]:
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM backups ORDER BY id DESC LIMIT 50").fetchall()
    return [db_row_to_backup(row) for row in rows]


def list_library() -> list[dict]:
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM library ORDER BY updated_at DESC, id DESC").fetchall()
    return [db_row_to_library_recipe(row) for row in rows]


def db_row_to_library_recipe(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "name": row["name"],
        "recipe_type": row["recipe_type"],
        "origin_slot": row["origin_slot"],
        "recipe": json.loads(row["recipe_json"]),
    }


def save_recipe_to_library(recipe: dict) -> dict:
    name = recipe.get("name") or "Untitled"
    recipe_type = recipe.get("recipe_type")
    origin_slot = recipe.get("slot")
    stamp = now_iso()
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        cur = db.execute(
            """
            INSERT INTO library (created_at, updated_at, name, recipe_type, origin_slot, recipe_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (stamp, stamp, name, recipe_type, origin_slot, json.dumps(recipe, ensure_ascii=False)),
        )
        row = db.execute("SELECT * FROM library WHERE id = ?", (cur.lastrowid,)).fetchone()
    return db_row_to_library_recipe(row)


def rename_library_recipe(recipe_id: int, name: str) -> dict:
    next_name = str(name or "").strip()
    if not next_name:
        raise RuntimeError("library recipe name cannot be empty")
    stamp = now_iso()
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        row = db.execute("SELECT * FROM library WHERE id = ?", (recipe_id,)).fetchone()
        if not row:
            raise RuntimeError(f"library recipe not found: {recipe_id}")
        recipe = json.loads(row["recipe_json"])
        recipe["name"] = next_name
        db.execute(
            """
            UPDATE library
            SET updated_at = ?, name = ?, recipe_json = ?
            WHERE id = ?
            """,
            (stamp, next_name, json.dumps(recipe, ensure_ascii=False), recipe_id),
        )
        row = db.execute("SELECT * FROM library WHERE id = ?", (recipe_id,)).fetchone()
    return db_row_to_library_recipe(row)


def library_recipe_by_id(recipe_id: int) -> dict:
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        row = db.execute("SELECT * FROM library WHERE id = ?", (recipe_id,)).fetchone()
    if not row:
        raise RuntimeError(f"library recipe not found: {recipe_id}")
    return db_row_to_library_recipe(row)


def write_library_recipe_to_slot(
    recipe_id: int,
    slot: int,
    confirmation: str,
    before_backup_id: int | None = None,
) -> dict:
    library_recipe = library_recipe_by_id(recipe_id)
    recipe = json.loads(json.dumps(library_recipe["recipe"]))
    recipe["slot"] = slot
    recipe["number"] = slot
    return write_recipe_slot(slot, recipe, confirmation, before_backup_id)


def expected_readback_recipe(slot: int, recipe: dict) -> dict:
    full_name = recipe_full_name(recipe).encode("ascii", errors="replace").decode("ascii", errors="replace")
    if "#" in full_name:
        name, recipe_type = full_name.split("#", 1)
    else:
        name, recipe_type = full_name, None

    points = []
    for index, point in enumerate(recipe.get("points") or []):
        duration_ticks = point.get("time_ticks_100ms")
        if duration_ticks is None:
            duration_ticks = float(point.get("duration_s") or 0) * 10
        flow_raw = point.get("flow_raw")
        if flow_raw is None:
            flow_raw = float(point.get("flow_ml_s") or 0) * 10
        temp_k = point.get("temperature_k")
        if temp_k is None:
            temp_c = point.get("temperature_c")
            temp_k = 0 if temp_c is None else float(temp_c) + 273
        points.append(
            {
                "index": index,
                "time_ticks_100ms": int(round(duration_ticks)),
                "flow_raw": int(round(flow_raw)),
                "temperature_k": int(round(temp_k)),
                "phase_raw": int(point.get("phase_raw", 0)),
            }
        )

    return {
        "slot": slot,
        "number": slot,
        "point_count": len(points),
        "full_name": full_name,
        "name": name,
        "recipe_type": recipe_type,
        "volume_ml": int(round(float(recipe.get("volume_ml") or 0))),
        "vessel_raw": int(recipe.get("vessel_raw", 0)),
        "beverage_raw": int(recipe.get("beverage_raw", 1)),
        "points": points,
    }


def compare_readback(expected: dict, actual: dict | None, error: str | None = None) -> dict:
    if error:
        return {
            "verified": False,
            "status": "readback_failed",
            "error": error,
            "mismatch_count": 0,
            "mismatches": [],
        }
    if not actual or not actual.get("available"):
        return {
            "verified": False,
            "status": "not_available",
            "mismatch_count": 1,
            "mismatches": [{"field": "available", "expected": True, "actual": False}],
        }

    mismatches = []

    def check(field: str, expected_value, actual_value) -> None:
        if expected_value != actual_value:
            mismatches.append({"field": field, "expected": expected_value, "actual": actual_value})

    for field in ("slot", "number", "point_count", "full_name", "volume_ml", "vessel_raw", "beverage_raw"):
        check(field, expected.get(field), actual.get(field))

    expected_points = expected.get("points") or []
    actual_points = actual.get("points") or []
    if len(expected_points) != len(actual_points):
        mismatches.append({"field": "points.length", "expected": len(expected_points), "actual": len(actual_points)})

    for index, expected_point in enumerate(expected_points):
        if index >= len(actual_points):
            break
        actual_point = actual_points[index]
        for field in ("time_ticks_100ms", "flow_raw", "temperature_k", "phase_raw"):
            check(f"points[{index}].{field}", expected_point.get(field), actual_point.get(field))

    return {
        "verified": not mismatches,
        "status": "verified" if not mismatches else "mismatch",
        "mismatch_count": len(mismatches),
        "mismatches": mismatches[:20],
    }


def write_recipe_slot(slot: int, recipe: dict, confirmation: str, before_backup_id: int | None = None) -> dict:
    target = get_target()
    profile = profile_for_key(target.get("profile_key"))
    if not WRITE_ENABLED:
        raise RuntimeError("writes are disabled; restart with TONE_ENABLE_WRITES=1")
    if not profile.recipe_supported:
        raise RuntimeError(f"{profile.model} recipe writes are not enabled until the converter is verified")
    if slot not in profile.slots:
        labels = ", ".join(str(slot_label(item)) for item in profile.slots)
        raise RuntimeError(f"slot must be one of: {labels}")
    if slot not in WRITABLE_SLOTS:
        allowed = ", ".join(str(slot_label(item)) for item in sorted(WRITABLE_SLOTS))
        raise RuntimeError(f"protected slot: writable slots are {allowed}")
    expected = f"WRITE SLOT {slot_label(slot)}"
    if confirmation != expected:
        raise RuntimeError(f"confirmation must be exactly: {expected}")

    before = backup_by_id(before_backup_id) if before_backup_id else probe_machine(note=f"before write slot {slot_label(slot)}")
    write_result = write_recipe(target["host"], target["port"], slot, recipe, 2.0)
    expected = expected_readback_recipe(slot, recipe)
    readback = None
    readback_error = None
    try:
        readback = parse_recipe(read_recipe(target["host"], target["port"], slot, 5.0))
    except Exception as exc:
        readback_error = str(exc)
    verification = compare_readback(expected, readback, readback_error)
    status = verification["status"]

    with sqlite3.connect(DB_PATH) as db:
        cur = db.execute(
            """
            INSERT INTO writes (created_at, slot, recipe_name, before_backup_id, request_hex, response_hex, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                now_iso(),
                slot,
                recipe.get("name") or "Untitled",
                before["id"],
                write_result["request_hex"],
                write_result["response_hex"],
                status,
            ),
        )
        write_id = cur.lastrowid
    return {
        "id": write_id,
        "slot": slot,
        "slot_label": slot_label(slot),
        "target": target,
        "request_hex": write_result["request_hex"],
        "response_hex": write_result["response_hex"],
        "before_backup": before,
        "readback": readback,
        "verification": verification,
    }


def fresh_parameters() -> list[dict]:
    target = get_target()
    records = [read_parameter(target["host"], target["port"], identifier, 2.0) for identifier in DEFAULT_PARAMS]
    return [parse_parameter(item) for item in records]


def latest_parameters() -> list[dict]:
    backup = latest_backup(require_parameters=True)
    if not backup:
        return fresh_parameters()
    return backup.get("data", {}).get("parameters", [])


def write_parameter_value(identifier: int, value_hex: str, confirmation: str) -> dict:
    if not WRITE_ENABLED:
        raise RuntimeError("writes are disabled; restart with TONE_ENABLE_WRITES=1")
    expected = f"WRITE PARAM {identifier}"
    if confirmation != expected:
        raise RuntimeError(f"confirmation must be exactly: {expected}")
    target = get_target()
    value = bytes.fromhex(value_hex)
    result = send_parameter(target["host"], target["port"], identifier, value, 2.0)
    return {
        "target": target,
        "identifier": identifier,
        "request_hex": result["request_hex"],
        "response_hex": result["response_hex"],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "ToneManager/0.1"

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} - {fmt % args}")

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, exc: Exception, status: int = 500) -> None:
        self.send_json({"error": str(exc), "type": exc.__class__.__name__}, status=status)

    def require_write_access(self) -> None:
        if not remote_write_token_required():
            return
        token = self.headers.get("X-TONE-Write-Token", "")
        if not hmac.compare_digest(token, WRITE_TOKEN):
            raise PermissionError("missing or invalid X-TONE-Write-Token")

    def do_GET(self) -> None:
        try:
            path = urlparse(self.path).path
            query = parse_qs(urlparse(self.path).query)
            if path == "/api/status":
                target = get_target()
                self.send_json(
                    {
                        "target": target,
                        "host": target["host"],
                        "port": target["port"],
                        "write_enabled": WRITE_ENABLED,
                        "remote_write_token_required": remote_write_token_required(),
                        "writable_slots": sorted(WRITABLE_SLOTS),
                        "writable_slot_labels": [slot_label(item) for item in sorted(WRITABLE_SLOTS)],
                        "profiles": machine_profiles_public(),
                        "actions": ACTION_REGISTRY,
                        "database": str(DB_PATH.relative_to(ROOT)),
                    }
                )
            elif path == "/api/capabilities":
                self.send_json(
                    {
                        "profiles": machine_profiles_public(),
                        "actions": ACTION_REGISTRY,
                        "parameters": DEFAULT_PARAMS,
                    }
                )
            elif path == "/api/machine":
                self.send_json({"machine": get_target()})
            elif path == "/api/discover":
                timeout = float(query.get("timeout", ["2.0"])[0])
                self.send_json({"machines": discover_machines(timeout=timeout), "selected": get_target()})
            elif path == "/api/parameters":
                if query.get("fresh") == ["1"]:
                    self.send_json({"parameters": fresh_parameters(), "target": get_target()})
                else:
                    self.send_json({"parameters": latest_parameters(), "target": get_target()})
            elif path == "/api/backups":
                self.send_json({"backups": list_backups()})
            elif path == "/api/current":
                if query.get("fresh") == ["1"]:
                    self.send_json({"backup": probe_machine(note="fresh read from UI")})
                else:
                    backup = latest_backup(require_all_slots=True)
                    if backup is None:
                        backup = probe_machine(note="initial read")
                    self.send_json({"backup": backup})
            elif path == "/api/library":
                self.send_json({"recipes": list_library()})
            else:
                self.serve_static(path)
        except Exception as exc:
            self.send_error_json(exc)

    def do_HEAD(self) -> None:
        try:
            path = urlparse(self.path).path
            rel = "index.html" if path in ("", "/") else path.lstrip("/")
            target = (STATIC_DIR / rel).resolve()
            if not str(target).startswith(str(STATIC_DIR.resolve())) or not target.exists():
                self.send_response(404)
                self.end_headers()
                return
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(str(target))[0] or "application/octet-stream")
            self.send_header("Content-Length", str(target.stat().st_size))
            self.end_headers()
        except Exception:
            self.send_response(500)
            self.end_headers()

    def do_POST(self) -> None:
        try:
            path = urlparse(self.path).path
            payload = self.read_json()
            if path == "/api/backup":
                slots = None
                if payload.get("slots") is not None:
                    slots = slot_labels_to_indexes([int(item) for item in payload.get("slots", [])])
                params = None
                if payload.get("params") is not None:
                    params = [int(item) for item in payload.get("params", [])]
                self.send_json(
                    {
                        "backup": probe_machine(
                            note=payload.get("note", "manual backup"),
                            slots=slots,
                            params=params,
                        )
                    }
                )
            elif path == "/api/machine":
                target = set_target(
                    str(payload["host"]),
                    int(payload.get("port", DEFAULT_PORT)),
                    payload.get("profile_key"),
                )
                self.send_json({"machine": target})
            elif path == "/api/write-parameter":
                self.require_write_access()
                self.send_json(
                    {
                        "parameter": write_parameter_value(
                            int(payload["identifier"]),
                            str(payload.get("value_hex", "")),
                            payload.get("confirmation", ""),
                        )
                    }
                )
            elif path == "/api/library":
                self.send_json({"recipe": save_recipe_to_library(payload["recipe"])})
            elif path.startswith("/api/library/") and path.endswith("/write-slot"):
                self.require_write_access()
                recipe_id = int(path.split("/")[-2])
                self.send_json(
                    {
                        "write": write_library_recipe_to_slot(
                            recipe_id,
                            int(payload["slot"]),
                            payload.get("confirmation", ""),
                            int(payload["before_backup_id"]) if payload.get("before_backup_id") else None,
                        )
                    }
                )
            elif path == "/api/write-slot":
                self.require_write_access()
                self.send_json(
                    {
                        "write": write_recipe_slot(
                            int(payload["slot"]),
                            payload["recipe"],
                            payload.get("confirmation", ""),
                            int(payload["before_backup_id"]) if payload.get("before_backup_id") else None,
                        )
                    }
                )
            else:
                self.send_error_json(RuntimeError("not found"), status=404)
        except PermissionError as exc:
            self.send_error_json(exc, status=403)
        except Exception as exc:
            self.send_error_json(exc, status=400)

    def do_PATCH(self) -> None:
        try:
            path = urlparse(self.path).path
            payload = self.read_json()
            if path.startswith("/api/library/"):
                recipe_id = int(path.rsplit("/", 1)[-1])
                self.send_json({"recipe": rename_library_recipe(recipe_id, str(payload.get("name", "")))})
            else:
                self.send_error_json(RuntimeError("not found"), status=404)
        except Exception as exc:
            self.send_error_json(exc, status=400)

    def serve_static(self, path: str) -> None:
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        target = (STATIC_DIR / rel).resolve()
        if not str(target).startswith(str(STATIC_DIR.resolve())) or not target.exists():
            self.send_error_json(RuntimeError("not found"), status=404)
            return
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(str(target))[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=DEFAULT_BIND_HOST)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    global SERVER_BIND_HOST
    SERVER_BIND_HOST = args.host
    try:
        validate_bind_security(args.host)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    init_db()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    target = get_target()
    print(f"Tone Manager listening on http://{args.host}:{args.port}")
    print(f"Target TONE: {target['host']}:{target['port']}; writes enabled: {WRITE_ENABLED}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nTone Manager stopped")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
