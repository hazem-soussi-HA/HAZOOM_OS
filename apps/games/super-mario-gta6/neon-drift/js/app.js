/*
  NEON DRIFT — SKY RACER
  Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
  Creator: Hazem Soussi (hazem.soussi@gmail.com)
  "attention is all you need"
  This game is part of HAZOOM OS.

  Build system: python3 build.py → index.html
  Modular architecture: JS split across engine/, entities/, world/, render/, ui/, systems/
*/
(function() {
  "use strict";

  // ═══════════════════════════════════════════════════════════════
  // MODULES INJECTED BY BUILD SYSTEM
  // ═══════════════════════════════════════════════════════════════

  /* __MODULES__ */

  // ═══════════════════════════════════════════════════════════════
  // ENTRY POINT
  // ═══════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => Game.init());
})();
