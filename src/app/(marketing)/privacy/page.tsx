import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | FloorQuote Pro',
  description: 'Privacy policy for FloorQuote Pro — how we collect, use, and protect your data.',
}

const LAST_UPDATED = 'April 28, 2026'

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p>
            FloorQuote Pro (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website at
            floorquote.us and the FloorQuote Pro software-as-a-service application (the &quot;Service&quot;).
            This Privacy Policy explains how we collect, use, store, share, and protect information when
            you use our Service.
          </p>
          <p>
            By using FloorQuote Pro, you agree to the collection and use of information in accordance
            with this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account information:</strong> name, email address, password (hashed), and company name.</li>
            <li><strong>Business data you create:</strong> customer contact details, project measurements, quotes, invoices, pricing, and notes you enter into the Service.</li>
            <li><strong>Payment information:</strong> processed securely by Stripe. We do not store credit card numbers on our servers.</li>
            <li><strong>Usage data:</strong> pages viewed, features used, and timestamps. We use this only to improve the Service.</li>
            <li><strong>Connected service data:</strong> if you connect a third-party account (such as Google Gmail), we receive limited information from that service as described below.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Google User Data</h2>
          <p>
            FloorQuote Pro lets you optionally connect your Google (Gmail) account so that quotes and
            invoices can be sent to your customers from your own email address. When you connect your
            Google account, we request access only to the following Google API scopes:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                https://www.googleapis.com/auth/gmail.send
              </code>{' '}
              — to send email on your behalf.
            </li>
            <li>
              <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                https://www.googleapis.com/auth/userinfo.email
              </code>{' '}
              — to display the connected email address in your settings.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">
            How we use Google user data
          </h3>
          <p>
            We use these Google API scopes solely to send quote and invoice emails (with their PDF
            attachments) to recipients you choose, from your own email address, when you click
            &quot;Send Email&quot; inside FloorQuote Pro.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Limited Use disclosure</h3>
          <p>
            FloorQuote Pro&apos;s use and transfer of information received from Google APIs to any
            other app will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-900"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically, we:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Only use Google user data to provide the email-sending feature you explicitly request.</li>
            <li>Do not use Google user data to serve advertisements.</li>
            <li>Do not allow humans to read Google user data, except (a) with your explicit consent for specific messages, (b) when necessary for security purposes such as investigating abuse, (c) to comply with applicable law, or (d) for internal operations where the data has been aggregated and anonymized.</li>
            <li>Do not transfer Google user data to third parties except as necessary to provide or improve the Service, comply with applicable law, or as part of a merger, acquisition, or sale of assets with prior notice to you.</li>
            <li>Do not sell Google user data, ever.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Storage of Google credentials</h3>
          <p>
            Your Google OAuth access and refresh tokens are encrypted at rest using AES-256-GCM
            encryption before being stored in our database. They are used solely to send emails on
            your behalf and to refresh expired access tokens. You may disconnect your Google account
            at any time from the Settings → Email page, which immediately deletes the stored tokens
            from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, operate, and maintain the Service.</li>
            <li>Process payments and manage subscriptions through Stripe.</li>
            <li>Send transactional emails (account confirmations, password resets, billing notices).</li>
            <li>Respond to support requests.</li>
            <li>Detect and prevent fraud, abuse, or security incidents.</li>
            <li>Improve the Service through aggregated, anonymized usage analysis.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data, your customers&apos; data, or your
            quote data to third parties. We do not use your data to train artificial intelligence or
            machine learning models.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage and Security</h2>
          <p>
            Your data is stored on infrastructure provided by Supabase (PostgreSQL) and Vercel,
            both of which maintain industry-standard security practices including encryption in
            transit (TLS) and at rest. We use Row-Level Security policies to ensure each company can
            only access its own data.
          </p>
          <p>
            While we take reasonable measures to protect your information, no method of transmission
            over the Internet or electronic storage is 100% secure. You are responsible for keeping
            your account password confidential.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Third-Party Services</h2>
          <p>We use the following third-party services to operate FloorQuote Pro:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> — database, authentication, file storage</li>
            <li><strong>Vercel</strong> — application hosting</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Resend</strong> — transactional email delivery (when Gmail is not connected)</li>
            <li><strong>Google APIs</strong> — Gmail sending (when you connect your Google account)</li>
          </ul>
          <p>
            Each of these services has its own privacy policy. We share only the minimum information
            necessary for them to perform their function.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access and download your data at any time from the Service.</li>
            <li>Correct or update inaccurate information in your account settings.</li>
            <li>Delete your account and all associated data by contacting us at{' '}
              <a href="mailto:support@floorquote.us" className="underline hover:text-gray-900">
                support@floorquote.us
              </a>.
            </li>
            <li>
              Disconnect any third-party integration (Gmail, Stripe billing portal) at any time.
            </li>
            <li>
              Revoke FloorQuote Pro&apos;s access to your Google account directly from{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900"
              >
                Google Account permissions
              </a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete your data within 30 days, except where we are legally required
            to retain certain records (e.g., billing records for tax purposes). Backups containing
            your data are rotated and overwritten within 90 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
          <p>
            FloorQuote Pro is intended for use by businesses and is not directed to individuals
            under the age of 16. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &quot;Last updated&quot; date at the top. Material changes will be communicated by email
            or in-app notification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:support@floorquote.us" className="underline hover:text-gray-900">
              support@floorquote.us
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
