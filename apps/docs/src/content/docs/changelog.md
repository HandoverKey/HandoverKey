---
title: Changelog
description: Release history for HandoverKey.
head: []
---

Full release history. Each version links to its diff on GitHub.

## [1.4.3](https://github.com/HandoverKey/HandoverKey/compare/v1.4.2...v1.4.3) — 2026-07-08

### Bug Fixes
- **ci:** sync lock file and fix prettier formatting

## [1.4.2](https://github.com/HandoverKey/HandoverKey/compare/v1.4.1...v1.4.2) — 2026-07-08

### Bug Fixes
- **deploy:** apply DB migrations on API container startup

## [1.4.1](https://github.com/HandoverKey/HandoverKey/compare/v1.4.0...v1.4.1) — 2026-07-05

### Bug Fixes
- Harden auth flows and fix handover, crypto, and inactivity bugs

## [1.4.0](https://github.com/HandoverKey/HandoverKey/compare/v1.3.0...v1.4.0) — 2026-06-27

### Features
- **web:** redesign landing page — warm, trustworthy, illustration-driven
- **web:** richer landing page explainer and brand icons

## [1.3.0](https://github.com/HandoverKey/HandoverKey/compare/v1.2.0...v1.3.0) — 2026-06-12

### Features
- Trust UX and accessibility improvements

### Bug Fixes
- Close critical zero-knowledge and dead man's switch trust gaps
- Consolidate migrations and make horizontal scaling safe
- Harden sessions, refresh tokens, and pause limits

## [1.2.0](https://github.com/HandoverKey/HandoverKey/compare/v1.1.3...v1.2.0) — 2026-05-02

### Features
- Add pricing, waitlist, Stripe billing, and tier-based gating
- UI polish and accessibility improvements
- **web:** dark mode, skeleton loaders, and accessibility

## [1.1.3](https://github.com/HandoverKey/HandoverKey/compare/v1.1.2...v1.1.3) — 2026-04-20

### Bug Fixes
- Admin panel nav visibility, audit trail, and activity display
- Resolve Redis initialisation race condition on startup

## [1.1.2](https://github.com/HandoverKey/HandoverKey/compare/v1.1.1...v1.1.2) — 2026-04-20

### Bug Fixes
- Exclude release-please files from Prettier checks

## [1.1.1](https://github.com/HandoverKey/HandoverKey/compare/v1.1.0...v1.1.1) — 2026-04-20

### Bug Fixes
- Auto-include www variant in CORS allowed origins
