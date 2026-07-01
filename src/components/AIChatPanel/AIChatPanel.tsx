import { useState, useRef, useEffect } from 'react';
import { FiSend, FiX, FiMessageSquare } from 'react-icons/fi';
import { aiApi, type ChatRequest } from '@/apis/ai.api';
// Avatar component expects user prop, but we'll use a simple div for user avatar

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

interface AIChatPanelProps {
  problemId?: number;
  problemTitle?: string;
  problemDescription?: string;
  currentCode?: string;
  language?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AIChatPanel = ({
  problemId,
  problemTitle,
  problemDescription,
  currentCode,
  language,
  isOpen,
  onClose
}: AIChatPanelProps) => {
  // Separate messages for each context
  const [problemMessages, setProblemMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm an AI Assistant. I can help you with this problem or answer questions about programming. What would you like to ask?",
      isUser: false
    }
  ]);
  const [generalMessages, setGeneralMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm an AI Assistant. I can help you with questions about programming, algorithms, data structures, and best practices. What would you like to ask?",
      isUser: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatContext, setChatContext] = useState<'problem' | 'general'>('problem');
  
  // Get current messages based on context
  const messages = chatContext === 'problem' ? problemMessages : generalMessages;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const shouldScrollRef = useRef(false); // Flag to control when to scroll

  // Auto scroll to bottom only when AI responds (not when user sends message or panel opens)
  useEffect(() => {
    // Skip scroll on first render (when panel opens)
    if (isFirstRender.current && isOpen) {
      isFirstRender.current = false;
      return;
    }
    
    // Only scroll if flag is set (when AI responds) - scroll within container only
    if (shouldScrollRef.current && chatContainerRef.current && isOpen) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          // Scroll container to bottom, not the whole page
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          shouldScrollRef.current = false; // Reset flag
        }
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true
    };

    // Don't scroll when user sends message
    shouldScrollRef.current = false;
    
    // Update messages based on current context
    if (chatContext === 'problem') {
      setProblemMessages(prev => [...prev, userMessage]);
    } else {
      setGeneralMessages(prev => [...prev, userMessage]);
    }
    setInputMessage('');
    setIsLoading(true);

    // Create AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      isStreaming: true
    };
    
    // Add AI message to correct context
    if (chatContext === 'problem') {
      setProblemMessages(prev => [...prev, aiMessage]);
    } else {
      setGeneralMessages(prev => [...prev, aiMessage]);
    }

    try {
      const chatRequest: ChatRequest = {
        message: userMessage.content,
        problemId: chatContext === 'problem' ? problemId : undefined,
        code: chatContext === 'problem' ? currentCode : undefined,
        language: chatContext === 'problem' ? language : undefined,
        context: chatContext
      };

      console.log('🚀 Sending AI chat request:', chatRequest);
      
      await aiApi.generateStreamingResponse(
        chatRequest,
        (chunk) => {
          console.log('📥 Received chunk:', chunk);
          // Enable scroll when AI starts responding
          shouldScrollRef.current = true;
          
          // Update messages in correct context
          if (chatContext === 'problem') {
            setProblemMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          } else {
            setGeneralMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          }
        },
        (error) => {
          console.error('❌ AI Chat error:', error);
          
          // Update error message in correct context
          if (chatContext === 'problem') {
            setProblemMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: "Sorry, an error occurred: " + error, isStreaming: false }
                  : msg
              )
            );
          } else {
            setGeneralMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: "Sorry, an error occurred: " + error, isStreaming: false }
                  : msg
              )
            );
          }
          setIsLoading(false);
        },
        () => {
          console.log('✅ AI Chat completed');
          
          // Mark streaming as complete in correct context
          if (chatContext === 'problem') {
            setProblemMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
              )
            );
          } else {
            setGeneralMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
              )
            );
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      // Update error in correct context
      if (chatContext === 'problem') {
        setProblemMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: "Sorry, an error occurred. Please try again.", isStreaming: false }
              : msg
          )
        );
      } else {
        setGeneralMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: "Sorry, an error occurred. Please try again.", isStreaming: false }
              : msg
          )
        );
      }
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Context Toggle */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Context:</span>
          <button
            onClick={() => {
              setChatContext('problem');
              // Reset first render flag when switching context
              isFirstRender.current = true;
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              chatContext === 'problem'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => {
              setChatContext('general');
              // Reset first render flag when switching context
              isFirstRender.current = true;
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              chatContext === 'general'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            General
          </button>
        </div>
        {chatContext === 'problem' && problemTitle && (
          <p className="text-xs text-gray-500 mt-1 truncate" title={problemTitle}>
            {problemTitle}
          </p>
        )}
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        style={{ 
          overscrollBehavior: 'contain', // Prevent scroll from bubbling to parent page
          isolation: 'isolate' // Create new stacking context to isolate scroll
        }}
        onScroll={(e) => {
          // Prevent scroll event from bubbling to parent
          e.stopPropagation();
        }}
        onWheel={(e) => {
          // Prevent wheel events from bubbling to parent when at scroll boundaries
          const container = chatContainerRef.current;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // If scrolling up at top or down at bottom, prevent default to stop page scroll
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
              e.stopPropagation();
            }
          }
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isUser && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
              </p>
            </div>
            {message.isUser && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-3 pt-2 pb-3 bg-gray-50 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                // Prevent any default scroll behavior
                const target = e.target as HTMLTextAreaElement;
                target.blur(); // Remove focus to prevent any scroll
                setTimeout(() => {
                  handleSendMessage();
                }, 0);
              }
            }}
            placeholder="Enter your question..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIChatPanel;

