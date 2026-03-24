import { useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getSocket } from '@/services/socket';
import { WS_EVENTS } from '@asipilot/shared';
import { useEditorStore } from '@/stores/editorStore';
import { useEnvStore } from '@/stores/envStore';
import 'xterm/css/xterm.css';

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal>();
  
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const openFiles = useEditorStore((s) => s.openFiles);
  const environment = useEnvStore((s) => s.environment);

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#080810',
        foreground: '#e8e8e8',
        cursor: '#81f084',
        selectionBackground: '#81f08433',
        black: '#1a1a2a',
        red: '#f07178',
        green: '#81f084',
        yellow: '#ffcb6b',
        blue: '#82aaff',
        magenta: '#c792ea',
        cyan: '#89ddff',
        white: '#e8e8e8',
      },
      fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminal.writeln('\x1b[1;32m✦ AsiPilot Terminal\x1b[0m');
    terminal.writeln('\x1b[90mConnected to local environment.\x1b[0m');
    terminal.writeln('');
    terminal.write('\x1b[32m❯\x1b[0m ');

    terminalRef.current = terminal;

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  useEffect(() => {
    const handleExecute = () => {
      if (!activeFilePath) return;
      const file = openFiles[activeFilePath];
      if (!file || !environment) return;

      terminalRef.current?.clear();
      terminalRef.current?.writeln(`\x1b[33mRunning ${file.path}...\x1b[0m\n`);
      
      const socket = getSocket();
      socket.emit(WS_EVENTS.EXECUTE_REQUEST, {
        language: environment,
        content: file.content
      });
    };

    window.addEventListener('asipilot:execute', handleExecute);
    return () => window.removeEventListener('asipilot:execute', handleExecute);
  }, [activeFilePath, openFiles, environment]);

  useEffect(() => {
    const socket = getSocket();
    
    const onToken = (data: { token: string; isError?: boolean }) => {
      const color = data.isError ? '\x1b[31m' : '\x1b[0m';
      const text = data.token.replace(/\n/g, '\r\n');
      terminalRef.current?.write(`${color}${text}\x1b[0m`);
    };
    
    const onComplete = () => {
      terminalRef.current?.writeln('\n\n\x1b[32m❯ Execution finished.\x1b[0m ');
    };
    
    const onError = (data: { error: string }) => {
      terminalRef.current?.writeln(`\r\n\x1b[31m[Error] ${data.error}\x1b[0m\r\n`);
      terminalRef.current?.writeln('\x1b[32m❯\x1b[0m ');
    };

    socket.on(WS_EVENTS.EXECUTE_TOKEN, onToken);
    socket.on(WS_EVENTS.EXECUTE_COMPLETE, onComplete);
    socket.on(WS_EVENTS.EXECUTE_ERROR, onError);

    return () => {
      socket.off(WS_EVENTS.EXECUTE_TOKEN, onToken);
      socket.off(WS_EVENTS.EXECUTE_COMPLETE, onComplete);
      socket.off(WS_EVENTS.EXECUTE_ERROR, onError);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
