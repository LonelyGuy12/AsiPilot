import { useState, useEffect } from 'react';
import TopBar from './TopBar';
import StatusBar from './StatusBar';
import PanelLayout from './PanelLayout';
import { useFileStore } from '@/stores/fileStore';

export default function IDEShell() {
  const [layout, setLayout] = useState<'editor' | 'split' | 'preview'>('split');
  const initialize = useFileStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar layout={layout} onLayoutChange={setLayout} />
      <PanelLayout layout={layout} />
      <StatusBar />
    </div>
  );
}
