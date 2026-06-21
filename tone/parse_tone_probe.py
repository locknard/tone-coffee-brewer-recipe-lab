#!/usr/bin/env python3
import argparse
import csv
import json
import time
from pathlib import Path


PHASES = {
    0: "none",
    1: "bloom",
    2: "turbulence",
    3: "extraction",
}

VESSELS = {
    0: "none",
    1: "flat",
    2: "v",
}

BEVERAGES = {
    1: "coffee",
    2: "tea",
}

PROGRAM_DATA_FIELDS = [
    ("program_time_s", 10.0),
    ("temperature_setpoint_c", 10.0),
    ("temperature_actual_ntc_c", 10.0),
    ("temperature_actual_efast_c", 10.0),
    ("efast_voltage_v", 1000.0),
    ("water_heat_power_setpoint", 10.0),
    ("water_heat_power_actual", 10.0),
    ("flow_setpoint_ml_s", 10.0),
    ("flow_actual_ml_s", 100.0),
    ("valve_setpoint", 10.0),
]

TEMPERATURE_CONTROL_FIELDS = ["kp", "ki", "kd", "ku"]


def u16be(data: bytes, idx: int) -> tuple[int, int]:
    return ((data[idx] << 8) | data[idx + 1], idx + 2)


def u32be(data: bytes, idx: int) -> tuple[int, int]:
    return (
        (data[idx] << 24) | (data[idx + 1] << 16) | (data[idx + 2] << 8) | data[idx + 3],
        idx + 4,
    )


def parse_program_data(value: bytes) -> dict:
    if len(value) != 40:
        return {"parse_warning": f"expected 40 bytes, got {len(value)}"}
    idx = 0
    parsed = {}
    for name, divisor in PROGRAM_DATA_FIELDS:
        raw, idx = u32be(value, idx)
        parsed[name] = raw / divisor
        parsed[f"{name}_raw"] = raw
    return parsed


def parse_temperature_control(value: bytes) -> dict:
    if len(value) != 16:
        return {"parse_warning": f"expected 16 bytes, got {len(value)}"}
    idx = 0
    parsed = {}
    for name in TEMPERATURE_CONTROL_FIELDS:
        raw, idx = u32be(value, idx)
        parsed[name] = raw / 1000.0
        parsed[f"{name}_raw"] = raw
    return parsed


def parse_parameter(item: dict) -> dict:
    raw = bytes.fromhex(item["response_hex"])
    result = {
        "identifier": item.get("identifier"),
        "name": item.get("name"),
        "available": raw != b"notAvailable",
        "raw_hex": item["response_hex"],
    }
    if not result["available"]:
        return result
    if len(raw) < 5 or raw[0] != 0x02:
        result["parse_warning"] = "unexpected parameter packet"
        return result
    value = raw[5:]
    result["size_byte"] = raw[4]
    result["value_hex"] = value.hex(" ")
    if item.get("name") == "set" and len(value) >= 2:
        declared = (value[0] << 8) | value[1]
        result["value"] = value[2 : 2 + declared].decode("ascii", errors="replace")
    elif item.get("name") == "live_value":
        result["value"] = parse_program_data(value)
    elif item.get("name") == "temperature_control":
        result["value"] = parse_temperature_control(value)
    else:
        result["value"] = value.decode("ascii", errors="replace")
    return result


def malformed_recipe(item: dict, warning: str) -> dict:
    return {
        "slot": item.get("slot"),
        "available": False,
        "raw_hex": item.get("response_hex", ""),
        "parse_warning": warning,
    }


