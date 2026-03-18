import type { Metadata } from 'next';
import LegalLayout from '../../components/LegalLayout';
import '../legal.css';
export const metadata: Metadata = {
  title: 'About — Dhikrly',
  description: "About Dhikrly — a daily adhkār and du'ā tracker for Muslims.",
};

export default function AboutPage() {
  return (
    <LegalLayout
      title="About Dhikrly"
      subtitle="A humble tool for daily remembrance of Allah"
      lastUpdated="March 2025"
    >
      <div className="highlight-box">
        <p>
          `Whoever recites Ayat al-Kursi after every obligatory prayer, nothing
          prevents him from entering Paradise except death.`` — Reported by
          al-Nasā`ī
        </p>
      </div>

      <h2>What is Dhikrly?</h2>
      <p>
        Dhikrly is a Progressive Web App (PWA) designed to help Muslims maintain
        consistency in their daily adhkār and du`ā. It provides a curated
        collection of morning and evening adhkār, Qur`ānic verses, and personal
        supplications — all in Arabic with English translations and
        transliterations.
      </p>
      <p>
        The app works entirely offline, can be installed on your home screen
        like a native app, and optionally syncs your progress across all your
        devices when you create a free account.
      </p>

      <h2>Why We Built This</h2>
      <p>
        Consistency in dhikr is one of the most virtuous and often overlooked
        acts of worship. Many Muslims know the importance of morning and evening
        adhkār but struggle with tracking whether they`ve completed them each
        day.
      </p>
      <p>
        Dhikrly was built to solve exactly this — a clean, distraction-free
        space dedicated solely to your daily remembrance, with no
        advertisements, no social features, and no noise.
      </p>

      <h2>Features</h2>
      <ul>
        <li>
          14 curated duas covering Qur`ānic verses, athkār, and personal
          supplications
        </li>
        <li>Arabic text with English translation and Latin transliteration</li>
        <li>Daily completion tracking with streaks and a 16-week heatmap</li>
        <li>Morning and evening notification reminders</li>
        <li>Add your own custom duas</li>
        <li>Weekly and monthly PDF progress reports</li>
        <li>Missed day recovery</li>
        <li>Cross-device sync via free account</li>
        <li>Works fully offline as a PWA</li>
        <li>Dark and light mode</li>
        <li>Subtle sound feedback on completion</li>
        <li>No ads. No tracking. No distractions.</li>
      </ul>

      <h2>Our Approach to Religious Content</h2>
      <p>
        All duas and adhkār in Dhikrly are sourced from authenticated hadith and
        well-known Islamic references including Ḥiṣn al-Muslim (Fortress of the
        Muslim) by Sa`īd ibn `Alī ibn Wahf al-Qaḥṭānī. We have taken care to
        present the Arabic text accurately, with translations that aim to be
        faithful to the meaning.
      </p>
      <p>
        If you notice any error in the religious content, we sincerely welcome
        your correction. Please email us at{' '}
        <a href="mailto:dhikrly@stacknothing.com">dhikrly@stacknothing.com</a>.
      </p>

      <h2>Privacy First</h2>
      <p>
        Dhikrly does not show advertisements, does not track your behaviour, and
        does not share your data with third parties. When you use the app
        without an account, everything stays entirely on your device. When you
        create an account, your data is stored securely and used only to sync
        your progress.
      </p>
      <p>
        Read our full <a href="/privacy-policy">Privacy Policy</a>.
      </p>

      <h2>Open to Feedback</h2>
      <p>
        Dhikrly is an ongoing project. If you have suggestions for duas to add,
        features you`d like to see, or anything else — please reach out. We`d
        love to hear from you.
      </p>
      <p>
        📧{' '}
        <a href="mailto:dhikrly@stacknothing.com">dhikrly@stacknothing.com</a>
      </p>

      <h2>Du`ā</h2>
      <p>
        May Allah accept our adhkār, grant us sincerity in worship, and make
        this app a means of benefit for the Muslim community. آمين
      </p>
    </LegalLayout>
  );
}
