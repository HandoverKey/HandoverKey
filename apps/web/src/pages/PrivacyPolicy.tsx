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
        <div className="prose prose-stone max-w-none bg-white dark:bg-gray-800/40 p-8 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700 space-y-4 text-gray-600 dark:text-gray-400">
          <p>Last updated: July 25, 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            1. Introduction
          </h2>
          <p>
            At HandoverKey ("we", "us", "our"), we take your privacy seriously.
            Our entire architecture is built around zero-knowledge encryption —
            we cannot access your stored vault data even if we wanted to. This
            policy explains what we collect, why, and your rights over it.
          </p>
          <p>
            For questions, contact us at{" "}
            <a
              href="mailto:privacy@handoverkey.app"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              privacy@handoverkey.app
            </a>
            .
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. Data We Collect
          </h2>
          <p>We collect the minimum data necessary to operate the service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (name, email address)</li>
            <li>
              Encrypted vault blobs, IVs, and salts (we cannot decrypt these)
            </li>
            <li>Successor contact information (emails you provide)</li>
            <li>
              Activity logs (login times, IP addresses for security auditing)
            </li>
            <li>
              Billing information processed by Stripe (we do not store card
              numbers)
            </li>
            <li>Support and contact form messages you send us</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            3. How We Use Your Data
          </h2>
          <p>We use your data solely to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and operate the dead man's switch service</li>
            <li>Send inactivity reminders and handover notifications</li>
            <li>Contact your successors in the event of a handover</li>
            <li>Process subscription payments via Stripe</li>
            <li>Maintain the security and integrity of the platform</li>
            <li>Respond to support requests</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            4. Zero-Knowledge Architecture
          </h2>
          <p>
            Your vault data is encrypted on your device using your master
            password before it is sent to our servers. We never store your
            master password or encryption key. This means:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We cannot decrypt your vault under any circumstances</li>
            <li>We cannot recover your account if you lose your password</li>
            <li>
              Law enforcement requests for vault contents cannot be fulfilled —
              we have nothing to hand over
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            5. Data Sharing and Sub-Processors
          </h2>
          <p>
            We do not sell or rent your personal data. We share data only with
            the following service providers necessary to operate the platform:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-gray-900 dark:text-white">Stripe</strong>{" "}
              — payment processing. Governed by Stripe's Privacy Policy.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                SMTP provider
              </strong>{" "}
              — transactional email delivery (reminders, handover
              notifications).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Hosting provider
              </strong>{" "}
              — infrastructure for the API and database.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Vercel</strong>{" "}
              — SPA hosting and optional aggregate analytics (no personal data
              collected).
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            6. Cookies
          </h2>
          <p>
            We use essential cookies for authentication only. No advertising or
            tracking cookies are set. See our{" "}
            <Link
              to="/cookies"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              Cookie Policy
            </Link>{" "}
            for full details.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            7. Data Retention
          </h2>
          <p>
            We retain your account data for as long as your account is active.
            If you delete your account, all personal data, vault entries, and
            successor records are permanently deleted within 30 days. Activity
            logs may be retained for up to 90 days for security purposes, then
            purged.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            8. Your Rights (GDPR / CCPA)
          </h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-gray-900 dark:text-white">Access</strong>{" "}
              — request a copy of your personal data
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Rectification
              </strong>{" "}
              — correct inaccurate data
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Erasure</strong>{" "}
              — request deletion of your data ("right to be forgotten")
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Portability
              </strong>{" "}
              — receive your data in a machine-readable format (use the vault
              export feature)
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                Objection
              </strong>{" "}
              — object to certain processing
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">
                California residents (CCPA)
              </strong>{" "}
              — right to know, delete, and opt out of sale (we do not sell data)
            </li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a
              href="mailto:privacy@handoverkey.app"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              privacy@handoverkey.app
            </a>
            .
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            9. Governing Law
          </h2>
          <p>
            This policy is governed by the laws of the Federal Republic of
            Germany. For EU residents, we comply with the General Data
            Protection Regulation (GDPR).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. Material changes will
            be communicated via email or a prominent notice on the platform. The
            "Last updated" date at the top of this page always reflects the
            current version.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
