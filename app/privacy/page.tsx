import type { Metadata } from 'next';
import LegalLayout from '@/components/LegalLayout';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — Dhikrly',
  description: 'Privacy Policy for Dhikrly — Daily Adhkār & Du\'ā tracker.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Dhikrly collects, uses, and protects your information"
      lastUpdated="March 2025"
    >
      <div className="highlight-box">
        <p>
          <strong>Summary:</strong> Dhikrly stores your progress locally on your device by default.
          If you create an account, your data is synced to secure servers only to enable cross-device access.
          We do not sell, share, or use your data for advertising.
        </p>
      </div>

      <h2>1. Who We Are</h2>
      <p>
        Dhikrly is an Islamic adhkār and du'ā tracking application accessible at{' '}
        <a href="https://dhikrly.vercel.app">dhikrly.vercel.app</a>. We are an independent
        developer project. For any privacy-related questions, please contact us at{' '}
        <a href="mailto:privacy@dhikrly.app">privacy@dhikrly.app</a>.
      </p>

      <h2>2. Information We Collect</h2>

      <h3>2a. Without an Account (Local-Only Mode)</h3>
      <p>
        When you use Dhikrly without signing in, no personal information is collected.
        All data — your daily completion records, streaks, custom duas, and settings —
        is stored exclusively in your browser's <code>localStorage</code> on your own device.
        This data never leaves your device and is never transmitted to any server.
      </p>

      <h3>2b. With an Account (Sync Mode)</h3>
      <p>
        If you choose to create an account to enable cross-device sync, we collect and store:
      </p>
      <ul>
        <li><strong>Email address</strong> — used for account identification and login</li>
        <li><strong>Daily progress data</strong> — which duas you have completed each day</li>
        <li><strong>Streak data</strong> — your current and best completion streaks</li>
        <li><strong>Custom duas</strong> — any personal duas you have added</li>
        <li><strong>Notification preferences</strong> — your reminder times (stored locally only)</li>
      </ul>

      <h3>2c. Google Sign-In</h3>
      <p>
        If you sign in with Google, we receive your email address, display name, and
        profile picture URL from Google. We do not receive your Google password or access
        to any other Google services.
      </p>

      <h3>2d. Automatically Collected Information</h3>
      <p>
        Our hosting provider (Vercel) and database provider (Supabase) may automatically
        collect standard server logs including IP addresses, browser type, and access times.
        This is standard infrastructure logging and is not used for tracking or profiling.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use your information solely to:</p>
      <ul>
        <li>Provide the core functionality of syncing your adhkār progress across your devices</li>
        <li>Authenticate your identity when you sign in</li>
        <li>Restore your progress when you log in on a new device</li>
      </ul>
      <p>
        We do <strong>not</strong> use your data for advertising, profiling, analytics,
        marketing, or any purpose beyond providing the app's core functionality.
      </p>

      <h2>4. Data Storage and Security</h2>
      <p>
        Your account data is stored on Supabase, a secure cloud database platform. Supabase
        uses industry-standard encryption in transit (TLS) and at rest. Each user's data is
        protected by Row-Level Security policies, meaning your data can only be accessed by
        your own authenticated session.
      </p>
      <p>
        While we take reasonable steps to protect your data, no internet transmission is
        100% secure. We encourage you to use a strong password.
      </p>

      <h2>5. Data Sharing</h2>
      <p>
        We do not sell, rent, or share your personal information with third parties,
        except with the following service providers who help us operate the app:
      </p>
      <ul>
        <li><strong>Supabase</strong> — database and authentication (supabase.com)</li>
        <li><strong>Vercel</strong> — application hosting (vercel.com)</li>
        <li><strong>Google</strong> — optional OAuth sign-in (accounts.google.com)</li>
      </ul>
      <p>
        Each of these providers has their own privacy policies and security practices.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        Your data is retained for as long as your account is active. Progress data older
        than 90 days may be automatically pruned from our servers to manage storage.
        Local data on your device is retained until you clear your browser storage or
        uninstall the app.
      </p>
      <p>
        You can delete your account and all associated data at any time by contacting us at{' '}
        <a href="mailto:privacy@dhikrly.app">privacy@dhikrly.app</a>.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of all data we hold about you</li>
        <li><strong>Correction</strong> — request correction of inaccurate data</li>
        <li><strong>Deletion</strong> — request deletion of your account and all data</li>
        <li><strong>Portability</strong> — request your data in a machine-readable format</li>
        <li><strong>Objection</strong> — object to any processing of your data</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{' '}
        <a href="mailto:privacy@dhikrly.app">privacy@dhikrly.app</a>. We will respond
        within 30 days.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Dhikrly does not use tracking cookies or advertising cookies. The only browser
        storage we use is <code>localStorage</code> for saving your progress and settings
        on your device, and a session cookie set by Supabase to maintain your login state.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Dhikrly is not directed at children under the age of 13. We do not knowingly
        collect personal information from children under 13. If you believe a child under
        13 has provided us with personal information, please contact us and we will
        promptly delete it.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify users of
        significant changes by updating the "Last updated" date at the top of this page.
        Continued use of the app after changes constitutes acceptance of the updated policy.
      </p>

      <h2>11. Contact</h2>
      <p>
        For any privacy questions, data requests, or concerns, please contact us at:{' '}
        <a href="mailto:privacy@dhikrly.app">privacy@dhikrly.app</a>
      </p>
    </LegalLayout>
  );
}
