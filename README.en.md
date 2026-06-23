# TONE Coffee Brewer Recipe Lab

[Simplified Chinese](README.md) | English

Unofficial local HTTP recipe manager and automation toolkit for TONE Coffee Brewer users.

This project provides a small, auditable local web UI and CLI for discovering TONE Coffee Brewers on a LAN, backing up recipe slots, editing recipes, writing guarded recipe updates, and preparing future Home Assistant and Bluetooth-scale automation workflows.

The project is community-maintained by TONE Coffee Brewer users and smart-home enthusiasts. It is not an official TONE product, cloud service, firmware updater, or replacement for the official mobile app.

## Why This Exists

TONE Coffee Brewers are capable machines, but advanced users often need workflows that are easier to script, inspect, back up, and combine with home automation. This repository focuses on those local-network workflows:

- Keep recipe data readable as JSON.
- Make every write explicit, reviewable, and backed up.
- Expose a lightweight HTTP API for local tools and future integrations.
- Provide a CLI that can be used by humans, scripts, or coding agents.
- Leave a clear path toward Home Assistant entities, Bluetooth-scale feedback, and extraction-curve experiments.

## Features

- LAN discovery for supported TONE Coffee Brewer profiles.
- Local web UI with recipe slot reading, recipe library management, and guarded writes.
- Chinese, English, and Japanese UI language switching.
- CLI for discovery, backup, slot export, recipe point edits, packet rendering, and slot writes.
- JSON recipe files that are easy to review and version.
- CSV curve export for recipe timing, flow, temperature, and phase analysis.
- Automatic pre-write backups.
- Post-write readback verification in the guarded write path.
- Safety checks for remote write-enabled server binds.
- Action registry for supported safe, guarded, and restricted operations.

## Current Status

The current implementation is useful for local recipe management and experimentation.

Verified:

- TCP control port: `50000`
- UDP discovery port: `60000`
- Verified profile: `primary`
- Writable recipe slots: `1-4`
- No-op slot write followed by readback verification

Implemented but still evolving:

- Additional machine profile discovery
- Parameter read/write helpers
- Recipe library workflow
- API shape for future automation

Not currently exposed as default UI actions:

- Brew start/stop controls
- Cleaning or service actions
- Firmware update actions

## Requirements

- Python 3.10 or newer
- A TONE Coffee Brewer reachable on the same LAN
- macOS, Linux, or another environment that can run Python standard-library HTTP servers
- No build step is required for the web UI

The app intentionally uses Python standard-library components for the server and static files for the frontend.

## Quick Start

Clone the repository and start the web UI in read-only mode:

```bash
git clone https://github.com/locknard/tone-coffee-brewer-recipe-lab.git
cd tone-coffee-brewer-recipe-lab
export TONE_HOST=<tone-host>
python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

Open:

```text
http://127.0.0.1:8765
```

You can also use the web UI discovery control to find machines on the LAN before selecting a target.

## Write-Enabled Mode

Writes are disabled by default. To enable recipe writes on localhost:

```bash
cd tone-coffee-brewer-recipe-lab
export TONE_HOST=<tone-host>
TONE_ENABLE_WRITES=1 python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

Every slot write still requires exact confirmation text:

```text
WRITE SLOT N
```

For example, writing slot 2 requires:

```text
WRITE SLOT 2
```

If you intentionally bind a write-enabled server to a non-loopback address, both safeguards are required:

```bash
export TONE_ALLOW_REMOTE_WRITES=1
export TONE_WRITE_TOKEN=<long-random-token>
```

Write requests must then send the token through:

```text
X-TONE-Write-Token: <long-random-token>
```

## Configuration

Common environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `TONE_HOST` | Target brewer host when not using discovery | `192.168.1.100` |
| `TONE_PORT` | TCP control port | `50000` |
| `TONE_PROFILE` | Machine profile key | `primary` |
| `TONE_ENABLE_WRITES` | Enable guarded write endpoints | unset |
| `TONE_WRITABLE_SLOTS` | Comma-separated slot labels allowed for writes | `1,2,3,4` |
| `TONE_ALLOW_REMOTE_WRITES` | Allow write-enabled non-loopback binds | unset |
| `TONE_WRITE_TOKEN` | Required token for remote write-enabled mode | unset |
| `TONE_DISCOVERY_BROADCASTS` | Comma-separated UDP broadcast targets | auto-detected |

