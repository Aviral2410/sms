# Step-by-Step Implementation Guide

## Quick Start (30 minutes)

### Phase 1: Backend Setup (10 minutes)

#### Step 1.1: Install Ollama
```bash
# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai
```

#### Step 1.2: Start Ollama
```bash
ollama serve

# In another terminal, pull llama model
ollama pull llama2
```

#### Step 1.3: Create FastAPI backend
```bash
mkdir llama-chat-backend
cd llama-chat-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn ollama python-dotenv
```

#### Step 1.4: Create `main.py`
```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ollama import Client
import json

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama client
client = Client(host='http://localhost:11434')

@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    message = body.get("message")
    
    async def generate():
        full_text = ""
        response = client.generate(
            model="llama2",
            prompt=message,
            stream=True,
        )
        
        for chunk in response:
            token = chunk.get("response", "")
            full_text += token
            yield f"data: {json.dumps({'type': 'text', 'content': token})}\n\n"
        
        yield f"data: {json.dumps({'type': 'complete', 'tokens': len(full_text.split())})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Step 1.5: Run backend
```bash
python main.py

# Test it
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Phase 2: Frontend Setup (15 minutes)

#### Step 2.1: Create React project
```bash
# Using Vite (faster)
npm create vite@latest llama-chat-ui -- --template react --typescript
cd llama-chat-ui

# Or using Create React App
npx create-react-app llama-chat-ui --template typescript
cd llama-chat-ui
```

#### Step 2.2: Install dependencies
```bash
npm install lucide-react recharts
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Step 2.3: Configure Tailwind
Update `tailwind.config.js`:
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### Step 2.4: Create chat component
Create `src/ChatUI.tsx` with the implementation from the template file.

#### Step 2.5: Update main App
```tsx
import ChatUI from './ChatUI'
import './index.css'

function App() {
  return <ChatUI />
}

export default App
```

#### Step 2.6: Run frontend
```bash
npm run dev

# Open http://localhost:5173 or http://localhost:3000
```

### Phase 3: Test Integration

#### Test 1: Basic message
1. Open frontend in browser
2. Type: "Hello, tell me about yourself"
3. Click send or press Enter
4. Should see streaming response

#### Test 2: Check backend logs
```bash
# Backend should show:
POST /api/chat - 200 OK
Generating response from llama2...
```

#### Test 3: Long response
Try: "Write a poem about artificial intelligence"
Watch it stream in real-time.

---

## Full Implementation (1-2 hours)

### Step 1: Enhanced Backend

Create `backend/requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
ollama==0.0.47
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

Create `backend/.env`:
```
OLLAMA_HOST=http://localhost:11434
LLAMA_MODEL=llama2
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Create `backend/main.py`:
```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from ollama import Client
import json
import logging
from typing import AsyncGenerator
from pydantic_settings import BaseSettings

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    ollama_host: str = "http://localhost:11434"
    llama_model: str = "llama2"
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()
ollama_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ollama_client
    ollama_client = Client(host=settings.ollama_host)
    logger.info(f"Connected to Ollama at {settings.ollama_host}")
    yield
    # Shutdown
    logger.info("Shutting down")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory conversation storage
conversations: dict = {}

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """Main chat endpoint with streaming"""
    try:
        body = await request.json()
        message = body.get("message", "").strip()
        conversation_id = body.get("conversation_id", "default")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        logger.info(f"[{conversation_id}] New message: {message[:50]}...")
        
        async def generate_response() -> AsyncGenerator[str, None]:
            try:
                # Get conversation history
                if conversation_id not in conversations:
                    conversations[conversation_id] = []
                
                history = conversations[conversation_id]
                
                # Build context from recent messages
                context_messages = history[-6:]  # Last 3 exchanges
                
                # Format conversation
                formatted_prompt = ""
                for msg in context_messages:
                    if msg["role"] == "user":
                        formatted_prompt += f"User: {msg['content']}\n"
                    else:
                        formatted_prompt += f"Assistant: {msg['content']}\n"
                
                formatted_prompt += f"User: {message}\nAssistant:"
                
                # Stream from Ollama
                full_response = ""
                response_generator = ollama_client.generate(
                    model=settings.llama_model,
                    prompt=formatted_prompt,
                    stream=True,
                    options={
                        "num_predict": 512,
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "top_k": 40,
                    }
                )
                
                for chunk in response_generator:
                    token = chunk.get("response", "")
                    full_response += token
                    
                    if token:
                        yield f"data: {json.dumps({'type': 'text', 'content': token})}\n\n"
                
                # Save to history
                conversations[conversation_id].append({
                    "role": "user",
                    "content": message
                })
                conversations[conversation_id].append({
                    "role": "assistant",
                    "content": full_response
                })
                
                # Send completion
                tokens = len(full_response.split())
                yield f"data: {json.dumps({'type': 'complete', 'usage': {'tokens': tokens}})}\n\n"
                
                logger.info(f"[{conversation_id}] Response complete ({tokens} tokens)")
            
            except Exception as e:
                logger.error(f"[{conversation_id}] Error: {str(e)}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    
    except Exception as e:
        logger.error(f"Endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check"""
    return {
        "status": "ok",
        "model": settings.llama_model,
        "host": settings.ollama_host
    }

@app.post("/api/conversations/{conversation_id}/clear")
async def clear_conversation(conversation_id: str):
    """Clear conversation history"""
    if conversation_id in conversations:
        del conversations[conversation_id]
        logger.info(f"Cleared conversation {conversation_id}")
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

### Step 2: Enhanced Frontend

Create `src/hooks/useChat.ts`:
```typescript
import { useState, useCallback } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status: 'sending' | 'streaming' | 'complete' | 'error'
  error?: string
}

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'complete',
      }

      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
      }

      setMessages(prev => [...prev, assistantMessage])

      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, conversation_id: conversationId }),
        })

        if (!response.ok) throw new Error('API error')

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                )
              }
            }
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, status: 'complete' }
              : msg
          )
        )
      } catch (error) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, status: 'error', error: String(error) }
              : msg
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId]
  )

  return { messages, isLoading, sendMessage }
}
```

---

## Debugging Tips

### Backend Issues

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Test chat endpoint directly
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -v

# Check logs
tail -f backend.log
```

### Frontend Issues

```bash
# Check browser console for errors
# Check network tab in DevTools
# Verify CORS headers in response
# Check if API endpoint is correct
```

### Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Cannot POST /api/chat" | Check backend is running on port 8000 |
| CORS error | Add frontend URL to CORS_ORIGINS in .env |
| No streaming response | Check SSE headers are correct |
| Slow responses | Reduce model size or increase GPU memory |
| Message not appearing | Check browser console for JS errors |

---

## Next Steps

1. ✅ Get basic version working
2. 🎨 Customize UI styling
3. 📊 Add component rendering (charts, tables)
4. 💾 Add persistence (save conversations)
5. 🔍 Add search functionality
6. 📱 Make mobile responsive
7. 🚀 Deploy to production

---

## Production Deployment

### Docker Setup

Create `Dockerfile.backend`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"

volumes:
  ollama_data:
```

Run with:
```bash
docker-compose up
```

This comprehensive guide should get you from zero to a working Claude-like AI chat interface!
