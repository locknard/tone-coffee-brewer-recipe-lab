#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

from parse_tone_probe import PHASES, parse_parameter, parse_recipe
from tone_probe import (
    DEFAULT_HOST,
    DEFAULT_PARAMS,
    DEFAULT_PORT,
    DEFAULT_SLOTS,
    ACTION_REGISTRY,
    build_recipe_packet,
    discover_machines,
    machine_profiles_public,
    probe_records,
    profile_for_key,
    read_parameter,
    read_recipe,
    send_parameter,
    write_recipe,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CAPTURE_DIR = ROOT / "tone" / "snapshots"
PHASE_VALUES = {name: value for value, name in PHASES.items()}


def print_json(payload: object) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))


def slot_index(slot_label: int) -> int:
    if slot_label < 1 or slot_label > 4:
        raise ValueError("slot must be between 1 and 4")
    return slot_label - 1


def slot_labels(profile_key: str) -> list[int]:
    return [slot + 1 for slot in profile_for_key(profile_key).slots]


def parsed_from_records(records: list[dict], source: Path | None = None) -> dict:
    machine = None
    for item in records:
        if item.get("host") and item.get("port"):
            machine = {"host": item["host"], "port": item["port"]}
            break
    return {
        "source": str(source) if source else None,
        "machine": machine,
        "parameters": [parse_parameter(item) for item in records if item["kind"] == "read_parameter"],
        "recipes": [parse_recipe(item) for item in records if item["kind"] == "read_recipe"],
    }


def backup_machine(args: argparse.Namespace, note: str = "cli backup") -> dict:
    ts = time.strftime("%Y%m%d-%H%M%S")
    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    slots = [slot_index(value) for value in args.slots]
    records = probe_records(args.host, args.port, args.timeout, slots, args.params, args.profile)
    raw_path = out_dir / f"tone-probe-{ts}.json"
    parsed_path = out_dir / f"tone-recipes-{ts}.json"
    write_json(raw_path, records)
    parsed = parsed_from_records(records, raw_path)
    parsed["note"] = note
    write_json(parsed_path, parsed)
    return {"raw_path": str(raw_path), "parsed_path": str(parsed_path), "data": parsed}


def summarize_recipes(recipes: list[dict]) -> list[dict]:
    summary = []
    for recipe in recipes:
        if not recipe.get("available"):
            summary.append({"slot": recipe.get("slot", -1) + 1, "available": False})
            continue
        summary.append(
            {
                "slot": recipe["slot"] + 1,
                "name": recipe["name"],
                "type": recipe.get("recipe_type"),
                "target_ml": recipe["volume_ml"],
                "points": recipe["point_count"],
            }
        )
    return summary


def load_recipe(path: Path) -> dict:
    payload = json.loads(path.read_text())
    if isinstance(payload, dict) and "recipe" in payload:
        return payload["recipe"]
    if isinstance(payload, dict) and "points" in payload:
        return payload
    raise ValueError("recipe JSON must be either a recipe object or {'recipe': ...}")


def recompute_recipe(recipe: dict) -> None:
    elapsed = 0.0
    volume = 0.0
    for index, point in enumerate(recipe.get("points", [])):
        point["index"] = index
        point["duration_s"] = float(point.get("duration_s") or 0)
        point["flow_ml_s"] = float(point.get("flow_ml_s") or 0)
        point["time_ticks_100ms"] = int(round(point["duration_s"] * 10))
        point["flow_raw"] = int(round(point["flow_ml_s"] * 10))
        temp_c = point.get("temperature_c")
        point["temperature_k"] = 0 if temp_c is None else int(round(float(temp_c) + 273))
        phase_raw = int(point.get("phase_raw", 0))
        point["phase_raw"] = phase_raw
        point["phase"] = PHASES.get(phase_raw, f"unknown_{phase_raw}")
        elapsed += point["duration_s"]
        volume += point["duration_s"] * point["flow_ml_s"]
        point["elapsed_end_s"] = round(elapsed, 3)
        point["estimated_cumulative_ml"] = round(volume, 3)


