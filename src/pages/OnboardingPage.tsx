import { useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Field, Textarea } from "@/components/ui/Field";
export function OnboardingPage() {
  const { createSociety } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter your society name.");
      return;
    }
    setSubmitting(true);
    const res = await createSociety(name, address);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    notify("Society created. Welcome aboard!", "success");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      {" "}
      <div className="w-full max-w-lg bg-surface-2 rounded-xl shadow-xs border border-line-strong p-8 animate-slide-up text-ink-900">
        {" "}
        <div className="flex items-center gap-3 mb-6">
          {" "}
          <div className="w-11 h-11 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
            {" "}
            <Building2 size={22} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-lg font-semibold text-ink-900">
              Set up your society
            </h1>{" "}
            <p className="text-sm text-ink-500">
              Tell us about the property you manage.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <form onSubmit={onSubmit} className="space-y-5">
          {" "}
          <Field label="Society / building name" htmlFor="name" required>
            {" "}
            <div className="relative">
              {" "}
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              />{" "}
              <Input
                id="name"
                placeholder="e.g. Green Acres Residency"
                className="pl-9 bg-canvas/40 border-line-strong text-ink-900 placeholder:text-ink-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />{" "}
            </div>{" "}
          </Field>{" "}
          <Field label="Address (optional)" htmlFor="address">
            {" "}
            <div className="relative">
              {" "}
              <MapPin
                size={16}
                className="absolute left-3 top-4 text-ink-500"
              />{" "}
              <Textarea
                id="address"
                rows={3}
                placeholder="Street, city, state, pincode"
                className="pl-9 bg-canvas/40 border-line-strong text-ink-900 placeholder:text-ink-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />{" "}
            </div>{" "}
          </Field>{" "}
          {error && (
            <div className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm">
              {" "}
              {error}{" "}
            </div>
          )}{" "}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            disabled={submitting}
          >
            {" "}
            {submitting ? "Creating…" : "Create society & continue"}{" "}
          </Button>{" "}
        </form>{" "}
        <p className="mt-4 text-xs text-ink-500 text-center">
          {" "}
          You can add towers, flats, and tenants from the dashboard next.{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
}
