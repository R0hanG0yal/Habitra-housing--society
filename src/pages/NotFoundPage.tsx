import { Home, ArrowRight } from "lucide-react";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
export function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-ink-900">
      {" "}
      <div className="w-full max-w-lg bg-surface-2 rounded-lg border border-line-strong shadow-xs p-8 sm:p-10 text-center space-y-6 animate-scale-in">
        {" "}
        <div className="flex flex-col items-center justify-center gap-3">
          {" "}
          <Logo variant="stacked" theme="light" size="sm" />{" "}
          <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-surface-3 text-ink-900 border border-line-strong">
            {" "}
            Error 404: Resource Not Found{" "}
          </span>{" "}
        </div>{" "}
        <div className="space-y-2">
          {" "}
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
            Page Not Found
          </h1>{" "}
          <p className="text-xs sm:text-sm text-ink-500 max-w-sm mx-auto leading-relaxed">
            {" "}
            The society management view or document resource you requested does
            not exist or may have been archived.{" "}
          </p>{" "}
        </div>{" "}
        {/* Single Clear Primary CTA */}{" "}
        <div className="pt-2">
          {" "}
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs"
          >
            {" "}
            <Home size={18} /> Return to Habitra Dashboard{" "}
          </Button>{" "}
        </div>{" "}
        {/* Secondary Navigation Quick Links */}{" "}
        <div className="pt-4 border-t border-line-strong space-y-3">
          {" "}
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
            Quick Navigation
          </p>{" "}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {" "}
            <button
              onClick={() => navigate("/portal")}
              className="p-2.5 rounded-md bg-surface-3 hover:bg-surface-3 border border-line-strong text-ink-900 font-medium text-left flex items-center justify-between transition"
            >
              {" "}
              <span>Tenant Portal</span>{" "}
              <ArrowRight size={13} className="text-brand-600" />{" "}
            </button>{" "}
            <button
              onClick={() => navigate("/invoices")}
              className="p-2.5 rounded-md bg-surface-3 hover:bg-surface-3 border border-line-strong text-ink-900 font-medium text-left flex items-center justify-between transition"
            >
              {" "}
              <span>Invoices &amp; Split</span>{" "}
              <ArrowRight size={13} className="text-brand-600" />{" "}
            </button>{" "}
            <button
              onClick={() => navigate("/compliance")}
              className="p-2.5 rounded-md bg-surface-3 hover:bg-surface-3 border border-line-strong text-ink-900 font-medium text-left flex items-center justify-between transition"
            >
              {" "}
              <span>Statutory NOCs</span>{" "}
              <ArrowRight size={13} className="text-brand-600" />{" "}
            </button>{" "}
            <button
              onClick={() => navigate("/documents")}
              className="p-2.5 rounded-md bg-surface-3 hover:bg-surface-3 border border-line-strong text-ink-900 font-medium text-left flex items-center justify-between transition"
            >
              {" "}
              <span>Society Bylaws</span>{" "}
              <ArrowRight size={13} className="text-brand-600" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
