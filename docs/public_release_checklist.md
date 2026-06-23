# Public Release Checklist

Use this checklist before creating the first public GitHub repository.

## Include

- `README.md`
- `README.en.md`
- `tone/`
- `tone_manager/`
- `docs/`
- `dev_resources/network_observation/` helper scripts, without captured sessions
- `.env.example`
- `.gitignore`
- `LICENSE`

## Exclude

The `.gitignore` is configured so these local artifacts stay out of the repository:

- `work/`
- `tone/snapshots/` except `.gitkeep`
- `tone_manager/data/` except `.gitkeep`
- `.env`
- `PRODUCT.md`
- `DESIGN.md`
- packet capture sessions under `dev_resources/network_observation/sessions/`
- internal compatibility references under `dev_resources/reference_materials/`
- logs, packet captures, and generated Python bytecode

## Before Publishing

- Confirm public wording is clear about unofficial enthusiast maintenance and repository ownership.
- Run `git status --ignored` after `git init` and before the first commit.
- Run `python3 -m py_compile tone/tone_probe.py tone/tone_cli.py tone/parse_tone_probe.py tone_manager/server.py`.
- Run `node --check tone_manager/static/app.js`.
- Start the HTTP server in read-only mode and verify discovery/current-slot reads.
- Verify long-running UI actions show visible progress, disable duplicate actions, and report completion or failure.
- Confirm the HTTP server is bound to localhost, or remote write mode requires both the opt-in env flag and token.
- Start write mode only on a trusted local network, write to a non-critical slot, and confirm readback verification.
