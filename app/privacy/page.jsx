import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LegalShell from '@/components/LegalShell';

export const metadata = {
  title: 'Privacy Policy — Craft It Yourself',
  description: 'What we collect, why, and how to control it.',
  alternates: { canonical: '/privacy' },
};

const EFFECTIVE = 'April 18, 2026';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <LegalShell title="Privacy Policy" effective={EFFECTIVE}>
          <p>
            This policy explains what Craft It Yourself (&quot;CIY&quot;, &quot;we&quot;) collects,
            why we collect it, and what choices you have.
          </p>

          <h2>1. What we collect</h2>
          <ul>
            <li><strong>Account data</strong>: email, display name, hashed password, account creation date.</li>
            <li><strong>Usage data</strong>: plan, credit balance, timestamps of generations, tier of each generation.</li>
            <li><strong>Prompts &amp; outputs</strong>: the text you submit and the code we return.</li>
            <li><strong>Billing data</strong>: Stripe customer ID and subscription status. Card details are handled by Stripe and never touch our servers.</li>
            <li><strong>Device data</strong>: IP address, user agent, referring URL, approximate location from IP — used for rate-limiting and fraud prevention.</li>
            <li><strong>Error &amp; analytics data</strong>: anonymised page views, click events, and error stack traces (via PostHog and Sentry) so we can fix bugs and see what features people use.</li>
          </ul>

          <h2>2. Why we collect it</h2>
          <p>We use your data to:</p>
          <ul>
            <li>Deliver the service (generate code, track credits, send the files back to you).</li>
            <li>Bill you correctly and prevent fraud.</li>
            <li>Respond to support requests.</li>
            <li>Debug and improve the product.</li>
            <li>Send transactional emails (receipts, important account notices). We do not send marketing email without your explicit opt-in.</li>
          </ul>

          <h2>3. AI providers &amp; your prompts</h2>
          <p>
            Your prompt, and any code you attach for debug/update, is sent to the AI provider you
            selected (Anthropic, Google, or OpenAI) for the purpose of generating a response. Those
            providers process the content under their own privacy policies and enterprise data
            controls. We do not train models on your content.
          </p>

          <h2>4. Who we share with</h2>
          <p>We share data only with the processors required to run the service:</p>
          <ul>
            <li><strong>Stripe</strong> — payments.</li>
            <li><strong>Supabase</strong> — account and database storage.</li>
            <li><strong>Anthropic / Google / OpenAI</strong> — AI generation.</li>
            <li><strong>Sentry</strong> — error monitoring.</li>
            <li><strong>PostHog</strong> — product analytics.</li>
          </ul>
          <p>We do not sell your data.</p>

          <h2>5. Retention</h2>
          <ul>
            <li>Account data: kept while your account is active and for 30 days after deletion to allow recovery.</li>
            <li>Prompts and generations: stored in your local browser only (client-side history). Our server does not keep a persistent copy after the response is returned.</li>
            <li>Payment records: kept for 7 years as required by tax law.</li>
            <li>Error logs: 30 days.</li>
          </ul>

          <h2>6. Your rights</h2>
          <p>
            Depending on your jurisdiction (GDPR, UK GDPR, CCPA, etc.) you may have the right to
            access, correct, export, or delete your personal data, and to object to processing.
            Email <a href="mailto:privacy@craftityourself.gg">privacy@craftityourself.gg</a> to exercise
            any of these rights. We respond within 30 days.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use a small number of first-party cookies and localStorage entries to keep you signed
            in and remember your plan. We use PostHog for analytics — it sets a cookie for anonymised
            session tracking. You can opt out of analytics from <a href="/account">your account</a>.
            See our <a href="/cookies">cookie policy</a> for the full list.
          </p>

          <h2>8. Security</h2>
          <p>
            Passwords are hashed with SHA-256 + random salt. Session tokens are HMAC-signed.
            All traffic is HTTPS with HSTS. API keys for AI providers are stored server-side only
            and never exposed to the browser. We follow the OWASP Top 10 as a baseline for web
            security.
          </p>

          <h2>9. Children</h2>
          <p>
            CIY is not directed at children under 13 (under 16 in the EEA/UK). If you believe a child
            has given us data without parental consent, contact us and we will delete it.
          </p>

          <h2>10. International transfers</h2>
          <p>
            Our servers are in the United States. If you are outside the US, your data is transferred
            there. For EEA/UK users, we rely on Standard Contractual Clauses where required.
          </p>

          <h2>11. Changes</h2>
          <p>
            We will post material changes here and email active users at least 14 days before they
            take effect.
          </p>

          <h2>12. Contact</h2>
          <p>
            <a href="mailto:privacy@craftityourself.gg">privacy@craftityourself.gg</a> or the <a href="/contact">contact page</a>.
          </p>
        </LegalShell>
      </main>
      <Footer />
    </div>
  );
}
