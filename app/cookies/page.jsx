import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LegalShell from '@/components/LegalShell';

export const metadata = {
  title: 'Cookie Policy — Craft It Yourself',
  description: 'What cookies and local storage CIY uses.',
  alternates: { canonical: '/cookies' },
};

const EFFECTIVE = 'April 18, 2026';

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <LegalShell title="Cookie Policy" effective={EFFECTIVE}>
          <p>
            We use cookies and similar technologies (localStorage, sessionStorage) to keep the
            product running. Here&apos;s everything we set.
          </p>

          <h2>Essential (cannot be disabled)</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Where</th><th>Purpose</th><th>Lifetime</th></tr>
            </thead>
            <tbody>
              <tr><td>ciy-user</td><td>localStorage</td><td>Stores your account record</td><td>Until logout</td></tr>
              <tr><td>ciy-token</td><td>localStorage</td><td>HMAC-signed session token with your credit balance</td><td>30 days</td></tr>
              <tr><td>ciy-usage</td><td>localStorage</td><td>Cached view of your plan and credits for UI</td><td>30 days</td></tr>
              <tr><td>ciy-history</td><td>localStorage</td><td>List of plugins you&apos;ve crafted on this device</td><td>Until cleared</td></tr>
              <tr><td>ciy-history-full</td><td>localStorage</td><td>Last 10 full generations for one-click refine</td><td>Until cleared</td></tr>
              <tr><td>sb-*</td><td>Cookie</td><td>Supabase auth session (when signed in)</td><td>7 days</td></tr>
            </tbody>
          </table>

          <h2>Analytics (optional, opt-out available)</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Provider</th><th>Purpose</th><th>Lifetime</th></tr>
            </thead>
            <tbody>
              <tr><td>ph_*</td><td>PostHog</td><td>Anonymous page views, feature usage, funnels</td><td>1 year</td></tr>
            </tbody>
          </table>

          <h2>How to opt out</h2>
          <p>
            Turn off analytics from <a href="/account">your account</a>. You can also clear
            everything we store from your browser&apos;s site settings — we&apos;ll recreate only
            the essentials on your next visit.
          </p>
        </LegalShell>
      </main>
      <Footer />
    </div>
  );
}
