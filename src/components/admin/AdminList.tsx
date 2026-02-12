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
  Instagram,
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

      if (!response.ok) throw new Error(data.error || "Failed to load confessions.");

      setItems(data.confessions ?? []);
      setTotalCount(data.total ?? 0);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load data.",
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
      setNotice({ type: "success", message: "Published successfully." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Operation failed.",
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
        message: error instanceof Error ? error.message : "Operation failed.",
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
        message: item.instagramPosted ? "Removed from Instagram." : "Marked as posted on Instagram." 
      });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Operation failed.",
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
      setNotice({ type: "success", message: "Confession rejected." });
      setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Operation failed.",
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-[hsl(var(--foreground))]">Confessions</h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">({totalCount})</span>
        </div>
        <button
          type="button"
          onClick={fetchItems}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-[hsl(var(--accent))] px-4 py-2 text-sm font-medium text-[hsl(var(--accent-foreground))] transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {["all", "draft", "published"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f as typeof filter)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                  : "border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s as typeof statusFilter)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? s === "pending"
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : s === "approved"
                    ? "bg-green-600 text-white dark:bg-green-700"
                    : s === "rejected"
                    ? "bg-red-600 text-white dark:bg-red-700"
                    : "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                  : "border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
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
          className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
          }`}
        >
          {notice.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <p>{notice.message}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-8">
          <Loader className="h-4 w-4 animate-spin text-[hsl(var(--accent))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No confessions found.</p>
        </div>
      )}

      {/* Confession List */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50 px-4 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                      item.status === "approved"
                        ? "bg-green-600 text-white dark:bg-green-700"
                        : item.status === "rejected"
                        ? "bg-red-600 text-white dark:bg-red-700"
                        : "bg-amber-500 text-white dark:bg-amber-600"
                    }`}
                  >
                    {item.status === "approved" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {item.status === "rejected" && <X className="h-3.5 w-3.5" />}
                    {item.status === "pending" && <Clock className="h-3.5 w-3.5" />}
                    {item.status ?? "pending"}
                  </span>

                  {/* Published Badge */}
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                      item.posted
                        ? "bg-blue-600 text-white dark:bg-blue-700"
                        : "bg-gray-400 text-white dark:bg-gray-600"
                    }`}
                  >
                    {item.posted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {item.posted ? "published" : "draft"}
                  </span>

                  {/* Instagram Badge */}
                  {item.instagramPosted && (
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                      <Instagram className="h-3.5 w-3.5" />
                      Instagram
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
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 overflow-y-auto" style={{ maxHeight: "240px" }}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
                      {item.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.message, `msg-${item._id}`)}
                    className="shrink-0 rounded border border-[hsl(var(--border))] p-1.5 transition hover:bg-[hsl(var(--secondary))]"
                    title="Copy"
                  >
                    <Copy
                      className={`h-3.5 w-3.5 ${
                        copiedId === `msg-${item._id}`
                          ? "text-green-600 dark:text-green-400"
                          : "text-[hsl(var(--muted-foreground))]"
                      }`}
                    />
                  </button>
                </div>

                {/* Music */}
                {item.music && (
                  <div className="rounded-md border border-orange-200/50 bg-orange-50/30 p-3 dark:border-orange-900/30 dark:bg-orange-950/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "120px" }}>
                        <p className="whitespace-pre-wrap text-sm text-orange-700 dark:text-orange-300">
                          🎵 {item.music}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.music || "", `music-${item._id}`)}
                        className="shrink-0 rounded border border-orange-300/50 bg-orange-100/50 p-1.5 transition hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
                        title="Copy"
                      >
                        <Copy
                          className={`h-3.5 w-3.5 ${
                            copiedId === `music-${item._id}`
                              ? "text-green-600 dark:text-green-400"
                              : "text-orange-600 dark:text-orange-400"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-4 py-3">
                {/* Pending Actions */}
                {item.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => acceptAndPublish(item)}
                      disabled={processingId === item._id}
                      className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Accept & Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectConfession(item)}
                      disabled={processingId === item._id}
                      className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
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
                    <span className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePublish(item)}
                      disabled={processingId === item._id}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                        item.posted
                          ? "bg-gray-600 text-white hover:bg-gray-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
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
                      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                        item.instagramPosted
                          ? "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white hover:opacity-90"
                          : "border-2 border-purple-500 bg-white text-purple-700 hover:bg-purple-50 dark:bg-gray-800 dark:text-purple-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {processingId === item._id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Instagram className="h-3.5 w-3.5" />
                      )}
                      {item.instagramPosted ? "Posted on IG" : "Mark as IG Posted"}
                    </button>
                  </>
                )}

                {/* Rejected Status */}
                {item.status === "rejected" && (
                  <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
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
