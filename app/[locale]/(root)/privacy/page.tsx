import Header from "@/components/shared/Header";

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header title="Privacy Policy" subtitle="Effective Date: June 1, 2024" />

      <div className="prose prose-purple mt-8 space-y-6 text-gray-700">
        <p>Your privacy is important to us. This Privacy Policy explains how ArabianRizz collects, uses, and protects your information.</p>

        <h3 className="text-xl font-bold text-gray-900">1. Information We Collect</h3>
        <ul className="list-disc pl-5">
            <li><strong>Account Info:</strong> Name, email address, and authentication details via Clerk.</li>
            <li><strong>Usage Data:</strong> Chat logs, generated images, and interactions to improve our AI models.</li>
            <li><strong>Payment Info:</strong> Processed securely by Stripe. We do not store your credit card details.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900">2. How We Use Your Information</h3>
        <p>We use your data to:</p>
        <ul className="list-disc pl-5">
            <li>Provide and improve the Service.</li>
            <li>Personalize your experience (e.g., "My Persona").</li>
            <li>Process transactions and prevent fraud.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900">3. Data Sharing</h3>
        <p>We do not sell your personal data. We may share data with trusted third-party service providers (e.g., OpenRouter, Stripe, MongoDB) strictly for operational purposes.</p>

        <h3 className="text-xl font-bold text-gray-900">4. Data Security</h3>
        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>

        <h3 className="text-xl font-bold text-gray-900">5. Your Rights</h3>
        <p>You have the right to request access to or deletion of your personal data. Contact us at support@arabianrizz.com for assistance.</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
