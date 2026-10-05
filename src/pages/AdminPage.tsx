import { useState } from "react";
import {
  Shield,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Wallet,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useAllUsers, useBuildingRegistrations } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  updateLocalProfile,
  updateLocalBuildingRegistrationStatus,
} from "@/lib/localStore";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";
import { getRoleLabel } from "@/lib/roles";
import type { UserProfile, BuildingRegistration } from "@/lib/roles";

type Tab = "users" | "registrations";

export function AdminPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>("users");

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-brand-600/15 flex items-center justify-center mb-4">
          <Shield size={28} className="text-brand-600" />
        </div>
        <h2 className="text-lg font-bold text-ink-900">Admin Access Only</h2>
        <p className="text-sm text-ink-500 mt-1">
          You need admin privileges to access this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Admin Panel</h1>
        <p className="text-sm text-ink-500">
          Manage users, buildings, and platform data
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-lg border border-line-strong w-fit">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
            tab === "users"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink-900 hover:bg-surface-3"
          }`}
        >
          <Users size={14} className="inline mr-1.5" />
          Users
        </button>
        <button
          onClick={() => setTab("registrations")}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
            tab === "registrations"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink-900 hover:bg-surface-3"
          }`}
        >
          <Building2 size={14} className="inline mr-1.5" />
          Building Registrations
        </button>
      </div>

      {tab === "users" ? <UsersTab /> : <RegistrationsTab />}
    </div>
  );
}

function UsersTab() {
  const { users, loading, error, reload } = useAllUsers();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  if (loading) return <PageLoader label="Loading users…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const roleStats = {
    admin: users.filter((u) => u.role === "admin").length,
    building_owner: users.filter((u) => u.role === "building_owner").length,
    flat_owner: users.filter((u) => u.role === "flat_owner").length,
    tenant: users.filter((u) => u.role === "tenant").length,
  };

  async function toggleVerification(userId: string, currentVerified: boolean) {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_verified: !currentVerified })
        .eq("id", userId);
      if (!error) {
        notify(
          `User ${currentVerified ? "unverified" : "verified"} successfully.`,
          "success",
        );
        reload();
        return;
      }
    } catch {
      // Remote fallback
    }

    updateLocalProfile(userId, { is_verified: !currentVerified });
    notify(
      `User ${currentVerified ? "unverified" : "verified"} successfully.`,
      "success",
    );
    reload();
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["admin", "building_owner", "flat_owner", "tenant"] as const).map(
          (r) => (
            <Card key={r}>
              <CardBody className="py-3">
                <p className="text-xs text-ink-500">{getRoleLabel(r)}</p>
                <p className="text-2xl font-bold font-mono text-ink-900 tabular-nums">
                  {roleStats[r]}
                </p>
              </CardBody>
            </Card>
          ),
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <Input
          placeholder="Search users…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No users match your search."
              icon={<Users size={22} />}
            />
          ) : (
            <div className="divide-y divide-line-strong">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-ink-900 font-bold text-sm border border-line-strong">
                      {u.full_name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {u.full_name || "Unnamed"}
                      </p>
                      <p className="text-xs text-ink-500">
                        {getRoleLabel(u.role)} · Joined{" "}
                        {formatDate(u.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {u.is_verified ? (
                      <Badge tone="paid">
                        <CheckCircle2 size={12} className="mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge tone="pending">
                        <Clock size={12} className="mr-1" /> Unverified
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVerification(u.id, u.is_verified)}
                    >
                      {u.is_verified ? (
                        <UserX size={14} />
                      ) : (
                        <UserCheck size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          open
          onClose={() => setSelectedUser(null)}
          title={selectedUser.full_name || "User Details"}
          size="sm"
        >
          <div className="space-y-3 text-sm text-ink-900">
            <p>
              <strong>Role:</strong> {getRoleLabel(selectedUser.role)}
            </p>
            <p>
              <strong>Phone:</strong> {selectedUser.phone || "Not provided"}
            </p>
            <p>
              <strong>Verified:</strong>{" "}
              {selectedUser.is_verified ? "Yes" : "No"}
            </p>
            <p>
              <strong>Joined:</strong> {formatDate(selectedUser.created_at)}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}

function RegistrationsTab() {
  const { registrations, loading, error, reload } = useBuildingRegistrations();
  const { user } = useAuth();
  const { notify } = useToast();

  if (loading) return <PageLoader label="Loading registrations…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;

  async function updateStatus(
    regId: string,
    status: "verified" | "rejected",
    notes?: string,
  ) {
    const updates: Record<string, unknown> = {
      status,
      admin_notes: notes || null,
    };
    if (status === "verified") {
      updates.verified_at = new Date().toISOString();
      updates.verified_by = user?.id;
    }

    try {
      const { error } = await supabase
        .from("building_registrations")
        .update(updates)
        .eq("id", regId);
      if (!error) {
        notify(`Registration ${status}.`, "success");
        reload();
        return;
      }
    } catch {
      // Remote fallback
    }

    updateLocalBuildingRegistrationStatus(regId, status, notes, user?.id);
    notify(`Registration ${status}.`, "success");
    reload();
  }

  const pending = registrations.filter((r) => r.status === "pending");
  const processed = registrations.filter((r) => r.status !== "pending");

  return (
    <>
      {/* Pending Registrations */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Approvals ({pending.length})</CardTitle>
            <CardDescription>
              Building registrations awaiting your review
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {pending.length === 0 ? (
            <EmptyState
              title="No pending registrations"
              description="All building registrations have been reviewed."
              icon={<CheckCircle2 size={22} />}
            />
          ) : (
            <div className="divide-y divide-line-strong">
              {pending.map((reg) => (
                <div key={reg.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink-900">
                        {reg.building_name}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {reg.building_address || "No address provided"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                        {reg.registration_number && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} /> Reg:{" "}
                            {reg.registration_number}
                          </span>
                        )}
                        {reg.proof_type && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} /> Proof:{" "}
                            {reg.proof_type.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Submitted{" "}
                          {formatDate(reg.submitted_at)}
                        </span>
                      </div>
                      {reg.proof_document_url && (
                        <a
                          href={reg.proof_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:underline font-semibold mt-2 inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> View Proof Document
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateStatus(reg.id, "verified")}
                        className="bg-success-500 hover:bg-success-600"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateStatus(reg.id, "rejected", "Proof insufficient")
                        }
                        className="text-brand-600 hover:bg-brand-600/10"
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Processed Registrations */}
      {processed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed ({processed.length})</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line-strong">
              {processed.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {reg.building_name}
                    </p>
                    <p className="text-xs text-ink-500">
                      {reg.building_address || "No address"} ·{" "}
                      {formatDate(reg.submitted_at)}
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    {reg.status === "verified" ? (
                      <Badge tone="paid">
                        <CheckCircle2 size={12} className="mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge tone="overdue">
                        <XCircle size={12} className="mr-1" /> Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
