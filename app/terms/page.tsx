import type { Metadata } from 'next';
import LegalLayout from '../../components/LegalLayout';
import '../legal.css';
export const metadata: Metadata = {
  title: 'Terms & Conditions — Dhikrly',
  description:
    "Terms and Conditions for using Dhikrly — Daily Adhkār & Du'ā tracker.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using Dhikrly"
      lastUpdated="March 2025"
    >
      <div className="highlight-box">
        <p>
          <strong>Summary:</strong> Dhikrly is a free tool to help you track
          your daily adhkār. Use it respectfully. We provide it as-is and are
          not liable for any issues. You own your data.
        </p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Dhikrly at{' '}
        <a href="https://dhikrly.com">dhikrly.vercel.app</a> (the `App``), you
        agree to be bound by these Terms and Conditions. If you do not agree,
        please do not use the App.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Dhikrly is a Progressive Web Application (PWA) that helps Muslims track
        their daily adhkār (remembrances) and du`ā (supplications). The App
        provides:
      </p>
      <ul>
        <li>
          A curated list of daily adhkār and du`ā with Arabic text,
          translations, and transliterations
        </li>
        <li>Daily completion tracking with streaks and history</li>
        <li>Optional account creation for cross-device sync</li>
        <li>Customisable notification reminders</li>
        <li>PDF progress reports</li>
        <li>The ability to add custom duas</li>
      </ul>

      <h2>3. User Accounts</h2>
      <p>
        You may use the App without creating an account. If you choose to create
        an account:
      </p>
      <ul>
        <li>You must provide accurate information</li>
        <li>
          You are responsible for maintaining the security of your account
          credentials
        </li>
        <li>You must notify us immediately of any unauthorised access</li>
        <li>
          You are responsible for all activity that occurs under your account
        </li>
        <li>You must be at least 13 years of age to create an account</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>
        You agree to use Dhikrly only for its intended purpose. You must not:
      </p>
      <ul>
        <li>Use the App for any unlawful purpose</li>
        <li>
          Attempt to gain unauthorised access to any part of the App or its
          infrastructure
        </li>
        <li>Interfere with or disrupt the App`s servers or networks</li>
        <li>
          Use automated tools to scrape, crawl, or extract data from the App
        </li>
        <li>Attempt to reverse engineer, decompile, or disassemble the App</li>
        <li>
          Upload content that is harmful, offensive, or violates any applicable
          law
        </li>
      </ul>

      <h2>5. Intellectual Property</h2>

      <h3>Our Content</h3>
      <p>
        The App`s design, code, and interface are the property of Dhikrly`s
        developers. You may not copy, reproduce, or distribute them without
        permission.
      </p>

      <h3>Islamic Texts</h3>
      <p>
        The Qur`ānic verses, hadith, and du`ā included in the App are part of
        the Islamic tradition and are not claimed as our intellectual property.
        Translations and transliterations are provided for educational and
        devotional purposes.
      </p>

      <h3>Your Content</h3>
      <p>
        Any custom duas or content you add to the App remain your property. By
        adding them, you grant us a limited licence to store and sync that
        content across your devices as part of the service.
      </p>

      <h2>6. Disclaimer of Warranties</h2>
      <p>
        Dhikrly is provided <strong>`as is`</strong> and{' '}
        <strong>`as available`</strong> without any warranties of any kind,
        express or implied. We do not warrant that:
      </p>
      <ul>
        <li>The App will be uninterrupted, error-free, or secure</li>
        <li>Any data stored will be preserved indefinitely</li>
        <li>The App will be available on any particular device or browser</li>
        <li>Any specific feature will continue to be available</li>
      </ul>
      <p>
        <strong>Important:</strong> We recommend keeping your own records of
        important duas and not relying solely on the App for preserving custom
        content.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, Dhikrly and its
        developers shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages, including loss of data, arising from
        your use of or inability to use the App.
      </p>

      <h2>8. Religious Content Disclaimer</h2>
      <p>
        The adhkār and du`ā provided in this App are sourced from well-known
        Islamic texts and are presented for convenience. We encourage users to
        verify all content with qualified Islamic scholars. Dhikrly does not
        provide religious rulings (fatwa) and is not a substitute for scholarly
        guidance.
      </p>

      <h2>9. Third-Party Services</h2>
      <p>
        The App uses the following third-party services, each governed by their
        own terms:
      </p>
      <ul>
        <li>
          <a
            href="https://supabase.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase Terms of Service
          </a>{' '}
          — database and authentication
        </li>
        <li>
          <a
            href="https://vercel.com/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel Terms of Service
          </a>{' '}
          — hosting
        </li>
        <li>
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Terms of Service
          </a>{' '}
          — optional sign-in
        </li>
      </ul>

      <h2>10. Privacy</h2>
      <p>
        Your use of Dhikrly is also governed by our{' '}
        <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into
        these Terms by reference.
      </p>

      <h2>11. Changes to the App and Terms</h2>
      <p>
        We reserve the right to modify or discontinue the App at any time
        without notice. We may also update these Terms from time to time.
        Continued use of the App after changes to the Terms constitutes
        acceptance of the new Terms. The `Last updated`` date at the top of this
        page will reflect any changes.
      </p>

      <h2>12. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account if you violate
        these Terms. You may stop using the App at any time. Upon termination,
        your right to use the App ceases, but your locally stored data remains
        on your device until you clear it.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with
        applicable law. Any disputes arising from these Terms or your use of the
        App shall be resolved through good-faith negotiation before any formal
        proceedings.
      </p>

      <h2>14. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at:{' '}
        <a href="mailto:nazrul@dhikrly.com">nazrul@dhikrly.com</a>
      </p>
    </LegalLayout>
  );
}
