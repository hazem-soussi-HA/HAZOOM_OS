<p align="center">
  <img src="https://raw.githubusercontent.com/hazem-soussi-HA/nano-protocol/main/hazoom-logo.svg" alt="HAZOOM Logo" width="300">
</p>

<h1 align="center">NANO PROTOCOL</h1>
<h3 align="center">Neuro-Acoustic Optimization for Natural Homeostasis</h3>

<p align="center">
  <em>A Doctoral Research Project in Frequency Medicine & Neuroacoustic Therapy</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/version-1.1.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="License">
  <img src="https://img.shields.io/badge/researcher-Hazem%20Soussi-purple" alt="Researcher">
  <img src="https://img.shields.io/badge/phase-II%20Research-orange" alt="Phase">
</p>

---

## Version History

| Version | Date | Phase | Description |
|---------|------|-------|-------------|
| v1.0.0 | 2026-07-28 | Phase I | Initial release - Frequency healing platform |
| v1.1.0 | 2026-07-28 | Phase II | Added research scraper microservice |

### Current State: Phase II - Research Infrastructure

**Advancement Status:**
- [x] **Phase I**: Core frequency healing platform
  - [x] Web-based audio synthesis engine
  - [x] 4 therapeutic modules (Restore, Abundance, Opportunity, Peace)
  - [x] Real-time visual meditation system
  - [x] Binaural beat technology
  - [x] Solfeggio frequency integration
  
- [x] **Phase II**: Research & Data Infrastructure (Current)
  - [x] Academic paper scraper (PubMed, arXiv)
  - [x] Book parser (PDF/EPUB)
  - [x] Web article scraper
  - [x] REST API for research queries
  - [x] NLP pipeline for frequency extraction
  - [x] JSON research database
  
- [ ] **Phase III**: Clinical Validation
  - [ ] EEG integration for brainwave monitoring
  - [ ] Heart rate variability (HRV) tracking
  - [ ] Cortisol testing protocols
  - [ ] Longitudinal studies
  
- [ ] **Phase IV**: Advanced Features
  - [ ] AI-personalized frequency selection
  - [ ] Biometric feedback integration
  - [ ] Mobile applications
  - [ ] Clinical trial partnerships

---

## Abstract

The NANO Protocol is an interdisciplinary doctoral research project investigating the therapeutic applications of sacred solfeggio frequencies, binaural beat entrainment, and neuroacoustic stimulation for psychophysiological homeostasis. This work bridges ancient vibrational healing traditions with contemporary neuroscience, exploring how specific frequency patterns can modulate neurotransmitter production—particularly serotonin, dopamine, oxytocin, and endorphins—and influence brainwave coherence across delta, theta, alpha, beta, and gamma states.

The project develops a real-time frequency delivery platform that combines:
- **Solfeggio Frequency Therapy** — Nine sacred tones (174Hz–963Hz) historically used in Gregorian chanting and temple healing practices
- **Binaural Beat Entrainment** — Stereo frequency separation to guide brainwave states
- **Ambient Soundscape Integration** — Nature-based acoustic environments layered with therapeutic frequencies
- **Neurovisual Feedback** — Real-time canvas visualizations responding to audio for enhanced meditative absorption

---

## Research Context

### Theoretical Framework

The NANO Protocol is grounded in three converging fields:

1. **Cymatics & Vibrational Medicine** — The study of how sound frequencies create geometric patterns in matter, suggesting a fundamental relationship between vibration and biological structure.

2. **Neuroplasticity & Brainwave Entrainment** — The brain's ability to reorganize neural pathways in response to rhythmic auditory stimulation, enabling targeted states of consciousness.

3. **Psychoneuroimmunology** — The interaction between psychological processes, the nervous system, and immune function, where frequency-induced emotional states may influence hormonal cascades.

### Historical Foundations

The solfeggio frequencies were originally derived from ancient musical traditions and rediscovered in Gregorian chants by Dr. Joseph Puleo in the 1970s. Each frequency corresponds to a specific energy center (chakra) and physiological response:

