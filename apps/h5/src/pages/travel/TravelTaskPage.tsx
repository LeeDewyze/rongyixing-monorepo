import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { TravelIframeView } from "@/components/travel/TravelIframeView";
import { useSmartBack } from "@/lib/app-back";
import { extractTaskTitle } from "@/lib/approval-task-url";

interface TravelTaskLocationState {
  url?: string;
  title?: string;
  returnTab?: string;
}

/** Legacy `onTaskDetail` — open TMC approval task in embedded WebView. */
export function TravelTaskPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = (location.state ?? {}) as TravelTaskLocationState;
  const url = state.url;
  const title = extractTaskTitle(state.title) || "审批详情";
  const returnTab = state.returnTab ?? "pending";
  const goBack = useSmartBack(`/travel/approval?tab=${returnTab}`);

  usePageHeader({ title, showBack: true, onBack: goBack });

  useEffect(() => {
    if (!url) {
      navigate(`/travel/approval?tab=${returnTab}`, { replace: true });
    }
  }, [navigate, url]);

  function handleWorkflowBack() {
    void queryClient.invalidateQueries({ queryKey: ["approval"] });
    goBack();
  }

  if (!url) {
    return null;
  }

  return <TravelIframeView title={title} url={url} onWorkflowBack={handleWorkflowBack} />;
}
