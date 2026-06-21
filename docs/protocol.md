# TONE Coffee Brewer Local Connection Notes

These notes document the current unofficial local HTTP workflow for TONE Coffee Brewer enthusiast review and collaboration. The code keeps connection handling in `tone/tone_probe.py` so the HTTP UI and CLI use the same packet logic.

## Discovery

- UDP port: `60000`
- Verified discovery payload: `ff ff 54 6f 6e 65 30 33`
- Additional discovery payloads are represented by machine profiles in `tone/tone_probe.py`.
- Discovery responses come from the machine IP on UDP port `60000`.
- Current discovery helper: `discover_machines()`

The discovery result includes `profile_key`, `model`, `recipe_supported`, and `verified`. The local machine is assigned to the `primary` profile. Additional payloads are wired into discovery and parameter reads, with recipe converter verification pending a real device sample.

## TCP Session

- TCP port: `50000`
- On connect, the brewer sends a 4-byte auth code.
- The client computes MurmurHash3 x86_32 with seed `420`.
- The client sends the little-endian 4-byte hash.
- The brewer confirms with a fixed 6-byte response.

## Reads

Read recipe request:

```text
01 00 <slot>
```

Slot indexes are `0..3` internally. CLI and UI present them as `1..4`.

Read parameter request:

```text
02 00 01 <identifier>
```

Useful parameter identifiers observed so far:

- `0`: firmware version
- `2`: name
- `3`: location
- `4`: set
- `5`: serial number
- `12`: temperature control
- `16`: bootloader version
- `21`: live value
- `27`: basket locking available

Parameter writes use:

```text
02 01 <count> <identifier> <size> <value>
```

The CLI/API expose low-level parameter writes behind explicit confirmation.

## Recipe Payload

Read recipe responses start with two response bytes; recipe parsing skips those two bytes.

Payload fields:

- `number`: 1 byte
- `point_count`: 2-byte big-endian
- `name_length`: 1 byte
- `name`: ASCII, often `name#recipeType`
- `timestamp`: 12 ASCII chars
- `target_volume_ml`: 2-byte big-endian
- `vessel`: 2-byte big-endian (`0=none`, `1=flat`, `2=v`)
- `beverage`: 2-byte big-endian (`1=coffee`, `2=tea`)
- points, 8 bytes each:
  - duration in 100 ms ticks
  - flow in 0.1 ml/s
  - temperature in Kelvin, with UI conversion `C = K - 273`
  - phase (`0=none`, `1=bloom`, `2=turbulence`, `3=extraction`)

## Writes

Write recipe request:

```text
01 01 <slot> <recipe-payload-without-read-response-prefix>
```

The packet builder in `tone/tone_probe.py` was verified against the existing slot 4 recipe representation. A no-op write to slot 4 was then sent and read back successfully. The slot byte is the only slot-specific field, so slots 1-4 use the same write mechanism.

Current guardrails:

- Writes require `TONE_ENABLE_WRITES=1` in the HTTP server or `--enable-write` in the CLI.
- Slots 1-4 are writable by default once writes are enabled.
- Confirmation text must match the target, such as `WRITE SLOT 1` or `WRITE SLOT 4`.
- A fresh backup is taken before sending a write packet.

## Action Registry

The code registers the packet families currently represented in the HTTP/CLI layer:

- `discover`: UDP discovery
- `read_parameter`: safe
- `write_parameter`: guarded
- `read_recipe`: safe
- `write_recipe`: guarded
- `request_firmware_upgrade`: restricted, packet `04 01`
- `upload_firmware_page`: restricted, packet `05 <len_hi> <len_lo> <page>`
- `check_firmware_page`: restricted, packet `06 <len_hi> <len_lo> <page>`
- `activate_firmware`: restricted, packet `07 ab cd 77 56`

Firmware packets are documented and buildable at the protocol layer, but not exposed as default UI actions.
