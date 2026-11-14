// Minimal SSE client for POST-initiated streams. EventSource only supports GET,
// so we use fetch + a ReadableStream reader with line-by-line SSE parsing.

export async function sseFetchPost(url, body, { signal, onEvent } = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        msg = j?.error || msg;
        if (j?.code) onEvent?.('error', { error: msg, code: j.code, status: res.status });
        return;
      }
    } catch {}
    onEvent?.('error', { error: msg, status: res.status });
    return;
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Dispatch any complete events (separated by blank line).
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = raw.split('\n');
      let eventName = 'message';
      let dataStr   = '';
      for (const line of lines) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      let data;
      try { data = JSON.parse(dataStr); } catch { data = { raw: dataStr }; }
      onEvent?.(eventName, data);
    }
  }
}
