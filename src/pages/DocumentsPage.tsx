import { useMemo, useState } from "react";
import { FolderArchive, Upload, Trash2, Download, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSocietyData, useDocuments } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, ErrorBanner } from "@/components/ui/Feedback";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import type { DocType } from "@/lib/types";
const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "agreement", label: "Agreement" },
  { value: "kyc", label: "KYC" },
  { value: "bill", label: "Bill" },
  { value: "property_paper", label: "Property paper" },
  { value: "other", label: "Other" },
];
export function DocumentsPage() {
  const { societyId, flats, tenants, loading, error, reload } =
    useSocietyData();
  const {
    documents,
    loading: dLoading,
    error: dError,
    reload: reloadD,
  } = useDocuments(societyId);
  const { notify } = useToast();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const flatMap = useMemo(
    () => new Map(flats.map((f) => [f.id, f.flat_no])),
    [flats],
  );
  const tenantMap = useMemo(
    () => new Map(tenants.map((t) => [t.id, t.name])),
    [tenants],
  );
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== "all" && d.doc_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.file_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [documents, search, typeFilter]);
  if (loading) return <PageLoader label="Loading documents…" />;
  if (error) return <ErrorBanner message={error} onRetry={reload} />;
  async function handleUpload(
    file: File,
    docType: DocType,
    entityType: "tenant" | "flat" | "society",
    entityId: string,
  ) {
    if (!societyId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "file";
      const path = `${societyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("documents").insert({
        society_id: societyId,
        entity_type: entityType,
        entity_id: entityType === "society" ? null : entityId || null,
        doc_type: docType,
        file_name: file.name,
        storage_path: path,
      });
      if (dbErr) throw dbErr;
      notify("Document uploaded.", "success");
      reloadD();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }
  async function download(path: string, fileName: string) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60);
    if (error) {
      notify(error.message, "error");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }
  async function deleteDoc(id: string, path: string) {
    if (!confirm("Delete this document?")) return;
    await supabase.storage.from("documents").remove([path]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("Document deleted.", "success");
    reloadD();
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {" "}
      <div>
        {" "}
        <h1 className="text-xl font-semibold text-ink-900">
          Document Vault
        </h1>{" "}
        <p className="text-sm text-ink-500">
          Upload agreements, KYC, bills, and property papers
        </p>{" "}
      </div>{" "}
      <UploadCard
        societyId={societyId!}
        flats={flats}
        tenants={tenants}
        onUpload={handleUpload}
        uploading={uploading}
      />{" "}
      <Card>
        {" "}
        <CardHeader>
          {" "}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {" "}
            <div className="relative flex-1">
              {" "}
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />{" "}
              <Input
                placeholder="Search file name…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />{" "}
            </div>{" "}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="sm:w-40"
            >
              {" "}
              <option value="all">All types</option>{" "}
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}{" "}
            </Select>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardBody className="p-0">
          {" "}
          {dLoading ? (
            <PageLoader label="Loading…" />
          ) : dError ? (
            <ErrorBanner message={dError} onRetry={reloadD} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                documents.length === 0
                  ? "No documents uploaded yet"
                  : "No documents match your filters"
              }
              description={
                documents.length === 0
                  ? "Upload agreements, KYC, or bills using the box above."
                  : "Try adjusting the filters."
              }
              icon={<FolderArchive size={22} />}
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {" "}
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  {" "}
                  <div className="min-w-0">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {d.file_name}
                      </p>{" "}
                      <Badge tone="neutral" className="capitalize">
                        {d.doc_type}
                      </Badge>{" "}
                    </div>{" "}
                    <p className="text-xs text-ink-500 mt-0.5">
                      {" "}
                      {d.entity_type === "tenant"
                        ? `Tenant: ${tenantMap.get(d.entity_id ?? "") ?? "-"}`
                        : d.entity_type === "flat"
                          ? `Unit: ${flatMap.get(d.entity_id ?? "") ?? "-"}`
                          : "Society-wide"}{" "}
                      {" · "}Uploaded {formatDate(d.uploaded_at)}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-1 shrink-0">
                    {" "}
                    <button
                      onClick={() => download(d.storage_path, d.file_name)}
                      className="text-ink-400 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-lg"
                      aria-label="Download"
                    >
                      {" "}
                      <Download size={15} />{" "}
                    </button>{" "}
                    <button
                      onClick={() => deleteDoc(d.id, d.storage_path)}
                      className="text-ink-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                      aria-label="Delete"
                    >
                      {" "}
                      <Trash2 size={15} />{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}{" "}
        </CardBody>{" "}
      </Card>{" "}
    </div>
  );
}
function UploadCard({
  flats,
  tenants,
  onUpload,
  uploading,
}: {
  societyId: string;
  flats: { id: string; flat_no: string }[];
  tenants: { id: string; name: string; flat_id: string | null }[];
  onUpload: (
    file: File,
    docType: DocType,
    entityType: "tenant" | "flat" | "society",
    entityId: string,
  ) => void;
  uploading: boolean;
}) {
  const [docType, setDocType] = useState<DocType>("agreement");
  const [entityType, setEntityType] = useState<"tenant" | "flat" | "society">(
    "society",
  );
  const [entityId, setEntityId] = useState("");
  const entityOptions =
    entityType === "flat"
      ? flats.map((f) => ({ id: f.id, label: f.flat_no }))
      : entityType === "tenant"
        ? tenants.map((t) => ({ id: t.id, label: t.name }))
        : [];
  return (
    <Card>
      {" "}
      <CardBody>
        {" "}
        <div className="flex items-center gap-2 mb-4">
          {" "}
          <Upload size={16} className="text-brand-600" />{" "}
          <p className="text-sm font-semibold text-ink-900">
            Upload a document
          </p>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {" "}
          <Select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          >
            {" "}
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}{" "}
          </Select>{" "}
          <Select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as "tenant" | "flat" | "society");
              setEntityId("");
            }}
          >
            {" "}
            <option value="society">Society-wide</option>{" "}
            <option value="flat">Linked to unit</option>{" "}
            <option value="tenant">Linked to tenant</option>{" "}
          </Select>{" "}
          {entityType !== "society" && (
            <Select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            >
              {" "}
              <option value="">-- Select --</option>{" "}
              {entityOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}{" "}
            </Select>
          )}{" "}
        </div>{" "}
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed border-ink-300 rounded-lg py-8 px-4 cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {" "}
          <Upload size={24} className="text-ink-400 mb-2" />{" "}
          <p className="text-sm text-ink-600">
            {uploading ? "Uploading…" : "Click to choose a file"}
          </p>{" "}
          <p className="text-xs text-ink-400 mt-1">
            PDF, images, or documents up to 10 MB
          </p>{" "}
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file, docType, entityType, entityId);
              e.target.value = "";
            }}
          />{" "}
        </label>{" "}
      </CardBody>{" "}
    </Card>
  );
}
