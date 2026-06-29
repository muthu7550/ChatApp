"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaArrowLeft,
} from "react-icons/fa";

const ORANGE = "linear-gradient(135deg, #ff9d2e, #ff5b2f)";

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <JoinGroupContent />
    </Suspense>
  );
}

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invite = searchParams.get("invite");
  const fromConversationId = searchParams.get("from");

  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!invite) {
      setError("Invite link is missing.");
      setLoading(false);
      return;
    }

    if (!user?._id) {
      const redirectUrl = `/join-group?invite=${invite}${
        fromConversationId ? `&from=${fromConversationId}` : ""
      }`;

      router.replace(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setCurrentUser(user);
    loadInvite(user._id);
  }, [invite, fromConversationId]);

  function goBack() {
    if (fromConversationId) {
      router.replace(`/chat?conversationId=${fromConversationId}`);
      return;
    }

    router.replace("/chat");
  }

  async function loadInvite(userId) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/groups/invite?invite=${invite}&userId=${userId}`,
      );

      const result = await res.json();

      if (!res.ok || !result?.success) {
        setError(result?.error || "This invite link is invalid.");
        return;
      }

    setGroup(result.group);

setAlreadyMember(
  Boolean(result.alreadyMember || result.group?.alreadyMember)
);

setPendingApproval(
  Boolean(result.pendingApproval || result.group?.pendingApproval)
);
    } catch (err) {
      setError("Unable to load this invite link.");
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup() {
    try {
      setJoining(true);

      const res = await fetch("/api/groups/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invite,
          userId: currentUser?._id,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result?.success) {
        setError(result?.error || "Join failed");
        return;
      }

      if (result?.pendingApproval) {
        setPendingApproval(true);
        return;
      }

      localStorage.setItem("forceRefreshConversations", Date.now().toString());

      router.replace(
        `/chat?conversationId=${result.group._id}&refresh=${Date.now()}`,
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center p-3 join-page">
      <style>{`
        .join-page {
          background:
            radial-gradient(circle at 15% 10%, rgba(255,157,46,.24), transparent 28%),
            radial-gradient(circle at 85% 20%, rgba(255,91,47,.20), transparent 30%),
            linear-gradient(135deg, #fff7f1, #f8fafc);
        }

        .join-card {
          max-width: 460px;
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(255, 217, 199, .9);
          box-shadow: 0 30px 90px rgba(15, 23, 42, .14);
        }

        .join-cover {
          height: 130px;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,.55), transparent 18%),
            ${ORANGE};
        }

        .join-avatar-wrap {
          width: 112px;
          height: 112px;
          padding: 5px;
          margin-top: -56px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 18px 45px rgba(255,91,47,.28);
        }

        .join-avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        .join-icon {
          width: 92px;
          height: 92px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          font-size: 36px;
        }

        .join-btn {
          border: 0;
          background: ${ORANGE};
          color: #fff;
          box-shadow: 0 14px 30px rgba(255,91,47,.26);
        }

        .join-btn:hover {
          color: #fff;
          transform: translateY(-1px);
        }

        .join-secondary-btn {
          background: #fff7f1;
          color: #ff5b2f;
          border: 1px solid #ffd9c7;
        }
      `}</style>

      {error ? (
        <div className="bg-white join-card p-5 text-center w-100">
          <div
            className="join-icon"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <FaExclamationTriangle />
          </div>

          <h2 className="fw-bold mb-2">Invalid Invite Link</h2>

          <p className="text-secondary mb-4">
            {error} Ask the group admin to share a new invite link.
          </p>

          <button
            type="button"
            onClick={goBack}
            className="btn join-btn rounded-4 px-4 py-3 fw-bold w-100"
          >
            <FaArrowLeft className="me-2 d-inline-block" />
            Back
          </button>
        </div>
      ) : (
        <div className="bg-white join-card text-center w-100">
          <div className="join-cover" />

          <div className="px-4 pb-4">
            <div className="join-avatar-wrap mx-auto">
              <img
                src={group?.avatar || "/default-avatar.png"}
                className="join-avatar"
                alt="group"
              />
            </div>

            <div
              className="mx-auto mt-3 mb-3 rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 fw-bold"
              style={{ background: "#fff3eb", color: "#ff5b2f" }}
            >
              <FaUsers />
              Group Invitation
            </div>

            <h2 className="fw-bold mb-1">{group?.name || "Group"}</h2>

            <p className="text-secondary mb-4">
              {group?.membersCount || 0} members
            </p>

            {pendingApproval && (
              <>
                <div
                  className="rounded-4 p-3 mb-4 fw-semibold"
                  style={{ background: "#fff3cd", color: "#b45309" }}
                >
                  ⏳ Your join request is pending admin approval.
                </div>

                <button
                  type="button"
                  onClick={goBack}
                  className="btn join-secondary-btn rounded-4 py-3 fw-bold w-100"
                >
                  Back
                </button>
              </>
            )}

            {pendingApproval ? (
              <>
                <div
                  className="rounded-4 p-3 mb-4 fw-semibold"
                  style={{ background: "#fff3cd", color: "#b45309" }}
                >
                  ⏳ Request Pending. Waiting for admin approval.
                </div>

                <button
                  type="button"
                  onClick={goBack}
                  className="btn join-secondary-btn rounded-4 py-3 fw-bold w-100"
                >
                  Back
                </button>
              </>
            ) : alreadyMember ? (
              <>
                <div
                  className="rounded-4 p-3 mb-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                >
                  <FaCheckCircle />
                  You are already a member of this group.
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn join-secondary-btn flex-fill rounded-4 py-3 fw-bold"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.replace(`/chat?conversationId=${group?._id}`)
                    }
                    className="btn join-btn flex-fill rounded-4 py-3 fw-bold"
                  >
                    View Group
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-secondary small mb-4">
                  Do you want to join this group and start chatting with
                  members?
                </p>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn join-secondary-btn flex-fill rounded-4 py-3 fw-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={joinGroup}
                    disabled={joining}
                    className="btn join-btn flex-fill rounded-4 py-3 fw-bold"
                  >
                    {joining
                      ? "Sending request..."
                      : group?.joinApproval
                        ? "Request to Join"
                        : "Join Group"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Loading() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="spinner-border" style={{ color: "#ff5b2f" }} />
    </main>
  );
}
