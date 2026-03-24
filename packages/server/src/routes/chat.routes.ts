import { Router, Request, Response } from 'express';
import { asi1 } from '../services/asi1-client.js';
import { defaultLimiter } from '../middleware/rate-limit.middleware.js';
import type { ASI1Message, ChatRequest } from '@frontendforge/shared';

const router = Router();

router.post('/', defaultLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history = [], stream = true } = req.body as ChatRequest;

    if (!message) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Message is required' } });
    }

    const messages: ASI1Message[] = [
      {
        role: 'system',
        content: 'You are FrontendForge AI, an expert frontend development assistant. You help with HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Next.js, Tailwind CSS, and all frontend technologies. Provide clear, concise, and accurate code with explanations. When showing code, use appropriate language tags in code blocks.',
      },
      ...history,
      { role: 'user', content: message },
    ];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const generator = asi1.chatStream(messages);
      for await (const token of generator) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await asi1.chat(messages);
      res.json({ success: true, data: response });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'CHAT_ERROR', message: (error as Error).message } });
  }
});

export { router as chatRoutes };
