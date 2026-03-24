import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Sidebar from './Sidebar';
import MultiFileEditor from '@/components/editor/MultiFileEditor';
import LivePreview from '@/components/preview/LivePreview';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import AIChatPanel from '@/components/ai/AIChatPanel';
import AgentResultsPanel from '@/components/ai/AgentResultsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PanelLayoutProps {
  layout: 'editor' | 'split' | 'preview';
}

function ResizeHandle({ direction = 'vertical' }: { direction?: 'vertical' | 'horizontal' }) {
  return (
    <PanelResizeHandle
      className={`group relative ${direction === 'vertical' ? 'w-1 hover:w-1.5' : 'h-1 hover:h-1.5'} bg-border/50 hover:bg-primary/30 transition-all`}
    >
      <div className={`absolute ${direction === 'vertical' ? 'inset-y-0 -left-0.5 -right-0.5' : 'inset-x-0 -top-0.5 -bottom-0.5'}`} />
    </PanelResizeHandle>
  );
}

export default function PanelLayout({ layout }: PanelLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="flex-1 min-h-0">
      {/* Left: Sidebar */}
      <Panel defaultSize={18} minSize={10} maxSize={25} collapsible>
        <Sidebar />
      </Panel>

      <ResizeHandle direction="vertical" />

      {/* Center: Editor + Terminal */}
      <Panel defaultSize={52} minSize={30}>
        <PanelGroup direction="vertical">
          {/* Editor / Preview area */}
          <Panel defaultSize={65} minSize={30}>
            {layout === 'editor' && <MultiFileEditor />}
            {layout === 'preview' && <LivePreview />}
            {layout === 'split' && (
              <PanelGroup direction="horizontal">
                <Panel defaultSize={50}>
                  <MultiFileEditor />
                </Panel>
                <ResizeHandle direction="vertical" />
                <Panel defaultSize={50}>
                  <LivePreview />
                </Panel>
              </PanelGroup>
            )}
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Bottom: Terminal + Agent Results */}
          <Panel defaultSize={35} minSize={15} collapsible>
            <Tabs defaultValue="terminal" className="h-full flex flex-col">
              <TabsList className="h-8 rounded-none border-b border-border bg-background justify-start px-2">
                <TabsTrigger value="terminal" className="text-xs h-7">Terminal</TabsTrigger>
                <TabsTrigger value="agents" className="text-xs h-7">Agent Results</TabsTrigger>
                <TabsTrigger value="console" className="text-xs h-7">Console</TabsTrigger>
              </TabsList>
              <TabsContent value="terminal" className="flex-1 min-h-0 mt-0">
                <TerminalPanel />
              </TabsContent>
              <TabsContent value="agents" className="flex-1 min-h-0 mt-0 overflow-auto">
                <AgentResultsPanel />
              </TabsContent>
              <TabsContent value="console" className="flex-1 min-h-0 mt-0 p-3">
                <p className="text-xs text-muted-foreground">Console output from the preview iframe will appear here.</p>
              </TabsContent>
            </Tabs>
          </Panel>
        </PanelGroup>
      </Panel>

      <ResizeHandle direction="vertical" />

      {/* Right: AI Chat */}
      <Panel defaultSize={30} minSize={20} maxSize={40} collapsible>
        <AIChatPanel />
      </Panel>
    </PanelGroup>
  );
}
