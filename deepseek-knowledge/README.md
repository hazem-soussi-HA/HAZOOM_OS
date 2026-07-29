# The History of the Internet - Video Generation Platform

A secure, AI-powered documentary video generation platform about the history of the internet, built with Python (FastAPI) and Ruby-compatible architecture.

## Overview

This platform generates documentary videos about the history of the internet using advanced AI and video generation technologies. It combines the power of Python for video processing with a secure, air-gapped architecture for knowledge preservation.

## Key Features

### Video Generation
- **Documentary-style videos** about internet history topics
- **Multiple formats** (3-5 minute documentaries)
- **High-quality output** using MoviePy and FFmpeg
- **Text-to-speech** integration for narration
- **Customizable templates** and styles

### Security & Access Control
- **Role-based access control** (Admin, Editor, Viewer)
- **JWT authentication** with secure token handling
- **Data encryption** for storage and transmission
- **Air-gapped architecture** for knowledge security
- **Rate limiting** and DDoS protection

### Web Interface
- **On-demand video generation** via REST API
- **Real-time job tracking** and status monitoring
- **Responsive design** for desktop and mobile
- **Admin dashboard** for content management
- **User management** and permissions

### Infrastructure
- **Docker containers** for consistent deployment
- **Kubernetes orchestration** for scalability
- **Redis for caching** and job queuing
- **PostgreSQL for data storage**
- **Celery for background processing**

## Technology Stack

### Backend (Python)
- **FastAPI**: REST API framework
- **MoviePy**: Video generation and editing
- **FFmpeg**: Video encoding and processing
- **SQLAlchemy**: Database ORM
- **Celery**: Background task processing
- **Redis**: Caching and job queue
- **PostgreSQL**: Relational database

### Frontend (React)
- **React**: Component-based UI
- **Material-UI**: Styling and components
- **Axios**: HTTP client
- **WebSockets**: Real-time updates

### Security
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Fernet**: Data encryption
- **CORS**: Cross-origin resource sharing
- **Rate limiting**: API protection

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Interface                        │
│  React + Material-UI + WebSockets                      │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│  FastAPI + JWT Auth + Rate Limiting                    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Services Layer                        │
│  • Video Generator (MoviePy + FFmpeg)                  │
│  • Authentication & Authorization                      │
│  • Knowledge Base (Internet History)                   │
│  • Encryption & Security                               │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                            │
│  • PostgreSQL (Video Jobs, Users)                       │
│  • Redis (Cache, Job Queue)                            │
│  • Encrypted Storage (Videos)                          │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (optional)
- Domain name with SSL certificate

### Local Development

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Start the services

```bash
# Clone the repository
git clone https://github.com/yourusername/deepseek-knowledge.git
cd deepseek-knowledge

# Install Python dependencies
pip install --break-system-packages -r requirements.txt

# Create .env file
 cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
python -m alembic upgrade head

# Start the application
uvicorn app.main:app --reload
```

### Production Deployment

1. Configure Kubernetes
2. Apply manifests
3. Set up secrets
4. Configure SSL certificates
5. Scale deployments

```bash
# Apply Kubernetes manifests
kubectl apply -k deployment/k8s/

# Set up secrets
kubectl create secret generic deepseek-knowledge-secrets \
  --from-env-file=.env

# Configure SSL with cert-manager
# ...
```

## API Documentation

The API is documented using OpenAPI/Swagger. Visit `/docs` to explore the endpoints.

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

#### Video Generation
- `POST /api/v1/videos/generate` - Generate new video
- `GET /api/v1/videos/jobs` - List video jobs
- `GET /api/v1/videos/jobs/{id}` - Get video job status
- `GET /api/v1/videos/{id}` - Get video details

#### Admin
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/analytics` - Get analytics

## Security Features

### Authentication
- JWT tokens with expiration
- Password hashing with bcrypt
- Role-based access control
- Session management

### Data Protection
- AES-256 encryption for stored data
- Secure token handling
- HTTPS enforcement
- Input validation and sanitization

### Infrastructure Security
- Air-gapped architecture
- Network policies
- Resource limits
- Pod security policies

## Video Generation Process

1. **Script Selection**: Choose a topic from the knowledge base
2. **Audio Generation**: Convert script to speech using gTTS
3. **Video Creation**: Generate video frames with text overlays
4. **Combination**: Merge audio and video using FFmpeg
5. **Storage**: Encrypt and store the final video
6. **Delivery**: Make available for download/streaming

## Knowledge Base

The platform includes a comprehensive knowledge base of internet history topics:

- ARPANET Origins
- TCP/IP Revolution
- Domain Name System (DNS)
- World Wide Web
- Commercial Internet
- Dot-Com Boom & Bust
- Web 2.0 Era
- Mobile Revolution
- Modern Internet

Each topic includes detailed scripts for video generation.

## Monitoring & Observability

- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **Logging**: Structured logging with ELK stack
- **Health checks**: API and database monitoring
- **Alerting**: Automated notifications

## Future Enhancements

1. **Multi-language support**: Generate videos in different languages
2. **Interactive videos**: Branching narratives based on user choices
3. **Virtual reality**: 360° video experiences
4. **Real-time collaboration**: Multiple users editing videos
5. **AI content generation**: Automatic script creation
6. **Cloud integration**: Multi-cloud deployment options

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support, please contact:
- GitHub Issues: https://github.com/yourusername/deepseek-knowledge/issues
- Email: support@history-of-internet.com

## Acknowledgments

- Vint Cerf and Bob Kahn for TCP/IP
- Tim Berners-Lee for the World Wide Web
- The open-source community for their contributions
- All internet history researchers and archivists