import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, RefreshCw, AlertCircle } from 'lucide-react';

// ============================================================================
// MESSAGE TYPE DEFINITIONS
// ============================================================================

interface UserMessage {
  id: string;
  role: 'user';
  content: string;
  timestamp: Date;
}

interface Component {
  type: 'component';
  componentType: string;
  props: Record<string, any>;
}

interface AssistantMessage {
  id: string;
  role: 'assistant';
  content: (string | Component)[];
  timestamp: Date;
  status: 'streaming' | 'complete' | 'error';
  error?: string;
}

type Message = UserMessage | AssistantMessage;

// ============================================================================
// HOOKS FOR STREAMING
// ============================================================================

async function* streamChatResponse(message: string, conversationId?: string) {
  try {
    const response = await fetch('http://localhost:8000/api/chat', { // Adjust URL to your backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch (e) {
            console.error('JSON parse error:', e, 'line:', line);
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          yield data;
        } catch (e) {
          console.error('Final buffer parse error:', e);
        }
      }
    }
  } catch (error) {
    yield { type: 'error', error: String(error) };
  }
}

// ============================================================================
// COMPONENT RENDERERS
// ============================================================================

interface ChartProps {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: any;
  [key: string]: any;
}

const ChartComponent: React.FC<ChartProps> = ({ type, title, data }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 my-4">
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      {/* Placeholder - integrate with Recharts, Chart.js, or similar */}
      <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Chart: {type}</p>
      </div>
    </div>
  );
};

const CodeBlockComponent: React.FC<{ language: string; code: string; showLineNumbers?: boolean }> = ({
  language,
  code,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto relative group">
      <div className="absolute top-2 right-2 flex gap-2">
        <span className="text-xs text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Copy code"
        >
          <Copy size={16} />
        </button>
      </div>
      <pre className="pt-8 whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
      {copied && (
        <div className="absolute bottom-2 right-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
          Copied!
        </div>
      )}
    </div>
  );
};

const DataTableComponent: React.FC<{ columns: string[]; rows: any[][]; striped?: boolean }> = ({
  columns,
  rows,
  striped = true,
}) => {
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={striped && rowIdx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component registry
const componentRegistry: Record<string, React.ComponentType<any>> = {
  chart: ChartComponent,
  codeBlock: CodeBlockComponent,
  dataTable: DataTableComponent,
};

const DynamicComponent: React.FC<{ component: Component }> = ({ component }) => {
  const Component = componentRegistry[component.componentType];

  if (!Component) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded p-4 my-4">
        <p className="text-red-800 dark:text-red-200">Unknown component: {component.componentType}</p>
      </div>
    );
  }

  return <Component {...component.props} />;
};

// ============================================================================
// MESSAGE RENDERING
// ============================================================================

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`max-w-2xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div>
            {(message as AssistantMessage).content.map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <p key={idx} className="whitespace-pre-wrap mb-2 last:mb-0">
                    {item}
                  </p>
                );
              } else {
                return <DynamicComponent key={idx} component={item} />;
              }
            })}

            {(message as AssistantMessage).status === 'streaming' && (
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
              </div>
            )}

            {(message as AssistantMessage).status === 'error' && (
              <div className="flex gap-2 items-start mt-2 p-2 bg-red-50 dark:bg-red-900 rounded border border-red-200 dark:border-red-700">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-200 text-sm">{(message as AssistantMessage).error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================

const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => `conv_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: UserMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create assistant message shell
    const assistantMessageId = `msg_${Date.now() + 1}`;
    const assistantMessage: AssistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: [],
      timestamp: new Date(),
      status: 'streaming',
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      let textBuffer = '';
      let currentContent: (string | Component)[] = [];

      for await (const chunk of streamChatResponse(input, conversationId)) {
        if (chunk.type === 'error') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, status: 'error' as const, error: chunk.error }
                : msg
            )
          );
          return;
        }

        if (chunk.type === 'text') {
          textBuffer += chunk.content;
          currentContent = [textBuffer];
        } else if (chunk.type === 'component') {
          if (textBuffer) {
            currentContent.push(textBuffer);
            textBuffer = '';
          }
          currentContent.push(chunk);
        }

        // Update the message in state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: currentContent }
              : msg
          )
        );
      }

      // Mark as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, status: 'complete' as const } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, status: 'error' as const, error: String(error) }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Powered by Llama</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start a conversation</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xs">
              Ask me anything. I can help with code, data analysis, and much more.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg px-4 py-3 transition-colors flex items-center justify-center"
            title="Send message"
          >
            {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
