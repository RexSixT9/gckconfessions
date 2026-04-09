interface StatusBoardDeps {
  client: {
    user?: { id?: string } | null;
    channels: {
      fetch: (channelId: string) => Promise<any>;
    };
  };
  config: {
    statusChannelId: string;
    defaultGraphDays: number;
    pollIntervalMs: number;
  };
  state: any;
  fetchMetrics: (config: any, state: any, days: number) => Promise<any>;
  buildStatusEmbed: (metrics: any, config: any, variant: string) => any;
  buildNavigationComponents: (config: any) => any;
  logMetricsError: (state: any, scope: string, error: unknown) => void;
  isWritableTextChannel: (channel: any) => boolean;
  statusMarker: string;
}

function isUnknownMessageError(error: unknown) {
  const anyError = error as { code?: unknown; rawError?: { code?: unknown } };
  const code = Number(anyError?.code ?? anyError?.rawError?.code ?? 0);
  return code === 10008;
}

function isStatusBoardMessage(message: any, clientUserId: string | undefined, statusMarker: string) {
  if (!message || message.author?.id !== clientUserId) {
    return false;
  }

  const primaryEmbed = message.embeds?.[0];
  const footerText = primaryEmbed?.footer?.text || "";

  return footerText.includes("Status Board") || message.content.startsWith(statusMarker);
}

async function ensureStatusMessage(deps: StatusBoardDeps, createPayload: unknown) {
  const { client, config, state, isWritableTextChannel, statusMarker } = deps;
  const channel = await client.channels.fetch(config.statusChannelId);
  if (!isWritableTextChannel(channel)) {
    throw new Error("Configured status channel is not a writable text channel.");
  }

  if (state.runtimeStatusMessageId) {
    try {
      const existing = await channel.messages.fetch(state.runtimeStatusMessageId);
      if (existing) return existing;
    } catch {
      state.runtimeStatusMessageId = "";
    }
  }

  const pinned = await channel.messages.fetchPins().catch(() => null);
  const pinnedMessages =
    (pinned && typeof pinned.find === "function" ? pinned : null) ||
    (Array.isArray(pinned) ? pinned : null) ||
    (pinned?.messages && typeof pinned.messages.find === "function" ? pinned.messages : null) ||
    (pinned?.items && typeof pinned.items.find === "function" ? pinned.items : null);

  const knownPinned = pinnedMessages?.find((message: any) =>
    isStatusBoardMessage(message, client.user?.id, statusMarker)
  );

  if (knownPinned) {
    state.runtimeStatusMessageId = knownPinned.id;
    return knownPinned;
  }

  const recent = await channel.messages.fetch({ limit: 25 });
  const known = recent.find((message: any) =>
    isStatusBoardMessage(message, client.user?.id, statusMarker)
  );

  if (known) {
    state.runtimeStatusMessageId = known.id;
    return known;
  }

  const created = await channel.send(createPayload ?? { content: "Initializing status board..." });
  state.runtimeStatusMessageId = created.id;

  return created;
}

export function createStatusBoardLoop(deps: StatusBoardDeps) {
  const { config, state, fetchMetrics, buildStatusEmbed, buildNavigationComponents, logMetricsError } = deps;

  async function updateStatusBoard() {
    const metrics = await fetchMetrics(config, state, config.defaultGraphDays);
    const payload = {
      embeds: [buildStatusEmbed(metrics, config, "board")],
      components: buildNavigationComponents(config),
    };
    const editPayload = {
      content: null,
      ...payload,
    };

    const message = await ensureStatusMessage(deps, payload);
    try {
      await message.edit(editPayload);
      return;
    } catch (error) {
      if (!isUnknownMessageError(error)) {
        throw error;
      }
    }

    state.runtimeStatusMessageId = "";
    console.warn("Status board message disappeared (Discord 10008). Recreating board message.");

    const recoveredMessage = await ensureStatusMessage(deps, payload);
    try {
      await recoveredMessage.edit(editPayload);
    } catch (error) {
      if (!isUnknownMessageError(error)) {
        throw error;
      }

      state.runtimeStatusMessageId = "";
      await ensureStatusMessage(deps, payload);
    }
  }

  async function runStatusRefresh() {
    if (state.isShuttingDown) return;

    if (state.statusUpdateInFlight) {
      state.runtimeStats.statusLoop.skipped += 1;
      scheduleStatusRefresh(Math.min(config.pollIntervalMs, 5_000));
      return;
    }

    const startedAt = Date.now();
    state.runtimeStats.statusLoop.runs += 1;
    state.runtimeStats.statusLoop.lastRunAt = startedAt;

    state.statusUpdateInFlight = true;
    try {
      await updateStatusBoard();
      state.runtimeStats.statusLoop.successes += 1;
      state.runtimeStats.statusLoop.consecutiveFailures = 0;
      state.runtimeStats.statusLoop.lastSuccessAt = Date.now();
      state.runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
      state.runtimeStats.statusLoop.lastError = "";
    } catch (error) {
      state.runtimeStats.statusLoop.failures += 1;
      state.runtimeStats.statusLoop.consecutiveFailures += 1;
      state.runtimeStats.statusLoop.lastFailureAt = Date.now();
      state.runtimeStats.statusLoop.lastDurationMs = Date.now() - startedAt;
      state.runtimeStats.statusLoop.lastError = String(
        error instanceof Error ? error.message : error || "unknown"
      ).slice(0, 220);
      logMetricsError(state, "Status board update failed", error);
    } finally {
      state.statusUpdateInFlight = false;
      scheduleStatusRefresh(config.pollIntervalMs);
    }
  }

  function scheduleStatusRefresh(delayMs = config.pollIntervalMs) {
    if (state.isShuttingDown) return;

    if (state.statusTimer) {
      clearTimeout(state.statusTimer);
      state.statusTimer = null;
    }

    state.nextStatusRunAt = Date.now() + delayMs;
    state.statusTimer = setTimeout(() => {
      void runStatusRefresh();
    }, delayMs);
  }

  return {
    updateStatusBoard,
    scheduleStatusRefresh,
  };
}
