#!/usr/bin/env python3
import argparse
import collections
import subprocess
import sys
from pathlib import Path


def run_observer(args: list[str]) -> str:
    proc = subprocess.run(
        ["tcpdump", *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode not in (0,):
        sys.stderr.write(proc.stderr)
    return proc.stdout


def packet_lines(session_file: Path) -> list[str]:
    out = run_observer(["-nn", "-tttt", "-r", str(session_file)])
    return [line for line in out.splitlines() if line.strip()]


def summarize(lines: list[str]) -> None:
    by_pair: collections.Counter[str] = collections.Counter()
    ports: collections.Counter[str] = collections.Counter()
    for line in lines:
        if " IP " not in line or " > " not in line:
            continue
        rest = line.split(" IP ", 1)[1]
        pair = rest.split(":", 1)[0]
        by_pair[pair] += 1
        for side in pair.split(" > "):
            parts = side.rsplit(".", 1)
            if len(parts) == 2 and parts[1].isdigit():
                ports[parts[1]] += 1

    print(f"packets: {len(lines)}")
    print("\nflows:")
    for pair, count in by_pair.most_common():
        print(f"  {count:5d}  {pair}")

    print("\nports:")
    for port, count in ports.most_common():
        print(f"  {count:5d}  {port}")


def print_payload_preview(session_file: Path, limit: int) -> None:
    print("\npayload preview:")
    print(
        run_observer(
            ["-nn", "-tttt", "-A", "-X", "-r", str(session_file), "tcp and greater 0"]
        )[:limit]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize a TONE local observation session.")
    parser.add_argument("session_file", type=Path)
    parser.add_argument("--hex-bytes", type=int, default=12000)
    args = parser.parse_args()

    lines = packet_lines(args.session_file)
    summarize(lines)
    print_payload_preview(args.session_file, args.hex_bytes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
