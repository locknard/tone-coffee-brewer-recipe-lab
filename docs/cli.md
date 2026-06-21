# CLI Guide

The CLI exists so later automation can read machine state, prepare recipe JSON changes, render or inspect packets, and apply a supported slot update after explicit confirmation. Commands use human slot labels `1..4`. Replace `<tone-host>` with a discovered machine address, or export `TONE_HOST` before running commands.

## Discover

```bash
cd /path/to/tone
python3 tone/tone_cli.py discover
```

Expected shape:

```json
{
  "machines": [
    {
      "host": "192.168.1.100",
      "port": 50000,
      "discovery_port": 60000,
      "profile_key": "primary",
      "model": "TONE",
      "verified": true
    }
  ]
}
```

## Capabilities

```bash
python3 tone/tone_cli.py capabilities
```

This prints supported machine profiles (`primary`, `alternate`, `unknown`) and the action registry currently represented in the HTTP/CLI layer.

## Backup

```bash
python3 tone/tone_cli.py backup --host <tone-host>
```

This writes probe JSON and parsed recipe JSON under `tone/snapshots/`.

Use a different profile when needed:

```bash
python3 tone/tone_cli.py backup --host <tone-host> --profile alternate
```

## Parameters

Read one parameter:

```bash
python3 tone/tone_cli.py read-param --host <tone-host> --identifier 21
```

Write one parameter from a hex value:

```bash
python3 tone/tone_cli.py write-param \
  --host <tone-host> \
  --identifier 2 \
  --value-hex "54 4f 4e 45" \
  --confirm "WRITE PARAM 2" \
  --enable-write
```

## Read And Edit A Slot

```bash
python3 tone/tone_cli.py read-slot --host <tone-host> --slot 4 --out work/slot4.json
```

Patch one point:

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

Export a curve CSV:

```bash
python3 tone/tone_cli.py export-curve --recipe-json work/slot4.next.json --out work/slot4.next.csv
```

Render a packet without writing:

```bash
python3 tone/tone_cli.py render-packet --slot 4 --recipe-json work/slot4.next.json
```

## Write A Slot

```bash
python3 tone/tone_cli.py write-slot \
  --host <tone-host> \
  --slot 4 \
  --recipe-json work/slot4.next.json \
  --confirm "WRITE SLOT 4" \
  --enable-write
```

The command takes a fresh backup before the write. The confirmation text must match the target slot, for example `WRITE SLOT 1`, `WRITE SLOT 2`, `WRITE SLOT 3`, or `WRITE SLOT 4`.

## Suggested Automation Loop

1. `read-slot` exports the target slot recipe JSON.
2. A model proposes small point-level changes against that JSON.
3. `set-point` or direct JSON editing creates the next candidate.
4. `render-packet` verifies packet shape without touching the machine.
5. `write-slot` updates the chosen slot after explicit confirmation.
6. A later Home Assistant/scale integration records actual extraction mass over time.
