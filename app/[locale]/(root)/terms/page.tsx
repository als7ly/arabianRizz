import Header from "@/components/shared/Header";

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header title="Terms of Service" subtitle="Effective Date: June 1, 2024" />

      <div className="prose prose-purple mt-8 space-y-6 text-gray-700">
        <p>Welcome to ArabianRizz. By accessing or using our website and services, you agree to be bound by these Terms of Service.</p>

        <h3 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h3>
        <p>By registering for an account, purchasing credits, or using our AI tools, you acknowledge that you have read, understood, and agree to these terms.</p>

        <h3 className="text-xl font-bold text-gray-900">2. Description of Service</h3>
        <p>ArabianRizz provides AI-powered dating advice, image generation, and conversation simulation. Our services are for entertainment purposes only.</p>

        <h3 className="text-xl font-bold text-gray-900">3. User Conduct</h3>
        <ul className="list-disc pl-5">
            <li>You must be at least 18 years old to use this service.</li>
            <li>You agree not to generate illegal, harmful, or abusive content.</li>
            <li>You are responsible for maintaining the confidentiality of your account.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900">4. Payments and Credits</h3>
        <p>Credits are virtual currency used to access premium features. Purchases are final and non-refundable, except as required by law.</p>

        <h3 className="text-xl font-bold text-gray-900">5. Limitation of Liability</h3>
        <p>ArabianRizz is not responsible for any outcomes in your personal relationships resulting from the use of our advice. Use your own judgment.</p>

        <h3 className="text-xl font-bold text-gray-900">6. Changes to Terms</h3>
        <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the new terms.</p>
      </div>
    </div>
  );
};

export default TermsPage;
