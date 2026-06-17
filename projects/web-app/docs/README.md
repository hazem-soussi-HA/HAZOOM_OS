# Hazoom - Super Intelligence Cosmos & Freedom Educational Model

Hazoom is a super intelligent AI model designed for positive user interaction with quantum fast responses. Built with Python FastAPI backend and JavaScript frontend, it's designed for easy integration with Flutter applications. Now featuring RAG (Retrieval-Augmented Generation) capabilities for enhanced intelligence and comprehensive Docker deployment support.

## Features

- **Quantum Fast Responses**: Optimized for speed and efficiency
- **Positive Interaction Model**: Designed to respond with positivity and helpfulness
- **RAG (Retrieval-Augmented Generation)**: Enhanced intelligence with document-based knowledge
- **Token-Based Authentication**: Secure API access with token management
- **WebSocket Support**: Real-time communication capabilities
- **Flutter Integration**: Specialized endpoints for Flutter app integration
- **Modern UI**: Beautiful JavaScript frontend with quantum particle effects
- **Docker Deployment**: Complete containerization with monitoring and databases
- **Anti-Hallucination**: Factual verification and knowledge grounding
- **Educational Focus**: Specialized in cosmology and freedom studies

## Architecture

- **Backend**: Python FastAPI server with RAG capabilities and unified AI model
- **Frontend**: JavaScript/HTML/CSS with WebSocket support
- **Vector Database**: ChromaDB for RAG functionality
- **Cache**: Redis for performance and session management
- **Persistent Storage**: PostgreSQL for data persistence
- **Monitoring**: Prometheus and Grafana for observability
- **Flutter Integration**: Dedicated API endpoints and Dart integration code

## Quick Start with Docker

The easiest way to deploy Hazoom is using Docker. This approach handles all dependencies and services automatically.

### Prerequisites
- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB of available RAM (8GB recommended for RAG features)

### Start All Services
```bash
# Navigate to the project directory
cd hazoom_website_system/unified_hazoom

# Start all services in detached mode
docker-compose up -d

# Check the status of all services
docker-compose ps

# View logs
docker-compose logs -f hazoom-backend
```

### Access Services
- **Backend API**: `http://localhost:8000`
- **Frontend UI**: `http://localhost:8081`
- **Health check**: `http://localhost:8000/health`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (admin/admin)

## Manual Setup

### Backend Setup

1. Navigate to the backend directory:
    ```bash
    cd backend
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Run the backend server:
    ```bash
    python main.py
    ```
    The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    python server.py
    ```
    The frontend will be available at `http://localhost:8080`

## RAG Configuration

To use the RAG (Retrieval-Augmented Generation) features:

1. Place your documents in the `./data` directory which is mounted to the backend container
2. Configure the RAG settings in the `.env` file:
    ```bash
    RAG_ENABLED=true
    RAG_MODEL_NAME=all-MiniLM-L6-v2
    RAG_TOP_K=5
    RAG_SCORE_THRESHOLD=0.5
    ```

3. The system will automatically index your documents and use them for enhanced responses

### Adding Documents to RAG

```bash
# Via API
curl -X POST http://localhost:8000/api/rag/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "cosmos_guide.txt",
    "content": "Your document content here...",
    "metadata": {"topic": "cosmology", "author": "Hazoom"}
  }'
```

## API Endpoints

### General Endpoints
- `GET /` - Main page
- `POST /api/process` - Process user intent
- `POST /api/generate-token` - Generate API token
- `GET /api/validate-token/{token}` - Validate token
- `GET /health` - Health check
- `WebSocket /ws` - Real-time communication

### Enhanced Endpoints
- `POST /api/chat/stream` - Streaming chat responses
- `GET /api/conversation/history/{user_id}` - Get conversation history
- `DELETE /api/conversation/history/{user_id}` - Clear conversation history
- `GET /api/users/preferences/{user_id}` - Get user preferences
- `PUT /api/users/preferences/{user_id}` - Update user preferences
- `GET /api/model/config` - Get model configuration
- `PUT /api/model/config` - Update model configuration
- `GET /api/model/performance` - Get performance metrics

