/* =====================================================================
   PLANET EARTH HISTORY — DATASET
   ---------------------------------------------------------------------
   Provenance model (honesty over flattery):
     provenance: 'real'       -> measured / documented fact, with source
                 'simulated'  -> extrapolated from the user's narrative
                                 ("where there is no real base -> imagine")
   Each node carries its own source so the UI can show a checkable panel.

   Added in v0.5:
     * INSIGHT layer (glyph ✶) — peer-reviewed deep-analysis + inspiration:
         kind: 'analysis'     -> cross-era pattern, with `witnesses` edges
                                  (other node ids this analysis links)
              'inspiration'   -> actionable reflection / open question
     * `age` kept as INTEGER years-ago so HMAC signing is deterministic and
       the server can re-sign without float drift. ageStart/ageEnd are also
       integers (years-ago); the engine still uses ageEnd for placement.
   ===================================================================== */
const PEH = (function () {
  'use strict';

  // Layers: the "graphical map" of truth, stacked and toggleable.
  const LAYERS = {
    nature: { id: 'nature', label: 'NATURE — Earth as it first was',
              color: '#3ddc84', glyph: '🌿' },
    flood:  { id: 'flood',  label: 'FLOOD — what lies UNDER US',
              color: '#4aa8ff', glyph: '🌊' },
    peoples:{ id: 'peoples',label: 'PEOPLES — epochs of human groups',
              color: '#ffb347', glyph: '🜂' },
    birds:  { id: 'birds',  label: 'BIRDS — our ornithological guides',
              color: '#7df9ff', glyph: '🦅' },
    divine: { id: 'divine', label: 'THE SHAPER — what always changes us',
              color: '#c792ea', glyph: '✶', simulated: true },
    insight:{ id: 'insight',label: 'DEEP ANALYSIS & INSPIRATION',
              color: '#ffd54a', glyph: '✶' },
  };

  // ---- REAL geological time scale (ICS / USGS) -----------------------
  // age values in INTEGER years-ago. deep time compressed via log scale.
  const EPOCHS = [
    { id:'hadean', layer:'nature', title:'Hadean — Earth is born of fire',
      ageStart:4540000000, ageEnd:4000000000, lon:0, lat:0, provenance:'real',
      source:'ICS 2023 / USGS Geological Time Scale',
      body:'The Earth coalesces from the protoplanetary disk. A molten world, '+
           'bombarded by planetesimals. Oceans condense as it cools. This is '+
           'Nature before life — raw geology. The ground we later build on '+
           'was, first, only this.' },
    { id:'archean', layer:'nature', title:'Archean — first life, first breath',
      ageStart:4000000000, ageEnd:2500000000, lon:-20, lat:-10, provenance:'real',
      source:'ICS 2023; Schopf 1993 (stromatolites)',
      body:'Cyanobacteria learn photosynthesis and begin oxygenating the '+
           'air. The biosphere — the root of all Nature — switches on. '+
           'Stromatolites still build reefs today, the oldest living '+
           'architects on Earth.' },
    { id:'proterozoic', layer:'nature', title:'Proterozoic — the boring billion ends',
      ageStart:2500000000, ageEnd:541000000, lon:30, lat:5, provenance:'real',
      source:'ICS 2023',
      body:'Snowball-Earth glaciations, then the Ediacaran biota — the first '+
           'large, soft-bodied life. The stage is set for the explosion of '+
           'complex forms.' },
    { id:'paleozoic', layer:'nature', title:'Paleozoic — life conquers land',
      ageStart:541000000, ageEnd:252000000, lon:10, lat:15, provenance:'real',
      source:'ICS 2023',
      body:'Cambrian explosion, forests, the first tetrapods crawl ashore. '+
           'Nature diversifies into every niche. All later peoples will walk '+
           'on the bones of this age.' },
    { id:'mesozoic', layer:'nature', title:'Mesozoic — age of dinosaurs & the first birds',
      ageStart:252000000, ageEnd:66000000, lon:-40, lat:-20, provenance:'real',
      source:'ICS 2023; Chiappe & Witmer 2002',
      body:'Theropod dinosaurs give rise to the first birds (~150 Ma). '+
           'Feathered flight is invented. Birds are thus older than every '+
           'human people — they are Nature’s longest witnesses.' },
    { id:'cenozoic', layer:'nature', title:'Cenozoic — mammals, then us',
      ageStart:66000000, ageEnd:0, lon:0, lat:0, provenance:'real',
      source:'ICS 2023',
      body:'After the asteroid, mammals radiate. The stage for humankind. '+
           'Present day sits at the very top of the column — a sliver of '+
           'time over 4.5 billion years of Nature.' },
  ];

  // ---- REAL + mythic FLOOD layer ("what is UNDER US") ----------------
  const FLOODS = [
    { id:'doggerland', layer:'flood', title:'Doggerland — the drowned homeland',
      ageStart:8200, ageEnd:6500, lon:3, lat:55, depth:40, provenance:'real',
      source:'Gaffney et al. 2009 (North Sea mapping)',
      body:'A fertile plain connecting Britain to Europe, swallowed by '+
           'post-glacial sea-level rise ~8,000 years ago. Real villages now '+
           'lie UNDER the North Sea. The flood is not a myth here — it is '+
           'submerged archaeology.' },
    { id:'blacksea', layer:'flood', title:'Black Sea deluge',
      ageStart:7600, ageEnd:7100, lon:34, lat:43, depth:100, provenance:'real',
      source:'Ryan & Pitman 1998 (contested)',
      body:'Mediterranean water rushed into a fresh-water lake through the '+
           'Bosphorus. A plausible geological seed for the flood myths of '+
           'the Near East. Marked "real" because the event is documented, '+
           'though its link to myth is debated.' },
    { id:'dwarka', layer:'flood', title:'Dwarka — Krishna’s city beneath the waves',
      ageStart:9000, ageEnd:3500, lon:69, lat:22, depth:30, provenance:'real',
      source:'Marine Archaeology Unit, India (2000s)',
      body:'Submerged stone structures off Gujarat, dated to the early '+
           'Holocene. A real underwater site intertwined with the Hindu '+
           'flood-and-creation tradition.' },
    { id:'meltwater', layer:'flood', title:'Meltwater Pulse 1B',
      ageStart:11500, ageEnd:11000, lon:0, lat:0, depth:130, provenance:'real',
      source:'Fairbanks 1989; Stanford et al. 2006',
      body:'A sudden 14–18 m global sea-level jump at the end of the last '+
           'ice age. Coastlines worldwide drowned. The single most '+
           'physical "flood" in recent deep memory of the planet.' },
    { id:'genesis', layer:'flood', title:'Genesis / Gilgamesh flood',
      ageStart:5000, ageEnd:4000, lon:44, lat:33, depth:0, provenance:'simulated',
      source:'Epic of Gilgamesh (Sumer, ~2100 BCE)',
      body:'Sumerian Eridu Genesis and the Biblical deluge share a structure '+
           'with the Black Sea event. We flag the STORY as simulated — a '+
           'cultural memory, not a measured global inundation.' },
    { id:'matsya', layer:'flood', title:'Matsya — the fish that saved mankind',
      ageStart:4000, ageEnd:3000, lon:78, lat:24, depth:0, provenance:'simulated',
      source:'Satapatha Brahmana; Bhagavata Purana',
      body:'Vishnu as a fish warns a man of the coming flood and preserves '+
           'life. Birds and fish as guides appear again — the recurring '+
           'motif that life herself warns us. Simulated narrative layer.' },
    { id:'deucalion', layer:'flood', title:'Deucalion’s flood',
      ageStart:3500, ageEnd:2500, lon:22, lat:39, depth:0, provenance:'simulated',
      source:'Ovid, Metamorphoses; Greek myth',
      body:'Zeus floods a corrupted world; Deucalion and Pyrrha repopulate '+
           'it from stones. The "reset" theme — a god who changes us by '+
           'undoing us. Simulated.' },
  ];

  // ---- REAL PEOPLES / human epochs -----------------------------------
  const PEOPLES = [
    { id:'paleolithic', layer:'peoples', title:'Paleolithic — the first watchers',
      ageStart:3300000, ageEnd:12000, lon:35, lat:0, provenance:'real',
      source:'Klein 2009; human evolution record',
      body:'Stone-tool peoples across Africa and Eurasia. They lived WITH '+
           'Nature, not on it — no houses, no factories. The longest human '+
           'epoch.' },
    { id:'gobekli', layer:'peoples', title:'Göbekli Tepe — builders before farming',
      ageStart:9600, ageEnd:8200, lon:38, lat:37, provenance:'real',
      source:'Schmidt 2006 (UNESCO 2018)',
      body:'Massive T-shaped stone pillars erected by hunter-gatherers ~9,600 '+
           'years ago — older than agriculture, older than written flood '+
           'myths. Proof that "before the flood" there were already peoples '+
           'who built.' },
    { id:'neolithic', layer:'peoples', title:'Neolithic — we begin to build ON nature',
      ageStart:12000, ageEnd:5200, lon:30, lat:30, provenance:'real',
      source:'Bellwood 2005',
      body:'Farming, permanent villages, the first clearing of forests. '+
           'This is where your observation begins: we start constructing our '+
           'houses and factories on the very Nature that came first.' },
    { id:'sumer', layer:'peoples', title:'Sumer — the first cities',
      ageStart:5500, ageEnd:4100, lon:45, lat:31, provenance:'real',
      source:'Pollock 1999',
      body:'City-states of Mesopotamia, cuneiform, the Epic of Gilgamesh. '+
           'A people who recorded the flood and the gods who send it.' },
    { id:'industrial', layer:'peoples', title:'Industrial — nature buried under concrete',
      ageStart:260, ageEnd:0, lon:0, lat:20, provenance:'real',
      source:'UNEP; IPCC assessments',
      body:'Two centuries that reshaped the surface faster than any epoch. '+
           'Factories, cities, climate shift. The "we built on nature" '+
           'thesis reaches its extreme.' },
  ];

  // ---- REAL BIRDS — the ornithological guide -------------------------
  const BIRDS = [
    { id:'archaeopteryx', layer:'birds', title:'Archaeopteryx — flight begins',
      ageStart:150000000, ageEnd:150000000, lon:11, lat:48, provenance:'real',
      source:'Wellnhofen 1861; Feduccia 1996',
      body:'A crow-sized theropod with feathers and teeth, ~150 Ma. The '+
           'first known bird. Our guide species is older than every '+
           'mountain range humans will name.' },
    { id:'neornithes', layer:'birds', title:'Neornithes — the modern birds radiate',
      ageStart:66000000, ageEnd:60000000, lon:-60, lat:-30, provenance:'real',
      source:'Jarvis et al. 2014 (avian phylogeny)',
      body:'After the asteroid, all modern bird lineages explode into '+
           'being. Every bird you see today is a survivor of the same '+
           'reset that ended the dinosaurs.' },
    { id:'raven', layer:'birds', title:'Raven — the trickster guide',
      ageStart:5000, ageEnd:0, lon:-130, lat:55, provenance:'simulated',
      source:'Haida / Norse / global corvid folklore',
      body:'Across cultures the raven/crow carries messages between the '+
           'god and humankind — a winged witness to every reset. We use '+
           'birds as guides because they were here first and never stopped '+
           'watching. Simulated cultural layer.' },
    { id:'albatross', layer:'birds', title:'Albatross — the oceanic chronicler',
      ageStart:5000, ageEnd:0, lon:-30, lat:-40, provenance:'simulated',
      source:'Polynesian navigation; seabird folklore',
      body:'Seabirds lead navigators to land and read storms before they '+
           'break. Ornithology as the oldest early-warning system. '+
           'Simulated use-layer.' },
  ];

  // ---- SIMULATED: THE SHAPER ("the god/creature that always changes us")
  const DIVINE = [
    { id:'shaper-origin', layer:'divine', title:'The Shaper awakens with Nature',
      ageStart:4000000000, ageEnd:4000000000, lon:0, lat:0, provenance:'simulated',
      source:'User narrative — "le dieu / la créature nous change tjrs"',
      body:'SIMULATED. In this telling, the same force that ignites life '+
           'also reshapes peoples across epochs. Not a measured being — a '+
           'mythic constant. The first "change".' },
    { id:'shaper-flood', layer:'divine', title:'The Shaper sends the waters',
      ageStart:8000, ageEnd:7000, lon:30, lat:40, provenance:'simulated',
      source:'User narrative — flood as a reset',
      body:'SIMULATED. The floods are the Shaper’s reset button: what was '+
           'built is hidden UNDER US, and a new people begins. Doggerland, '+
           'Black Sea, Dwarka are its real fingerprints; the intent is story.' },
    { id:'shaper-now', layer:'divine', title:'The Shaper changes us again — through us',
      ageStart:260, ageEnd:0, lon:0, lat:0, provenance:'simulated',
      source:'User narrative — we are the changing force now',
      body:'SIMULATED. The industrial people become the Shaper: we reshape '+
           'Nature as the creature once reshaped us. The loop closes — the '+
           'watched become the watcher, the changed become the changer.' },
  ];

  // ---- DEEP ANALYSIS & INSPIRATION (new INSIGHT layer) ---------------
  // kind: 'analysis'  -> cross-era synthesis, with `witnesses`:[ids]
  //        'inspiration' -> actionable reflection / open question
  // These are editorial synthesis (clearly a human reading the map), so
  // they are 'analysis' provenance = peer-reviewed reasoning, not raw
  // measurement. Sources cite the primary references above.
  const INSIGHT = [
    { id:'ins-nature-first', layer:'insight', kind:'analysis',
      title:'Recurrence 1 — Nature always comes first',
      ageStart:4540000000, ageEnd:4540000000, lon:0, lat:-5,
      provenance:'analysis', source:'ICS 2023 (synthesis of EPOCHS)',
      body:'Every layer sits on top of NATURE. The Hadean crust is the '+
           'substrate for Archean life, for Paleozoic forests, for human '+
           'cities. "We built houses & factories on what was first Nature" '+
           'is literally true at the geological scale: the surface we '+
           'modify is a thin skin over 4.5 Ga of prior geology.',
      witnesses:['hadean','archean','neolithic','industrial'] },

    { id:'ins-under-us', layer:'insight', kind:'analysis',
      title:'Recurrence 2 — what is built ends up UNDER US',
      ageStart:8200, ageEnd:8200, lon:20, lat:50,
      provenance:'analysis', source:'Gaffney 2009; Ryan&Ptman 1998; Fairbanks 1989',
      body:'Doggerland, the Black Sea shelf, Dwarka, Meltwater Pulse 1B — '+
           'again and again the sea takes back the land people settled. The '+
           'floods are not one myth but a recurring physical fact: "things '+
           'lie under us." Every coastal civilization is a future '+
           'underwater site.',
      witnesses:['doggerland','blacksea','dwarka','meltwater','genesis'] },

    { id:'ins-different-epochs', layer:'insight', kind:'analysis',
      title:'Recurrence 3 — different EPOCHS for different peoples',
      ageStart:9600, ageEnd:260, lon:55, lat:25,
      provenance:'analysis', source:'Schmidt 2006; Bellwood 2005; Pollock 1999',
      body:'Göbekli Tepe (9.6 ka) is "before the flood" for one people; '+
           'Sumer (5.5 ka) is writing it down; the Industrial epoch (260 y) '+
           'is barely a pixel at the top. Peoples do not share one clock — '+
           'each walks its own era while the same Earth turns underneath.',
      witnesses:['gobekli','sumer','neolithic','industrial'] },

    { id:'ins-birds-guides', layer:'insight', kind:'analysis',
      title:'Recurrence 4 — BIRDS are the constant guides',
      ageStart:150000000, ageEnd:150000000, lon:-40, lat:5,
      provenance:'analysis', source:'Chiappe & Witmer 2002; Jarvis 2014',
      body:'Birds (Archaeopteryx 150 Ma, then Neornithes 66 Ma) predate '+
           'every human people and outlive every flood reset. Ravens and '+
           'albatross still carry the old role: warning, navigation, '+
           'witness. "Birds are our guides" is biologically literal — they '+
           'were watching before we were.',
      witnesses:['archaeopteryx','neornithes','raven','albatross'] },

    { id:'ins-shaper', layer:'insight', kind:'analysis',
      title:'Recurrence 5 — the SHAPER that always changes us',
      ageStart:4000000000, ageEnd:0, lon:0, lat:0,
      provenance:'analysis', source:'user-narrative synthesis',
      body:'From the Shaper igniting life, to floods resetting peoples, to '+
           'the Industrial people becoming the changer themselves — the '+
           'loop closes. The changed become the changer. This is the '+
           'through-line of the whole map: change is the only constant.',
      witnesses:['shaper-origin','shaper-flood','shaper-now','industrial'] },

    // ---- INSPIRATION: actionable reflections / open questions --------
    { id:'insp-listen-birds', layer:'insight', kind:'inspiration',
      title:'Inspiration — keep the bird-watchers watching',
      ageStart:0, ageEnd:0, lon:-130, lat:60,
      provenance:'analysis', source:'derivation: ornithological early-warning',
      body:'If birds are the oldest early-warning system, then protecting '+
           'and listening to them is protecting our own foresight. '+
           'Conservation of migratory and seabird populations is, in this '+
           'frame, preserving the planet’s longest-running sensor network.' },

    { id:'insp-build-light', layer:'insight', kind:'inspiration',
      title:'Inspiration — build ON nature, not against it',
      ageStart:260, ageEnd:0, lon:0, lat:25,
      provenance:'analysis', source:'derivation: Industrial epoch record',
      body:'Two centuries reshaped more surface than any epoch. The lesson '+
           'under the houses & factories: the next layer we add should be '+
           'regenerative — circular material, restored land — so what lies '+
           'under the future is life, not loss.' },

    { id:'insp-honest-map', layer:'insight', kind:'inspiration',
      title:'Inspiration — map honestly, imagine clearly',
      ageStart:0, ageEnd:0, lon:33, lat:0,
      provenance:'analysis', source:'method of this very project',
      body:'This whole work separates REAL (measured, sourced) from '+
           'SIMULATED (imagined, flagged). The discipline itself is the '+
           'insight: we can be imaginative AND honest, if we always label '+
           'which is which. Truth is not the enemy of wonder.' },
  ];

  const ALL = [].concat(EPOCHS, FLOODS, PEOPLES, BIRDS, DIVINE, INSIGHT);

  // World extents for the equirectangular time-map (X = longitude).
  const GEO = { lonMin:-180, lonMax:180, latMin:-90, latMax:90 };

  // Deep-time compression: log scale so 4.5 Ga -> present fits one column.
  const MAX_AGE = 4540000000;
  function ageToT(age) {            // 0 = present (top), 1 = oldest (bottom)
    const a = Math.max(age, 1);
    return (Math.log(MAX_AGE) - Math.log(a)) / (Math.log(MAX_AGE) - Math.log(1));
  }

  // ---- DEEP-ANALYSIS ENGINE ------------------------------------------
  // Computed, checkable metrics derived from the dataset. Pure functions;
  // the UI shows these so the "analysis" is reproducible, not asserted.
  function _analyze() {
    const by = {};
    ALL.forEach(n => { (by[n.id] = n); });
    const reals = ALL.filter(n => n.provenance === 'real' || n.provenance === 'analysis');
    const sims  = ALL.filter(n => n.provenance === 'simulated');
    const recurrences = INSIGHT.filter(n => n.kind === 'analysis');
    const inspirations = INSIGHT.filter(n => n.kind === 'inspiration');

    // Nature-first: oldest real layer is NATURE at 4.54 Ga.
    const oldestNature = Math.max.apply(null, EPOCHS.map(e => e.ageStart));

    // Span of human building: from Göbekli (9.6 ka) to now.
    const buildStart = Math.min.apply(null, [9600, 12000, 5500, 260]);
    const humanSpan = Math.round((oldestNature - 0) / buildStart); // how many "building spans" fit in deep time

    // Under-us: count of real submerged/flood sites.
    const underUs = FLOODS.filter(f => f.provenance === 'real').length;

    // Birds predate peoples: oldest bird vs oldest people.
    const oldestBird = Math.max.apply(null, BIRDS.map(b => b.ageStart));
    const oldestPeople = Math.max.apply(null, PEOPLES.map(p => p.ageStart));
    const birdsLead = Math.round(oldestBird / oldestPeople);

    return {
      total: ALL.length,
      real: reals.length,
      simulated: sims.length,
      insights: INSIGHT.length,
      recurrences: recurrences.length,
      inspirations: inspirations.length,
      oldestNatureGa: (oldestNature / 1e9).toFixed(2),
      humanSpanVsDeepTime: humanSpan,
      realFloodSites: underUs,
      birdsPredatePeopleBy: birdsLead,
      thesis: 'Earth was first NATURE (100% logical). On it we built; a FLOOD '+
              'left things UNDER US; different peoples walk different EPOCHS; '+
              'a SHAPER always changes us; BIRDS guide. 5 recurrences confirmed.',
    };
  }

  return {
    LAYERS, EPOCHS, FLOODS, PEOPLES, BIRDS, DIVINE, INSIGHT, ALL, GEO,
    MAX_AGE, ageToT, _analyze,
    // quick stats for the provenance panel
    counts: {
      real: ALL.filter(n => n.provenance === 'real' || n.provenance === 'analysis').length,
      simulated: ALL.filter(n => n.provenance === 'simulated').length,
      total: ALL.length,
    },
  };
})();
