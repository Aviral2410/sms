# AI Chat UI Implementation Prompt

## Project Overview
Build a production-grade AI chat interface that mimics Claude's design and functionality, integrated with a self-hosted Llama model backend. The UI should support real-time message rendering, dynamic content generation (charts, code blocks, visualizations), and seamless streaming responses.

## Core Requirements

### 1. Chat Interface Architecture
- **Message Display**: Render user messages and AI responses in a conversation thread
- **Real-time Streaming**: Display AI responses character-by-character or token-by-token as they arrive from the backend
- **Message Types**: Support multiple content types in a single response:
  - Plain text
  - Markdown with code blocks, lists, tables
  - Inline code with syntax highlighting
  - Charts and data visualizations
  - Interactive components (buttons, forms, toggles)
  - Code blocks with copy functionality
  - LaTeX/mathematical equations
  - Structured data (JSON, formatted data)

### 2. Dynamic Content Rendering
The AI should be capable of requesting the UI to render custom components at runtime. Implement a system where:

**Vision**: Users ask questions that may require visual answers. The system should:
- Generate charts automatically when discussing data
- Create code visualizations when explaining algorithms
- Display tables when showing comparisons
- Render interactive diagrams for process flows
- Generate syntax-highlighted code examples
- Create SVG visualizations for data insights

**Examples of Runtime Rendering**:
- User: "Show me a pie chart of my monthly expenses"
  → AI generates chart data → UI renders interactive pie chart in the conversation
- User: "Explain quicksort algorithm"
  → AI provides explanation + generates step-by-step visualizations → UI renders animated diagrams
- User: "Compare React vs Vue"
  → AI provides comparison → UI renders feature comparison table
- User: "Write a login form"
  → AI generates code + interactive preview → UI renders working form component

### 3. Message Input & State Management
- **Input Box**: Floating/fixed text input at bottom, supports multi-line
- **Submission**: Send on Enter, disable during response generation
- **Suggested Prompts**: Show example queries when conversation is empty
- **Message History**: Store and display full conversation
- **Clear Chat**: Option to start new conversation
- **Auto-scroll**: Keep latest message visible

### 4. Backend Integration
Ensure proper API connectivity:

```javascript
// API Endpoint Structure
POST /api/chat
{
  "message": "user message here",
  "conversation_id": "optional-session-id",
  "stream": true // Enable streaming
}

// Response Format (Streaming)
// Server sends Server-Sent Events (SSE) or chunked transfer encoding
data: {"type":"text", "content":"Token or chunk of text"}
data: {"type":"component", "content":{"type":"chart", "data":{...}}}
data: {"type":"complete", "usage":{...}}
```

**Handle**:
- Streaming responses with proper error handling
- Request timeouts and retry logic
- Network failures gracefully
- Rate limiting and throttling
- Conversation context/history management

### 5. UI/UX Design Direction
**Aesthetic**: Clean, minimal, professional with subtle animations
- **Typography**: Use distinctive, refined font pairing
- **Colors**: High-contrast light/dark theme support, accent colors for interactions
- **Spacing**: Generous padding, clear visual hierarchy
- **Animations**: Smooth message entrance, subtle hover states, loading states
- **Visual Feedback**: Loading spinners, typing indicators, message status (sent, delivered, error)

**Key Design Elements**:
- Message bubbles with clear user/AI distinction
- Code blocks with syntax highlighting (Prism.js or Highlight.js)
- Loading state with animated skeleton or spinner
- Error states with retry buttons
- Avatar/indicator for user vs AI
- Timestamp or "just now" indicators
- Copy buttons on code and responses
- Like/dislike feedback buttons on responses

### 6. Advanced Features

#### 6.1 Component Rendering System
Create a component registry that allows the backend to request specific UI components:

```javascript
// Backend sends this in streaming response:
{
  "type": "component",
  "componentType": "chart",
  "props": {
    "chartType": "bar",
    "data": [...],
    "title": "...",
    "xAxis": "...",
    "yAxis": "..."
  }
}

// Or for code visualization:
{
  "type": "component",
  "componentType": "codeEditor",
  "props": {
    "language": "python",
    "code": "...",
    "readOnly": true,
    "theme": "dark"
  }
}

// Or for data tables:
{
  "type": "component",
  "componentType": "dataTable",
  "props": {
    "columns": [...],
    "rows": [...],
    "sortable": true,
    "filterable": true
  }
}
```

Supported Components:
- `chart`: Line, bar, pie, scatter charts (using Chart.js or Recharts)
- `codeBlock`: Syntax-highlighted code with line numbers
- `codeEditor`: Interactive code editor (Monaco or similar)
- `dataTable`: Sortable, filterable data tables
- `diagram`: SVG-based flowcharts, sequence diagrams
- `markdown`: Rich markdown rendering
- `alert`: Informational, warning, error alerts
- `accordion`: Collapsible sections
- `tabs`: Tabbed content
- `button`: Interactive buttons for actions
- `form`: Form inputs and controls
- `imageGallery`: Image carousel or grid
- `timeline`: Chronological event display
- `quotation`: Highlighted quotes or callouts

#### 6.2 Code Execution (Optional but Powerful)
- Display interactive code playgrounds (like sandboxes)
- Allow users to modify and run code snippets
- Show output/results in real-time

#### 6.3 Conversation Management
- **Save conversations**: Store chat history
- **Export**: Download chat as markdown/PDF
- **Search**: Search through conversation history
- **Rename conversations**: Give conversations custom names
- **Branch conversations**: Create alternative paths

### 7. Technical Stack Recommendations

