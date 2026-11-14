import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LegalShell from '@/components/LegalShell';

export const metadata = {
  title: 'Refund Policy — Craft It Yourself',
  description: 'How refunds work at Craft It Yourself.',
  alternates: { canonical: '/refund' },
};

const EFFECTIVE = 'April 18, 2026';

export default function RefundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <LegalShell title="Refund Policy" effective={EFFECTIVE}>
          <p>
            We want you to be happy with Craft It Yourself. If it isn&apos;t working for you, here is
            how refunds work.
          </p>

          <h2>14-day satisfaction guarantee</h2>
          <p>
            If you purchase a paid plan for the first time and it doesn&apos;t meet your expectations,
            email <a href="mailto:billing@craftityourself.gg">billing@craftityourself.gg</a> within
            14 days of purchase for a full refund — no questions asked.
          </p>

          <h2>Subscriptions</h2>
          <ul>
            <li>Cancel anytime from <a href="/account">your account</a>. Cancellation takes effect at the end of the current billing period — you keep your credits until then.</li>
            <li>We do not prorate refunds for unused days of the current period.</li>
            <li>Renewal charges are final 72 hours after the charge. If you forget to cancel and reach out within 72 hours, we&apos;ll refund it.</li>
          </ul>

          <h2>One-time packs</h2>
          <ul>
            <li>Packs are refundable in full within 14 days <em>if no credits in the pack have been used</em>.</li>
            <li>If you used some credits, we refund on a prorated basis: (unused credits ÷ total credits) × pack price.</li>
          </ul>

          <h2>When we can&apos;t refund</h2>
          <ul>
            <li>Beyond 14 days from purchase for first-time buyers, or beyond 72 hours for subsequent renewals.</li>
            <li>Accounts terminated for Terms of Service violations.</li>
            <li>Chargebacks — please contact us first, it&apos;s faster and friendlier.</li>
          </ul>

          <h2>How to request a refund</h2>
          <p>
            Email <a href="mailto:billing@craftityourself.gg">billing@craftityourself.gg</a> with
            your account email and the order or subscription ID. Approved refunds are processed to
            your original payment method within 5–10 business days depending on your bank.
          </p>

          <h2>EU / UK statutory rights</h2>
          <p>
            If you are a consumer in the EU or UK, you have a 14-day right of withdrawal for digital
            services. By purchasing and immediately using credits you expressly waive this right for
            credits already consumed, but you can still refund unused credits within 14 days.
          </p>
        </LegalShell>
      </main>
      <Footer />
    </div>
  );
}