def write_curve_csv(recipe: dict, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "slot",
                "name",
                "recipe_type",
                "target_volume_ml",
                "point_index",
                "duration_s",
                "elapsed_end_s",
                "flow_ml_s",
                "temperature_c",
                "phase",
                "estimated_cumulative_ml",
            ],
        )
        writer.writeheader()
        for point in recipe.get("points", []):
            writer.writerow(
                {
                    "slot": recipe.get("slot", -1) + 1,
                    "name": recipe.get("name"),
                    "recipe_type": recipe.get("recipe_type"),
                    "target_volume_ml": recipe.get("volume_ml"),
                    "point_index": point["index"] + 1,
                    "duration_s": point["duration_s"],
                    "elapsed_end_s": point["elapsed_end_s"],
                    "flow_ml_s": point["flow_ml_s"],
                    "temperature_c": point.get("temperature_c"),
                    "phase": point.get("phase"),
                    "estimated_cumulative_ml": point["estimated_cumulative_ml"],
                }
            )


def command_discover(args: argparse.Namespace) -> int:
    print_json({"machines": discover_machines(timeout=args.timeout)})
    return 0


def command_capabilities(args: argparse.Namespace) -> int:
    print_json({"profiles": machine_profiles_public(), "actions": ACTION_REGISTRY, "parameters": DEFAULT_PARAMS})
    return 0


def command_backup(args: argparse.Namespace) -> int:
    backup = backup_machine(args)
    print_json(
        {
            "raw_path": backup["raw_path"],
            "parsed_path": backup["parsed_path"],
            "recipes": summarize_recipes(backup["data"]["recipes"]),
        }
    )
    return 0


def command_read_slot(args: argparse.Namespace) -> int:
    recipe = parse_recipe(read_recipe(args.host, args.port, slot_index(args.slot), args.timeout))
    if args.out:
        write_json(args.out, recipe)
        print(args.out)
    else:
        print_json(recipe)
    return 0


def command_read_param(args: argparse.Namespace) -> int:
    result = parse_parameter(read_parameter(args.host, args.port, args.identifier, args.timeout))
    print_json(result)
    return 0


def command_write_param(args: argparse.Namespace) -> int:
    enabled = args.enable_write or os.environ.get("TONE_ENABLE_WRITES") == "1"
    if not enabled:
        raise RuntimeError("writes are disabled; pass --enable-write or set TONE_ENABLE_WRITES=1")
    expected = f"WRITE PARAM {args.identifier}"
    if args.confirm != expected:
        raise RuntimeError(f"confirmation must be exactly: {expected}")
    value = bytes.fromhex(args.value_hex)
    result = send_parameter(args.host, args.port, args.identifier, value, args.timeout)
    print_json(result)
    return 0


def command_export_curve(args: argparse.Namespace) -> int:
    recipe = load_recipe(args.recipe_json) if args.recipe_json else parse_recipe(
        read_recipe(args.host, args.port, slot_index(args.slot), args.timeout)
    )
    write_curve_csv(recipe, args.out)
    print(args.out)
    return 0


def command_set_point(args: argparse.Namespace) -> int:
    recipe = load_recipe(args.recipe_json)
    index = args.point - 1
    points = recipe.get("points", [])
    if index < 0 or index >= len(points):
        raise ValueError(f"point must be between 1 and {len(points)}")
    point = points[index]
    if args.duration_s is not None:
        point["duration_s"] = args.duration_s
    if args.flow_ml_s is not None:
        point["flow_ml_s"] = args.flow_ml_s
    if args.temperature_c is not None:
        point["temperature_c"] = args.temperature_c
    if args.phase is not None:
        phase = args.phase.strip().lower()
        point["phase_raw"] = int(phase) if phase.isdigit() else PHASE_VALUES[phase]
    recompute_recipe(recipe)
    write_json(args.out, recipe)
    print(args.out)
    return 0


def command_render_packet(args: argparse.Namespace) -> int:
    recipe = load_recipe(args.recipe_json)
    packet = build_recipe_packet(recipe, slot_index(args.slot))
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(packet)
        print(args.out)
    else:
        print(packet.hex(" "))
    return 0


def command_write_slot(args: argparse.Namespace) -> int:
    enabled = args.enable_write or os.environ.get("TONE_ENABLE_WRITES") == "1"
    if not enabled:
        raise RuntimeError("writes are disabled; pass --enable-write or set TONE_ENABLE_WRITES=1")
    if args.slot not in slot_labels(args.profile):
        raise ValueError(f"slot must be one of: {slot_labels(args.profile)}")
    expected = f"WRITE SLOT {args.slot}"
    if args.confirm != expected:
        raise RuntimeError(f"confirmation must be exactly: {expected}")

    before = backup_machine(args, note=f"before cli write slot {args.slot}")
    recipe = load_recipe(args.recipe_json)
    result = write_recipe(args.host, args.port, slot_index(args.slot), recipe, args.timeout)
    print_json(
        {
            "write": {
                "host": args.host,
                "port": args.port,
                "slot": args.slot,
                "request_hex": result["request_hex"],
                "response_hex": result["response_hex"],
                "before_raw_path": before["raw_path"],
                "before_parsed_path": before["parsed_path"],
            }
        }
    )
    return 0