**Frontend**:
- **Framework**: React (preferred) or Vue.js
- **Styling**: Tailwind CSS + CSS-in-JS (Styled Components or Emotion)
- **Markdown**: react-markdown + rehype plugins
- **Code Highlighting**: Prism.js or Highlight.js
- **Charts**: Recharts, Chart.js, or D3.js
- **Icons**: Lucide React or Feather Icons
- **Streaming**: Native Fetch API with ReadableStream or axios with onDownloadProgress
- **State Management**: React Context or Zustand
- **Type Safety**: TypeScript

**Backend Considerations**:
- Stream responses using Server-Sent Events (SSE) or chunked transfer encoding
- Implement proper error handling and validation
- Add request logging for debugging
- Rate limiting and security headers
- CORS configuration for frontend domain

### 8. Critical Implementation Details

#### 8.1 Streaming Response Handling
```javascript
async function* streamChatResponse(message) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
    headers: { 'Content-Type': 'application/json' }
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    buffer = lines.pop(); // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  }
}
```

#### 8.2 Message State Management
```javascript
// Track message states:
- SENDING: Message submitted, awaiting response
- LOADING: Response being generated
- STREAMING: Tokens arriving in real-time
- COMPLETE: Response finished
- ERROR: Request failed

// Each message should have:
- id (unique identifier)
- role ('user' or 'assistant')
- content (text or component array)
- timestamp
- status (above states)
- tokens (for display/analytics)
```

#### 8.3 Error Handling
```javascript
// Handle gracefully:
- Network timeouts (show retry button)
- 4xx errors (show user-friendly error message)
- 5xx errors (show "service unavailable" message)
- Partial responses (show what was received + error message)
- Rate limiting (show countdown timer for retry)
```

### 9. Component Rendering Examples

**Example 1: Bar Chart**
```json
{
  "type": "component",
  "componentType": "chart",
  "props": {
    "type": "bar",
    "title": "Monthly Revenue",
    "data": {
      "labels": ["Jan", "Feb", "Mar"],
      "datasets": [{
        "label": "Revenue",
        "data": [1200, 1900, 3000],
        "backgroundColor": "#3b82f6"
      }]
    }
  }
}
```

**Example 2: Code Block with Execution**
```json
{
  "type": "component",
  "componentType": "codeBlock",
  "props": {
    "language": "python",
    "code": "def fibonacci(n):\n  if n <= 1:\n    return n\n  return fibonacci(n-1) + fibonacci(n-2)",
    "executable": false,
    "showLineNumbers": true
  }
}
```

**Example 3: Data Comparison Table**
```json
{
  "type": "component",
  "componentType": "dataTable",
  "props": {
    "columns": ["Feature", "React", "Vue", "Angular"],
    "rows": [
      ["Learning Curve", "Easy", "Easy", "Steep"],
      ["Bundle Size", "Medium", "Small", "Large"],
      ["Performance", "Fast", "Very Fast", "Fast"]
    ],
    "striped": true,
    "hoverable": true
  }
}
```

### 10. Performance Optimizations
- **Lazy Load Components**: Only render visible components initially
- **Virtual Scrolling**: For long conversations with many messages
- **Code Splitting**: Load chart/visualization libraries on demand
- **Debounce Input**: Debounce input changes to reduce re-renders
- **Memoization**: Use React.memo for chat message components
- **Image Optimization**: Lazy load and compress images

### 11. Accessibility
- **ARIA Labels**: Proper labels for screen readers
- **Keyboard Navigation**: Full keyboard support for sending, scrolling
- **Color Contrast**: Ensure WCAG AA compliance
- **Focus Management**: Clear focus states
- **Semantic HTML**: Use proper HTML structure

### 12. Testing Considerations
- **Unit Tests**: Test message formatting, component rendering
- **Integration Tests**: Test API integration and streaming
- **E2E Tests**: Test full chat flow
- **Visual Regression**: Test UI consistency across updates
- **Performance Tests**: Measure load time and response times

## Implementation Checklist

- [ ] Set up base React/Vue project with TypeScript
- [ ] Implement message list component with scroll management
- [ ] Build input box component with state management
- [ ] Create streaming response parser
- [ ] Integrate backend API endpoint
- [ ] Implement markdown rendering
- [ ] Add syntax highlighting for code blocks
- [ ] Build component registry for dynamic rendering
- [ ] Create chart/data visualization components
- [ ] Implement error handling and retry logic
- [ ] Add loading states and animations
- [ ] Style UI to match design vision
- [ ] Test streaming with backend
- [ ] Optimize performance
- [ ] Add accessibility features
- [ ] Document component API

## Prompt Template for AI to Generate UI Components

When asking your backend AI to generate components, use structured prompts:

```
Generate a response to: "[USER QUESTION]"

Important: When appropriate, include component rendering instructions in JSON blocks like this:

For data visualization needs, include:
{"type": "component", "componentType": "chart", "props": {...}}

For code examples, include:
{"type": "component", "componentType": "codeBlock", "props": {...}}

For comparisons, include:
{"type": "component", "componentType": "dataTable", "props": {...}}

After component definitions, provide the text explanation.
```

## Notes for Your Backend

- **Llama Model Setup**: Ensure Llama is properly configured for streaming responses
- **Token Limits**: Set appropriate max_tokens to control response length
- **Temperature/Sampling**: Configure for coherent, useful responses
- **Context Window**: Manage conversation history to fit within token limits
- **Response Formatting**: Train/prompt model to output valid JSON for components
- **Error Handling**: Gracefully handle model failures and incomplete responses

---

This prompt provides everything needed to build a production-grade AI chat UI that rivals Claude's design and functionality while being deeply customizable for your specific use case.
