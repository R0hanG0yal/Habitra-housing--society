import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/roles";
import { ShieldX } from "lucide-react";

type RoleGuardProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Blocks rendering if the user doesn't have the required permission.
 */
export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const { role } = useAuth();

  if (!role || !hasPermission(role, permission)) {
    return fallback ?? <AccessDenied />;
  }

  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-brand-600/15 flex items-center justify-center mb-4">
        <ShieldX size={28} className="text-brand-600" />
      </div>
      <h2 className="text-lg font-bold text-ink-900">Access Denied</h2>
      <p className="text-sm text-ink-500 mt-1 max-w-sm">
        You don't have permission to view this page. Contact your building
        administrator if you think this is a mistake.
      </p>
    </div>
  );
}
