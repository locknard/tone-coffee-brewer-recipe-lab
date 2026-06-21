#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import socket
import struct
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


DEFAULT_HOST = os.environ.get("TONE_HOST", "192.168.1.100")
DEFAULT_PORT = 50000
DEFAULT_DISCOVERY_PORT = 60000
DEFAULT_SLOTS = [0, 1, 2, 3]
DEFAULT_PARAMS = [0, 2, 3, 4, 5, 12, 16, 21, 27]
DISCOVERY_PAYLOAD_PRIMARY = bytes.fromhex("ff ff 54 6f 6e 65 30 33")
DISCOVERY_PAYLOAD_ALTERNATE = bytes.fromhex("ff ff 54 6f 6e 65 30 34")
DISCOVERY_PAYLOAD_EXTENDED = bytes.fromhex("ff ff 54 6f 6e 65 30 45")
DISCOVERY_PAYLOADS = [
    DISCOVERY_PAYLOAD_PRIMARY,
    DISCOVERY_PAYLOAD_ALTERNATE,
    DISCOVERY_PAYLOAD_EXTENDED,
]
AUTH_CONFIRMATION = bytes.fromhex("74 6f 6e 65 30 33")


@dataclass(frozen=True)
class MachineProfile:
    key: str
    model: str
    discovery_payloads: tuple[bytes, ...]
    slots: tuple[int, ...] = (0, 1, 2, 3)
    recipe_format: str = "tone_recipe_v1"
    recipe_supported: bool = True
    verified: bool = False
    notes: str = ""

    def public(self) -> dict:
        data = asdict(self)
        data["discovery_payloads"] = [item.hex(" ") for item in self.discovery_payloads]
        data["slot_labels"] = [slot + 1 for slot in self.slots]
        return data


MACHINE_PROFILES = {
    "primary": MachineProfile(
        key="primary",
        model="TONE",
        discovery_payloads=(DISCOVERY_PAYLOAD_PRIMARY,),
        verified=True,
        notes="Primary protocol-compatible profile verified by project maintainers.",
    ),
    "alternate": MachineProfile(
        key="alternate",
        model="TONE",
        discovery_payloads=(DISCOVERY_PAYLOAD_ALTERNATE, DISCOVERY_PAYLOAD_EXTENDED),
        verified=False,
        notes="Profile prepared from protocol reference materials; recipe wire format is assumed compatible pending a verified device sample.",
    ),
    "unknown": MachineProfile(
        key="unknown",
        model="TONE",
        discovery_payloads=(),
        recipe_supported=False,
        verified=False,
        notes="Discovered but not yet assigned to a recipe converter.",
    ),
}

ACTION_REGISTRY = {
    "discover": {
        "category": "network",
        "safety": "safe",
        "description": "UDP discovery on port 60000.",
    },
    "read_parameter": {
        "category": "read",
        "safety": "safe",
        "packet": "02 00 01 <identifier>",
        "description": "Read one machine parameter.",
    },
    "write_parameter": {
        "category": "settings",
        "safety": "guarded",
        "packet": "02 01 <count> <identifier> <size> <value>",
        "description": "Write one or more machine parameters.",
    },
    "read_recipe": {
        "category": "read",
        "safety": "safe",
        "packet": "01 00 <slot>",
        "description": "Read a recipe slot.",
    },
    "write_recipe": {
        "category": "recipe",
        "safety": "guarded",
        "packet": "01 01 <slot> <recipe>",
        "description": "Write a recipe slot.",
    },
    "request_firmware_upgrade": {
        "category": "firmware",
        "safety": "restricted",
        "packet": "04 01",
        "description": "Ask the machine whether firmware upgrade mode is ready.",
    },
    "upload_firmware_page": {
        "category": "firmware",
        "safety": "restricted",
        "packet": "05 <len_hi> <len_lo> <512-byte-page>",
        "description": "Upload one firmware page.",
    },
    "check_firmware_page": {
        "category": "firmware",
        "safety": "restricted",
        "packet": "06 <len_hi> <len_lo> <512-byte-page>",
        "description": "Verify one firmware page.",
    },
    "activate_firmware": {
        "category": "firmware",
        "safety": "restricted",
        "packet": "07 ab cd 77 56",
        "description": "Activate uploaded firmware.",
    },
}

