# Cadre — Umbrella Naming Decision

**Date:** 2026-03-30
**Status:** Design approved

## Decision

**Cadre** is the umbrella name for the ecosystem of apps and infrastructure. It sits above all individual apps — Apex (workout logging), the weight tracker, the dashboard, the cloud API, and any future projects beyond health.

## Name: Cadre

**Meaning:** A small, elite, trained core group — the nucleus that builds and leads a larger force. Military origin (French → Latin *quadrum*), used across military and organizational contexts for the highly capable inner circle.

**Why it fits:**
- Quiet authority — institutional without being aggressive
- Elite performance connotation without being loud about it
- Scales beyond fitness — the umbrella for everything, not just health apps
- Short, sharp, two syllables — works as a brand, org name, package scope, directory name
- The apps are the cadre: a small, disciplined set of tools that each do one thing well

**Vibe:** Calm confidence. Delta Force energy. The kind of name that sounds like it's been around forever and doesn't need to explain itself.

## Relationship to Existing Apps

- **Cadre** is the umbrella / command structure
- **Apex** remains the workout logging app — unchanged, keeps its name and identity
- Future apps (weight tracker, dashboard, etc.) are peers under Cadre, not sub-brands of Apex
- The shared package, cloud API, and infrastructure all live under the Cadre umbrella

## Practical Usage

| Context | Example |
|---------|---------|
| GitHub org or namespace | `cadre/apex`, `cadre/weight`, `cadre/api` |
| npm package scope | `@cadre/shared`, `@cadre/sync-client` |
| Directory structure | `projects/cadre/apex/`, `projects/cadre/weight/` |
| Cloud API | `cadre-api` or `cadre-health-api` |
| Dashboard | Cadre Dashboard |

## What This Changes

The health ecosystem design (`2026-03-22-health-ecosystem-design.md`) previously left names as TBD. This decision resolves that:

- The shared package → `@cadre/shared` (or similar)
- The cloud API Worker → lives under the Cadre umbrella
- The weight app → own name TBD, under Cadre
- The dashboard → Cadre Dashboard (or own name TBD)

Individual app names (beyond Apex) will be decided when each is brainstormed and built.