def add_common_target_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--timeout", type=float, default=2.0)
    parser.add_argument("--profile", default="primary", choices=["primary", "alternate", "unknown"])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="TONE local HTTP connection helper CLI.")
    sub = parser.add_subparsers(dest="command", required=True)

    discover = sub.add_parser("discover", help="Find TONE machines on the local network.")
    discover.add_argument("--timeout", type=float, default=2.0)
    discover.set_defaults(func=command_discover)

    capabilities = sub.add_parser("capabilities", help="Show supported machine profiles and action registry.")
    capabilities.set_defaults(func=command_capabilities)

    backup = sub.add_parser("backup", help="Read parameters and all slots into JSON files.")
    add_common_target_args(backup)
    backup.add_argument("--out-dir", type=Path, default=DEFAULT_CAPTURE_DIR)
    backup.add_argument("--slots", type=int, nargs="*", default=[slot + 1 for slot in DEFAULT_SLOTS])
    backup.add_argument("--params", type=int, nargs="*", default=DEFAULT_PARAMS)
    backup.set_defaults(func=command_backup)

    read_slot = sub.add_parser("read-slot", help="Read one human-numbered slot, 1 to 4.")
    add_common_target_args(read_slot)
    read_slot.add_argument("--slot", type=int, required=True)
    read_slot.add_argument("--out", type=Path)
    read_slot.set_defaults(func=command_read_slot)

    read_param = sub.add_parser("read-param", help="Read one machine parameter.")
    add_common_target_args(read_param)
    read_param.add_argument("--identifier", type=int, required=True)
    read_param.set_defaults(func=command_read_param)

    write_param = sub.add_parser("write-param", help="Write one machine parameter from a hex value.")
    add_common_target_args(write_param)
    write_param.add_argument("--identifier", type=int, required=True)
    write_param.add_argument("--value-hex", required=True)
    write_param.add_argument("--confirm", required=True)
    write_param.add_argument("--enable-write", action="store_true")
    write_param.set_defaults(func=command_write_param)

    export_curve = sub.add_parser("export-curve", help="Export recipe points as CSV.")
    add_common_target_args(export_curve)
    export_curve.add_argument("--slot", type=int, default=4)
    export_curve.add_argument("--recipe-json", type=Path)
    export_curve.add_argument("--out", type=Path, required=True)
    export_curve.set_defaults(func=command_export_curve)

    set_point = sub.add_parser("set-point", help="Patch one recipe point and recompute totals.")
    set_point.add_argument("--recipe-json", type=Path, required=True)
    set_point.add_argument("--out", type=Path, required=True)
    set_point.add_argument("--point", type=int, required=True, help="1-based point index.")
    set_point.add_argument("--duration-s", type=float)
    set_point.add_argument("--flow-ml-s", type=float)
    set_point.add_argument("--temperature-c", type=float)
    set_point.add_argument("--phase", choices=[*PHASE_VALUES.keys(), "0", "1", "2", "3"])
    set_point.set_defaults(func=command_set_point)

    render_packet = sub.add_parser("render-packet", help="Render a recipe JSON into the TCP write packet.")
    render_packet.add_argument("--slot", type=int, required=True)
    render_packet.add_argument("--recipe-json", type=Path, required=True)
    render_packet.add_argument("--out", type=Path)
    render_packet.set_defaults(func=command_render_packet)

    write_slot = sub.add_parser("write-slot", help="Write a recipe JSON to any supported slot.")
    add_common_target_args(write_slot)
    write_slot.add_argument("--slot", type=int, required=True)
    write_slot.add_argument("--recipe-json", type=Path, required=True)
    write_slot.add_argument("--confirm", required=True)
    write_slot.add_argument("--enable-write", action="store_true")
    write_slot.add_argument("--out-dir", type=Path, default=DEFAULT_CAPTURE_DIR)
    write_slot.add_argument("--slots", type=int, nargs="*", default=[slot + 1 for slot in DEFAULT_SLOTS])
    write_slot.add_argument("--params", type=int, nargs="*", default=DEFAULT_PARAMS)
    write_slot.set_defaults(func=command_write_slot)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
