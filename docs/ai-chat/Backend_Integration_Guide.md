# Backend Integration Guide for AI Chat UI

## Overview
This guide covers setting up your self-hosted Llama backend to work with the Claude-like AI chat UI. Focus is on streaming responses and structured component rendering.

## Backend Requirements

### 1. Streaming Endpoint (`/api/chat`)

Your backend should expose a streaming endpoint that handles chat requests and returns Server-Sent Events (SSE) or chunked responses.

```python
# Python FastAPI Example
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import json
from typing import AsyncGenerator

app = FastAPI()

@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse:
    body = await request.json()
    user_message = body.get("message")
    conversation_id = body.get("conversation_id")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        # Your Llama model inference here
        response_generator = generate_llama_response(
            message=user_message,
            conversation_id=conversation_id
        )
        
        for chunk in response_generator:
            # Chunk format: {"type": "text", "content": "..."}
            # or: {"type": "component", "componentType": "...", "props": {...}}
            json_str = json.dumps(chunk)
            yield f"data: {json_str}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### 2. Response Format

Your Llama backend should structure responses with these event types:

#### Text Streaming
```json
{
  "type": "text",
  "content": "This is part of the response..."
}
```

#### Component Rendering
```json
{
  "type": "component",
  "componentType": "chart",
  "props": {
    "type": "bar",
    "title": "Sales Data",
    "data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [{
        "label": "Revenue",
        "data": [1000, 1500, 2000, 2500],
        "backgroundColor": "#3b82f6"
      }]
    }
  }
}
```

#### Completion Signal
```json
{
  "type": "complete",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 320,
    "total_tokens": 470
  }
}
```

### 3. Llama Model Configuration

#### Using Ollama (Recommended)
```bash
# Pull Llama model
ollama pull llama2

# Run with API server
ollama serve

# Test endpoint
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama2",
    "prompt": "Hello, how are you?",
    "stream": true
  }'
```

#### Using llama-cpp-python
```python
from llama_cpp import Llama

llm = Llama(
    model_path="./models/llama-2-7b-chat.gguf",
    n_gpu_layers=35,  # GPU acceleration
    n_ctx=2048,       # Context window
    verbose=False,
)

response = llm(
    "What is machine learning?",
    max_tokens=256,
    temperature=0.7,
    top_p=0.95,
    echo=False,
)

print(response['choices'][0]['text'])
```

#### Using vLLM
```python
from vllm import LLM, SamplingParams

llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")
sampling_params = SamplingParams(temperature=0.7, top_p=0.95, max_tokens=256)

