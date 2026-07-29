# Contributing to SUPER MARIO GTA6

Thank you for your interest in contributing to this project.
This document explains the workflow, the legal agreement you make
by contributing, and the standard the project tries to maintain.

---

## 1. Quick Start

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/<your-username>/mario_gta6.git
cd mario_gta6

# 3. Create a feature branch
git checkout -b feature/my-amazing-thing

# 4. Make your changes
#    ... edit code ...

# 5. Run the existing tests
python3 tests/test_physics.py

# 6. Commit with a sign-off (see § 4 below)
git add -A
git commit -s -m "feat: my amazing thing

A longer description of what changed and why.

Signed-off-by: Your Name <your.email@example.com>"

# 7. Push and open a Pull Request
git push origin feature/my-amazing-thing
```

---

## 2. Code Style

The project follows a "nano engine" philosophy: tight, readable
code over heavy abstractions. When in doubt, match the file you
are editing.

  • **Python** (`mario_gta6_2d.py`) — compact, single-file, no
    external dependencies beyond pygame. Keep functions short.
    Use the existing procedural sprite / surface pattern.
  • **JavaScript** (`website/js/*`) — vanilla ES5+ so the build
    output works in older browsers. No transpilation step.
    Each module exposes globals on `window`, not ES module
    imports, so the build concatenator stays trivial.
  • **HTML / CSS** — single inline `<style>` in
    `website/index.html`, hand-tuned for the dark theme.

---

## 3. License

The project's source code is licensed under the **MIT License**.
See `LICENSE` for the full text. By contributing, you agree that
your contribution will be licensed under the same MIT terms.

The MIT license applies to **code only**. Trademarks, character
names, and other IP referenced in the project are governed by
`TRADEMARKS.md` and remain the property of their respective
owners. Do not introduce any copied assets from Nintendo®,
Rockstar®, or any other third party.

---

## 4. Developer Certificate of Origin (DCO)

This project uses the **Developer Certificate of Origin (DCO)**
sign-off process, the same model used by the Linux kernel and
many other major open-source projects. It is a lightweight
alternative to a full Contributor License Agreement (CLA) and
achieves the same legal goal: certifying that you have the
right to submit the code you are contributing.

### How to Sign Off

Every commit you contribute **must** include a `Signed-off-by`
line in the commit message. The line must match the name and
email you use on your commits.

```text
Signed-off-by: Your Name <your.email@example.com>
```

### Using the `-s` Flag

The easiest way to add a sign-off line is the `-s` (or
`--signoff`) flag when committing:

```bash
git commit -s -m "fix: correct footstep cadence"
```

Git will automatically append the sign-off line based on your
configured `user.name` and `user.email`. **Make sure these are
set to the name and email you want associated with your
contribution before you commit.**

### What the Sign-Off Means

By adding a `Signed-off-by` line, you certify, per the
[Developer Certificate of Origin 1.1](https://developercertificate.org/),
that:

> (a) The contribution was created in whole or in part by me
>     and I have the right to submit it under the open source
>     license indicated in the file; or
>
> (b) The contribution is based upon previous work that, to
>     the best of my knowledge, is covered under an
>     appropriate open source license and I have the right
>     under that license to submit that work with
>     modifications, whether created in whole or in part by
>     me, under the same open source license (unless I am
>     permitted to submit under a different license), as
>     indicated in the file; or
>
> (c) The contribution was provided directly to me by some
>     other person who certified (a), (b), or (c) and I have
>     not modified it.
>
> (d) I understand and agree that this project and the
>     contribution are public and that a record of the
>     contribution (including all personal information I
>     submit with it, including my sign-off) is maintained
>     indefinitely and may be redistributed consistent with
>     this project or the open source license(s) involved.

This is a serious legal statement. Do not sign off on a commit
unless you have the right to make the certification above.

### If You Forget to Sign Off

If a commit lands without a sign-off, you can amend it before
your pull request is merged:

```bash
git commit --amend --signoff --no-edit
git push --force-with-lease
```

---

## 5. Pull Request Checklist

Before opening a PR, please make sure:

  - [ ] Code matches the existing style of the file you edited
  - [ ] `python3 tests/test_physics.py` still passes
  - [ ] You have run the game in your browser / pygame and
        visually confirmed nothing is broken
  - [ ] Your commit message describes **what** and **why**,
        not just what
  - [ ] Every commit is signed off (`git log --format='%B' |
        grep 'Signed-off-by'`)
  - [ ] You have **not** introduced any copied asset from a
        third-party IP holder. All sprites must be
        procedurally drawn, all sounds must be procedurally
        generated, all music must be procedural

---

## 6. What We Are Looking For

  • Bug fixes and physics tweaks
  • Performance improvements to the renderer
  • New level layouts for the built-in `LVL` parser
  • Improvements to the HUD, particle system, or reward
    system
  • New procedurally-generated enemy types
  • Documentation and translation work
  • Accessibility improvements (colorblind modes,
    larger-text HUD toggle, etc.)
  • Legal-hygiene improvements to `LICENSE`,
    `TRADEMARKS.md`, and `NOTICE_TO_IP_HOLDERS.md`

---

## 7. What We Are Not Looking For

  • Anything that requires a copied Nintendo® or Rockstar®
    asset (sprite, sound, music, or model)
  • Code that bypasses the takedown-friendly structure of
    the project (e.g. hardcoding references that would make
    a future rename painful)
  • Marketing claims that misrepresent the project's
    relationship with any IP holder — see
    `PRE_PARTNERSHIP_STATEMENT.md` for the correct framing
  • Pull requests that bundle many unrelated changes into
    one commit

---

## 8. Code of Conduct

Participation in this project is governed by `CODE_OF_CONDUCT.md`.
Please read it before opening your first issue or PR.

---

## 9. Questions?

Open a GitHub issue with the `[QUESTION]` tag, or check the
existing `AUDIT_REPORT.md` for a detailed technical breakdown of
the current state and roadmap.

> *Thanks for considering a contribution. Every PR — even a
> typo fix — is appreciated.*
