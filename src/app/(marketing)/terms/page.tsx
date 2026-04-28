import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | FloorQuote Pro',
  description: 'Terms of service for FloorQuote Pro.',
}

const LAST_UPDATED = 'April 28, 2026'

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using FloorQuote Pro (the &quot;Service&quot;), operated at floorquote.us,
            you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree
            to these Terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
          <p>
            FloorQuote Pro is a software-as-a-service application designed to help flooring contractors
            create, manage, and send professional quotes and invoices to their customers. Features
            include quote generation, PDF export, customer management, optional integrations with
            third-party services such as Google Gmail for sending email, and subscription billing
            through Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Accounts</h2>
          <p>
            You must be at least 18 years old and operating a legitimate business to create an account.
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information during registration and
            to keep this information updated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions and Billing</h2>
          <p>
            FloorQuote Pro offers paid subscription plans billed monthly or annually through Stripe.
            By subscribing, you authorize us to charge your payment method on a recurring basis until
            you cancel. You may cancel at any time from your account billing page; cancellation takes
            effect at the end of your current billing period.
          </p>
          <p>
            All fees are non-refundable except as required by applicable law. We reserve the right to
            change pricing with at least 30 days notice to active subscribers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any illegal purpose or to send spam, phishing, or fraudulent communications.</li>
            <li>Attempt to gain unauthorized access to other users&apos; accounts or to our infrastructure.</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
            <li>Resell, sublicense, or commercially exploit the Service without our written permission.</li>
            <li>Upload viruses, malware, or any other harmful content.</li>
            <li>Use the Service in a way that violates any third-party rights, including intellectual property rights.</li>
            <li>
              Use connected email accounts (such as Gmail) to send unsolicited bulk email or any
              communication that violates the recipient&apos;s consent or applicable anti-spam laws.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Data</h2>
          <p>
            You retain all rights to the data you create or upload to the Service (customer
            information, quotes, invoices, measurements, etc.). By using the Service, you grant us a
            limited license to store, process, and display your data solely for the purpose of
            operating the Service.
          </p>
          <p>
            You are solely responsible for ensuring you have the right to use and store any customer
            information you enter into the Service, including compliance with applicable privacy
            laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Third-Party Integrations</h2>
          <p>
            The Service offers optional integrations with third-party services such as Google
            (Gmail), Stripe, Resend, and others. Your use of these integrations is subject to the
            respective third-party&apos;s terms and privacy policies. We are not responsible for the
            availability, performance, or content of third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
          <p>
            The Service, including its software, design, and content (excluding your data), is owned
            by FloorQuote Pro and protected by copyright, trademark, and other intellectual property
            laws. You may not copy, modify, distribute, or create derivative works without our prior
            written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without
            notice, for any violation of these Terms or for any other reason at our sole discretion.
            You may terminate your account at any time by contacting us or canceling your
            subscription.
          </p>
          <p>
            Upon termination, your right to use the Service ceases immediately. We will retain or
            delete your data as described in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
            OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT
            WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
          <p>
            Quotes and invoices generated by the Service are based on the information you input.
            You are solely responsible for the accuracy of your pricing, calculations, and any
            commitments you make to your customers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOORQUOTE PRO AND ITS AFFILIATES SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
            LOSS OF PROFITS, DATA, OR REVENUE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12
            MONTHS PRIOR TO THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless FloorQuote Pro, its affiliates, officers,
            employees, and agents from any claims, damages, or expenses (including reasonable
            attorneys&apos; fees) arising out of your use of the Service, your violation of these
            Terms, or your violation of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated by
            email or in-app notification at least 30 days before they take effect. Continued use of
            the Service after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the United States and the State of New York,
            without regard to conflict-of-law principles. Any disputes arising under these Terms
            shall be resolved in the state or federal courts located in New York, New York.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contact</h2>
          <p>
            If you have any questions about these Terms, contact us at{' '}
            <a href="mailto:support@floorquote.us" className="underline hover:text-gray-900">
              support@floorquote.us
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
