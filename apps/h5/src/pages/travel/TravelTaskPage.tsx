import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
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

  usePageHeader({ visible: false });

  // goBack via smart back — used by both header button and iframe workflow back
  const handleBack = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["approval"] });
    goBack();
  }, [goBack, queryClient]);

  useEffect(() => {
    if (!url) {
      navigate(`/travel/approval?tab=${returnTab}`, { replace: true });
    }
  }, [navigate, url]);

  function handleWorkflowBack() {
    handleBack();
  }

  if (!url) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="shrink-0 bg-gradient-to-b from-[#5099fe] to-[#6aabff] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-2 pt-1">
          <button
            type="button"
            className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
            aria-label="返回"
            onClick={handleBack}
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-white">
            {title}
          </h1>
          <span className="w-10 shrink-0" />
        </div>
      </div>
      <TravelIframeView title={title} url={url} onWorkflowBack={handleWorkflowBack} />
    </div>
  );
}
