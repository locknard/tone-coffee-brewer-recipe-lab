# TONE Development Notes

These notes capture implementation direction for the local HTTP and CLI layers. Personal machine observations, packet captures, and experimental JSON outputs should stay in ignored working directories such as `work/`, `tone/snapshots/`, or `dev_resources/network_observation/sessions/`.

## Connection Summary

- Discovery uses UDP port `60000`.
- The control/read channel uses TCP port `50000`.
- Slots are indexed as `0..3` in packets and shown as `1..4` in the CLI and UI.
- Connection, authentication, parameter, and recipe packet details are implemented in `tone/tone_probe.py`.
- Detailed compatibility references are kept outside the public repository unless the maintainer explicitly approves publishing them.

## Integration Direction

The first Home Assistant integration should be read-only:

- device online/offline
- discovered model/name/firmware when visible in the protocol
- recipe list and recipe parameters when they are returned without triggering an action

After the read-only protocol is stable, add a guarded service layer:

- `tone.load_recipe`
- `tone.set_recipe`
- `tone.start_brew`
- `tone.stop_brew`

Brewing control should require explicit confirmation in UI automations because it can heat water and dispense liquid.

## Scale And Recipe Telemetry

For scale integration, record brew telemetry and scale readings on the same clock. The useful output is a time series like:

```text
t_ms, target_flow_ml_s, actual_weight_g, actual_flow_g_s, cumulative_g, pulse_state
```

That lets the HTTP layer compare the recipe's intended flow or pulse curve against real mass over time.

## Write Validation

Use `tone/tone_cli.py render-packet` before any live write. For live validation, take a fresh backup, write only after explicit confirmation, then read the slot back and compare machine fields before treating the write as verified.
