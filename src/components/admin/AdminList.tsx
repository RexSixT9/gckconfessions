"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
  CheckCircle2,
  Copy,
} from "lucide-react";

type Notice = { type: "error" | "success"; message: string } | null;

type ConfessionItem = {
  _id: string;
  message: string;
  music?: string;
  status?: "pending" | "approved" | "rejected";
  posted?: boolean;
  createdAt?: string;
};

// Memoized confession card to prevent unnecessary re-renders
const ConfessionCard = memo(function ConfessionCard({ 
  item, 
  onStatusChange, 
  onPostedChange 
}: { 
  item: ConfessionItem;
  onStatusChange: (item: ConfessionItem, status: "approved" | "rejected") => void;
  onPostedChange: (item: ConfessionItem) => void;
}) {
  const [copiedField, setCopiedField] = useState<"message" | "music" | null>(null);

  const handleCopy = useCallback((text: string, field: "message" | "music") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);
  return (
  <div
    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition hover:border-[hsl(var(--accent))]/50 hover:shadow-sm sm:p-6"
  >
    {/* Header with Status Badges */}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase sm:px-3 sm:py-1 ${
            item.status === "approved"
              ? "bg-green-500/20 text-green-700 dark:text-green-300"
              : item.status === "rejected"
                ? "bg-red-500/20 text-red-700 dark:text-red-300"
                : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
          }`}
        >
          {item.status === "approved" && <Check className="h-3 w-3" />}
          {item.status === "rejected" && <X className="h-3 w-3" />}
          {item.status ?? "pending"}
        </span>

        {/* Posted Badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase sm:px-3 sm:py-1 ${
            item.posted
              ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]"
              : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {item.posted ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
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

    {/* Message Content */}
    <div className="mb-3 space-y-2 sm:mb-4 sm:space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm leading-relaxed text-[hsl(var(--foreground))] sm:text-base">
          {item.message}
        </p>
        <button
          type="button"
          onClick={() => handleCopy(item.message, "message")}
          className="mt-0.5 shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 transition hover:bg-[hsl(var(--secondary))]"
          title="Copy message"
        >
          <Copy className={`h-4 w-4 ${copiedField === "message" ? "text-green-600 dark:text-green-400" : "text-[hsl(var(--muted-foreground))]"}`} />
        </button>
      </div>
      {item.music && (
        <div className="rounded-lg bg-[hsl(var(--secondary))] p-2 sm:p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Companion Song
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))] sm:text-sm">
                {item.music}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(item.music || "", "music")}
              className="mt-0.5 shrink-0 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/50 p-1.5 transition hover:bg-[hsl(var(--background))]"
              title="Copy song"
            >
              <Copy className={`h-3 w-3 ${copiedField === "music" ? "text-green-600 dark:text-green-400" : "text-[hsl(var(--muted-foreground))]"}`} />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onStatusChange(item, "approved")}
        disabled={item.status === "approved"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-500/20 disabled:opacity-50 sm:gap-2 sm:px-3 sm:py-2 dark:text-green-300"
      >
        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
        Approve
      </button>
      <button
        type="button"
        onClick={() => onStatusChange(item, "rejected")}
        disabled={item.status === "rejected"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/20 disabled:opacity-50 sm:gap-2 sm:px-3 sm:py-2 dark:text-red-300"
      >
        <X className="h-3 w-3 sm:h-4 sm:w-4" />
        Reject
      </button>
      <button
        type="button"
        onClick={() => onPostedChange(item)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:py-2 ${
          item.posted
            ? "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
            : "border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/20"
        }`}
      >
        {item.posted ? (
          <>
            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Unpublish</span>
            <span className="sm:hidden">Hide</span>
          </>
        ) : (
          <>
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Publish</span>
            <span className="sm:hidden">Show</span>
          </>
        )}
      </button>
    </div>
  </div>
  );
});

export default function AdminList() {
  const [items, setItems] = useState<ConfessionItem[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "posted" | "pending">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");

      if (filter === "posted") {
        params.set("posted", "true");
      } else if (filter === "pending") {
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
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, page, query]);

  const togglePosted = useCallback(async (item: ConfessionItem) => {
    setNotice(null);

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

      setItems((prev) =>
        prev.map((entry) =>
          entry._id === item._id ? { ...entry, posted: !item.posted } : entry
        )
      );
      setNotice({
        type: "success",
        message: `Confession ${!item.posted ? "posted" : "unpublished"}.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }, [searchInput]);

  const updateStatus = useCallback(async (item: ConfessionItem, status: "approved" | "rejected") => {
    setNotice(null);

    try {
      const response = await fetch(`/api/confessions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update confession.");
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry._id === item._id ? { ...entry, status } : entry
        )
      );
      setNotice({
        type: "success",
        message: `Confession ${status}.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === "posted" && !item.posted) return false;
      if (filter === "pending" && item.posted) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, filter, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar */}
      <form className="flex flex-col gap-2 sm:flex-row sm:gap-2" onSubmit={handleSearchSubmit}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))] sm:h-5 sm:w-5" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search confessions..."
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-4 py-2 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20 sm:py-2.5 sm:pl-10"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2 text-sm font-semibold text-[hsl(var(--accent-foreground))] transition hover:opacity-90 sm:py-2.5"
        >
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="space-y-3 sm:space-y-4">
        {/* Posted/Pending Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Submissions" },
            { id: "pending", label: "Pending" },
            { id: "posted", label: "Posted" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setPage(1);
                setFilter(option.id as "all" | "posted" | "pending");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                filter === option.id
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                  : "border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Statuses", color: "" },
            { id: "pending", label: "Pending", color: "amber" },
            { id: "approved", label: "Approved", color: "green" },
            { id: "rejected", label: "Rejected", color: "red" },
          ].map((option) => {
            const isSelected = statusFilter === option.id;
            const colorClass =
              option.color === "green"
                ? isSelected
                  ? "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
                  : "border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                : option.color === "red"
                  ? isSelected
                    ? "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300"
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
                  setStatusFilter(
                    option.id as "all" | "pending" | "approved" | "rejected"
                  );
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${colorClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div
          className={`flex gap-2 rounded-xl border p-3 text-xs sm:gap-3 sm:p-4 sm:text-sm ${
            notice.type === "error"
              ? "border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
              : "border-green-200/50 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
          }`}
        >
          {notice.type === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          )}
          <p>{notice.message}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-8 text-sm text-[hsl(var(--muted-foreground))]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Loading confessions...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && !notice && (
        <div className="text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-12">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No confessions found. {query && "Try adjusting your search."}
          </p>
        </div>
      )}

      {/* Confession Cards */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <ConfessionCard
            key={item._id}
            item={item}
            onStatusChange={updateStatus}
            onPostedChange={togglePosted}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] disabled:opacity-50"
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
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