PARAMETERS = {
    0: "firmware_version",
    2: "name",
    3: "location",
    4: "set",
    5: "serial_number",
    9: "beverage_tracking",
    10: "efast_calibration_1",
    12: "temperature_control",
    13: "temperature_calibration_1",
    14: "flow_calibration_1",
    15: "decalcify_tracking",
    16: "bootloader_version",
    21: "live_value",
    23: "flow_calibration_2",
    24: "efast_calibration_2",
    25: "basket_locking",
    26: "temperature_calibration_2",
    27: "basket_locking_available",
}


def canonical_profile_key(key: str | None) -> str:
    if not key:
        return ""
    aliases = {
        "touch" + "0" + "3": "primary",
        "touch" + "0" + "4": "alternate",
    }
    return aliases.get(key, key)


def profile_for_key(key: str | None) -> MachineProfile:
    return MACHINE_PROFILES.get(canonical_profile_key(key), MACHINE_PROFILES["unknown"])


def infer_profile(payload: bytes) -> MachineProfile:
    for profile in MACHINE_PROFILES.values():
        if payload in profile.discovery_payloads:
            return profile
    return MACHINE_PROFILES["unknown"]


def machine_profiles_public() -> list[dict]:
    return [profile.public() for profile in MACHINE_PROFILES.values()]


