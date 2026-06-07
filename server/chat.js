import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.CHAT_SERVER_PORT ?? 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    return;
  }

  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system:
        'You are Crew, a friendly travel planning assistant. Help users discover trips, plan itineraries, and answer travel questions concisely.',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const payload = JSON.stringify({
          type: 'content_block_delta',
          delta: { text: event.delta.text },
        });
        res.write(`data: ${payload}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stream failed';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Crew chat server listening on http://localhost:${port}`);
});
