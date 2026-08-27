import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Footer from "../components/Footer";

export default function CookiePolicy() {
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
          Cookie Policy
        </h1>
        <div className="prose prose-stone max-w-none bg-white dark:bg-gray-800/40 p-8 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700 space-y-6 text-gray-600 dark:text-gray-400">
          <p>Last updated: July 25, 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            1. What Are Cookies
          </h2>
          <p>
            Cookies are small text files placed on your device by a website. We
            use them solely to make the service work correctly — not to track
            you across the web or serve advertising.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. Cookies We Set
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">
                  Purpose
                </th>
                <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-gray-800">
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">access_token</td>
                <td className="py-2 pr-4">
                  Authentication — keeps you logged in (httpOnly, Secure)
                </td>
                <td className="py-2">1 hour</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">refresh_token</td>
                <td className="py-2 pr-4">
                  Session renewal (httpOnly, Secure)
                </td>
                <td className="py-2">7 days</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">hk_theme</td>
                <td className="py-2 pr-4">
                  Remembers your light/dark mode preference (localStorage)
                </td>
                <td className="py-2">Persistent</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">
                  hk_cookie_consent
                </td>
                <td className="py-2 pr-4">
                  Records your cookie consent choice (localStorage)
                </td>
                <td className="py-2">Persistent</td>
              </tr>
            </tbody>
          </table>
          <p>
            All authentication cookies are <strong>httpOnly</strong> and{" "}
            <strong>Secure</strong> — JavaScript cannot read them, reducing XSS
            risk. We do not set any third-party, advertising, or analytics
            cookies.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            3. Optional Analytics
          </h2>
          <p>
            When enabled, we use{" "}
            <a
              href="https://vercel.com/analytics"
              className="underline underline-offset-4 decoration-amber-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Analytics
            </a>{" "}
            for aggregate, anonymous page-view data. Vercel Analytics does not
            use cookies or fingerprint individual users. No personal data is
            collected by this service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            4. Managing Cookies
          </h2>
          <p>
            You can clear cookies at any time through your browser settings.
            Removing the authentication cookies will log you out. You can also
            withdraw consent via the banner at the bottom of the page — reload
            after clearing <code>hk_cookie_consent</code> from localStorage to
            see it again.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            5. Contact
          </h2>
          <p>
            Questions about our use of cookies?{" "}
            <Link
              to="/contact"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              Contact us
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:privacy@handoverkey.app"
              className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white"
            >
              privacy@handoverkey.app
            </a>
            .
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
