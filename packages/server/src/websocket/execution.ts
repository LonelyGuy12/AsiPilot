import { Socket } from 'socket.io';
import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { WS_EVENTS } from '@asipilot/shared';
import { logger } from '../utils/logger.js';
import type { WSExecuteRequest } from '@asipilot/shared';

// Time limit for execution to prevent infinite loops (10 seconds)
const EXECUTION_TIMEOUT_MS = 10000;

export async function handleCodeExecution(socket: Socket, data: WSExecuteRequest) {
  const { language, content } = data;
  let tempDir: string | null = null;
  
  try {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asipilot-exec-'));
    
    if (language === 'python') {
      if (!tempDir) throw new Error("Temp dir not created");
      const dir = tempDir;
      const filePath = path.join(dir, 'main.py');
      await fs.writeFile(filePath, content, 'utf-8');
      
      await runProcess(socket, 'python3', [filePath]);
    } else if (language === 'java') {
      if (!tempDir) throw new Error("Temp dir not created");
      const dir = tempDir;
      const filePath = path.join(dir, 'Main.java');
      await fs.writeFile(filePath, content, 'utf-8');
      
      // Compile Java First
      await new Promise<void>((resolve, reject) => {
        exec(`javac Main.java`, { cwd: dir, timeout: 5000 }, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: stderr || error.message, isError: true });
            reject(new Error('Compilation Failed'));
          } else {
            resolve();
          }
        });
      });
      
      // Run Java class
      await runProcess(socket, 'java', ['Main'], tempDir);
    } else {
      socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: `Unsupported language: ${language}`, isError: true });
      socket.emit(WS_EVENTS.EXECUTE_COMPLETE, {});
    }
  } catch (err) {
    logger.error('Execution setup error', err);
    socket.emit(WS_EVENTS.EXECUTE_ERROR, { error: (err as Error).message });
    socket.emit(WS_EVENTS.EXECUTE_COMPLETE, {});
  } finally {
    // Cleanup
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        logger.error(`Failed to cleanup temp dir ${tempDir}`, e);
      }
    }
  }
}

function runProcess(socket: Socket, command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    
    let isFinished = false;

    const timeoutPath = setTimeout(() => {
      if (!isFinished) {
        child.kill('SIGTERM');
        socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: '\n[Execution Terminated: Timeout (10s)]', isError: true });
      }
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: data.toString() });
    });

    child.stderr.on('data', (data) => {
      socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: data.toString(), isError: true });
    });

    child.on('close', (code) => {
      isFinished = true;
      clearTimeout(timeoutPath);
      socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: `\n[Process exited with code ${code}]` });
      socket.emit(WS_EVENTS.EXECUTE_COMPLETE, {});
      resolve();
    });

    child.on('error', (err) => {
      isFinished = true;
      clearTimeout(timeoutPath);
      socket.emit(WS_EVENTS.EXECUTE_TOKEN, { token: `\n[Process error: ${err.message}]`, isError: true });
      socket.emit(WS_EVENTS.EXECUTE_COMPLETE, {});
      reject(err);
    });
  });
}
