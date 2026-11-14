'use client';

// Rendered when the root layout itself throws. Must include its own
// <html>/<body> and cannot depend on layout styles.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        background: '#050505',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem' }}>
            The page couldn&apos;t load.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            A fatal error stopped the app from rendering. You can retry or go back to the homepage.
          </p>
          {error?.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
              error id · {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#22c55e', color: '#000', border: 0,
                padding: '0.75rem 1.25rem', borderRadius: 6,
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.1em', fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.75rem 1.25rem', borderRadius: 6,
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.1em', fontSize: '0.75rem', textDecoration: 'none',
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