See [.env.example](.env.example) for a compact reference.

## CLI Examples

Discover machines:

```bash
python3 tone/tone_cli.py discover
```

Show supported profiles and registered actions:

```bash
python3 tone/tone_cli.py capabilities
```

Create a backup:

```bash
python3 tone/tone_cli.py backup --host <tone-host>
```

Read one recipe slot into editable JSON:

```bash
python3 tone/tone_cli.py read-slot --host <tone-host> --slot 4 --out work/slot4.json
```

Patch one recipe point and recompute totals:

```bash
python3 tone/tone_cli.py set-point \
  --recipe-json work/slot4.json \
  --point 3 \
  --duration-s 8.0 \
  --flow-ml-s 4.2 \
  --temperature-c 93 \
  --phase extraction \
  --out work/slot4.next.json
```

Render the TCP write packet without sending it:

```bash
python3 tone/tone_cli.py render-packet --slot 4 --recipe-json work/slot4.next.json
```

Write a recipe to a slot after an explicit backup and confirmation:

```bash
python3 tone/tone_cli.py write-slot \
  --host <tone-host> \
  --slot 4 \
  --recipe-json work/slot4.next.json \
  --confirm "WRITE SLOT 4" \
  --enable-write
```

Export a recipe curve as CSV:

```bash
python3 tone/tone_cli.py export-curve --recipe-json work/slot4.next.json --out work/slot4.next.csv
```

## Safety Model

The project is designed to make read operations easy and write operations deliberate.

- Discovery and reads are safe by default.
- HTTP writes require `TONE_ENABLE_WRITES=1`.
- CLI writes require `--enable-write` or `TONE_ENABLE_WRITES=1`.
- Every write requires exact confirmation text matching the target.
- Every recipe slot write creates a fresh backup before sending data.
- Remote write-enabled server binds require both `TONE_ALLOW_REMOTE_WRITES=1` and `TONE_WRITE_TOKEN`.
- Firmware packet families are documented in the action registry but are not exposed as default UI actions.

Use this tool only with machines you own or are authorized to administer. Keep write-enabled servers on trusted local networks.

## Project Layout

```text
tone/
  tone_cli.py          CLI commands for discovery, backup, recipe editing, and writes
  tone_probe.py        Local connection helpers, machine profiles, action registry
  parse_tone_probe.py  Recipe and parameter parsing helpers

tone_manager/
  server.py            Standard-library HTTP server and API
  static/              Web UI assets
  data/                Local SQLite state, ignored by git except .gitkeep

docs/
  cli.md               CLI reference
  protocol.md          Local connection notes
  public_release_checklist.md

dev_resources/
  network_observation/ Optional local helper scripts, without captured sessions
```

## Development

Run the focused tests:

```bash
python3 -m unittest tests/test_library_write.py tests/test_library_rename.py
```

Check Python syntax:

```bash
python3 -m py_compile tone/tone_probe.py tone/tone_cli.py tone/parse_tone_probe.py tone_manager/server.py
```

Check the frontend script:

```bash
node --check tone_manager/static/app.js
```

Start the local app:

```bash
python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

## Roadmap

- More complete machine status reads, including selected slot and automation-friendly runtime state.
- Home Assistant integration with entities, recipe sync, and controlled workflow triggers.
- Bluetooth-scale integration for extraction mass, time, and flow feedback.
- Recipe import/export and shareable recipe bundles.
- More community-maintained recipe templates for different beans, roast levels, and extraction goals.
- Additional verified machine samples for profile compatibility.

## Documentation

- [CLI Guide](docs/cli.md)
- [Local Connection Notes](docs/protocol.md)
- [Public Release Checklist](docs/public_release_checklist.md)

## Contributing

Issues and pull requests are welcome, especially for:

- Verified machine profile reports
- Safer recipe-editing workflows
- Home Assistant integration design
- Scale data and extraction-curve experiments
- Documentation improvements for TONE Coffee Brewer users

Please keep public contributions free of private packet captures, access tokens, serial numbers, personal network details, and other local-only data.

## License

Apache License 2.0. See [LICENSE](LICENSE).
