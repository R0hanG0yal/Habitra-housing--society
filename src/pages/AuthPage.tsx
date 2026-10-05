import { useState } from "react";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Droplets,
  Receipt,
  User,
  Home,
  Users,
  CheckCircle2,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { useRouter } from "@/lib/router";
import { isValidEmail } from "@/lib/security";
import { Logo } from "@/components/ui/Logo";
import type { UserRole } from "@/lib/roles";
import { getRoleLabel, getRoleDescription } from "@/lib/roles";

const ROLE_OPTIONS: { role: UserRole; icon: typeof Building2 }[] = [
  { role: "tenant", icon: User },
  { role: "flat_owner", icon: Home },
  { role: "building_owner", icon: Building2 },
];

type Step = "role_select" | "auth_form";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const { notify } = useToast();
  const [step, setStep] = useState<Step>("role_select");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [consentGiven, setConsentGiven] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setStep("auth_form");
    setError(null);
  }

  function goBackToRoleSelect() {
    setStep("role_select");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (honeypot.trim().length > 0) {
      setError("Bot activity detected.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!consentGiven) {
      setError("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }

    setSubmitting(true);
    if (mode === "signin") {
      const res = await signIn(email, password);
      setSubmitting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      notify("Signed in successfully.", "success");
    } else {
      if (!selectedRole) {
        setError("Please select your role first.");
        setSubmitting(false);
        return;
      }
      const res = await signUp(email, password, selectedRole, fullName);
      setSubmitting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      notify("Account created! Welcome to Habitra.", "success");
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas text-ink-800 selection:bg-brand-600 selection:text-white">
      {/* ══════════ Brand Panel — espresso ══════════ */}
      <div className="lg:w-[46%] bg-ink-950 text-white relative overflow-hidden flex flex-col justify-between p-8 lg:p-12">
        {/* Ambient glows */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-white/10 blur-[130px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-brand-600/10 blur-[120px]"
        />
        {/* Fine grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative">
          <Logo variant="horizontal" theme="dark" size="lg" badge="RWA" />
        </div>

        <div className="relative max-w-lg my-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.07] text-white/80 ring-1 ring-white/15 mb-5">
            <Building2 size={12} className="text-brand-300" />
            Residential Management System
          </div>
          <h1 className="font-display text-4xl lg:text-[44px] lg:leading-[1.1] font-semibold tracking-tight">
            The operating system for
            <span className="text-brand-300"> homes</span>, societies &amp;
            everyone in between.
          </h1>
          <p className="mt-5 text-white/60 text-sm lg:text-base leading-relaxed">
            Collect rent and maintenance on time, track every expense, manage
            staff, visitors and compliance — with an escrow-secured wallet built
            in.
          </p>

          <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                icon: <Receipt className="w-4 h-4" />,
                title: "Role-Based Access",
                desc: "Tenant · Flat Owner · Building Owner",
              },
              {
                icon: <Wallet className="w-4 h-4" />,
                title: "Escrow Wallet",
                desc: "Pay rent & maintenance instantly",
              },
              {
                icon: <Droplets className="w-4 h-4" />,
                title: "Building Verification",
                desc: "Onboard with proof documents",
              },
              {
                icon: <Cpu className="w-4 h-4" />,
                title: "Automated Invoicing",
                desc: "Monthly runs, late fees & reminders",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.05] p-3.5 rounded-xl ring-1 ring-white/10 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600/25 text-brand-300 ring-1 ring-brand-500/30 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-white/50 text-[11px] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] text-white/40 border-t border-white/10 pt-5">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-success-300" /> DPDP Act 2023
            Certified
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} /> Model Tenancy Act Compliant
          </span>
        </div>
      </div>

      {/* ══════════ Form Panel — porcelain ══════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-line shadow-card text-ink-800">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo variant="stacked" theme="light" size="sm" />
          </div>

          {step === "role_select" ? (
            /* ───────── STEP 1: ROLE SELECTION ───────── */
            <>
              <h2 className="font-display text-[26px] font-semibold text-ink-900">
                Who are you?
              </h2>
              <p className="text-sm text-ink-500 mt-1.5">
                Select your role to get started. This determines what you can
                access.
              </p>

              <div className="mt-6 space-y-3">
                {ROLE_OPTIONS.map(({ role, icon: Icon }) => (
                  <button
                    key={role}
                    onClick={() => selectRole(role)}
                    className="w-full p-4 rounded-xl bg-canvas hover:bg-surface-2 border border-line hover:border-line text-left transition-all group flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 text-ink-900">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">
                        {getRoleLabel(role)}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-ink-300 group-hover:text-ink-900 group-hover:translate-x-0.5 shrink-0 mt-2.5 transition-all"
                    />
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-line space-y-3">
                <p className="text-sm text-ink-500 text-center">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signin");
                      setStep("auth_form");
                    }}
                    className="text-brand-600 font-semibold hover:text-brand-700 transition"
                  >
                    Sign in
                  </button>
                </p>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/landing")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-full border border-brand-200 transition"
                  >
                    <Sparkles size={13} />
                    Explore Product Tour, Modules & Pricing
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ───────── STEP 2: AUTH FORM ───────── */
            <>
              {mode === "signup" && (
                <button
                  onClick={goBackToRoleSelect}
                  className="flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600 font-semibold mb-4 transition"
                >
                  <ArrowLeft size={14} /> Change role
                </button>
              )}

              <h2 className="font-display text-[26px] font-semibold text-ink-900">
                {mode === "signin"
                  ? "Welcome back"
                  : `Join as ${selectedRole ? getRoleLabel(selectedRole) : ""}`}
              </h2>
              <p className="text-sm text-ink-500 mt-1.5">
                {mode === "signin"
                  ? "Sign in to your Habitra account."
                  : "Set up your account to get started."}
              </p>

              {mode === "signup" && selectedRole && (
                <div className="mt-4 p-3 rounded-xl bg-success-50 border border-success-200 flex items-center gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="text-success-600 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink-900">
                      Registering as: {getRoleLabel(selectedRole)}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {getRoleDescription(selectedRole)}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                {/* Anti-spam honeypot */}
                <div style={{ display: "none" }} aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {mode === "signup" && (
                  <Field label="Full Name" htmlFor="fullName" required>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                      />
                      <Input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        className="pl-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </Field>
                )}

                <Field label="Email address" htmlFor="email" required>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </Field>

                <Field label="Password" htmlFor="password" required>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                    />
                    <Input
                      id="password"
                      type="password"
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      placeholder="At least 6 characters"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </Field>

                {/* Consent */}
                <div className="pt-1 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-line-strong text-brand-600 focus:ring-brand-600/30"
                  />
                  <label
                    htmlFor="consentCheck"
                    className="text-xs text-ink-500 leading-relaxed select-none"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/terms")}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/privacy")}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </button>
                    .
                  </label>
                </div>

                {error && (
                  <div className="rounded-xl bg-danger-50 border border-danger-200 px-3.5 py-2.5 text-xs text-danger-700 font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                  {!submitting && <ArrowRight size={16} />}
                </Button>
              </form>

              <p className="mt-6 text-sm text-ink-500 text-center">
                {mode === "signin"
                  ? "Don't have an account? "
                  : "Already registered? "}
                <button
                  onClick={() => {
                    if (mode === "signin") {
                      setMode("signup");
                      setStep("role_select");
                    } else {
                      setMode("signin");
                    }
                    setError(null);
                  }}
                  className="text-brand-600 font-semibold hover:text-brand-700 transition"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}

          {/* Legal Footer */}
          <div className="mt-7 pt-5 border-t border-line flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-brand-600 transition"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-brand-600 transition"
            >
              Terms
            </button>
            <span>•</span>
            <button
              onClick={() => navigate("/refund")}
              className="hover:text-brand-600 transition"
            >
              Refund Policy
            </button>
            <span>•</span>
            <button
              onClick={() => navigate("/cookies")}
              className="hover:text-brand-600 transition"
            >
              Cookies
            </button>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-ink-400 text-center max-w-sm">
          Habitra Technologies Private Limited · CIN: U72900KA2024PTC189021
          <br />
          Outer Ring Road, Bengaluru 560103, India · Contact: support@habitra.in
        </p>
      </div>
    </div>
  );
}
