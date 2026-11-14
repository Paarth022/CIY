import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LegalShell from '@/components/LegalShell';

export const metadata = {
  title: 'Terms of Service — Craft It Yourself',
  description: 'The rules for using Craft It Yourself.',
  alternates: { canonical: '/terms' },
};

const EFFECTIVE = 'April 18, 2026';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <LegalShell title="Terms of Service" effective={EFFECTIVE}>
          <h2>1. Who we are</h2>
          <p>
            Craft It Yourself (&quot;CIY&quot;, &quot;we&quot;, &quot;us&quot;) operates the service at
            craftityourself.gg. By creating an account or using the service you agree to these Terms.
            If you do not agree, do not use the service.
          </p>

          <h2>2. The service</h2>
          <p>
            CIY lets you describe a Minecraft plugin in plain English and returns AI-generated Java code,
            <code>plugin.yml</code>, <code>pom.xml</code>, and related project files. Generations are
            produced by third-party large-language-model providers (currently Anthropic, Google, and
            OpenAI) that we call on your behalf.
          </p>

          <h2>3. Accounts</h2>
          <ul>
            <li>You must be 13 or older (16 in the EEA/UK) to create an account.</li>
            <li>You are responsible for keeping your password secret and for activity under your account.</li>
            <li>One account per person. Do not share credentials.</li>
          </ul>

          <h2>4. Credits, plans, and packs</h2>
          <p>
            Plans are billed monthly and renew automatically until cancelled. One-time packs do not
            expire and stack with any plan. Credits have no cash value and are non-transferable.
            Plan credits reset at the start of each billing period; unused plan credits are forfeited.
          </p>

          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use CIY to generate malicious code, griefing tools, credential harvesters, or anything that targets minors.</li>
            <li>Attempt to reverse-engineer, scrape, or overload the service.</li>
            <li>Resell generations as a drop-in service under a different brand.</li>
            <li>Upload content you do not have the right to upload (e.g. proprietary code you do not own).</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these rules. Serious violations
            may be reported to law enforcement.
          </p>

          <h2>6. Your content</h2>
          <p>
            You retain ownership of the prompts you submit and the generated code we return to you.
            You grant CIY a limited licence to process your prompt through AI providers, store a copy
            to deliver the service, and to use anonymised, aggregated data to improve the product.
            We do not train models on your content.
          </p>

          <h2>7. AI output disclaimer</h2>
          <p>
            Generated code is provided &quot;as is&quot;. AI models can produce code that contains bugs,
            security issues, or that does not compile. You are responsible for reviewing, testing, and
            deploying the code. CIY is not liable for any damage caused by running generated code on
            your server.
          </p>

          <h2>8. Third-party services</h2>
          <p>
            We use Stripe for payments, Supabase for account storage, Sentry for error tracking, and
            Anthropic / Google / OpenAI for generation. Your use of the service is also subject to
            those providers&apos; terms.
          </p>

          <h2>9. Termination</h2>
          <p>
            You may cancel your subscription from <a href="/account">your account</a> at any time.
            Cancellation stops the next renewal but does not refund the current period. We may
            terminate your account for cause (fraud, abuse, violation of these Terms) or for
            convenience on 30 days&apos; notice.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, CIY&apos;s total liability for any claim is
            capped at the greater of (a) the amount you paid us in the 12 months before the claim,
            or (b) US$50. We are not liable for indirect, incidental, or consequential damages.
          </p>

          <h2>11. Changes to these Terms</h2>
          <p>
            We may update these Terms. Material changes will be announced at least 14 days in
            advance via the email on your account. Continued use after the effective date means you
            accept the new Terms.
          </p>

          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of your country of residence where required by
            local consumer-protection law; otherwise by the laws of the State of Delaware, USA,
            without regard to conflicts-of-law principles.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions: <a href="/contact">contact page</a> or <a href="mailto:hello@craftityourself.gg">hello@craftityourself.gg</a>.
          </p>

          <h2>14. Minecraft &amp; Mojang</h2>
          <p>
            Craft It Yourself is not affiliated with, endorsed by, or sponsored by Mojang Studios or
            Microsoft. &quot;Minecraft&quot; is a trademark of Mojang Studios.
          </p>
        </LegalShell>
      </main>
      <Footer />
    </div>
  );
}
