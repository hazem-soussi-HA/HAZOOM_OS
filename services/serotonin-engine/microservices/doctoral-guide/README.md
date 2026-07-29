<p align="center">
  <img src="../../hazoom-logo.svg" alt="HAZOOM Logo" width="200">
</p>

<h1 align="center">Doctoral Guide</h1>
<h3 align="center">Artefactual Creatif Service</h3>

<p align="center">
  <em>Comprehensive Solfeggio Frequency Reference — NANO Protocol</em>
</p>

---

## Overview

The Doctoral Guide is a creative artifact service providing comprehensive documentation of Solfeggio frequencies for academic and therapeutic reference.

### Features

- **9 Solfeggio Frequencies** — Complete profiles with traditional use and scientific evidence
- **Therapeutic Modules** — 4 healing protocols with frequency combinations
- **Scientific References** — Peer-reviewed research citations
- **Interactive API** — Query any frequency, effect, or module
- **Visual Explorer** — Browser-based frequency visualization

---

## Quick Start

```bash
cd microservices/doctoral-guide

# Install dependencies
pip install fastapi uvicorn

# Start API server (port 8098)
uvicorn src.api:app --host 0.0.0.0 --port 8098

# Open visual explorer
open static/index.html
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info |
| `GET /api/frequencies` | All solfeggio frequencies |
| `GET /api/frequency/{hz}` | Single frequency detail |
| `GET /api/binaural` | Binaural beats reference |
| `GET /api/modules` | Therapeutic modules |
| `GET /api/modules/{name}` | Single module detail |
| `GET /api/references` | Scientific references |
| `GET /api/search?q=` | Search database |
| `GET /api/healing-map` | Healing frequency map |
| `GET /api/session-builder` | Build custom session |

---

## Solfeggio Frequency Table

| Hz | Name | Chakra | Primary Effects |
|----|------|--------|-----------------|
| 174 | Foundation | Root | Pain relief, grounding |
| 285 | Repair | Sacral | Tissue healing, energy |
| 396 | Liberation | Solar Plexus | Guilt release, endorphins |
| 417 | Change | Heart | Undoing, transformation |
| 432 | Harmony | Heart | Natural resonance, peace |
| 528 | Transformation | Solar Plexus | DNA repair, serotonin |
| 639 | Connection | Heart | Relationships, oxytocin |
| 741 | Intuition | Throat | Awakening, expression |
| 852 | Spiritual Order | Third Eye | Clarity, inner vision |
| 963 | Divine | Crown | Higher consciousness |

---

## Data Sources

- Scientific references (peer-reviewed)
- Traditional historical use
- Modern therapeutic applications
- Cross-verified through multiple sources

---

## Security

```
CLASSIFICATION: ACADEMIC REFERENCE
RESEARCHER: Hazem Soussi
STATUS: Verified Data Only
```

---

**NANO Protocol — Artefactual Creatif Service**
