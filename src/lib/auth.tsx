import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Society } from "@/lib/types";
import type { UserRole, UserProfile } from "@/lib/roles";
import {
  registerLocalUser,
  findLocalUserByEmail,
  getLocalProfile,
  getCurrentLocalUser,
  setCurrentLocalUser,
  getLocalSocieties,
  createLocalSociety,
  initLocalStore,
} from "@/lib/localStore";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  society: Society | null;
  societies: Society[];
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSociety: () => Promise<void>;
  switchSociety: (id: string) => void;
  createSociety: (
    name: string,
    address?: string,
  ) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "habitra.active_society";

function makeSyntheticUser(id: string, email: string, name: string): User {
  return {
    id,
    app_metadata: {},
    user_metadata: { full_name: name },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
    phone: "",
    role: "authenticated",
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (!error && data) {
        const p = data as UserProfile;
        setProfile(p);
        return p;
      }
    } catch {
      // Supabase network unreachable
    }

    const localP = getLocalProfile(uid);
    setProfile(localP);
    return localP;
  }

  async function loadSocieties(uid: string, userRole: UserRole) {
    try {
      let query;
      if (userRole === "admin") {
        query = supabase
          .from("societies")
          .select("*")
          .order("created_at", { ascending: true });
      } else if (userRole === "building_owner") {
        query = supabase
          .from("societies")
          .select("*")
          .eq("admin_id", uid)
          .order("created_at", { ascending: true });
      } else if (userRole === "flat_owner") {
        query = supabase
          .from("societies")
          .select("*, flat_owners!inner(user_id)")
          .eq("flat_owners.user_id", uid)
          .order("created_at", { ascending: true });
      } else {
        query = supabase
          .from("societies")
          .select("*, tenants!inner(user_id)")
          .eq("tenants.user_id", uid)
          .order("created_at", { ascending: true });
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const list = data as Society[];
        setSocieties(list);
        const savedId = localStorage.getItem(STORAGE_KEY);
        const active = list.find((s) => s.id === savedId) ?? list[0];
        setSociety(active);
        return;
      }
    } catch {
      // Supabase network unreachable
    }

    // Local fallback
    initLocalStore();
    const localList = getLocalSocieties();
    setSocieties(localList);
    if (localList.length > 0) {
      const savedId = localStorage.getItem(STORAGE_KEY);
      const active = localList.find((s) => s.id === savedId) ?? localList[0];
      setSociety(active);
    } else {
      setSociety(null);
    }
  }

  async function initUser(authUser: User) {
    const p = await loadProfile(authUser.id);
    if (p) {
      await loadSocieties(authUser.id, p.role);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Check if there is an active local store session
    const currentLoc = getCurrentLocalUser();
    if (currentLoc) {
      const prof = getLocalProfile(currentLoc.id);
      const synth = makeSyntheticUser(
        currentLoc.id,
        currentLoc.email,
        prof?.full_name ?? "",
      );
      setUser(synth);
      setProfile(prof);
      const localList = getLocalSocieties();
      setSocieties(localList);
      setSociety(localList[0] ?? null);
      setLoading(false);
      return;
    }

    // Try Supabase auth
    try {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!mounted) return;
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            initUser(data.session.user).finally(() => {
              if (mounted) setLoading(false);
            });
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });

      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          (async () => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
              await initUser(newSession.user);
            } else {
              setProfile(null);
              setSocieties([]);
              setSociety(null);
            }
            setLoading(false);
          })();
        },
      );

      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    } catch {
      if (mounted) setLoading(false);
    }
  }, []);

  async function signUp(
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
  ) {
    // 1. Try remote Supabase first
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!authError && authData.user) {
        await supabase.from("user_profiles").insert({
          id: authData.user.id,
          role,
          full_name: fullName.trim(),
        });
        await supabase.from("wallets").insert({
          user_id: authData.user.id,
          balance: 0,
        });
        return { error: null };
      }

      // If error is not a network failure, return it directly
      if (
        authError &&
        !authError.message.toLowerCase().includes("failed to fetch") &&
        !authError.message.toLowerCase().includes("network")
      ) {
        return { error: authError.message };
      }
    } catch {
      // Remote Supabase unreachable, fallback gracefully to localStore
    }

    // 2. Resilient local fallback
    const { user: localUser, profile: localProf } = registerLocalUser(
      email,
      role,
      fullName,
      password,
    );
    const synth = makeSyntheticUser(
      localUser.id,
      localUser.email,
      localProf.full_name,
    );
    setUser(synth);
    setProfile(localProf);
    const localSocs = getLocalSocieties();
    setSocieties(localSocs);
    setSociety(localSocs[0] ?? null);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    // 1. Try remote Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        return { error: null };
      }
      if (
        error &&
        !error.message.toLowerCase().includes("failed to fetch") &&
        !error.message.toLowerCase().includes("network")
      ) {
        return { error: error.message };
      }
    } catch {
      // Remote Supabase unreachable
    }

    // 2. Check local store
    const localUser = findLocalUserByEmail(email);
    if (!localUser) {
      return {
        error:
          "Account not found for this email. Please click 'Create account' to register.",
      };
    }
    const localProf = getLocalProfile(localUser.id);
    const synth = makeSyntheticUser(
      localUser.id,
      localUser.email,
      localProf?.full_name ?? "",
    );
    setCurrentLocalUser(localUser);
    setUser(synth);
    setProfile(localProf);
    const localSocs = getLocalSocieties();
    setSocieties(localSocs);
    setSociety(localSocs[0] ?? null);
    return { error: null };
  }

  async function signOut() {
    setCurrentLocalUser(null);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on signout
    }
    setUser(null);
    setProfile(null);
    setSocieties([]);
    setSociety(null);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  async function refreshSociety() {
    if (user && profile) await loadSocieties(user.id, profile.role);
  }

  function switchSociety(id: string) {
    const next = societies.find((s) => s.id === id);
    if (next) {
      setSociety(next);
      localStorage.setItem(STORAGE_KEY, id);
    }
  }

  async function createSociety(name: string, address?: string) {
    if (!user) return { error: "Not signed in." };
    if (
      !profile ||
      (profile.role !== "building_owner" && profile.role !== "admin")
    ) {
      return { error: "Only building owners and admins can create societies." };
    }

    try {
      const { data, error } = await supabase
        .from("societies")
        .insert({
          name: name.trim(),
          address: address?.trim() || null,
          admin_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        const created = data as Society;
        await supabase.from("settings").insert({ society_id: created.id });
        const next = [...societies, created];
        setSocieties(next);
        setSociety(created);
        localStorage.setItem(STORAGE_KEY, created.id);
        return { error: null };
      }
    } catch {
      // Fallback
    }

    const created = createLocalSociety(name, address || null, user.id);
    const next = [...societies, created];
    setSocieties(next);
    setSociety(created);
    localStorage.setItem(STORAGE_KEY, created.id);
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: profile?.role ?? null,
        society,
        societies,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshSociety,
        switchSociety,
        createSociety,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
