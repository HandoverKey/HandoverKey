import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../services/api";
import { CheckIcon } from "@heroicons/react/24/outline";

interface BillingStatus {
  tier: string;
  status: string;
  stripeEnabled: boolean;
  hasSubscription: boolean;
  endsAt: string | null;
}

const tierDetails: Record<
  string,
  { name: string; description: string; features: string[] }
> = {
  free: {
    name: "Free",
    description: "Basic digital legacy protection",
    features: [
      "Up to 5 vault entries",
      "1 successor",
      "Dead Man's Switch",
      "Zero-knowledge encryption",
    ],
  },
  pro: {
    name: "Pro",
    description: "Comprehensive protection for individuals",
    features: [
      "Unlimited vault entries",
      "Up to 5 successors",
      "Shamir's Secret Sharing",
      "Priority reminders",
      "Activity audit logs",
      "Vault export & import",
    ],
  },
  family: {
    name: "Family",
    description: "Complete protection for you and your family",
    features: [
      "Everything in Pro",
      "Unlimited successors",
      "Per-entry access controls",
      "Custom inactivity thresholds",
      "Webhook notifications",
      "Dedicated support",
    ],
  },
};

const Billing: React.FC = () => {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await api.get("/billing/status");
      setBilling(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Billing endpoint not deployed yet — default to free
        setBilling({
          tier: "free",
          status: "active",
          stripeEnabled: false,
          hasSubscription: false,
          endsAt: null,
        });
      } else {
        // Real error (network, 500, etc.) — still show page but without billing
        setBilling({
          tier: "free",
          status: "active",
          stripeEnabled: false,
          hasSubscription: false,
          endsAt: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: "pro" | "family") => {
    setCheckoutLoading(tier);
    try {
      const response = await api.post("/billing/checkout", {
        priceId: tier, // Backend resolves the actual Stripe price ID
      });
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post("/billing/portal");
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const currentTier = billing?.tier || "free";
  const currentDetails = tierDetails[currentTier] || tierDetails.free;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Plan:{" "}
              <span className="text-amber-700 dark:text-amber-400">
                {currentDetails.name}
              </span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentDetails.description}
            </p>
          </div>
          {billing?.status === "past_due" && (
            <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-medium">
              Payment Past Due
            </span>
          )}
          {billing?.status === "active" && currentTier !== "free" && (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
              Active
            </span>
          )}
        </div>

        {billing?.endsAt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Current period ends: {new Date(billing.endsAt).toLocaleDateString()}
          </p>
        )}

        {billing?.hasSubscription && (
          <button
            type="button"
            onClick={handleManageSubscription}
            className="text-sm text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4 decoration-amber-500 hover:decoration-2 font-medium"
          >
            Manage Subscription →
          </button>
        )}
      </div>

      {/* Upgrade Options */}
      {currentTier === "free" && billing?.stripeEnabled && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upgrade Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["pro", "family"] as const).map((tier) => {
              const details = tierDetails[tier];
              const featured = tier === "pro";
              return (
                <div
                  key={tier}
                  className={`relative rounded-2xl p-6 ring-1 ${
                    featured
                      ? "ring-amber-200/80 dark:ring-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10"
                      : "ring-stone-200 dark:ring-gray-700 bg-white dark:bg-gray-800/40"
                  }`}
                >
                  {featured && (
                    <span className="absolute top-4 right-4 text-[10px] font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-1">
                    {details.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {details.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {details.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleUpgrade(tier)}
                    disabled={checkoutLoading === tier}
                    className="btn btn-primary w-full"
                  >
                    {checkoutLoading === tier
                      ? "Redirecting..."
                      : `Upgrade to ${details.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing not configured message */}
      {!billing?.stripeEnabled && currentTier === "free" && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Paid plans are coming soon. Join the waitlist on our homepage to be
            notified when they launch!
          </p>
        </div>
      )}
    </div>
  );
};

export default Billing;
