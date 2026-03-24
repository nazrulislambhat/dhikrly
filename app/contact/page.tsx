import type { Metadata } from 'next';
import LegalLayout from '@/components/LegalLayout';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Contact — Dhikrly',
  description: 'Get in touch with the Dhikrly team.',
};

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact Us"
      subtitle="We'd love to hear from you — feedback, bugs, duas suggestions"
      lastUpdated="March 2025"
    >
      <div className="highlight-box">
        <p>
          Dhikrly is an independent project built with care for the Muslim community.
          All feedback, suggestions, and bug reports are welcome and genuinely read.
        </p>
      </div>

      <h2>General Enquiries</h2>
      <p>
        For general questions about Dhikrly, feature requests, or feedback:
      </p>
      <p>
        📧 <a href="mailto:hello@dhikrly.app">hello@dhikrly.app</a>
      </p>

      <h2>Privacy & Data Requests</h2>
      <p>
        For privacy-related questions, data access requests, or account deletion:
      </p>
      <p>
        📧 <a href="mailto:privacy@dhikrly.app">privacy@dhikrly.app</a>
      </p>

      <h2>Bug Reports</h2>
      <p>
        Found something broken? Please describe what happened and we'll fix it promptly:
      </p>
      <p>
        📧 <a href="mailto:bugs@dhikrly.app">bugs@dhikrly.app</a>
      </p>

      <h2>Islamic Content</h2>
      <p>
        If you notice an error in any Arabic text, translation, or transliteration —
        or would like to suggest a du'ā to be added — please reach out. Accuracy in
        religious content is important to us.
      </p>
      <p>
        📧 <a href="mailto:content@dhikrly.app">content@dhikrly.app</a>
      </p>

      <h2>Response Time</h2>
      <p>
        We aim to respond to all emails within 3–5 business days. JazakAllahu khairan
        for your patience.
      </p>

      <h2>Useful Links</h2>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms &amp; Conditions</a></li>
        <li><a href="/">Back to the App</a></li>
      </ul>
    </LegalLayout>
  );
}
