"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const params = new URLSearchParams();
      
      if (filter === "published") params.set("posted", "true");
      else if (filter === "draft") params.set("posted", "false");
      
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/confessions?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to load.");

      setItems(data.confessions ?? []);
      setTotalCount(data.total ?? 0);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Load failed.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, query]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const acceptAndPublish = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: true }),
      });

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
  }, [fetchItems]);

  const togglePublish = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: !item.posted }),
      });

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
  }, [fetchItems]);

  const toggleInstagram = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramPosted: !item.instagramPosted }),
      });

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
  }, [fetchItems]);

  const rejectConfession = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setProcessingId(item._id);

    try {
      await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

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
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
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
            className="w-full rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--background))] py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/25"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-4 py-2 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 active:scale-95 sm:w-auto"
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
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col gap-2.5 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Status Badge */}
                  <span className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-2.5 py-1 text-xs font-medium capitalize text-[hsl(var(--foreground))]">
                    {item.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                    {item.status === "rejected" && <X className="h-3 w-3" />}
                    {item.status === "pending" && <Clock className="h-3 w-3" />}
                    {item.status ?? "pending"}
                  </span>

                  {/* Published Badge */}
                  {item.posted && (
                    <span className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-2.5 py-1 text-xs font-medium capitalize text-[hsl(var(--foreground))]">
                      <Eye className="h-3 w-3" />
                      Published
                    </span>
                  )}

                  {/* Instagram Badge */}
                  {item.instagramPosted && (
                    <span className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))]">
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
                      <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.message, `msg-${item._id}`)}
                    className="shrink-0 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 p-2 transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95"
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
                        <p className="wrap-break-word whitespace-pre-wrap text-xs leading-relaxed text-[hsl(var(--foreground))]">
                          🎵 {item.music}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.music || "", `music-${item._id}`)}
                      className="shrink-0 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 p-2 transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95"
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
              <div className="flex flex-wrap gap-2 border-t border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/60 px-4 py-3 sm:gap-2.5 sm:px-5">
                {/* Pending Actions */}
                {item.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => acceptAndPublish(item)}
                      disabled={processingId === item._id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--action-accept))]/30 bg-[hsl(var(--action-accept))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-accept))] transition hover:bg-[hsl(var(--action-accept))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
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
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--action-reject))]/30 bg-[hsl(var(--action-reject))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-reject))] transition hover:bg-[hsl(var(--action-reject))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
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
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--action-publish))]/30 bg-[hsl(var(--action-publish))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--action-publish))] transition hover:bg-[hsl(var(--action-publish))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
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
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--accent))] transition hover:bg-[hsl(var(--accent))]/20 active:scale-95 disabled:opacity-50 sm:w-auto"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
