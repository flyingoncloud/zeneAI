# ZeneAI Backend

Spring Boot API server for ZeneAI IFS therapy platform.

## Features
- User authentication with JWT
- IFS therapy chat API
- File upload for images
- Audio transcription
- Session management
- OpenAI integration

## Setup
1. Install PostgreSQL and create database `chatbot`
2. Update `src/main/resources/application.properties` with your database credentials
3. Add your OpenAI API key to application.properties
4. Run: `mvn spring-boot:run`

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/chat` - Chat with AI
- `POST /api/zene/chat` - IFS therapy chat
- `POST /api/zene/transcribe` - Audio transcription
- `POST /api/zene/upload` - File upload
- `POST /api/zene/suggest` - Therapy suggestions

Server runs on http://localhost:8080
