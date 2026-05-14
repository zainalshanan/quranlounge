import { Link } from 'react-router-dom';

const TermsOfService = () => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="policy-container">
      <h1>Terms of Service for QuranLounge</h1>
      <p><strong>Effective Date:</strong> {today}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using QuranLounge, you agree to abide by these Terms of Service. If you do not agree, please do not use this application.
      </p>

      <h2>2. Integrity of the Quranic Text</h2>
      <p>
        QuranLounge utilizes official data provided by the Quran Foundation. The Arabic text of the Quran is sacred. As a user of this site, you agree that:
      </p>
      <ul>
        <li>The text of the Quran cannot and must not be modified, altered, or manipulated in any way.</li>
        <li>If you share or capture snippets of Quranic content from this application, you must preserve their original context and not alter the intended message.</li>
      </ul>

      <h2>3. Prohibited Conduct</h2>
      <p>
        QuranLounge is designed as a peaceful, lofi environment for study and reflection. You strictly agree not to use the content provided by this application in any contexts that:
      </p>
      <ul>
        <li>Promote hate speech, extremism, violence, or discrimination.</li>
        <li>Spread misinformation or deliberate distortions of the text.</li>
        <li>Combine the sacred text or audio with unlawful, explicit, or inappropriate material.</li>
      </ul>

      <h2>4. Data Scraping and Artificial Intelligence</h2>
      <p>
        The backend data, timings, and text powering this application are legally protected by the Quran Foundation and various open-source licenses. Users are strictly prohibited from scraping this site, its API endpoints, or its network requests to:
      </p>
      <ul>
        <li>Build, train, or optimize machine-learning (ML) models or artificial intelligence (AI).</li>
        <li>Create biometric identifiers.</li>
        <li>Bulk-download audio files for commercial resale. (Any such use requires explicit, written consent directly from the original data providers).</li>
      </ul>

      <h2>5. Disclaimer of Warranties</h2>
      <p>
        QuranLounge is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. While we strive for 100% accuracy by relying on verified databases, we do not warrant that the service will be entirely uninterrupted or error-free.
      </p>

      <h2>6. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time to comply with updated API developer policies. Continued use of QuranLounge after any such changes constitutes your consent to the new terms.
      </p>

      <div className="policy-footer">
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default TermsOfService;
