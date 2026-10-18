# Voting companion

Source for the mobile voting page, shared voting API, and screen design preview.

See [the main project README](../README.md) for rules, status, installation, and validation.

This copy has no existing Site identity. Use the Sites skill for registration, dependency setup, source synchronisation, migration application, and publication. The `DB` D1 binding and the included generated migration are required. The hosting starter's helper scripts select a managed or portable execution profile; the ignored `.sites-runtime/` stores that local choice.

The retained Vinext starter documentation is available at https://github.com/cloudflare/vinext. For the current private pilot, the hosted Sites source remains separate from this repository.

With Node 24 and installed dependencies, run `node --test test/game.test.mjs`, `pnpm exec tsc --noEmit`, and `pnpm run build` from this directory. SVG/PNG assets can be regenerated with `node scripts/create-art.mjs`.
