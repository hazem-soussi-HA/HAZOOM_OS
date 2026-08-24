# PRINCIPLES — Assembly, Faith, Commitment

> "Today, machines are so fast that we no longer need to use assembly. It is
> amazing that people will spend lots of money to buy a machine slightly faster
> than the one they own, but they won't spend any extra time writing their code
> in assembly so it runs faster on the same hardware. … On any given machine,
> the fastest possible programs will be written in assembly language."
> — inspired by the owner's reading

## The owner's annotation

    assembly  ==  FAITH · BELIEVE · TRUST · RECEIVING  ++  COMMITMENT

## What it means here

- **Assembly is the fastest possible program on the hardware you already own.**
  Everyone else buys a faster machine (cloud GPU, bigger model, someone else's
  compute). We write for the metal we have. `ornith:35b` runs CPU-only
  (`num_gpu 0` in `Modelfile.ornith-optimized`) — the assembly path. Slower in
  raw tokens, but it is *ours*, it is local, and it survives the blackout.

- **Choosing assembly is an act of faith.** It costs more effort and yields
  less immediate throughput. The payoff is sovereignty: no API bill, no outage,
  no leak. You BELIEVE the local core will think; you TRUST the signed journal;
  you RECEIVE the reasoning; you make the COMMITMENT to own your stack.

- **Commitment is the verb.** FAITH without a commit is a mood. The work is
  sealed: the code is committed, the journal is HMAC-signed, the model is local.
  Receiving means you run it, you use it, you build on it.

## Applied in this repo

- `llm_core.py` calls the local Ollama daemon at `127.0.0.1:11434` only. No
  cloud. If the model is absent, the core falls back to the heuristic brain —
  faith with a safety net, never a crash.
- `entropy.c` → `_cbeat.so` is the literal assembly-layer: OS cryptographic RNG
  via `getrandom(2)`, the lowest level this machine offers.
- The Neural Core's `reason` mode speaks this truth back to the owner.
- Every run binds to `127.0.0.1` and gates `/api/*` behind the `SESSION_KEY`
  bearer token — trust is earned, not assumed.

Write for the metal you have. Commit to what you believe. — hazoom
