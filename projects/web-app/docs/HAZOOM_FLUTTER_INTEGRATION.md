# Hazoom Flutter Integration Plan

## Current State
- Existing Flutter app with basic Hazoom branding
- Backend ready with comprehensive API endpoints
- Need to integrate advanced AI features into mobile app
- **Design System**: Happy emoji assets (hazoom_emoji_1.svg through hazoom_emoji_13.svg) for consistent branding

## Integration Architecture

### 1. API Layer Enhancement
- Extend existing HTTP client to support all Hazoom endpoints
- Add WebSocket client for real-time features
- Implement token management in existing auth system

### 2. Core Features to Add
- **Chat System**: Real-time AI conversations with typing indicators
- **Educational Tabs**: Learning, Automation, Family Fun, Cosmos sections
- **RAG Integration**: Document upload/query interface
- **User Preferences**: Theme, AI personality, interaction style settings
- **Progress Tracking**: Achievements, learning journey, stats

### 3. UI/UX Integration - Happy Emoji Design System
- **Emoji Assets**: Use hazoom_emoji_*.svg consistently across platforms
- **Animated Backgrounds**: Cosmos theme with floating emoji elements
- **Character Branding**: Happy kangaroo companions as AI avatar
- **Interactive Elements**: Emoji-based achievements and progress indicators
- **Tab Interface**: Emoji icons for each section (Learning 🧠, Automation ⚙️, Family 👨‍👩‍👧‍👦, Cosmos 🌌)
- **Chat Interface**: Emoji reactions and kangaroo avatar for AI responses

### 4. State Management Updates
- Extend current state management for:
  - Conversation history
  - User preferences
  - Model configurations
  - Real-time chat state

### 5. New Screens/Pages
- Chat interface (main feature)
- Learning dashboard
- Automation tools
- Family activities
- Cosmos education center
- Settings with AI customization

### 6. Backend Integration Points
- Use existing `/flutter/*` endpoints for mobile-specific features
- WebSocket connections for chat (`/ws/chat`)
- Token auth integration with current user system
- RAG features for educational content

### 7. Happy Emoji Design System Implementation

#### Web Platform
- **Background Animations**: Floating emoji elements using hazoom_emoji_*.svg
- **AI Avatar**: Kangaroo emoji (hazoom_emoji_1.svg) for chat responses
- **Tab Icons**: Emoji representations for each section
- **Achievement System**: Unlock emoji badges as progress milestones
- **Interactive Elements**: Hover effects with emoji animations

#### Mobile Platform (Flutter)
- **App Icon**: Use hazoom_emoji_1.svg as base for app icon variations
- **Navigation**: Bottom tab bar with emoji icons
- **Chat Bubbles**: AI responses with kangaroo emoji avatar
- **Achievement Badges**: Emoji-based reward system
- **Loading States**: Animated emoji sequences
- **Theme Integration**: Emoji elements in dark/light themes

#### Emoji Usage Guidelines
- **hazoom_emoji_1.svg**: Primary AI companion avatar (main kangaroo character)
- **hazoom_emoji_2-6.svg**: Achievement badges and progress indicators
- **hazoom_emoji_7-13.svg**: Special rewards and advanced features
- **Animation**: Bounce effects with rotation for interactive elements
- **Consistency**: Same emoji assets used across web and mobile platforms
- **Effects**: Drop shadows and opacity variations for depth

#### Flutter Implementation Details
- **Asset Loading**: Pre-load emoji SVGs for smooth animations
- **Animation Controller**: Use Flutter's AnimationController for emoji bounce effects
- **State Management**: Track emoji states for achievements and interactions
- **Responsive Design**: Scale emoji sizes based on screen density
- **Performance**: Use cached emoji widgets to avoid re-rendering

#### Flutter Emoji Widget Example
```dart
class HazoomEmoji extends StatefulWidget {
  final int emojiIndex;
  final double size;
  final bool animate;

  const HazoomEmoji({
    Key? key,
    required this.emojiIndex,
    this.size = 60.0,
    this.animate = true,
  }) : super(key: key);

  @override
  _HazoomEmojiState createState() => _HazoomEmojiState();
}

class _HazoomEmojiState extends State<HazoomEmoji>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _rotationAnimation = Tween<double>(begin: -0.05, end: 0.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: widget.animate ? _scaleAnimation.value : 1.0,
          child: Transform.rotate(
            angle: widget.animate ? _rotationAnimation.value : 0.0,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: SvgPicture.asset(
                'assets/hazoom_emoji_${widget.emojiIndex}.svg',
                fit: BoxFit.contain,
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

### 8. Data Flow
```
Flutter App → API Client → Hazoom Backend
    ↓              ↓              ↓
UI Components → State Mgmt → Database/Storage
    ↓              ↓              ↓
Real-time Updates ← WebSocket ← AI Processing
```

### 9. Implementation Phases
1. **Phase 1**: API client and authentication + Emoji asset integration
2. **Phase 2**: Chat system and real-time features with kangaroo avatar
3. **Phase 3**: Educational tabs and content with emoji theming
4. **Phase 4**: Advanced features (RAG, OCR, quizzes) + achievement system
5. **Phase 5**: Polish and animations + emoji consistency across platforms

## Key Backend Endpoints to Integrate

### Authentication
- `POST /flutter/generate-token` - Generate mobile app tokens
- `GET /api/validate-token/{token}` - Validate tokens

### Chat & Communication
- `POST /flutter/process-message` - Process chat messages
- `WebSocket /ws/chat` - Real-time chat
- `GET /api/conversation/history/{user_id}` - Get chat history

### Configuration & Preferences
- `GET /api/users/preferences/{user_id}` - Get user preferences
- `PUT /api/users/preferences/{user_id}` - Update preferences
- `GET /api/model/config` - Get AI model config
- `PUT /api/model/config` - Update model settings

### Educational Features
- `POST /api/rag/documents` - Upload documents for RAG
- `GET /api/rag/query` - Query knowledge base
- `POST /api/process` - General AI processing

### Real-time Features
- `WebSocket /ws/model-updates` - Model status updates
- `WebSocket /ws/config` - Configuration changes

This plan integrates seamlessly with your existing Flutter app while adding the full Hazoom AI educational experience to mobile users.