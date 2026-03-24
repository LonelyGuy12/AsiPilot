import { useState } from 'react';
import { Menu, Play, Shield, Github, Monitor, Columns, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentReview } from '@/hooks/useAgentReview';
import RepoImporter from '@/components/github/RepoImporter';

interface TopBarProps {
  layout: 'editor' | 'split' | 'preview';
  onLayoutChange: (layout: 'editor' | 'split' | 'preview') => void;
}

export default function TopBar({ layout, onLayoutChange }: TopBarProps) {
  const { reviewWorkspace, isReviewing } = useAgentReview();
  const [showImporter, setShowImporter] = useState(false);

  return (
    <>
      <div className="h-10 bg-background border-b border-border flex items-center px-2 gap-2">
        <button className="p-1.5 hover:bg-secondary rounded text-muted-foreground">
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground ml-1">FrontendForge</span>

        <div className="flex-1" />

        {/* Layout toggles */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {([
            { id: 'editor' as const, icon: Monitor, label: 'Editor' },
            { id: 'split' as const, icon: Columns, label: 'Split' },
            { id: 'preview' as const, icon: Eye, label: 'Preview' },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => onLayoutChange(item.id)}
              className={`p-1.5 transition-colors ${
                layout === item.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={item.label}
            >
              <item.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => reviewWorkspace()}
          disabled={isReviewing}
          className="gap-1.5 text-xs"
        >
          <Shield className="w-3.5 h-3.5" />
          {isReviewing ? 'Reviewing...' : 'Review'}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowImporter(true)}
          className="gap-1.5 text-xs"
        >
          <Github className="w-3.5 h-3.5" />
          Import
        </Button>
      </div>

      <RepoImporter open={showImporter} onClose={() => setShowImporter(false)} />
    </>
  );
}