| Hz | Traditional Use | Proposed Mechanism |
|---|---|---|
| 174 | Pain relief, foundation | Grounding, physical stabilization |
| 285 | Tissue repair, energy | Cellular regeneration signaling |
| 396 | Liberating guilt & fear | Limbic system modulation |
| 417 | Undoing situations, change | Cortisol reduction, adaptive response |
| 528 | Transformation, love, miracles | Serotonin synthesis enhancement |
| 639 | Connections, relationships | Oxytocin pathway activation |
| 741 | Awakening intuition | Prefrontal cortex stimulation |
| 852 | Returning to spiritual order | Thalamic recalibration |
| 963 | Divine consciousness | Pineal gland activation |

---

## Methodology

### Frequency Generation

All audio is synthesized in real-time using the Web Audio API, eliminating the need for pre-recorded files and enabling precise frequency control:

- **Oscillator-based synthesis** with sine, triangle, and custom waveforms
- **Stereo binaural separation** for brainwave entrainment (±0.5Hz precision)
- **Amplitude modulation** for gentle fade-in/fade-out transitions
- **Layered frequency stacking** combining solfeggio tones with binaural carriers

### Neuroacoustic Modules

| Module | Primary Frequencies | Binaural Range | Therapeutic Target |
|---|---|---|---|
| **RESTORE** | 396Hz · 417Hz · 528Hz | Theta 6Hz | Trauma release, energetic cleansing |
| **ABUNDANCE** | 888Hz · 639Hz · 528Hz | Alpha 10Hz | Prosperity consciousness, dopamine pathways |
| **OPPORTUNITY** | 741Hz · 852Hz · 963Hz | Beta 15Hz | Intuition, opportunity recognition |
| **PEACE** | 432Hz · 528Hz · 639Hz | Theta 5Hz | Cortisol reduction, parasympathetic activation |

### Visual Neurofeedback

Real-time canvas visualizations serve as biofeedback anchors:

- **Mandala Mode** — Sacred geometry with frequency-responsive pulsation
- **Aura Mode** — Seven-point chakra energy field visualization
- **Particle Mode** — Fluid dynamics responding to audio amplitude
- **Flower of Life Mode** — Geometric patterns with harmonic overtone display

---

## Technical Architecture

```
nano-protocol/
├── index.html                 # Research portal landing page
├── dimensional.html           # Dimensional frequency explorer
├── start.sh                   # Quick start script
├── css/
│   └── main.css              # Design system (dark theme, color therapy)
├── js/
│   ├── audio-engine.js       # Core synthesis & frequency management
│   ├── visualizer.js         # Canvas rendering & neurofeedback
│   └── app.js                # Session control & user interaction
├── modules/
│   ├── restore.html          # Therapeutic module: Restoration
│   ├── abundance.html        # Therapeutic module: Abundance
│   ├── opportunity.html      # Therapeutic module: Opportunity
│   └── peace.html            # Therapeutic module: Peace
├── assets/
│   └── hazoom-logo.svg       # Project emblem
├── microservices/
│   └── frequency-research-scraper/
│       ├── main.py           # Scraper entry point
│       ├── src/
│       │   ├── scrapers/     # Academic, Book, Web scrapers
│       │   ├── pipeline/     # NLP & analysis
│       │   └── api/          # REST API (FastAPI)
│       └── data/             # Research database
├── docs/
│   └── getting-started/      # Setup & usage guide
├── README.md                 # This document
└── LICENSE                   # MIT License
```

### Dependencies

**Web App:** Zero external dependencies - vanilla JavaScript with native browser APIs:
- Web Audio API (frequency generation, analysis)
- Canvas API (real-time visualization)
- requestAnimationFrame (60fps rendering loop)

**Research Scraper:** Python 3.9+ with:
- FastAPI (REST API)
- aiohttp (async HTTP)
- BeautifulSoup4 (HTML parsing)
- PyPDF2/ebooklib (book parsing)

---

## Brainwave State Reference