outputs = llm.generate("Tell me about AI", sampling_params)
```

### 4. Complete FastAPI Implementation

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ollama import Client
import json
import asyncio
from typing import AsyncGenerator

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama client
ollama_client = Client(host='http://localhost:11434')

# Store conversation history
conversations = {}

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """Stream chat responses with optional component rendering"""
    try:
        body = await request.json()
        message = body.get("message", "")
        conversation_id = body.get("conversation_id", "default")
        
        if not message:
            return StreamingResponse(
                error_generator("Message is required"),
                media_type="text/event-stream"
            )
        
        async def generate_response() -> AsyncGenerator[str, None]:
            # Get conversation history
            if conversation_id not in conversations:
                conversations[conversation_id] = []
            
            history = conversations[conversation_id]
            
            # Build messages for context
            messages = [
                {
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                }
                for msg in history[-5:]  # Keep last 5 messages for context
            ]
            messages.append({"role": "user", "content": message})
            
            # System prompt to encourage structured output
            system_prompt = """You are a helpful AI assistant. When the user asks for:
- Data visualization: Include JSON like {"type": "component", "componentType": "chart", "props": {...}}
- Code examples: Include JSON like {"type": "component", "componentType": "codeBlock", "props": {...}}
- Comparisons: Include JSON like {"type": "component", "componentType": "dataTable", "props": {...}}

Always provide helpful text explanations alongside any components."""
            
            try:
                # Stream from Ollama
                full_response = ""
                async for chunk in stream_ollama_response(
                    messages=messages,
                    system_prompt=system_prompt
                ):
                    full_response += chunk
                    
                    # Try to parse and send as structured data
                    if chunk:
                        # Send as text chunk
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
                
                # Store in history
                conversations[conversation_id].append({
                    "role": "user",
                    "content": message
                })
                conversations[conversation_id].append({
                    "role": "assistant",
                    "content": full_response
                })
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'complete', 'usage': {'tokens': len(full_response.split())}})}\n\n"
                
            except Exception as e:
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
        return StreamingResponse(
            error_generator(str(e)),
            media_type="text/event-stream"
        )


async def stream_ollama_response(messages: list, system_prompt: str):
    """Stream response from Ollama"""
    try:
        # Format message for Ollama
        formatted_prompt = format_chat_prompt(messages)
        
        # Stream from Ollama
        response = ollama_client.generate(
            model="llama2",
            prompt=formatted_prompt,
            system=system_prompt,
            stream=True,
            options={
                "num_predict": 512,
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
            }
        )
        
        for chunk in response:
            if chunk.get("response"):
                yield chunk["response"]
            
            # Check if done
            if chunk.get("done"):
                break
    
    except Exception as e:
        yield f"Error: {str(e)}"


def format_chat_prompt(messages: list) -> str:
    """Format messages into prompt string for Llama"""
    prompt = ""
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "user":
            prompt += f"User: {content}\n"
        else:
            prompt += f"Assistant: {content}\n"
    
    prompt += "Assistant: "
    return prompt


async def error_generator(error_message: str):
    """Generate error response"""
    yield f"data: {json.dumps({'type': 'error', 'error': error_message})}\n\n"


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": "llama2",
        "endpoint": "http://localhost:11434"
    }


@app.post("/api/clear/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """Clear conversation history"""
    if conversation_id in conversations:
        del conversations[conversation_id]
    return {"status": "cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 5. Advanced: Component Generation from Llama

To make Llama generate proper component structures, implement a prompt that guides it:

```python
def create_smart_response(user_message: str, context: str = "") -> AsyncGenerator[str, None]:
    """
    Generate response with Llama, parsing for component directives
    """
    
    # Detect if response needs components
    needs_components = any(keyword in user_message.lower() for keyword in [
        "chart", "graph", "visualize", "compare", "table", "code",
        "show", "display", "analyze", "data", "example"
    ])
    
    system_prompt = f"""You are a helpful AI assistant. {
        "When providing data analysis, comparisons, or code examples, structure your response as:
        
1. Start with text explanation
2. Include structured components in JSON blocks enclosed in <component> tags:
   <component>
   {{"type": "component", "componentType": "chart", "props": {{...}}}}
   </component>
        
3. Continue with additional explanation" if needs_components else ""
    }
    
Available component types: chart, codeBlock, dataTable, diagram"""
    
    # Generate with Llama
    response = ""
    for chunk in ollama_client.generate(
        model="llama2",
        prompt=f"{context}\n\nUser: {user_message}\n\nAssistant:",
        system=system_prompt,
        stream=True
    ):
        token = chunk.get("response", "")
        response += token
        
        # Look for component markers
        if "<component>" in response:
            # Extract and parse component
            start = response.find("<component>") + len("<component>")
            end = response.find("</component>")
            
            if end > start:
                try:
                    component_json = response[start:end].strip()
                    component = json.loads(component_json)
                    yield json.dumps(component) + "\n"
                    
                    # Remove processed component from response
                    response = response[:start - len("<component>")] + response[end + len("</component>"):]
                except json.JSONDecodeError:
                    pass
        
        yield f"data: {json.dumps({'type': 'text', 'content': token})}\n\n"
```

### 6. Error Handling

```python
class ChatError(Exception):
    pass

@app.exception_handler(ChatError)
async def chat_error_handler(request: Request, exc: ChatError):
    return StreamingResponse(
        error_generator(str(exc)),
        status_code=400,
        media_type="text/event-stream"
    )

# Validate inputs
def validate_chat_request(body: dict):
    message = body.get("message", "").strip()
    if not message:
        raise ChatError("Message cannot be empty")
    if len(message) > 5000:
        raise ChatError("Message exceeds maximum length")
    return message
```

### 7. Performance Optimization

```python
# Use caching for repeated queries
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_cached_response(prompt_hash: str):
    # Return cached response if available
    pass

def hash_prompt(prompt: str) -> str:
    return hashlib.md5(prompt.encode()).hexdigest()

# Implement request queuing
from asyncio import Queue

request_queue = Queue(maxsize=10)

async def process_queue():
    while True:
        request = await request_queue.get()
        # Process request
        request_queue.task_done()
```

## Testing

```python
# Test with curl
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me a bar chart of monthly sales",
    "conversation_id": "test-conv"
  }'

# Test with Python
import requests

response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "message": "Explain quicksort algorithm with code",
        "conversation_id": "test"
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode())
```

## Deployment Considerations

1. **Rate Limiting**: Implement to prevent abuse
2. **Authentication**: Add API keys or JWT tokens
3. **Monitoring**: Log requests, errors, and performance metrics
4. **Load Balancing**: Handle multiple concurrent requests
5. **Resource Management**: Monitor GPU/CPU usage with Llama
6. **Timeout Handling**: Set appropriate request timeouts

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to `allow_origins` |
| Connection refused | Ensure Ollama is running on correct port |
| Slow responses | Increase GPU layers, reduce context window |
| Memory issues | Use smaller model (7B instead of 70B) |
| No streaming | Check `stream=True` in request and response headers |

This setup enables real-time, interactive AI responses with rich component rendering!
