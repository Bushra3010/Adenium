import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { gatewayConfigured, simulationEnabled } from '@/lib/razorpay';
import { PageHeading, Panel } from '@/components/admin/ui';
import { SettingsForm } from '@/components/admin/settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  const integrations = [
    {
      name: 'Payment gateway (Razorpay)',
      ready: gatewayConfigured,
      detail: gatewayConfigured
        ? 'Live keys configured.'
        : simulationEnabled
          ? 'Not configured — checkout is simulated in development. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
          : 'Not configured. Checkout will refuse orders until keys are set.',
    },
    {
      name: 'Transactional email (SMTP)',
      ready: Boolean(process.env.SMTP_HOST),
      detail: process.env.SMTP_HOST
        ? `Sending via ${process.env.SMTP_HOST}.`
        : 'Not configured — emails are written to the server log instead of being sent.',
    },
    {
      name: 'Transactional SMS',
      ready: Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY),
      detail:
        process.env.SMS_PROVIDER && process.env.SMS_API_KEY
          ? 'Provider configured.'
          : 'Not configured. Indian transactional SMS also needs TRAI DLT approval for the sender ID and every template.',
    },
  ];

  return (
    <>
      <PageHeading title="Settings" description="Store-wide configuration." />

      <div className="mb-6">
        <Panel title="Integrations">
          <ul className="space-y-3">
            {integrations.map((i) => (
              <li key={i.name} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i.ready ? 'bg-leaf' : 'bg-sun'}`}
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {i.name}{' '}
                    <span className={i.ready ? 'text-leaf' : 'text-sun'}>
                      {i.ready ? '· ready' : '· not configured'}
                    </span>
                  </p>
                  <p className="text-sm text-ink-3">{i.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
            These are set through environment variables, not here — see the README.
          </p>
        </Panel>
      </div>

      <SettingsForm initial={settings} />
    </>
  );
}
