// Security headers applied to every response.
// CSP uses 'unsafe-inline' on script-src because Next.js injects runtime
// scripts without nonces in the App Router. Tightening this requires
// per-request nonce generation in middleware — planned follow-up.

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us.i.posthog.com https://us-assets.i.posthog.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=(self)',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=(self "https://js.stripe.com" "https://checkout.stripe.com")',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=(self)',
  'usb=()',
  'xr-spatial-tracking=()',
  'interest-cohort=()',
].join(', ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy',         value: CSP },
          { key: 'X-Content-Type-Options',          value: 'nosniff' },
          { key: 'X-Frame-Options',                 value: 'DENY' },
          { key: 'Referrer-Policy',                 value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',              value: PERMISSIONS_POLICY },
          { key: 'X-DNS-Prefetch-Control',          value: 'on' },
          { key: 'Strict-Transport-Security',       value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy',      value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy',    value: 'same-origin' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control',            value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // Stripe webhook must accept cross-origin POST from Stripe.
        source: '/api/stripe/webhook',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