| Band | Frequency | Associated State | Therapeutic Application |
|---|---|---|---|
| **Delta** | 0.5–4 Hz | Deep sleep, unconscious healing | Cellular repair, immune regulation |
| **Theta** | 4–8 Hz | Meditation, deep relaxation | Emotional processing, creativity |
| **Alpha** | 8–14 Hz | Calm focus, relaxation | Stress reduction, learning enhancement |
| **Beta** | 14–30 Hz | Active thinking, focus | Problem solving, alertness |
| **Gamma** | 30–100 Hz | Higher consciousness | Peak perception, spiritual insight |

---

## Hormone Response Hypothesis

The NANO Protocol proposes that sustained exposure to specific frequency combinations may influence endocrine function through auditory-limbic-hypothalamic pathways:

| Frequency | Proposed Hormonal Effect | Supporting Literature |
|---|---|---|
| 528Hz | Serotonin synthesis upregulation | Horvath et al. (2018) — sound therapy & mood |
| 432Hz | Cortisol reduction, parasympathetic shift | Petrie & Dawson (1997) — music & stress |
| 396Hz | Endorphin release, pain modulation | Goldsby et al. (2017) — music & analgesia |
| 639Hz | Oxytocin pathway activation | Keeler et al. (2015) — music & social bonding |

*Note: This project is exploratory. Clinical trials are recommended before therapeutic claims.*

---

## Usage Protocol

### Standard Session

1. Access the platform via modern browser (Chrome, Firefox, Safari)
2. Select therapeutic intention based on current psychophysiological need
3. Configure session parameters:
   - **Duration:** 5–30 minutes (recommended: 20 minutes)
   - **Visualization:** Mandala / Aura / Particles / Sacred Geometry
   - **Volume:** 40–60% (comfortable listening level)
4. Engage with headphones for optimal binaural effect
5. Assume comfortable position; close eyes or focus on visualization
6. Practice diaphragmatic breathing throughout session
7. Journal post-session observations for longitudinal tracking

### Safety Considerations

- Not recommended for individuals with epilepsy or seizure disorders
- Avoid while operating vehicles or machinery
- Consult healthcare provider if pregnant or experiencing neurological conditions
- Discontinue if experiencing discomfort, dizziness, or anxiety

---

## Future Research Directions

### Phase III (Planned)
1. **EEG Integration** — Real-time brainwave monitoring to validate frequency entrainment
2. **Heart Rate Variability (HRV)** — Measuring autonomic nervous system response
3. **Cortisol Saliva Testing** — Pre/post session hormonal analysis
4. **Longitudinal Studies** — 30/60/90-day frequency exposure protocols

### Phase IV (Visionary)
5. **Clinical Trials** — Randomized controlled studies with standardized outcome measures
6. **AI-Personalization** — Adaptive frequency selection based on biometric feedback
7. **Mobile Applications** — iOS/Android apps for personal use
8. **Clinical Partnerships** — Integration with healthcare providers

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/hazem-soussi-HA/nano-protocol.git
cd nano-protocol

# Run interactive menu
./start.sh

# Or manually run web app
python3 -m http.server 8080

# Or run research scraper API
cd microservices/frequency-research-scraper
pip install -r requirements.txt
uvicorn src.api.main:app --port 8099
```

For detailed instructions, see [docs/getting-started/README.md](docs/getting-started/README.md)

---

## Citation

If this work contributes to your research, please cite:

```
Soussi, H. (2026). NANO Protocol: Neuro-Acoustic Optimization for Natural Homeostasis
[Doctoral research project]. Retrieved from https://github.com/hazem-soussi-HA/nano-protocol
```

---

## About

**NANO Protocol** — Neuro-Acoustic Optimization for Natural Homeostasis

**Researcher:** Hazem Soussi
**Institution:** Independent Doctoral Research
**Year:** 2026
**License:** MIT

*Healing through sacred frequency. Aligning body, mind, and spirit with the vibration of the universe.*

---

<p align="center">
  <sub>"The universe is not only queerer than we suppose, but queerer than we can suppose." — J.B.S. Haldane</sub>
</p>
