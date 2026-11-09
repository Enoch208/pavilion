import {
  navigateWithAgentChatViewTransition,
  type AgentDynamicSuggestionsOption,
} from "@agent-native/core/client/agent-chat";
import { useT } from "@agent-native/core/client/i18n";
import { focusAgentChat } from "@agent-native/toolkit/app/chat";
import { AgentSidebar } from "@agent-native/toolkit/app/chat";
import { useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { ChatComposerContextProvider } from "@/components/ChatComposerContext";
import { agentPromptKeys, FALLBACK_PROMPT_KEYS } from "@/lib/agent-prompts";
import { chatThreadPath } from "@/lib/chat-paths";
import { TAB_ID } from "@/lib/tab-id";

const SCREEN_PROMPT_POLL_MS = 2_000;

interface AgentInspectorProps {
  children: ReactNode;
  chatHomeHandoffActive: boolean;
  chatHomeHandoffPending: boolean;
}

export function AgentInspector({
  children,
  chatHomeHandoffActive,
  chatHomeHandoffPending,
}: AgentInspectorProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();
  const fallbackPrompts = useMemo(
    () => FALLBACK_PROMPT_KEYS.map((key) => t(key)),
    [t],
  );
  const screenPrompts = useMemo<AgentDynamicSuggestionsOption>(
    () => ({
      pollMs: SCREEN_PROMPT_POLL_MS,
      getSuggestions: (context) =>
        agentPromptKeys(context).map((key) => t(key)),
    }),
    [t, pathname],
  );

  function openAskAgentFullscreen(threadId?: string) {
    focusAgentChat();
    navigateWithAgentChatViewTransition(navigate, chatThreadPath(threadId));
  }

  return (
    <AgentSidebar
      composerContextProvider={ChatComposerContextProvider}
      position="right"
      chatViewTransition
      chatViewTransitionHandoff={chatHomeHandoffPending}
      storageKey="chat"
      browserTabId={TAB_ID}
      openOnChatRunning={chatHomeHandoffActive}
      onFullscreenRequest={openAskAgentFullscreen}
      emptyStateText={t("chat.inspectEmptyState")}
      agentPageHref="/settings/agent"
      suggestions={fallbackPrompts}
      dynamicSuggestions={screenPrompts}
    >
      {children}
    </AgentSidebar>
  );
}
