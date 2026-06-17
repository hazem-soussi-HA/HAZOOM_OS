# Universe Map

An automated, AI-powered universe visualization system with attention-based optimization for real-time celestial object rendering and exploration.

## 🚀 Features

### Core Capabilities
- **Real-time 3D Universe Visualization** - Interactive 3D exploration using Three.js and React Three Fiber
- **Attention-Based Optimization** - AI-powered rendering optimization using multi-head attention mechanisms
- **Live Astronomical Data** - Automated data syncing from SIMBAD, Gaia, and NASA catalogs
- **Smart Filtering & Search** - Advanced filtering by object type, position, and properties
- **Detailed Object Information** - Comprehensive celestial object data with physical properties

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Three.js & React Three Fiber for 3D visualization
- Framer Motion for animations
- Tailwind CSS for styling
- React Query for data management

**Backend:**
- FastAPI (Python 3.11)
- PostgreSQL with PostGIS
- Redis for caching
- PyTorch for attention-based optimization
- Astropy for astronomical calculations

**Infrastructure:**
- Docker & Docker Compose
- AWS ECS (Fargate) for production
- Terraform for IaC
- Prometheus & Grafana for monitoring
- OpenTelemetry for observability

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│  (React)    │     │  (FastAPI)  │     │ PostgreSQL  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│    Redis    │
                    │   Cache     │
                    └─────────────┘
                         
External Data Sources:
- SIMBAD (CDS)
- Gaia (ESA)
- NASA Exoplanet Archive
```

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Poetry (for backend dependencies)
- AWS CLI (for production deployment)

## 🚀 Quick Start

### Development Environment

1. **Clone the repository:**
```bash
git clone <repository-url>
cd universe-map
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Start all services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

### Development (Local)

**Backend:**
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://universe:universe_pass@localhost:5432/universe_map
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
NASA_API_KEY=your-nasa-api-key
SIMBAD_API_KEY=your-simbad-api-key
GRAFANA_PASSWORD=admin
```

## 📊 API Endpoints

### Celestial Objects
- `GET /api/v1/celestial-objects` - List celestial objects with filtering
- `GET /api/v1/celestial-objects/{id}` - Get specific object details
- `GET /api/v1/regions` - List universe regions

### Optimization
- `GET /api/v1/optimize` - AI-optimized view rendering
- Parameters:
  - `viewer_position`: RA,DEC,DISTANCE (comma-separated)
  - `fov`: Field of view in degrees
  - `max_objects`: Maximum objects to render

### Data Sync
- `POST /api/v1/sync-data` - Sync data from astronomical catalogs
- Requires API Key header

### Statistics
- `GET /api/v1/stats` - Universe statistics

## 🤖 AI Optimization

The system uses a multi-head attention mechanism to optimize rendering:

1. **Object Embedding** - Celestial objects are embedded using:
   - Positional coordinates (RA, Dec, Distance)
   - Physical properties (Mass, Radius, Temperature, Luminosity)
   - Spectral features (10-dimensional vector)
   - Object type classification

2. **Attention Mechanism** - Multi-head attention computes relationships between objects
3. **Importance Scoring** - Objects are ranked by rendering importance
4. **Optimized Rendering** - Only the most relevant objects are rendered first

## 🌐 External Data Sources

### SIMBAD (CDS)
- World's most comprehensive astronomical database
- Real-time querying via TAP protocol

### Gaia (ESA)
- High-precision astrometry
- 1.8+ billion stars catalog

### NASA Exoplanet Archive
- Confirmed exoplanets and candidates
- Host star properties

## 📈 Monitoring & Observability

### Prometheus Metrics
- API response times (P50, P95, P99)
- Request counts by endpoint
- Error rates
- Database connection pool
- Cache hit/miss ratios

### Grafana Dashboards
- API performance
- Database health
- Redis cache performance
- System resources

### Logging
Structured logging with:
- Request tracing with OpenTelemetry
- Error tracking
- Performance monitoring

## 🔒 Security

- API key authentication for data sync
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 🚢 Production Deployment

### Using Terraform

1. **Configure AWS credentials:**
```bash
aws configure
```

2. **Initialize Terraform:**
```bash
cd infrastructure/terraform
terraform init
```

3. **Plan deployment:**
```bash
terraform plan
```

4. **Apply changes:**
```bash
terraform apply
```

### Automated Deployment

```bash
./scripts/deployment/deploy.sh
```

## 🧪 Testing

**Backend:**
```bash
cd backend
poetry run pytest
```

**Frontend:**
```bash
cd frontend
npm test
```

**Integration Tests:**
```bash
npm run test:integration
```

## 📝 Performance Optimization

### Caching Strategy
- Redis cache for API responses (5-minute TTL)
- Browser caching for static assets
- CDN for frontend assets

### Database Optimization
- Indexed queries (RA, Dec, object_type)
- Connection pooling
- Read replicas for scale

### Rendering Optimization
- AI-based object prioritization
- Level-of-detail rendering
- Frustum culling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- NASA for astronomical data
- European Space Agency (Gaia)
- CDS (SIMBAD)
- Open source community

## 📧 Contact

- Issues: GitHub Issues
- Documentation: /docs

---

**Built with ❤️ by NASA Space Computing Team**
