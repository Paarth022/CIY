// RFC 9116 — security.txt
// https://www.rfc-editor.org/rfc/rfc9116
export const dynamic = 'force-static';

const YEAR_FROM_NOW = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';

export async function GET() {
  const body = [
    `Contact: mailto:security@craftityourself.gg`,
    `Contact: https://craftityourself.gg/contact`,
    `Expires: ${YEAR_FROM_NOW}`,
    `Preferred-Languages: en`,
    `Canonical: https://craftityourself.gg/.well-known/security.txt`,
    `Policy: https://craftityourself.gg/privacy`,
    ``,
  ].join('\n');
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