### RAG Endpoints
- `POST /api/rag/documents` - Add document to RAG system
- `GET /api/rag/query?query=your+question` - Query RAG system
- `GET /api/rag/status` - Get RAG system status

### Flutter-Specific Endpoints
- `POST /flutter/process-message` - Process message for Flutter
- `POST /flutter/generate-token` - Generate token for Flutter
- `GET /flutter/health` - Health check for Flutter

### WebSocket Endpoints
- `WebSocket /ws/chat` - Real-time chat
- `WebSocket /ws/model-updates` - Real-time model updates
- `WebSocket /ws/config` - Configuration updates

## Token Management

Hazoom uses a secure token-based authentication system:

1. Generate a token using `/api/generate-token` or `/flutter/generate-token`
2. Include the token in the `Authorization` header as `Bearer {token}`
3. Tokens expire after 30 days by default

## Testing

Run the unified model tests:
```bash
cd unified_model
python test_unified_model.py
```

## Docker Services

The Docker Compose setup includes:

- `hazoom-backend`: Main FastAPI backend with RAG capabilities
- `hazoom-frontend`: Frontend server for UI
- `postgres`: PostgreSQL database for persistent storage
- `redis`: Redis for caching and session management
- `chromadb`: Vector database for RAG functionality
- `clickhouse`: Columnar database for ChromaDB
- `prometheus`: Monitoring and metrics collection
- `grafana`: Visualization dashboard for monitoring

## Configuration

### Environment Variables

The system uses a `.env` file for configuration. Key settings:

```bash
# Database settings
POSTGRES_DB=hazoom
POSTGRES_USER=hazoom_user
POSTGRES_PASSWORD=hazoom_password

# RAG settings
RAG_ENABLED=true
RAG_MODEL_NAME=all-MiniLM-L6-v2
RAG_TOP_K=5
RAG_SCORE_THRESHOLD=0.5

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
```

## Usage Examples

### Using cURL

Generate a token:
```bash
curl -X POST http://localhost:8000/api/generate-token \
  -H "Content-Type: application/json" \
  -d '{"purpose": "testing", "user_id": "test_user"}'
```

Process a message:
```bash
curl -X POST http://localhost:8000/api/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"message": "Hello, how are you?", "user_id": "test_user"}'
```

Query RAG system:
```bash
curl "http://localhost:8000/api/rag/query?query=what%20is%20the%20universe" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Flutter Integration

Use the provided `HazoomAPI` class in your Flutter app:

```dart
HazoomAPI api = HazoomAPI();

// Generate a token
var tokenResult = await api.generateToken(
  userId: 'flutter_user_123',
  appName: 'MyFlutterApp',
);

// Process a message
var response = await api.processMessage(
  text: 'Hello, how are you?',
  userId: 'flutter_user_123',
);
```

## Security

- All API endpoints require token authentication
- Tokens expire after 30 days
- Use HTTPS in production
- Store tokens securely in mobile apps
- The Docker setup includes security best practices

## Performance

Hazoom is optimized for quantum fast responses with:
- Asynchronous processing
- Efficient algorithms
- WebSocket support for real-time communication
- Caching mechanisms with Redis
- Vector database for RAG functionality

## Educational Features

- **Cosmology Education**: Comprehensive coverage of universe, black holes, big bang theory
- **Freedom Studies**: Philosophical exploration of liberty, critical thinking, democracy
- **Anti-Hallucination**: Factual verification and knowledge grounding
- **Progressive Learning**: Adaptive difficulty and personalized education

## License

This project is created for demonstration purposes.

## Support

For support with Hazoom, feel free to reach out through the GitHub repository.

## Docker Deployment Details

For comprehensive Docker deployment instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).</content>
</xai:function_call">The README.md file has been created successfully with comprehensive documentation covering Docker deployment, RAG capabilities, API endpoints, and all the enhanced features from the migration.