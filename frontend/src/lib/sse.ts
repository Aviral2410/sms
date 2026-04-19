export type SseEvent = {
  event: string;
  data: string;
  id?: string;
};

type Handlers = {
  onEvent: (evt: SseEvent) => void;
  onError?: (err: unknown) => void;
  onComplete?: () => void;
};

export async function readSseStream(body: ReadableStream<Uint8Array>, handlers: Handlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let eventName = 'message';
  let eventId: string | undefined;
  let dataLines: string[] = [];

  const flush = () => {
    if (dataLines.length === 0) return;
    handlers.onEvent({
      event: eventName || 'message',
      data: dataLines.join('\n'),
      id: eventId,
    });
    eventName = 'message';
    eventId = undefined;
    dataLines = [];
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl = buffer.indexOf('\n');
      while (nl >= 0) {
        const rawLine = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);

        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

        if (line === '') {
          flush();
          nl = buffer.indexOf('\n');
          continue;
        }

        if (line.startsWith(':')) {
          nl = buffer.indexOf('\n');
          continue;
        }

        const idx = line.indexOf(':');
        const field = idx >= 0 ? line.slice(0, idx) : line;
        const valuePart = idx >= 0 ? line.slice(idx + 1).trimStart() : '';

        if (field === 'event') {
          eventName = valuePart;
        } else if (field === 'data') {
          dataLines.push(valuePart);
        } else if (field === 'id') {
          eventId = valuePart;
        }

        nl = buffer.indexOf('\n');
      }
    }
    flush();
  } catch (err) {
    if (handlers.onError) handlers.onError(err);
    else throw err;
  } finally {
    if (handlers.onComplete) handlers.onComplete();
    reader.releaseLock();
  }
}

export function tryParseJson<T = unknown>(raw: string): { ok: true; value: T } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false };
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(trimmed) as T };
  } catch {
    return { ok: false };
  }
}

