import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { getApiErrorMessage } from "../services/api-error";
import OnboardingChecklist, {
  type SetupStatus,
} from "../components/OnboardingChecklist";
import Skeleton from "../components/Skeleton";

interface ActivityLog {
  id: string;
  activity_type: string;
  created_at: string;
  ip_address?: string;
}

interface SafetyStatus {
  lastActivity: string | null;
  thresholdDays: number;
  isPaused: boolean;
  pausedUntil: string | null;
  daysUntilHandover: number | null;
}

interface HandoverStatus {
  active: boolean;
  id?: string;
  status?: string;
  gracePeriodEnds?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [stats, setStats] = useState([
    {
      name: "Total Secrets",
      stat: "...",
      icon: ShieldCheckIcon,
      color: "bg-blue-500",
    },
    {
      name: "Successors",
      stat: "...",
      icon: UserGroupIcon,
      color: "bg-green-500",
    },
    {
      name: "Days Active",
      stat: "...",
      icon: ClockIcon,
      color: "bg-purple-500",
    },
  ]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [cancellingHandover, setCancellingHandover] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [safety, setSafety] = useState<SafetyStatus | null>(null);
  const [handover, setHandover] = useState<HandoverStatus | null>(null);
  const [handoverStatusUnavailable, setHandoverStatusUnavailable] =
    useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    try {
      setOnboardingDismissed(
        window.localStorage.getItem("onboarding_dismissed") === "true",
      );
    } catch {
      /* restricted storage mode */
    }
  }, []);

  const fetchData = useCallback(async () => {
    // Track handover-status failures separately: silently assuming "no
    // handover" could hide a genuinely active handover from the user, so we
    // surface the uncertainty instead of dropping the red banner.
    let handoverStatusFailed = false;
    try {
      const [vaultRes, successorsRes, activityRes, inactivityRes, handoverRes] =
        await Promise.all([
          api.get("/vault/entries"),
          api.get("/successors"),
          api.get("/activity?limit=5"),
          api.get("/inactivity/settings").catch((err: unknown) => {
            const status = (err as { response?: { status?: number } })?.response
              ?.status;
            if (status === 404) return null;
            throw err;
          }),
          api.get("/handover/status").catch(() => {
            handoverStatusFailed = true;
            return null;
          }),
        ]);

      // Vault returns array directly
      const vaultCount = Array.isArray(vaultRes.data)
        ? vaultRes.data.length
        : 0;
      // Successors returns { successors: [...] }
      const successors = successorsRes.data.successors || [];
      const successorCount = successors.length;

      const hasKeyShares = successors.some(
        (s: { encryptedShare?: string | null }) => !!s.encryptedShare,
      );

      const inactivitySettings = inactivityRes?.data;
      const hasInactivityConfig =
        !!inactivitySettings && inactivitySettings.thresholdDays > 0;

      setSetupStatus({
        hasSecrets: vaultCount > 0,
        hasSuccessors: successorCount > 0,
        hasKeyShares,
        hasInactivityConfig,
      });

      // Activity returns { data: [...], pagination: {...} }
      const activityList: ActivityLog[] = activityRes.data.data || [];
      setActivities(activityList);

      // Derive the dead-man's-switch safety status.
      const thresholdDays = inactivitySettings?.thresholdDays ?? 90;
      const lastActivity = activityList[0]?.created_at ?? null;
      const daysSinceActivity = lastActivity
        ? Math.floor(
            (Date.now() - new Date(lastActivity).getTime()) /
              (1000 * 3600 * 24),
          )
        : null;
      const daysUntilHandover =
        daysSinceActivity === null
          ? null
          : Math.max(0, thresholdDays - daysSinceActivity);

      setSafety({
        lastActivity,
        thresholdDays,
        isPaused: Boolean(inactivitySettings?.isPaused),
        pausedUntil: inactivitySettings?.pausedUntil ?? null,
        daysUntilHandover,
      });

      const handoverData = handoverRes?.data;
      setHandoverStatusUnavailable(handoverStatusFailed);
      setHandover(
        handoverData?.active
          ? {
              active: true,
              id: handoverData.handover?.id,
              status: handoverData.handover?.status,
              gracePeriodEnds: handoverData.handover?.gracePeriodEnds,
            }
          : { active: false },
      );

      // "Days until handover" is the trust-relevant number, not a vanity
      // "days since signup" stat.
      const daysUntilStat = inactivitySettings?.isPaused
        ? "Paused"
        : daysUntilHandover === null
          ? "—"
          : daysUntilHandover.toString();

      setStats([
        {
          name: "Total Secrets",
          stat: vaultCount.toString(),
          icon: ShieldCheckIcon,
          color: "bg-blue-500",
        },
        {
          name: "Successors",
          stat: successorCount.toString(),
          icon: UserGroupIcon,
          color: "bg-green-500",
        },
        {
          name: "Days Until Handover",
          stat: daysUntilStat,
          icon: ClockIcon,
          color: "bg-purple-500",
        },
      ]);
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to load your dashboard"));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleManualCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post("/activity/check-in", {});
      success("Check-in recorded. Inactivity timer reset.");
      await fetchData();
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to record check-in"));
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCancelHandover = async () => {
    setCancellingHandover(true);
    try {
      await api.post("/handover/cancel", {
        reason: "Cancelled from dashboard",
      });
      success("Handover cancelled. Your vault remains private.");
      await fetchData();
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to cancel handover"));
    } finally {
      setCancellingHandover(false);
    }
  };

  const formatExactDate = (value: string | null) => {
    if (!value) return "No activity recorded yet";
    return new Date(value).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:tracking-tight truncate">
            Welcome back, {user?.name || user?.email?.split("@")[0] || "User"}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualCheckIn}
            disabled={checkingIn}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            {checkingIn ? "Checking In..." : "Check In"}
          </button>
          <Link
            to="/vault"
            className="btn btn-primary flex-1 sm:flex-none text-center"
          >
            Add Secret
          </Link>
        </div>
      </div>

      {setupStatus && !onboardingDismissed && !loading && (
        <div className="mt-8">
          <OnboardingChecklist
            status={setupStatus}
            onDismiss={() => {
              setOnboardingDismissed(true);
              localStorage.setItem("onboarding_dismissed", "true");
            }}
          />
        </div>
      )}

      {!loading && handoverStatusUnavailable && (
        <div
          role="alert"
          className="mt-8 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon
              className="h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">
                Handover status unavailable
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                We couldn&apos;t check whether a handover is currently in
                progress. If you were expecting a notice here, refresh the page
                to try again.
              </p>
              <button
                onClick={fetchData}
                className="mt-3 btn btn-secondary"
                type="button"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && handover?.active && (
        <div className="mt-8 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-5">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon
              className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-800 dark:text-red-300">
                {handover.status?.toUpperCase() === "GRACE_PERIOD"
                  ? "Handover grace period in progress"
                  : "Handover in progress"}
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Your dead-man&apos;s switch has triggered because no activity
                was detected.
                {handover.gracePeriodEnds &&
                  ` Successors will be notified after ${new Date(
                    handover.gracePeriodEnds,
                  ).toLocaleString()}.`}{" "}
                If this is a mistake, cancel it now to keep your vault private.
              </p>
              <button
                onClick={handleCancelHandover}
                disabled={cancellingHandover}
                className="mt-3 btn btn-primary"
              >
                {cancellingHandover ? "Cancelling..." : "Cancel handover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && safety && (
        <div className="mt-8">
          <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Safety Status
          </h3>
          <div className="mt-4 card p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last check-in
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {formatExactDate(safety.lastActivity)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safety.isPaused ? "Switch status" : "Days until handover"}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {safety.isPaused
                  ? safety.pausedUntil
                    ? `Paused until ${new Date(safety.pausedUntil).toLocaleDateString()}`
                    : "Paused"
                  : safety.daysUntilHandover === null
                    ? "—"
                    : `${safety.daysUntilHandover} of ${safety.thresholdDays} days`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inactivity threshold
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {safety.thresholdDays} days
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Overview
        </h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.name}
              className="card px-4 py-5 sm:p-6 flex items-center"
            >
              <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.name}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {loading ? <Skeleton className="h-6 w-12" /> : item.stat}
                  </div>
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <div className="mt-4 card">
          {activities.length > 0 ? (
            <ul
              role="list"
              className="divide-y divide-gray-100 dark:divide-gray-700"
            >
              {activities.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-x-4 py-5 px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                      {formatActivityType(item.activity_type)}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
