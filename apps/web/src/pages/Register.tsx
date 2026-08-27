import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import { deriveAuthKey, generateEncryptionSalt } from "../services/encryption";
import BrandMark from "../components/BrandMark";
import Footer from "../components/Footer";
import LoadingButton from "../components/LoadingButton";
import { getApiErrorMessage } from "../services/api-error";

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      // 1. Generate Encryption Salt (for Master Key)
      const encryptionSalt = generateEncryptionSalt();

      // 2. Derive Auth Key (Client-side Hashing)
      // This is what we send to the server as the "password"
      const authKey = await deriveAuthKey(password, email);

      // 3. Send Registration Request
      // We send the authKey as the password, and the encryptionSalt to be stored
      await api.post("/auth/register", {
        name,
        email,
        password: authKey,
        confirmPassword: authKey,
        salt: encryptionSalt,
      });

      // 4. Show success message and redirect to login
      // User must verify email before they can login
      setSuccess(
        `Registration successful! Please check your email at ${email} to verify your account before logging in.`,
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to register"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Link
                to="/"
                className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl ring-1 ring-amber-200/80 dark:ring-amber-800/40 focus:outline-none"
              >
                <BrandMark className="h-10 w-10" />
              </Link>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
              Secure your legacy
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Create your Handoverkey account
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-gray-900 dark:text-white underline underline-offset-4 decoration-amber-500 hover:decoration-2"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="card p-8">
            {plan && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/80 dark:ring-amber-800/40 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm text-center">
                You're signing up for the{" "}
                <strong className="capitalize">{plan}</strong> plan — you can
                upgrade after confirming your email.
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Min 12 chars, uppercase, lowercase, number, special"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20 text-right">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 12 characters with uppercase, lowercase,
                  number, and special character.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="agreedToTerms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label
                  htmlFor="agreedToTerms"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white hover:decoration-2"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="underline underline-offset-4 decoration-amber-500 text-gray-900 dark:text-white hover:decoration-2"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div>
                <LoadingButton
                  type="submit"
                  loading={loading}
                  disabled={!agreedToTerms}
                  className="w-full btn btn-primary flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Account
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
