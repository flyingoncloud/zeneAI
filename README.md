# ZeneAI Frontend

Next.js frontend application for ZeneAI IFS (Internal Family Systems) therapy platform.

## Features

### Core Functionality
- **IFS Therapy Interface** - Real-time Parts and Self detection and tracking
- **AI Chat Integration** - Therapeutic conversations with OpenAI-powered responses
- **Session Management** - Persistent conversation history and progress tracking
- **Report Generation** - Automated therapy session summaries and insights

### Media & Drawing Tools
- **Photo Upload** - Upload images for AI analysis and therapeutic discussion
- **Image Gallery** - Select from curated nature photos for emotional exploration
- **Canvas Drawing** - Built-in drawing tool for creative expression and analysis
- **Voice Input** - Audio recording and transcription capabilities

### User Interface
- **Responsive Design** - Optimized for desktop and mobile devices
- **Real-time Tracking** - Live display of detected Self and Parts during conversations
- **Modal System** - Guidance prompts and therapeutic interventions
- **Progress Indicators** - Visual feedback on therapy session milestones

### Safety Features
- **Risk Detection** - Automatic monitoring for emotional distress signals
- **Intervention System** - Therapeutic guidance when risk patterns are detected
- **Paywall Integration** - Secure access to advanced features

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Update NEXT_PUBLIC_API_URL if needed (default: http://localhost:8080)
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Ensure backend is running**
   - Backend should be running on http://localhost:8080
   - See zeneAI-backend README for setup instructions

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Components
- **ChatBox** - Main conversation interface with media upload capabilities
- **ImageGallery** - Curated photo selection for therapeutic exploration
- **SketchPad** - Canvas drawing tool with AI analysis integration
- **GuidanceModal** - Therapeutic guidance and intervention system
- **RiskModal** - Safety monitoring and crisis intervention

### API Integration
- **Chat API** - Real-time conversation with IFS-focused AI responses
- **Upload API** - Image and drawing upload with analysis
- **Gallery API** - Curated therapeutic image collection
- **Risk API** - Emotional distress pattern detection
- **Greeting API** - Dynamic welcome messages

### State Management
- **Session Tracking** - Persistent conversation and progress data
- **Real-time Detection** - Live Parts and Self identification
- **Modal System** - Contextual guidance and intervention triggers

## Therapeutic Features

### IFS Integration
- **Parts Detection** - Automatic identification of emotional parts (anxiety, anger, sadness, etc.)
- **Self Recognition** - Detection of Self qualities (calm, clarity, compassion, etc.)
- **Progress Tracking** - Real-time monitoring of therapeutic milestones
- **Intervention Triggers** - Automated guidance based on session progress

### AI Analysis
- **Image Analysis** - Therapeutic interpretation of uploaded photos and drawings
- **Conversation Analysis** - IFS-focused responses and insights
- **Risk Assessment** - Emotional safety monitoring and intervention
- **Progress Suggestions** - Personalized therapeutic recommendations

## Development

Built with:
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - Modern state management
- **Canvas API** - Drawing functionality

## License

Private - ZeneAI Therapy Platform
