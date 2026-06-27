import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { setMasterKey, deriveAuthKey } from "../services/encryption";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Spinner from "../components/Spinner";
import { getApiErrorMessage } from "../services/api-error";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const twoFactorInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // When the 2FA field is revealed, move focus to it so the user can type the
  // code immediately without hunting for the input.
  useEffect(() => {
    if (show2FA && !useRecoveryCode) {
      twoFactorInputRef.current?.focus();
    }
  }, [show2FA, useRecoveryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      // 1. Derive Auth Key (Client-side Hashing)
      // We use the email as salt for the Auth Key
      const authKey = await deriveAuthKey(password, email);

      // 2. Send Login Request with Auth Key
      const response = await api.post("/auth/login", {
        email,
        password: authKey,
        twoFactorCode:
          !useRecoveryCode && twoFactorCode ? twoFactorCode : undefined,
        recoveryCode:
          useRecoveryCode && recoveryCode
            ? recoveryCode.toUpperCase().trim()
            : undefined,
      });

      const { user: userData } = response.data;

      // 3. Set Master Key using the Salt returned by the server
      // The server returns the encryption salt (which we sent during registration)
      if (userData.salt) {
        await setMasterKey(password, userData.salt);
      }

      login(userData);
      navigate("/dashboard");
    } catch (err: unknown) {
      // If the server says a second factor is required, reveal the 2FA field
      // and keep the entered credentials so the user can finish signing in.
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 401 &&
        err.response.data?.twoFactorRequired
      ) {
        setShow2FA(true);
        setError("");
        setInfo("Enter your two-factor code to finish signing in.");
        return;
      }
      setError(getApiErrorMessage(err, "Failed to login"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-900">
        <Spinner className="h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link
              to="/"
              className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl ring-1 ring-amber-200/80 dark:ring-amber-800/40 focus:outline-none"
            >
              <ShieldCheckIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </Link>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sign in to Handoverkey
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-gray-900 dark:text-white underline underline-offset-4 decoration-amber-500 hover:decoration-2"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {info && (
              <div
                role="status"
                className="bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/80 dark:ring-amber-800/40 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm"
              >
                {info}
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {show2FA && (
              <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use recovery code
                  </label>
                  <input
                    type="checkbox"
                    checked={useRecoveryCode}
                    onChange={(e) => setUseRecoveryCode(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                </div>
                {!useRecoveryCode ? (
                  <div className="mt-3">
                    <label
                      htmlFor="two-factor-code"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Two-Factor Code
                    </label>
                    <input
                      id="two-factor-code"
                      ref={twoFactorInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="input mt-1"
                      placeholder="123456"
                    />
                  </div>
                ) : (
                  <div className="mt-3">
                    <label
                      htmlFor="recovery-code"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Recovery Code
                    </label>
                    <input
                      id="recovery-code"
                      type="text"
                      value={recoveryCode}
                      onChange={(e) =>
                        setRecoveryCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-F0-9-]/g, ""),
                        )
                      }
                      className="input mt-1 font-mono"
                      placeholder="A1B2C3-D4E5F6"
                    />
                  </div>
                )}
              </div>
            )}

            {!show2FA && (
              <button
                type="button"
                onClick={() => setShow2FA(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium underline underline-offset-4 decoration-stone-300 hover:decoration-amber-500"
              >
                Have a two-factor or recovery code?
              </button>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary flex justify-center"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
