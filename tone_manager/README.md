# TONE Coffee Brewer Recipe Lab

Unofficial local HTTP recipe manager for TONE Coffee Brewer machines, maintained as an enthusiast project for recipe editing, guarded writes, Home Assistant-friendly automation, and coffee workflow experiments. This app is kept intentionally small so it can be audited, extended, and adapted for community workflows.

## Run Locally

Read-only mode:

```bash
python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

Open:

```text
http://127.0.0.1:8765
```

The top bar can discover TONE Coffee Brewers on the LAN, preserve their profile, and switch the active target before reading or backing up recipes.

The UI supports Chinese, English, and Japanese. The selected interface language is stored locally in the browser.

Long-running network actions such as discovery, refresh, machine switching, parameter reads, backups, and library saves use a shared operation status strip with elapsed time, stage copy, progress feedback, duplicate-action protection, and failure feedback.

Saved library recipes can be written directly to a selected target slot from the Library panel. This uses the same guarded path as the main write panel: exact confirmation text, a fresh pre-write backup, and readback verification.

Write-enabled mode:

```bash
TONE_ENABLE_WRITES=1 python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

The server binds to `127.0.0.1` by default. If you intentionally bind a write-enabled server to a non-loopback address, set both `TONE_ALLOW_REMOTE_WRITES=1` and `TONE_WRITE_TOKEN`; write requests must include that value as `X-TONE-Write-Token`.

The write API still requires confirmation text:

```text
WRITE SLOT N
```

## Safety Defaults

- Writes are disabled unless `TONE_ENABLE_WRITES=1`.
- Write-enabled remote binds are refused unless `TONE_ALLOW_REMOTE_WRITES=1` and `TONE_WRITE_TOKEN` are set.
- Slots 1-4 are writable by default after writes are explicitly enabled.
- The confirmation text must match the selected slot, such as `WRITE SLOT 3`.
- Every write creates a fresh machine backup first.
- Parameter writes require `WRITE PARAM <identifier>`.
- Firmware-related packets are registered but not exposed as default UI actions.

## Verified Capabilities

- TCP port: `50000`
- Verified profile: `primary`
- Additional profile: `alternate`
- Writable slots: `1-4`
- No-op slot write and readback verification are supported by the guarded write path.

## Deployment Note

The app is a plain Python standard-library HTTP server plus static files. It can be copied to an internal host and run under `launchd`, `systemd`, `pm2`, or a small proxy once SSH access is available.