def parse_recipe(item: dict) -> dict:
    raw_hex = item.get("response_hex", "")
    try:
        raw_response = bytes.fromhex(raw_hex)
    except ValueError as exc:
        return malformed_recipe(item, f"invalid hex: {exc}")
    if raw_response == b"notAvailable":
        return {"slot": item.get("slot"), "available": False, "raw_hex": raw_hex}
    if len(raw_response) < 2:
        return malformed_recipe(item, f"expected at least 2 response prefix bytes, got {len(raw_response)}")

    data = raw_response[2:]
    idx = 0

    def take(count: int, label: str) -> bytes:
        nonlocal idx
        if idx + count > len(data):
            raise ValueError(
                f"truncated recipe packet while reading {label}: "
                f"need {count} bytes at offset {idx}, have {len(data) - idx}"
            )
        value = data[idx : idx + count]
        idx += count
        return value

    def take_u16(label: str) -> int:
        return int.from_bytes(take(2, label), "big")

    try:
        number = take(1, "number")[0]
        point_count = take_u16("point_count")
        name_length = take(1, "name_length")[0]
        full_name = take(name_length, "name").decode("ascii", errors="replace")
        timestamp = take(12, "timestamp").decode("ascii", errors="replace")
        volume_ml = take_u16("volume_ml")
        vessel_raw = take_u16("vessel")
        beverage_raw = take_u16("beverage")
    except ValueError as exc:
        return malformed_recipe(item, str(exc))

    if "#" in full_name:
        name, recipe_type = full_name.split("#", 1)
    else:
        name, recipe_type = full_name, None

    points = []
    cumulative_ml = 0.0
    elapsed_s = 0.0
    try:
        for point_index in range(point_count):
            time_ticks = take_u16(f"point_{point_index}_time")
            flow_raw = take_u16(f"point_{point_index}_flow")
            temp_k = take_u16(f"point_{point_index}_temperature")
            phase_raw = take_u16(f"point_{point_index}_phase")
            duration_s = time_ticks / 10.0
            flow_ml_s = flow_raw / 10.0
            temp_c = None if temp_k == 0 else temp_k - 273
            cumulative_ml += duration_s * flow_ml_s
            elapsed_s += duration_s
            points.append(
                {
                    "index": point_index,
                    "time_ticks_100ms": time_ticks,
                    "duration_s": duration_s,
                    "elapsed_end_s": elapsed_s,
                    "flow_raw": flow_raw,
                    "flow_ml_s": flow_ml_s,
                    "temperature_k": temp_k,
                    "temperature_c": temp_c,
                    "phase_raw": phase_raw,
                    "phase": PHASES.get(phase_raw, f"unknown_{phase_raw}"),
                    "estimated_cumulative_ml": round(cumulative_ml, 3),
                }
            )
    except ValueError as exc:
        return malformed_recipe(item, str(exc))

    return {
        "slot": item.get("slot"),
        "available": True,
        "number": number,
        "point_count": point_count,
        "full_name": full_name,
        "name": name,
        "recipe_type": recipe_type,
        "timestamp": timestamp,
        "volume_ml": volume_ml,
        "vessel_raw": vessel_raw,
        "vessel": VESSELS.get(vessel_raw, f"unknown_{vessel_raw}"),
        "beverage_raw": beverage_raw,
        "beverage": BEVERAGES.get(beverage_raw, f"unknown_{beverage_raw}"),
        "points": points,
        "raw_hex": raw_hex,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse TONE probe JSON into recipe curves.")
    parser.add_argument("probe_json", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("tone/snapshots"))
    args = parser.parse_args()

    records = json.loads(args.probe_json.read_text())
    parameters = [parse_parameter(x) for x in records if x["kind"] == "read_parameter"]
    recipes = [parse_recipe(x) for x in records if x["kind"] == "read_recipe"]

    ts = time.strftime("%Y%m%d-%H%M%S")
    recipes_json = args.out_dir / f"tone-recipes-{ts}.json"
    curves_csv = args.out_dir / f"tone-recipe-curves-{ts}.csv"
    parsed = {
        "source": str(args.probe_json),
        "parameters": parameters,
        "recipes": recipes,
    }
    recipes_json.write_text(json.dumps(parsed, ensure_ascii=False, indent=2))

    with curves_csv.open("w", newline="") as f:
        writer = csv.DictWriter(
            f,
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
        for recipe in recipes:
            if not recipe.get("available"):
                continue
            for point in recipe["points"]:
                writer.writerow(
                    {
                        "slot": recipe["slot"],
                        "name": recipe["name"],
                        "recipe_type": recipe["recipe_type"],
                        "target_volume_ml": recipe["volume_ml"],
                        "point_index": point["index"],
                        "duration_s": point["duration_s"],
                        "elapsed_end_s": point["elapsed_end_s"],
                        "flow_ml_s": point["flow_ml_s"],
                        "temperature_c": point["temperature_c"],
                        "phase": point["phase"],
                        "estimated_cumulative_ml": point["estimated_cumulative_ml"],
                    }
                )

    print(recipes_json)
    print(curves_csv)
    for recipe in recipes:
        if recipe.get("available"):
            print(
                f"slot {recipe['slot']}: {recipe['name']} "
                f"({recipe['recipe_type']}), {recipe['volume_ml']}ml, "
                f"{recipe['point_count']} points"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
