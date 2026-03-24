import { useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal>();

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

    terminal.writeln('\x1b[1;32m✦ FrontendForge Terminal\x1b[0m');
    terminal.writeln('\x1b[90mConnected to local environment.\x1b[0m');
    terminal.writeln('');
    terminal.write('\x1b[32m❯\x1b[0m ');

    // Simple echo
    let currentLine = '';
    terminal.onKey(({ key, domEvent }) => {
      const char = key;
      if (domEvent.keyCode === 13) {
        terminal.writeln('');
        if (currentLine.trim()) {
          terminal.writeln(`\x1b[90m$ ${currentLine}\x1b[0m`);
          terminal.writeln(`\x1b[33mNote:\x1b[0m Terminal commands run through the server WebSocket. Connect the server to enable command execution.`);
        }
        currentLine = '';
        terminal.write('\x1b[32m❯\x1b[0m ');
      } else if (domEvent.keyCode === 8) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (char.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
        currentLine += char;
        terminal.write(char);
      }
    });

    terminalRef.current = terminal;

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
