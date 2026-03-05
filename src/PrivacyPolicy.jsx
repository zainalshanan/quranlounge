import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="policy-container">
      <h1>Privacy Policy for QuranLounge</h1>
      <p><strong>Effective Date:</strong> {today}</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to QuranLounge. This application provides a tranquil, synchronized audio-visual experience for studying and listening to the Quran. To power this experience, QuranLounge utilizes the Quran Foundation (QF) APIs and aligns with the Quran.com brand's commitment to preserving the integrity of digital Islamic resources.
      </p>

      <h2>2. Data Collection & API Usage</h2>
      <p>
        QuranLounge is a "read-only" application. Public Quran text, audio, and associated metadata are retrieved via the Quran Foundation APIs without collecting personal user data from the source. We do not require users to create accounts, log in, or submit personal information to use the core features of this site.
      </p>

      <h2>3. Our "Never" Pledges</h2>
      <p>We respect your privacy and the sacred nature of the content we provide. QuranLounge strictly pledges that we will never:</p>
      <ul>
        <li>Use user data to build advertising profiles.</li>
        <li>Sell, rent, mine, or repurpose any personal information.</li>
        <li>Use user-generated content or user interaction data to train Artificial Intelligence (AI) models or machine learning algorithms without explicit written consent.</li>
      </ul>

      <h2>4. Sensitive Data Protection</h2>
      <p>
        We acknowledge that data related to a user's religious beliefs or practices is considered sensitive personal data requiring special legal protection. While QuranLounge does not currently collect user accounts or usage profiles, should this change in the future, we pledge to obtain explicit opt-in consent before collecting any religious or sensitive personal data.
      </p>

      <h2>5. Security Commitments</h2>
      <p>
        To ensure a safe browsing experience and protect the integrity of the data stream, QuranLounge implements the following security measures (in accordance with QF Security Rule 6.9):
      </p>
      <ul>
        <li><strong>Encryption in Transit:</strong> All connections to our site and the APIs utilize TLS (HTTPS).</li>
        <li><strong>Encryption at Rest:</strong> Any local caching of data utilizes standard encryption protocols.</li>
        <li><strong>Access Controls & Secret Rotation:</strong> API keys and infrastructure access are strictly controlled and regularly rotated.</li>
        <li><strong>Incident Response:</strong> In the event of a security vulnerability or breach, we commit to an incident response window of less than 24 hours.</li>
      </ul>

      <h2>6. Third-Party Services</h2>
      <p>
        QuranLounge uses third-party infrastructure to host and serve the application (e.g., Cloudflare). We ensure that appropriate data protection agreements are in place with our hosting providers. Please review their respective privacy policies regarding basic web-hosting analytics (such as IP logging for DDoS protection).
      </p>

      <p>
        <strong>Contact:</strong> If you have questions about this policy, please contact <a href="mailto:zainalshanan@gmail.com">zainalshanan@gmail.com</a>.
      </p>
      
      <div className="policy-footer">
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
