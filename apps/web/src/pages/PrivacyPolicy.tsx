import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <div className="prose prose-stone max-w-none bg-white dark:bg-gray-800/40 p-8 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Last updated: June 12, 2026
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            1. Introduction
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            At HandoverKey, we take your privacy seriously. Our entire
            architecture is built around the principle of Zero-Knowledge
            Encryption, meaning we cannot access your stored data even if we
            wanted to.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. Data We Collect
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We collect the minimum amount of data necessary to operate the
            service:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-4 space-y-2">
            <li>Account information (email address)</li>
            <li>Encrypted blobs (your data, which we cannot decrypt)</li>
            <li>
              Successor contact information (emails/phone numbers you provide)
            </li>
            <li>
              Usage logs (login times, IP addresses for security auditing)
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            3. How We Use Your Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We use your data solely to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-4 space-y-2">
            <li>Provide the Dead Man's Switch service</li>
            <li>Notify you of check-in requirements</li>
            <li>Contact your successors in the event of a handover</li>
            <li>Maintain the security and integrity of the platform</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            4. Zero-Knowledge Architecture
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your vault data is encrypted on your device using your master
            password before it is sent to our servers. We do not store your
            master password. This means:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-4 space-y-2">
            <li>We cannot decrypt your vault</li>
            <li>We cannot recover your account if you lose your password</li>
            <li>
              We cannot sell your data to advertisers because we can't read it
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            5. Data Sharing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We do not sell, trade, or rent your personal identification
            information to others. We may share generic aggregated demographic
            information not linked to any personal identification information
            regarding visitors and users with our business partners, trusted
            affiliates, and advertisers.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
