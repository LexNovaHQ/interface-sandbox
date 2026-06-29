# Deployment Notes

This file records backend deployment trigger notes for the artifact backend.

## 2026-06-30

Triggered deployment after public runner hardening patches:

- async worker executes in-process instead of public self-callback by default
- queued-but-not-started runs can be re-dispatched
- public root redirects to Interface Diligence Engine
- public UI exposes safe runner diagnostics
