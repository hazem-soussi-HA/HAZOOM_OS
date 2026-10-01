# HAZOOM OS — Ethical Terms of Use

These terms are not decoration. They describe how this system is actually
built, and the build is what makes them true.

---

## 1. The one commitment

**HAZOOM OS is local-first. Your data, your machine, your models.**

- No account is required to use the core system.
- No telemetry, no analytics, no usage tracking, no crash reporting to anyone.
- The intelligence runs on local models (Ollama) on your own hardware.
- The system is designed to function with the network cable pulled.

This is not a roadmap item. It is the architecture, and it is verified rather
than asserted: the secure outbound fetcher refuses every private and reserved
address, refuses every protocol but http/https, re-validates every redirect
hop, and never forwards a cookie. The app registry resolves entirely to
loopback. `GET /api/surface` reports any app that points off-machine.

## 2. Why it is built this way

An operating system that phones home is not private, however good its
intentions. A model that runs on a server is not yours. A browser that can
reach your loopback interface on the user's behalf is a security liability
wearing the costume of a feature.

So HAZOOM OS draws a hard line:

```
open to the entire public internet
zero reach into the machine it runs on
```

The consequence is that some genuinely useful things are deliberately not
offered: remote control, silent sync, server-side inference, telemetry-backed
telemetry. Those are refused on purpose.

## 3. The contract comes before the machine

`CONTRACT.md` is hash-verified at boot by `scripts/contract-check.sh`. The
guard runs before the kernel initialises, not after. A system whose law is
checked after it has already acted is not governed by that law.

## 4. Prohibited uses

The following are refused, and this project will not help with them:

- Surveillance, monitoring, or tracking of any person without their informed
  and documented consent.
- Covert recording of audio, video, keyboard input, or screen.
- Any deployment that removes or weakens the loopback boundary described
  above in order to expose a machine to a network it was not built for.
- Using the local model runtime to generate material that harms a specific
  identifiable person: targeted harassment, non-consensual intimate imagery,
  defamatory content presented as fact.
- Removing or forking the authorship and licence notices from this source.

## 5. Attribution

Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.

This repository is proprietary. See `LICENSE`. If you fork it, keep the
notice. Attribution is not legally required by this document; it is requested,
because the work is someone's life and the record should stay accurate.

Third-party components keep their own licences and are listed in
`package.json` and the lockfile. Nothing vendored here is relicensed.

## 6. Separate works

HAZOOM XP (`maze-ship`) is a **GPL-3.0-only** work and is deliberately *not*
copied into this repository. It is executed alongside the OS, with its licence
and source intact. The reasoning is recorded in `docs/MIGRATION-XP.md`, and
the short version is that copying GPL code into a proprietary repository would
have made the OS a GPL derivative — licensing the kernel, the services and the
storefront away.

That separation is a decision, recorded and reversible. It is also the reason
both works survived.

---

*Verify everything. The system is designed so that you can.*
