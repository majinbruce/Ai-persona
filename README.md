# AI Persona Chatbot

A sophisticated chatbot application that mimics the teaching styles and personalities of two popular programming instructors: **Hitesh Choudhary** and **Piyush Garg**. The application uses advanced prompt engineering to recreate their unique communication patterns, teaching approaches, and personality traits.

## 🎯 Project Overview

This project demonstrates advanced AI persona modeling by:
- Analyzing real communication patterns from YouTube and social media content
- Creating detailed system prompts that capture unique speaking styles
- Implementing smooth persona switching in real-time conversations
- Building a scalable, production-ready web application

## 🏗️ Architecture

```
ai-persona-chatbot/
├── client/                 # React frontend
├── server/                 # Node.js/Express API
├── data-prep/             # Data collection and processing scripts
├── sample-transcripts.md  # Example conversations
└── README.md
```

### Tech Stack
- **Frontend**: React.js with modern hooks and responsive design
- **Backend**: Node.js with Express.js REST API
- **AI Integration**: OpenAI GPT-3.5/4 with custom persona prompts
- **Styling**: Custom CSS with gradient themes and smooth animations
- **Data Processing**: Node.js scripts for content analysis and cleaning

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- OpenAI API key
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-persona-chatbot
```

2. **Install root dependencies**
```bash
npm install
```

3. **Set up the backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. **Set up the frontend**
```bash
cd ../client
npm install
```

5. **Set up data preparation tools (optional)**
```bash
cd ../data-prep
npm install
```

### Environment Configuration

Create a `.env` file in the `server` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
```

### Running the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```
This starts both the frontend (port 3000) and backend (port 5000) concurrently.

#### Individual Services
```bash
# Backend only
npm run server

# Frontend only  
npm run client
```

### Building for Production
```bash
cd client
npm run build
```

## 🧠 Persona Implementation

### Hitesh Choudhary Persona
**Characteristics:**
- Warm, encouraging teaching style
- Uses Hindi/Hinglish expressions ("Haanji", "bilkul")
- Frequently mentions chai (tea) 🫖
- Student-focused approach with regular comprehension checks
- Personal anecdotes from corporate background
- Breaks complex topics into digestible parts

**Example Response:**
> "Haanji! React hooks - ye bilkul amazing concept hai! 🫖 Chai ke saath baith ke samjhate hain ise..."

### Piyush Garg Persona
**Characteristics:**
- Direct, professional communication
- Emphasis on real-world, production-ready solutions
- Focus on clean code and design patterns
- Industry-oriented examples and career advice
- Fast-paced, project-based teaching approach
- Technical precision with practical implementation

**Example Response:**
> "Great question! This is exactly the kind of real-world problem you'll face in the industry. Let me walk you through how we actually build scalable systems in production..."

## 📊 Features

### Core Functionality
- ✅ **Dual Persona System** - Switch between Hitesh and Piyush seamlessly
- ✅ **Real-time Chat Interface** - Modern, responsive chat UI
- ✅ **Conversation Memory** - Maintains context throughout the session
- ✅ **Persona-specific Styling** - Visual cues for each instructor
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Error Handling** - Graceful error management and user feedback

### Advanced Features
- 🔄 **Smooth Persona Switching** - No page reloads, instant transitions
- 💬 **Context Preservation** - Maintains conversation history per persona
- 🎨 **Dynamic Theming** - Color schemes adapt to selected persona
- 🔒 **Rate Limiting** - Built-in API protection
- 📈 **Token Usage Tracking** - Monitor API costs and usage

### Data Processing Pipeline
- 📥 **Content Scraping** - YouTube transcripts and social media content
- 🧹 **Data Cleaning** - Remove noise, format for training
- 🏷️ **Feature Extraction** - Identify persona-specific patterns
- 📝 **Prompt Generation** - Create training examples automatically

## 🔧 API Documentation

### Chat Endpoint
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Can you explain React hooks?",
  "persona": "hitesh",
  "conversationHistory": [...]
}
```

**Response:**
```json
{
  "response": "Haanji! React hooks - ye bilkul amazing concept hai!...",
  "persona": "hitesh",
  "personaName": "Hitesh Choudhary",
  "timestamp": "2024-01-15T10:30:00Z",
  "tokensUsed": 245
}
```

### Available Personas Endpoint
```http
GET /api/chat/personas
```

### Health Check
```http
GET /api/health
```

## 📁 Project Structure

### Frontend (`/client`)
```
src/
├── App.js              # Main React component
├── index.js            # React DOM entry point
├── index.css           # Global styles and animations
└── public/
    └── index.html      # HTML template
```

### Backend (`/server`)
```
├── index.js            # Express server setup
├── routes/
│   └── chat.js         # Chat API routes
├── prompts.js          # Persona system prompts
└── package.json        # Dependencies and scripts
```

### Data Processing (`/data-prep`)
```
├── scraper.js          # Content collection script
├── processor.js        # Data cleaning and analysis
└── README.md           # Data preparation guide
```

## 🎨 Customization

### Adding New Personas
1. Research the new personality's communication style
2. Create a system prompt in `server/prompts.js`
3. Add the persona configuration to `server/routes/chat.js`
4. Update the frontend persona selector in `client/src/App.js`
5. Add appropriate styling and colors

### Modifying Persona Prompts
Edit the prompts in `server/prompts.js`. Key elements to include:
- Personality traits and communication style
- Technical expertise areas
- Unique speech patterns and vocabulary
- Teaching approach and methodology
- Background information

### Styling Customization
The CSS uses CSS variables for easy theming:
```css
:root {
  --hitesh-color: #ff6b35;
  --piyush-color: #4ecdc4;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Persona switching works without losing context
- [ ] Messages display with correct persona styling
- [ ] Conversation history maintained properly
- [ ] Error handling works for API failures
- [ ] Mobile responsiveness across devices
- [ ] Loading states display correctly

### API Testing
```bash
# Test chat endpoint
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","persona":"hitesh"}'

# Test personas endpoint
curl http://localhost:5000/api/chat/personas
```

## 🚢 Deployment

### Production Considerations
1. Set up environment variables for production
2. Configure CORS for your production domain
3. Set up rate limiting and security headers
4. Use a process manager like PM2 for the Node.js server
5. Set up SSL/TLS certificates
6. Configure monitoring and logging

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example for the backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performance Optimization

- **Frontend**: React.memo for component optimization
- **Backend**: Response compression and caching
- **Database**: Consider Redis for session storage
- **API**: Request/response compression
- **Monitoring**: Implement logging for API usage

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**OpenAI API errors:**
- Check your API key in `.env`
- Verify account has sufficient credits
- Check rate limits

**CORS errors:**
- Ensure backend is running on port 5000
- Check CORS configuration in `server/index.js`

**Frontend not loading:**
- Clear browser cache
- Check if backend is accessible
- Verify proxy configuration in client `package.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 🙏 Acknowledgments

- **Hitesh Choudhary** - For inspiring programming education with warmth and accessibility
- **Piyush Garg** - For demonstrating practical, industry-focused teaching
- OpenAI - For providing the GPT models that make this persona modeling possible

---

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the sample transcripts for expected behavior
3. Open an issue on GitHub with detailed reproduction steps

**Happy coding! 🚀**