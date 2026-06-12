import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../contexts/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

interface SessionItem {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
}

const Sessions: React.FC = () => {
  const { success, error: showError } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invalidatingOthers, setInvalidatingOthers] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/sessions");
      setSessions(response.data.sessions || []);
    } catch {
      showError("Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleInvalidateSession = async (sessionId: string) => {
    setBusyId(sessionId);
    try {
      await api.delete(`/sessions/${sessionId}`);
      success("Session revoked successfully");
      await fetchSessions();
    } catch {
      showError("Failed to revoke session");
    } finally {
      setBusyId(null);
    }
  };

  const handleInvalidateOthers = async () => {
    setInvalidatingOthers(true);
    try {
      await api.post("/sessions/invalidate-others", {});
      success("All other sessions were revoked");
      await fetchSessions();
    } catch {
      showError("Failed to revoke other sessions");
    } finally {
      setInvalidatingOthers(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Active Sessions
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Review and revoke browser sessions connected to your account.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setConfirmRevokeOthers(true)}
            disabled={invalidatingOthers}
            className="btn btn-primary"
          >
            {invalidatingOthers ? "Revoking..." : "Revoke Other Sessions"}
          </button>
        </div>
      </div>

      <div className="mt-8 card">
        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No active sessions found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="p-6 flex items-start justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session.userAgent || "Unknown device"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    IP: {session.ipAddress || "Unknown"} | Last activity:{" "}
                    {new Date(session.lastActivity).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                {session.isCurrent ? (
                  <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/20">
                    Current
                  </span>
                ) : (
                  <button
                    onClick={() => setSessionToRevoke(session.id)}
                    disabled={busyId === session.id}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {busyId === session.id ? "Revoking..." : "Revoke"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationModal
        isOpen={sessionToRevoke !== null}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={async () => {
          const id = sessionToRevoke;
          setSessionToRevoke(null);
          if (id) {
            await handleInvalidateSession(id);
          }
        }}
        title="Revoke this session?"
        message="This device will be signed out and will need to log in again. Continue?"
        confirmText="Revoke session"
        type="danger"
      />

      <ConfirmationModal
        isOpen={confirmRevokeOthers}
        onClose={() => setConfirmRevokeOthers(false)}
        onConfirm={async () => {
          setConfirmRevokeOthers(false);
          await handleInvalidateOthers();
        }}
        title="Revoke all other sessions?"
        message="Every other device signed into your account will be signed out immediately. This session stays active. Continue?"
        confirmText="Revoke others"
        type="danger"
      />
    </div>
  );
};

export default Sessions;
