import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles, Bug, TestTube2, Zap } from 'lucide-react';
import { useASI1Chat } from '@/hooks/useASI1Chat';
import { useAIStore } from '@/stores/aiStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AIChatPanel() {
  const { sendMessage, stopGeneration, isStreaming } = useASI1Chat();
  const messages = useAIStore((s) => s.messages);
  const streamingMessage = useAIStore((s) => s.streamingMessage);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    sendMessage(input.trim(), history);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: Sparkles, label: 'Explain', prefix: 'Explain this code:\n' },
    { icon: Bug, label: 'Fix', prefix: 'Fix any issues in this code:\n' },
    { icon: TestTube2, label: 'Tests', prefix: 'Write unit tests for this code:\n' },
    { icon: Zap, label: 'Optimize', prefix: 'Optimize this code for performance:\n' },
  ];

  return (
    <div className="flex flex-col h-full bg-card/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Powered by ASI-1 Mini</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/40" />
            <p className="font-medium">How can I help?</p>
            <p className="text-xs mt-1">Ask about your code, request fixes, or get explanations.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[90%] text-sm',
              msg.role === 'user' ? 'ml-auto' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'px-4 py-3 rounded-2xl whitespace-pre-wrap break-words',
                msg.role === 'user'
                  ? 'bg-primary/10 rounded-br-md'
                  : 'liquid-glass rounded-bl-md'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="mr-auto max-w-[90%] text-sm">
            <div className="liquid-glass px-4 py-3 rounded-2xl rounded-bl-md whitespace-pre-wrap">
              {streamingMessage}
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-1.5 border-t border-border/50">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => setInput(action.prefix)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (⌘+Enter to send)"
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
          />
          {isStreaming ? (
            <Button size="icon" variant="ghost" onClick={stopGeneration}>
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="default"
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
