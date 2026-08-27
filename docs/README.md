# Documentation Index

This folder contains the source markdown files for HandoverKey's documentation,
published at **[docs.handoverkey.app](https://docs.handoverkey.app)** via the
`apps/docs` Starlight site.

## Contents

- [`api.md`](api.md) — HTTP API contract and authentication model
- [`architecture.md`](architecture.md) — runtime topology and package boundaries
- [`deployment.md`](deployment.md) — local, container, and hosted deployment
- [`security.md`](security.md) — implemented security model and limitations
- [`testing.md`](testing.md) — test strategy and coverage expectations
- [`openapi.yaml`](openapi.yaml) — OpenAPI spec

## Contributing to docs

If you change an endpoint, auth behaviour, deployment requirement, or environment
variable, update the matching document here in the same pull request.

The `apps/docs` Starlight site pulls its content from
`apps/docs/src/content/docs/` — edit those files directly for the published site.
The markdown files in this folder serve as the canonical source of truth for contributors.
