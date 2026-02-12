"use client";

import { useEffect, useState, useCallback, memo } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader,
} from "lucide-react";

type Notice = { type: "error" | "success"; message: string } | null;

type ConfessionItem = {
  _id: string;
  message: string;
  music?: string;
  status?: "pending" | "approved";
  posted?: boolean;
  createdAt?: string;
};

// Memoized confession card to prevent unnecessary re-renders
const ConfessionCard = memo(function ConfessionCard({ 
  item, 
  onAccept,
  onTogglePublish,
  isUpdating,
}: { 
  item: ConfessionItem;
  onAccept: (item: ConfessionItem) => Promise<void>;
  onTogglePublish: (item: ConfessionItem) => Promise<void>;
  isUpdating: boolean;
}) {
  const [copiedField, setCopiedField] = useState<"message" | "music" | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const handleCopy = useCallback((text: string, field: "message" | "music") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleAccept = useCallback(async () => {
    setAcceptLoading(true);
    try {
      await onAccept(item);
    } finally {
      setAcceptLoading(false);
    }
  }, [item, onAccept]);

  const handleTogglePublish = useCallback(async () => {
    setPublishLoading(true);
    try {
      await onTogglePublish(item);
    } finally {
      setPublishLoading(false);
    }
  }, [item, onTogglePublish]);

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm transition hover:shadow-md">
      {/* Header with Status Badges */}
      <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              item.status === "approved"
                ? "bg-green-500/20 text-green-700 dark:text-green-300"
                : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            {item.status === "approved" && <Check className="h-3.5 w-3.5" />}
            {item.status ?? "pending"}
          </span>

          {/* Posted Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              item.posted
                ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]"
                : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {item.posted ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {item.posted ? "Published" : "Draft"}
          </span>
        </div>

        {/* Timestamp */}
        <time className="text-xs text-[hsl(var(--muted-foreground))]">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString() +
              " at " +
              new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </time>
      </div>

      {/* Message Content Section */}
      <div className="border-b border-[hsl(var(--border))] p-5">
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Message
          </label>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5 p-4">
            <p className="flex-1 text-sm leading-relaxed text-[hsl(var(--foreground))] sm:text-base">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(item.message, "message")}
              className="mt-0 shrink-0 rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 p-2.5 transition hover:bg-[hsl(var(--accent))]/20"
              title="Copy message"
            >
              <Copy className={`h-4 w-4 ${copiedField === "message" ? "text-green-600 dark:text-green-400" : "text-[hsl(var(--accent))]"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Song Content Section */}
      {item.music && (
        <div className="border-b border-[hsl(var(--border))] p-5">
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              🎵 Companion Song
            </label>
            <div className="flex items-start justify-between gap-3 rounded-lg border border-orange-200/50 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-950/10">
              <p className="flex-1 text-sm leading-relaxed text-[hsl(var(--foreground))]">
                {item.music}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(item.music || "", "music")}
                className="mt-0 shrink-0 rounded-lg border border-orange-300/50 bg-orange-100/50 p-2.5 transition hover:bg-orange-100/70 dark:border-orange-900/40 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
                title="Copy song"
              >
                <Copy className={`h-4 w-4 ${copiedField === "music" ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 p-5">
        {item.status === "pending" && !item.posted ? (
          <button
            type="button"
            onClick={handleAccept}
            disabled={acceptLoading || publishLoading || isUpdating}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-green-600 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700"
          >
            {acceptLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Accept & Publish
              </>
            )}
          </button>
        ) : item.status === "approved" ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-300">
            <Check className="h-4 w-4" />
            Accepted
          </span>
        ) : null}

        {item.status === "approved" && (
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishLoading || acceptLoading || isUpdating}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              item.posted
                ? "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                : "border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/20"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {publishLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                {item.posted ? "Unpublishing..." : "Publishing..."}
              </>
            ) : item.posted ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Unpublish</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Publish</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
});

export default function AdminList() {
  const [items, setItems] = useState<ConfessionItem[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Fetch items from database based on filters
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");

      if (filter === "published") {
        params.set("posted", "true");
      } else if (filter === "draft") {
        params.set("posted", "false");
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (query.trim()) {
        params.set("q", query.trim());
      }

      const response = await fetch(`/api/confessions?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load confessions.");
      }

      setItems(data.confessions ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, page, query]);

  // Auto-fetch when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const acceptConfession = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setUpdatingIds((prev) => new Set(prev).add(item._id));

    try {
      // First, approve the confession
      const approveResponse = await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!approveResponse.ok) {
        const approveData = await approveResponse.json();
        throw new Error(approveData.error || "Failed to approve confession.");
      }

      // Then, publish it
      const publishResponse = await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: true }),
      });

      if (!publishResponse.ok) {
        const publishData = await publishResponse.json();
        throw new Error(publishData.error || "Failed to publish confession.");
      }

      // Refresh data from database
      await fetchItems();

      setNotice({
        type: "success",
        message: `Confession accepted and published successfully.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to accept confession.",
      });
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }
  }, [fetchItems]);

  const togglePublished = useCallback(async (item: ConfessionItem) => {
    setNotice(null);
    setUpdatingIds((prev) => new Set(prev).add(item._id));

    try {
      const response = await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: !item.posted }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update confession.");
      }

      // Refresh data from database
      await fetchItems();

      setNotice({
        type: "success",
        message: `Confession ${!item.posted ? "published" : "unpublished"} successfully.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }
  }, [fetchItems]);

  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }, [searchInput]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3" onSubmit={handleSearchSubmit}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search confessions..."
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] transition hover:opacity-90 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="space-y-4">
        {/* Publication Status Filter */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Publication Status
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Submissions" },
              { id: "draft", label: "Draft (Pending & Unpublished)" },
              { id: "published", label: "Published" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setPage(1);
                  setFilter(option.id as "all" | "published" | "draft");
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 ${
                  filter === option.id
                    ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Approval Status Filter */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Approval Status
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Statuses", color: "" },
              { id: "pending", label: "Pending (Awaiting Review)", color: "amber" },
              { id: "approved", label: "Approved", color: "green" },
            ].map((option) => {
              const isSelected = statusFilter === option.id;
              const colorClass =
                option.color === "green"
                  ? isSelected
                    ? "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
                    : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                  : option.color === "amber"
                    ? isSelected
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                    : isSelected
                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setStatusFilter(option.id as "all" | "pending" | "approved");
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 ${colorClass}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${
            notice.type === "error"
              ? "border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
              : "border-green-200/50 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
          }`}
        >
          {notice.type === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}
          <p>{notice.message}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-12 text-sm text-[hsl(var(--muted-foreground))]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Loading confessions...
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !notice && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-12 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No confessions found. {query && "Try adjusting your search."}
          </p>
        </div>
      )}

      {/* Confession Cards */}
      <div className="space-y-4">
        {items.map((item) => (
          <ConfessionCard
            key={item._id}
            item={item}
            onAccept={acceptConfession}
            onTogglePublish={togglePublished}
            isUpdating={updatingIds.has(item._id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
