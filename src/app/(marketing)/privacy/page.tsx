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
            FloorQuote Pro offers an optional integration that lets users connect their Google
            (Gmail) account so that quote and invoice emails can be sent to their customers from
            their own Gmail address. This section discloses, in detail, exactly how FloorQuote Pro
            accesses, uses, stores, and shares Google user data, in compliance with the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-900"
            >
              Google API Services User Data Policy
            </a>{' '}
            (including the Limited Use requirements).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.1 Data Accessed (Google scopes requested)
          </h3>
          <p>
            FloorQuote Pro requests access to the minimum scopes required to send email on the
            user&apos;s behalf. We do <strong>not</strong> request, access, read, modify, or delete
            any other Google data — no Gmail inbox messages, no Drive files, no Calendar events, no
            Contacts, no Photos, no profile picture, and no other Google services.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                  https://www.googleapis.com/auth/gmail.send
                </code>
              </strong>
              <br />
              <span className="text-sm">
                A restricted Gmail scope that grants permission to <em>send</em> emails on the
                user&apos;s behalf via the Gmail API. It does <strong>not</strong> grant permission
                to read, modify, or delete any messages in the user&apos;s mailbox. The only data
                FloorQuote Pro generates with this scope is the outbound message itself (recipient,
                subject, body, and attached PDF), which the user composes inside our app.
              </span>
            </li>
            <li>
              <strong>
                <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                  https://www.googleapis.com/auth/userinfo.email
                </code>
              </strong>
              <br />
              <span className="text-sm">
                A non-sensitive scope that returns the user&apos;s primary Google account email
                address (e.g., <em>name@gmail.com</em>) and Google account ID. This lets us label
                the connected account in the app&apos;s Settings page (&quot;Connected as
                name@gmail.com&quot;) so users can verify they connected the correct account.
              </span>
            </li>
            <li>
              <strong>
                <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">openid</code>
              </strong>
              <br />
              <span className="text-sm">
                Required by Google&apos;s OAuth 2.0 implementation to issue the access and refresh
                tokens used by the two scopes above. No additional data is read.
              </span>
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.2 Data Usage (how we use the data and why)
          </h3>
          <p>
            We use Google user data <strong>solely</strong> to provide the email-sending feature
            that the user explicitly initiates from inside our application. There is no other use.
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-900 border border-gray-200">
                    Data type
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-900 border border-gray-200">
                    How we use it
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-900 border border-gray-200">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 align-top border border-gray-200">
                    Google account email address
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    Stored in our database (associated with the user&apos;s company) and displayed
                    in the user&apos;s Settings → Email page.
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    To show the user which Google account is currently connected to FloorQuote Pro,
                    so they can verify or disconnect it.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top border border-gray-200">
                    OAuth access token (gmail.send)
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    Stored encrypted (AES-256-GCM) in our database. Used at runtime to authorize a
                    single API call to{' '}
                    <code className="text-xs">gmail.googleapis.com/gmail/v1/users/me/messages/send</code>{' '}
                    when the user clicks &quot;Send Email&quot; on a quote or invoice in the app.
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    To send the user-composed email (with attached PDF) from the user&apos;s
                    connected Gmail address to a recipient that the user has specified inside our
                    app.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 align-top border border-gray-200">
                    OAuth refresh token
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    Stored encrypted (AES-256-GCM) in our database. Used only to exchange for a new
                    access token when the previous one expires (typically every hour).
                  </td>
                  <td className="p-3 align-top border border-gray-200">
                    To keep the user signed in to the integration without requiring them to
                    re-authenticate for every email they send.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            We do <strong>not</strong> use Google user data for any of the following: advertising,
            machine learning or AI model training, marketing, profiling, analytics, resale, or any
            purpose unrelated to sending the email the user explicitly requested.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.3 Data Storage and Security
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Encryption at rest:</strong> Both the OAuth access token and refresh token
              are encrypted with AES-256-GCM before being written to our database. The encryption
              key is stored as an environment variable that is never written to source control or
              shared with any third party.
            </li>
            <li>
              <strong>Encryption in transit:</strong> All requests to Google APIs are made over
              HTTPS (TLS 1.2+). All requests between the user&apos;s browser and our servers are
              made over HTTPS.
            </li>
            <li>
              <strong>Access control:</strong> Tokens are stored in a Supabase (PostgreSQL)
              database protected by Row-Level Security policies. Only the user&apos;s own company
              can access its row.
            </li>
            <li>
              <strong>Hosting:</strong> Our infrastructure runs on Vercel and Supabase, both of
              which are SOC 2 Type II compliant.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.4 Data Sharing
          </h3>
          <p>
            We do <strong>not</strong> share Google user data with any third parties. The user&apos;s
            Google email address and OAuth tokens never leave our infrastructure except in the
            single, scoped API call to <code className="text-xs">gmail.googleapis.com</code> that
            is required to send the email the user explicitly requested. No analytics, advertising,
            or marketing services have access to Google user data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.5 Data Retention and Deletion
          </h3>
          <p>
            Google OAuth tokens are retained only for as long as the user keeps the Gmail
            integration connected. When the user clicks &quot;Disconnect&quot; on the Settings →
            Email page, both the access token and refresh token are immediately deleted from our
            database, and we send a revocation request to Google&apos;s OAuth server. Tokens are
            also deleted if the user&apos;s account is deleted. Users may additionally revoke
            FloorQuote Pro&apos;s access at any time directly from{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-900"
            >
              Google Account permissions
            </a>
            .
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
            3.6 Limited Use Disclosure
          </h3>
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
            , including the Limited Use requirements. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              We only use Google user data to provide or improve user-facing features (in this
              case, sending email on the user&apos;s behalf) that are prominent in the
              requesting application&apos;s user interface.
            </li>
            <li>
              We do not use Google user data to serve advertisements, including retargeting,
              personalized, or interest-based advertising.
            </li>
            <li>
              We do not allow humans to read Google user data, except (a) with the user&apos;s
              affirmative agreement for specific messages, (b) when necessary for security purposes
              such as investigating abuse, (c) to comply with applicable law, or (d) for internal
              operations where the data has been aggregated and anonymized.
            </li>
            <li>
              We do not transfer Google user data to third parties except as necessary to provide
              or improve user-facing features, to comply with applicable law, or as part of a
              merger, acquisition, or sale of assets with prior notice to affected users.
            </li>
            <li>
              We do not use Google user data to develop, improve, or train generalized or
              non-personalized AI and/or machine learning models.
            </li>
            <li>
              We do not sell Google user data — ever.
            </li>
          </ul>
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
