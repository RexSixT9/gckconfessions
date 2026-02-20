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
  Loader,
  RefreshCw,
  X,
  Share2,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  // GSAP ref — animate confession cards when items change
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || !listRef.current) return;
    const cards = listRef.current.querySelectorAll<HTMLElement>("[data-card]");
    if (!cards.length) return;
    gsap.from(cards, { opacity: 0, y: 18, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "all" });
  }, [loading, items]);

  // Reset to page 1 whenever filters or query change
  useEffect(() => {
    setPage(1);
  }, [filter, statusFilter, query]);

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
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Load failed.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, query, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API may be denied (e.g. non-HTTPS or permissions blocked)
      console.warn("Clipboard write failed");
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const patchConfession = useCallback(async (id: string, body: Record<string, unknown>): Promise<void> => {
    const res = await fetch(`/api/confessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? "Action failed.");
    }
  }, []);

  const acceptAndPublish = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      // Single atomic request: approve and publish together
      await patchConfession(item._id, { status: "approved", posted: true });
      await fetchItems();
      setNotice({ type: "success", message: "Published." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchItems, patchConfession]);

  const togglePublish = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await patchConfession(item._id, { posted: !item.posted });
      await fetchItems();
      setNotice({ type: "success", message: item.posted ? "Unpublished." : "Published." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchItems, patchConfession]);

  const toggleInstagram = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await patchConfession(item._id, { instagramPosted: !item.instagramPosted });
      await fetchItems();
      setNotice({
        type: "success",
        message: item.instagramPosted ? "Instagram cleared." : "Marked Instagram.",
      });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchItems, patchConfession]);

  const rejectConfession = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await patchConfession(item._id, { status: "rejected" });
      await fetchItems();
      setNotice({ type: "success", message: "Rejected." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchItems, patchConfession]);

  const deleteConfession = useCallback(async (item: ConfessionItem) => {
    if (!window.confirm("Permanently delete this confession? This cannot be undone.")) return;
    setNotice(null);
    setProcessingId(item._id);

    try {
      const res = await fetch(`/api/confessions/${item._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Delete failed.");
      }
      await fetchItems();
      setNotice({ type: "success", message: "Deleted." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Delete failed.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchItems]);

  const handleSearch = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setQuery(searchInput.trim());
  }, [searchInput]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] sm:text-base">Queue</h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">({totalCount})</span>
        </div>
        <button
          type="button"
          onClick={fetchItems}
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search text or song"
            className="input-base w-full pl-9"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-4 py-2 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 sm:w-auto"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {["all", "draft", "published"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f as typeof filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] shadow-sm"
                  : "border border-[hsl(var(--border))]/70 text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))]/5"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s as typeof statusFilter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] shadow-sm"
                  : "border border-[hsl(var(--border))]/70 text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))]/5"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-3 text-sm ${
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
          }`}
        >
          {notice.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <p className="flex-1">{notice.message}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/70 py-8">
          <Loader className="h-4 w-4 animate-spin text-[hsl(var(--accent))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/70 py-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No results.</p>
        </div>
      )}

      {/* Confession List */}
      {!loading && items.length > 0 && (
        <div ref={listRef} className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              data-card
              className="bento-cell overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col gap-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Status Badge */}
                  <span className="flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-0.5 text-xs font-medium capitalize text-[hsl(var(--foreground))]">
                    {item.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                    {item.status === "rejected" && <X className="h-3 w-3" />}
                    {item.status === "pending" && <Clock className="h-3 w-3" />}
                    {item.status ?? "pending"}
                  </span>

                  {/* Published Badge */}
                  {item.posted && (
                    <span className="flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-0.5 text-xs font-medium capitalize text-[hsl(var(--foreground))]">
                      <Eye className="h-3 w-3" />
                      Published
                    </span>
                  )}

                  {/* Instagram Badge */}
                  {item.instagramPosted && (
                    <span className="flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--foreground))]">
                      <Share2 className="h-3 w-3" />
                      Shared
                    </span>
                  )}
                </div>
                <time className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </time>
              </div>

              {/* Message */}
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="max-h-45 overflow-y-auto rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-3.5 sm:max-h-50 sm:p-4">
                      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.message, `msg-${item._id}`)}
                    className="shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-1.5 transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95"
                    title="Copy Message"
                  >
                    <Copy
                      className={`h-3.5 w-3.5 ${
                        copiedId === `msg-${item._id}`
                          ? "text-[hsl(var(--accent))]"
                          : "text-[hsl(var(--muted-foreground))]"
                      }`}
                    />
                  </button>
                </div>

                {/* Music */}
                {item.music && (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="max-h-20 overflow-y-auto rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/70 p-3 sm:max-h-25 sm:p-3.5">
                        <p className="break-words whitespace-pre-wrap text-xs leading-relaxed text-[hsl(var(--foreground))]">
                          🎵 {item.music}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.music || "", `music-${item._id}`)}
                      className="shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-1.5 transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95"
                      title="Copy Music"
                    >
                      <Copy
                        className={`h-3.5 w-3.5 ${
                          copiedId === `music-${item._id}`
                            ? "text-[hsl(var(--accent))]"
                            : "text-[hsl(var(--muted-foreground))]"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 sm:gap-2.5 sm:px-5">
                {/* Pending Actions */}
                {item.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => acceptAndPublish(item)}
                      disabled={processingId === item._id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--action-accept))]/30 bg-[hsl(var(--action-accept))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-accept))] transition hover:bg-[hsl(var(--action-accept))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Approve + publish</span>
                      <span className="sm:hidden">Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectConfession(item)}
                      disabled={processingId === item._id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--action-reject))]/30 bg-[hsl(var(--action-reject))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-reject))] transition hover:bg-[hsl(var(--action-reject))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </button>
                  </>
                )}

                {/* Approved Actions */}
                {item.status === "approved" && (
                  <>
                    <button
                      type="button"
                      onClick={() => togglePublish(item)}
                      disabled={processingId === item._id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--action-publish))]/30 bg-[hsl(var(--action-publish))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-publish))] transition hover:bg-[hsl(var(--action-publish))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : item.posted ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {item.posted ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleInstagram(item)}
                      disabled={processingId === item._id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      {item.instagramPosted ? "Shared" : "Mark Share"}
                    </button>
                  </>
                )}

                {/* Rejected Status */}
                {item.status === "rejected" && (
                  <span className="flex w-full items-center gap-1.5 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-3 py-2 text-xs font-medium capitalize text-[hsl(var(--foreground))] sm:w-auto">
                    <X className="h-3.5 w-3.5" />
                    Rejected
                  </span>
                )}

                {/* Delete (always available) */}
                <button
                  type="button"
                  onClick={() => deleteConfession(item)}
                  disabled={processingId === item._id}
                  className="ml-auto flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300/30 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-95 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 sm:w-auto"
                  title="Delete confession"
                >
                  {processingId === item._id ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


