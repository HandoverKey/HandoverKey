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
        <div className="prose prose-stone max-w-none bg-white dark:bg-gray-800/40 p-8 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Last updated: June 12, 2026
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            By accessing and using HandoverKey, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. Description of Service
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            HandoverKey provides a digital legacy service that includes a "Dead
            Man's Switch" mechanism. We store encrypted data and release it to
            designated successors upon the failure of the account holder to
            check in within a specified timeframe.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            3. User Responsibilities
          </h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-4 space-y-2">
            <li>
              You are responsible for maintaining the confidentiality of your
              master password. We cannot recover it for you.
            </li>
            <li>
              You are responsible for ensuring your contact information and that
              of your successors is up to date.
            </li>
            <li>You agree not to use the service for any illegal purposes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            4. Limitation of Liability
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            HandoverKey is provided "as is". We are not liable for any damages
            arising from the use or inability to use the service, including but
            not limited to data loss or failure to deliver data to successors.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            5. Termination
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We reserve the right to terminate your access to the service without
            cause or notice, which may result in the forfeiture and destruction
            of all information associated with your account.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