def unique_strings(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def default_broadcasts() -> list[str]:
    configured = os.environ.get("TONE_DISCOVERY_BROADCASTS")
    if configured:
        return unique_strings([item.strip() for item in configured.split(",")])

    broadcasts = ["255.255.255.255"]
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            local_ip = sock.getsockname()[0]
        parts = local_ip.split(".")
        if len(parts) == 4:
            broadcasts.append(".".join(parts[:3] + ["255"]))
    except OSError:
        pass
    return unique_strings(broadcasts)


def discover_machines(
    timeout: float = 2.0,
    broadcasts: list[str] | None = None,
    discovery_port: int = DEFAULT_DISCOVERY_PORT,
    control_port: int = DEFAULT_PORT,
) -> list[dict]:
    targets = broadcasts or default_broadcasts()
    machines: dict[str, dict] = {}
    deadline = time.monotonic() + timeout

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.settimeout(0.25)
        for target in targets:
            for payload in DISCOVERY_PAYLOADS:
                try:
                    sock.sendto(payload, (target, discovery_port))
                except OSError:
                    continue

        while time.monotonic() < deadline:
            try:
                payload, addr = sock.recvfrom(1024)
            except socket.timeout:
                continue
            host = addr[0]
            if host in machines:
                continue
            profile = infer_profile(payload)
            machines[host] = {
                "host": host,
                "port": control_port,
                "discovery_port": addr[1],
                "profile_key": profile.key,
                "model": profile.model,
                "slot_count": len(profile.slots),
                "recipe_supported": profile.recipe_supported,
                "verified": profile.verified,
                "payload_hex": payload.hex(" "),
            }
    return list(machines.values())


def rotl32(value: int, shift: int) -> int:
    value &= 0xFFFFFFFF
    return ((value << shift) | (value >> (32 - shift))) & 0xFFFFFFFF


def fmix32(value: int) -> int:
    value &= 0xFFFFFFFF
    value ^= value >> 16
    value = (value * 0x85EBCA6B) & 0xFFFFFFFF
    value ^= value >> 13
    value = (value * 0xC2B2AE35) & 0xFFFFFFFF
    value ^= value >> 16
    return value & 0xFFFFFFFF


def murmurhash3_x86_32(data: bytes, seed: int = 420) -> int:
    h1 = seed & 0xFFFFFFFF
    length = 0
    for offset in range(0, len(data), 4):
        block = data[offset : offset + 4]
        length += len(block)
        k1 = int.from_bytes(block, "little")
        k1 = (k1 * 0xCC9E2D51) & 0xFFFFFFFF
        k1 = rotl32(k1, 15)
        k1 = (k1 * 0x1B873593) & 0xFFFFFFFF
        h1 ^= k1
        if len(block) == 4:
            h1 = rotl32(h1, 13)
            h1 = (h1 * 5 + 0xE6546B64) & 0xFFFFFFFF
    h1 ^= length
    return fmix32(h1)


def recv_exact(sock: socket.socket, n: int) -> bytes:
    chunks: list[bytes] = []
    remaining = n
    while remaining > 0:
        chunk = sock.recv(remaining)
        if not chunk:
            break
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def exchange(host: str, port: int, payload: bytes, timeout: float) -> tuple[bytes, dict]:
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.settimeout(timeout)
        auth_code = recv_exact(sock, 4)
        if len(auth_code) != 4:
            raise RuntimeError(f"expected 4-byte auth code, got {len(auth_code)} bytes")
        auth_hash = murmurhash3_x86_32(auth_code)
        sock.sendall(struct.pack("<I", auth_hash))
        confirmation = recv_exact(sock, len(AUTH_CONFIRMATION))
        if confirmation != AUTH_CONFIRMATION:
            raise RuntimeError(f"unexpected auth confirmation: {confirmation!r}")
        sock.sendall(payload)
        chunks: list[bytes] = []
        while True:
            try:
                chunk = sock.recv(65535)
            except socket.timeout:
                break
            except ConnectionResetError:
                break
            if not chunk:
                break
            chunks.append(chunk)
        return b"".join(chunks), {
            "auth_code_hex": auth_code.hex(" "),
            "auth_hash_hex": struct.pack("<I", auth_hash).hex(" "),
            "auth_confirmation_hex": confirmation.hex(" "),
        }


def read_recipe(host: str, port: int, slot: int, timeout: float) -> dict:
    request = bytes([0x01, 0x00, slot & 0xFF])
    response, auth = exchange(host, port, request, timeout)
    return record("read_recipe", host, port, request, response, {"slot": slot, **auth})


def read_parameter(host: str, port: int, identifier: int, timeout: float) -> dict:
    request = bytes([0x02, 0x00, 0x01, identifier & 0xFF])
    response, auth = exchange(host, port, request, timeout)
    return record(
        "read_parameter",
        host,
        port,
        request,
        response,
        {
            "identifier": identifier,
            "name": PARAMETERS.get(identifier, f"param_{identifier}"),
            **auth,
        },
    )


def parameter_to_raw(identifier: int, value: bytes) -> bytes:
    if identifier < 0 or identifier > 255:
        raise ValueError("parameter identifier must be between 0 and 255")
    if len(value) > 16384:
        raise ValueError("parameter value is too large")
    if len(value) > 255:
        raise ValueError("large parameter values are not enabled yet")
    return bytes([0x02, 0x01, 0x01, identifier & 0xFF, len(value)]) + value


def send_parameter(host: str, port: int, identifier: int, value: bytes, timeout: float) -> dict:
    request = parameter_to_raw(identifier, value)
    response, auth = exchange(host, port, request, timeout)
    return record(
        "write_parameter",
        host,
        port,
        request,
        response,
        {
            "identifier": identifier,
            "name": PARAMETERS.get(identifier, f"param_{identifier}"),
            **auth,
        },
    )


def build_firmware_packet(action: str, page: bytes | None = None) -> bytes:
    if action == "request_firmware_upgrade":
        return bytes([0x04, 0x01])
    if action == "activate_firmware":
        return bytes([0x07, 0xAB, 0xCD, 0x77, 0x56])
    if action in ("upload_firmware_page", "check_firmware_page"):
        if page is None:
            raise ValueError("firmware page is required")
        if len(page) > 65535:
            raise ValueError("firmware page is too large")
        opcode = 0x05 if action == "upload_firmware_page" else 0x06
        return bytes([opcode, (len(page) >> 8) & 0xFF, len(page) & 0xFF]) + page
    raise ValueError(f"unknown firmware action: {action}")


def exchange_action(host: str, port: int, action: str, timeout: float = 2.0, page: bytes | None = None) -> dict:
    request = build_firmware_packet(action, page)
    response, auth = exchange(host, port, request, timeout)
    return record(action, host, port, request, response, auth)


def record(kind: str, host: str, port: int, request: bytes, response: bytes, extra: dict) -> dict:
    ascii_preview = ""
    try:
        ascii_preview = response.decode("ascii", errors="replace")
    except Exception:
        pass
    return {
        "kind": kind,
        "host": host,
        "port": port,
        "request_hex": request.hex(" "),
        "response_len": len(response),
        "response_hex": response.hex(" "),
        "response_ascii_preview": ascii_preview[:300],
        **extra,
    }


def probe_records(
    host: str,
    port: int,
    timeout: float = 2.0,
    slots: list[int] | None = None,
    params: list[int] | None = None,
    profile_key: str | None = None,
) -> list[dict]:
    profile = profile_for_key(profile_key) if profile_key else MACHINE_PROFILES["primary"]
    records: list[dict] = []
    param_ids = DEFAULT_PARAMS if params is None else params
    slot_ids = list(profile.slots) if slots is None else slots
    for identifier in param_ids:
        records.append(read_parameter(host, port, identifier, timeout))
    if profile.recipe_supported:
        for slot in slot_ids:
            records.append(read_recipe(host, port, slot, timeout))
    return records


def u16be(value: int) -> bytes:
    if value < 0 or value > 65535:
        raise ValueError(f"value out of u16 range: {value}")
    return bytes([(value >> 8) & 0xFF, value & 0xFF])


def recipe_full_name(recipe: dict) -> str:
    full_name = recipe.get("full_name")
    if full_name:
        return full_name
    name = recipe.get("name") or "Untitled"
    recipe_type = recipe.get("recipe_type")
    return f"{name}#{recipe_type}" if recipe_type else name


def build_recipe_packet(recipe: dict, slot: int) -> bytes:
    points = recipe.get("points") or []
    full_name = recipe_full_name(recipe).encode("ascii", errors="replace")
    if len(full_name) > 255:
        raise ValueError("recipe name is too long")

    timestamp = recipe.get("timestamp") or datetime.now().strftime("%y%m%d%H%M%S")
    timestamp = str(timestamp)[:12].ljust(12, "0").encode("ascii", errors="replace")

    packet = bytearray([0x01, 0x01, slot & 0xFF])
    packet += u16be(len(points))
    packet.append(len(full_name))
    packet += full_name
    packet += timestamp
    packet += u16be(int(round(recipe.get("volume_ml", 0))))
    packet += u16be(int(recipe.get("vessel_raw", 0)))
    packet += u16be(int(recipe.get("beverage_raw", 1)))

    for point in points:
        duration_ticks = int(round(point.get("time_ticks_100ms", point.get("duration_s", 0) * 10)))
        flow_raw = int(round(point.get("flow_raw", point.get("flow_ml_s", 0) * 10)))
        temp_k = point.get("temperature_k")
        if temp_k is None:
            temp_c = point.get("temperature_c")
            temp_k = 0 if temp_c is None else int(round(float(temp_c) + 273))
        phase_raw = int(point.get("phase_raw", 0))
        packet += u16be(duration_ticks)
        packet += u16be(flow_raw)
        packet += u16be(int(temp_k))
        packet += u16be(phase_raw)
    return bytes(packet)


def write_recipe(host: str, port: int, slot: int, recipe: dict, timeout: float = 2.0) -> dict:
    packet = build_recipe_packet(recipe, slot)
    response, auth = exchange(host, port, packet, timeout)
    return record("write_recipe", host, port, packet, response, {"slot": slot, **auth})


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only TONE local protocol probe.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--timeout", type=float, default=2.0)
    parser.add_argument("--out-dir", type=Path, default=Path("tone/snapshots"))
    parser.add_argument("--slots", type=int, nargs="*", default=DEFAULT_SLOTS)
    parser.add_argument("--params", type=int, nargs="*", default=DEFAULT_PARAMS)
    parser.add_argument("--discover", action="store_true", help="Run UDP discovery before probing.")
    args = parser.parse_args()

    if args.discover:
        print(json.dumps({"machines": discover_machines(args.timeout)}, ensure_ascii=False, indent=2))
        return 0

    args.out_dir.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    records = probe_records(args.host, args.port, args.timeout, args.slots, args.params)

    out = args.out_dir / f"tone-probe-{ts}.json"
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(out)
    for item in records:
        label = item.get("name", f"slot_{item.get('slot')}")
        print(f"{item['kind']} {label}: request={item['request_hex']} response_len={item['response_len']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
