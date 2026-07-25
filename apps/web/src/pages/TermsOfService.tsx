import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Footer from "../components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-gray-900">
      <nav className="bg-[#FAF7F2]/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-stone-200/70 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex justify-between h-14 items-center">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark className="h-6 w-6" />
              <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
                Handoverkey
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-1.5"
              >
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-stone max-w-none bg-white dark:bg-gray-800/40 p-8 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700 space-y-4 text-gray-600 dark:text-gray-400">
          <p>Last updated: July 25, 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using HandoverKey ("Service"), you agree to be bound
            by these Terms of Service and our{" "}
            <Link
              to="/privacy"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              Privacy Policy
            </Link>
            . If you do not agree, do not use the Service. You must be at least
            18 years old to create an account.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. Description of Service
          </h2>
          <p>
            HandoverKey provides a zero-knowledge encrypted digital vault with a
            dead man's switch mechanism. We store encrypted data and, upon the
            account holder's prolonged inactivity, release cryptographic key
            shares to designated successors so they can decrypt the vault
            client-side.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">
              Important:
            </strong>{" "}
            Because encryption and decryption happen entirely in your browser,
            we cannot recover your vault if you lose your master password. Data
            loss resulting from a forgotten password is your responsibility.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            3. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any unlawful purpose</li>
            <li>
              Attempt to gain unauthorised access to other users' accounts or
              data
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code
              beyond what is already open-source
            </li>
            <li>
              Use the Service to store content that violates applicable law
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            4. User Responsibilities
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You are solely responsible for maintaining the confidentiality of
              your master password.
            </li>
            <li>
              You are responsible for keeping your contact information and that
              of your successors up to date.
            </li>
            <li>
              You are responsible for configuring your inactivity threshold
              appropriately.
            </li>
            <li>
              You acknowledge that resetting your password permanently destroys
              your existing encrypted vault data.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            5. Paid Plans and Refunds
          </h2>
          <p>
            Paid subscriptions (Pro, Family) are billed monthly or annually via
            Stripe. You may cancel at any time from your billing settings;
            access continues until the end of the current billing period. We
            offer a full refund within 14 days of initial purchase if the
            Service does not work as described — contact{" "}
            <a
              href="mailto:support@handoverkey.app"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              support@handoverkey.app
            </a>
            .
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            6. Limitation of Liability
          </h2>
          <p>
            The Service is provided "as is" without warranties of any kind. To
            the maximum extent permitted by law, HandoverKey shall not be liable
            for any indirect, incidental, or consequential damages, including
            but not limited to loss of data, failure to deliver data to
            successors, or loss of profits.
          </p>
          <p>
            Our aggregate liability for any claim arising out of these Terms
            shall not exceed the amount you paid us in the 12 months preceding
            the claim.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            7. Termination
          </h2>
          <p>
            You may delete your account at any time from Settings. We reserve
            the right to suspend or terminate accounts that violate these Terms.
            Upon termination, your data is permanently deleted within 30 days.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            8. Changes to Terms
          </h2>
          <p>
            We may update these Terms from time to time. Material changes will
            be communicated via email at least 14 days before taking effect.
            Continued use of the Service after that date constitutes acceptance
            of the updated Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            9. Governing Law and Dispute Resolution
          </h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of
            Germany. Any disputes shall first be attempted to be resolved
            informally by contacting{" "}
            <a
              href="mailto:legal@handoverkey.app"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              legal@handoverkey.app
            </a>
            . If unresolved, disputes shall be subject to the exclusive
            jurisdiction of the courts of Germany.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
