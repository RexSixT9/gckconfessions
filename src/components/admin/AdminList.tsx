"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import gsap from "@/lib/gsap";
import {
  Eye,
  EyeOff,
  Search,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Loader,
  RefreshCw,
  X,
  Share2,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Music2,
  MessageSquare,
} from "lucide-react";

// ─── tiny helpers ────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    approved: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Approved",
      cls: "border-[hsl(var(--action-accept))]/30 bg-[hsl(var(--action-accept))]/10 text-[hsl(var(--action-accept))]",
    },
    rejected: {
      icon: <X className="h-3 w-3" />,
      label: "Rejected",
      cls: "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]",
    },
    pending: {
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
      cls: "border-amber-300/40 bg-amber-50/80 text-amber-600 dark:border-amber-700/30 dark:bg-amber-950/20 dark:text-amber-400",
    },
  };
  const s = status ?? "pending";
  const { icon, label, cls } = map[s] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

function ActionBtn({
  onClick,
  disabled,
  variant = "ghost",
  children,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "accept" | "reject" | "publish" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";
  const variants: Record<string, string> = {
    ghost:
      "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]",
    accept:
      "border-[hsl(var(--action-accept))]/30 bg-[hsl(var(--action-accept))]/10 text-[hsl(var(--action-accept))] hover:bg-[hsl(var(--action-accept))]/20",
    reject:
      "border-[hsl(var(--action-reject))]/30 bg-[hsl(var(--action-reject))]/10 text-[hsl(var(--action-reject))] hover:bg-[hsl(var(--action-reject))]/20",
    publish:
      "border-[hsl(var(--action-publish))]/30 bg-[hsl(var(--action-publish))]/10 text-[hsl(var(--action-publish))] hover:bg-[hsl(var(--action-publish))]/20",
    danger:
      "border-red-300/30 bg-transparent text-red-500 hover:bg-red-50 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-950/30",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── types ───────────────────────────────────────────────────────
type Notice = { type: "error" | "success"; message: string } | null;

type ConfessionItem = {
  _id: string;
  message: string;
  music?: string;
  status?: "pending" | "approved" | "rejected";
  posted?: boolean;
  instagramPosted?: boolean;
  createdAt?: string;
};

// ─── main component ──────────────────────────────────────────────
export default function AdminList() {
  const [items, setItems] = useState<ConfessionItem[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || !listRef.current) return;
    const cards = listRef.current.querySelectorAll<HTMLElement>("[data-card]");
    if (!cards.length) return;
    gsap.from(cards, { opacity: 0, y: 14, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "all" });
  }, [loading, items]);

  useEffect(() => { setPage(1); }, [filter, statusFilter, query]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params = new URLSearchParams();
      if (filter === "published") params.set("posted", "true");
      else if (filter === "draft") params.set("posted", "false");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      params.set("limit", "20");

      const response = await fetch(`/api/confessions?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load.");
      setItems(data.confessions ?? []);
      setTotalCount(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Load failed." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, query, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => console.warn("Clipboard write failed"));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/confessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error ?? "Action failed.");
    }
  }, []);

  const run = useCallback(
    async (id: string, action: () => Promise<void>, msg: string) => {
      setNotice(null);
      setProcessingId(id);
      try {
        await action();
        await fetchItems();
        setNotice({ type: "success", message: msg });
        setTimeout(() => setNotice(null), 3000);
      } catch (err) {
        setNotice({ type: "error", message: err instanceof Error ? err.message : "Action failed." });
      } finally {
        setProcessingId(null);
      }
    },
    [fetchItems],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => { e.preventDefault(); setQuery(searchInput.trim()); },
    [searchInput],
  );

  return (
    <div className="space-y-5">

      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-[hsl(var(--muted-foreground))]">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search confessions or songs…"
            className="input-base w-full py-2 pl-9 pr-9 text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setQuery(""); }}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Reload */}
        <button
          type="button"
          onClick={fetchItems}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="sm:hidden">Reload</span>
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border))] pb-4">
        {/* Publish segmented control */}
        <div className="flex items-center gap-0.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-0.5">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filter === f
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Status segmented control */}
        <div className="flex items-center gap-0.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-0.5">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
          {totalCount} result{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Notice ────────────────────────────────────── */}
      {notice && (
        <div className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${
          notice.type === "error"
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
            : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
        }`}>
          {notice.type === "error"
            ? <AlertCircle className="h-4 w-4 shrink-0" />
            : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <p className="flex-1 text-xs font-medium">{notice.message}</p>
          <button type="button" onClick={() => setNotice(null)}>
            <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-md bg-[hsl(var(--secondary))]" />
                  <div className="h-5 w-12 animate-pulse rounded-md bg-[hsl(var(--secondary))]" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded-md bg-[hsl(var(--secondary))]" />
                </div>
                <div className="h-16 animate-pulse rounded-xl bg-[hsl(var(--secondary))]" />
                <div className="mt-3 flex gap-2">
                  <div className="h-7 w-28 animate-pulse rounded-lg bg-[hsl(var(--secondary))]" />
                  <div className="h-7 w-16 animate-pulse rounded-lg bg-[hsl(var(--secondary))]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────── */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[hsl(var(--border))] py-14 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
            <MessageSquare className="h-5 w-5 text-[hsl(var(--accent))]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Nothing here</p>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">No confessions match the current filters.</p>
          </div>
        </div>
      )}

      {/* ── Confession cards ──────────────────────────── */}
      {!loading && items.length > 0 && (
        <div ref={listRef} className="flex flex-col gap-3">
          {items.map((item) => {
            const busy = processingId === item._id;
            const msgId = `msg-${item._id}`;
            const musId = `music-${item._id}`;
            return (
              <div key={item._id} data-card className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] transition-shadow hover:shadow-sm">

                {/* Card header */}
                <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 sm:gap-3 sm:px-5 sm:pt-4 sm:pb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.status} />
                    {item.posted && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--action-publish))]/30 bg-[hsl(var(--action-publish))]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--action-publish))]">
                        <Eye className="h-3 w-3" />
                        Live
                      </span>
                    )}
                    {item.instagramPosted && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--accent))]">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </span>
                    )}
                  </div>
                  <time className="shrink-0 text-[11px] tabular-nums text-[hsl(var(--muted-foreground))]">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </time>
                </div>

                {/* Message */}
                <div className="px-3 pb-3 sm:px-5">
                  <div className="group relative">
                    <div className="max-h-40 overflow-y-auto rounded-xl bg-[hsl(var(--secondary))] px-4 py-3">
                      <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
                        {item.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.message, msgId)}
                      title="Copy message"
                      className="absolute right-2 top-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition hover:text-[hsl(var(--accent))] group-hover:opacity-100"
                    >
                      {copiedId === msgId
                        ? <Check className="h-3 w-3 text-[hsl(var(--action-accept))]" />
                        : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Music pill */}
                  {item.music && (
                    <div className="mt-2">
                      <div className="group/mus flex min-w-0 items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2">
                        <Music2 className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent))]" />
                        <span className="min-w-0 flex-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{item.music}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.music!, musId)}
                          title="Copy song"
                          className="shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 transition hover:text-[hsl(var(--accent))] group-hover/mus:opacity-100"
                        >
                          {copiedId === musId
                            ? <Check className="h-3 w-3 text-[hsl(var(--action-accept))]" />
                            : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-3 border-t border-[hsl(var(--border))] sm:mx-5" />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-5">
                  {item.status === "pending" && (
                    <>
                      <ActionBtn
                        variant="accept"
                        onClick={() => run(item._id, () => patch(item._id, { status: "approved", posted: true }), "Published ✓")}
                        disabled={busy}
                      >
                        {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Approve &amp; publish</span>
                        <span className="sm:hidden">Approve</span>
                      </ActionBtn>
                      <ActionBtn
                        variant="reject"
                        onClick={() => run(item._id, () => patch(item._id, { status: "rejected" }), "Rejected.")}
                        disabled={busy}
                      >
                        {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        Reject
                      </ActionBtn>
                    </>
                  )}

                  {item.status === "approved" && (
                    <>
                      <ActionBtn
                        variant="publish"
                        onClick={() => run(item._id, () => patch(item._id, { posted: !item.posted }), item.posted ? "Unpublished." : "Published ✓")}
                        disabled={busy}
                      >
                        {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : item.posted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {item.posted ? "Unpublish" : "Publish"}
                      </ActionBtn>
                      <ActionBtn
                        variant="ghost"
                        onClick={() => run(item._id, () => patch(item._id, { instagramPosted: !item.instagramPosted }), item.instagramPosted ? "Cleared." : "Marked shared ✓")}
                        disabled={busy}
                      >
                        {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                        {item.instagramPosted ? "Unmark share" : "Mark share"}
                      </ActionBtn>
                    </>
                  )}

                  {item.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                      <X className="h-3.5 w-3.5" />
                      Rejected — no further actions
                    </span>
                  )}

                  <ActionBtn
                    variant="danger"
                    className="ml-auto w-full sm:w-auto"
                    onClick={() => {
                      if (!window.confirm("Permanently delete this confession?")) return;
                      void run(
                        item._id,
                        async () => {
                          const res = await fetch(`/api/confessions/${item._id}`, { method: "DELETE" });
                          if (!res.ok) {
                            const d = await res.json().catch(() => ({}));
                            throw new Error((d as { error?: string }).error ?? "Delete failed.");
                          }
                        },
                        "Deleted.",
                      );
                    }}
                    disabled={busy}
                  >
                    {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </ActionBtn>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
            Page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
