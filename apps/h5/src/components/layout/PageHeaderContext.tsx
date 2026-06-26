import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { AppHeader, type AppHeaderProps } from "./AppHeader";

export interface PageHeaderState extends AppHeaderProps {
  visible?: boolean;
  /** Plain-text line below title (preferred over `extended`). */
  subtitle?: string;
}

interface PageHeaderStore {
  getHeader: () => PageHeaderState;
  setHeader: (state: PageHeaderState, ownerId: number) => void;
  resetHeader: (ownerId: number) => void;
  allocateOwnerId: () => number;
  subscribe: (listener: () => void) => () => void;
}

const EMPTY_HEADER: PageHeaderState = { visible: false };

const PageHeaderStoreContext = createContext<PageHeaderStore | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const headerRef = useRef<PageHeaderState>(EMPTY_HEADER);
  const ownerRef = useRef(0);
  const nextOwnerIdRef = useRef(1);
  const listenersRef = useRef(new Set<() => void>());

  const store = useMemo<PageHeaderStore>(
    () => ({
      getHeader: () => headerRef.current,
      allocateOwnerId: () => nextOwnerIdRef.current++,
      setHeader: (state: PageHeaderState, ownerId: number) => {
        ownerRef.current = ownerId;
        headerRef.current = state;
        listenersRef.current.forEach((listener) => listener());
      },
      resetHeader: (ownerId: number) => {
        if (ownerRef.current !== ownerId) {
          return;
        }
        headerRef.current = EMPTY_HEADER;
        listenersRef.current.forEach((listener) => listener());
      },
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );

  return (
    <PageHeaderStoreContext.Provider value={store}>{children}</PageHeaderStoreContext.Provider>
  );
}

export function PageHeaderSlot() {
  const store = useContext(PageHeaderStoreContext);
  const navigate = useNavigate();
  const [, bump] = useState(0);

  useEffect(() => {
    if (!store) return;
    return store.subscribe(() => bump((v) => v + 1));
  }, [store]);

  if (!store) return null;

  const header = store.getHeader();
  if (!header.visible) return null;

  const extended =
    header.subtitle != null && header.subtitle !== "" ? (
      <p className="px-4 pb-3 text-sm text-white/85">{header.subtitle}</p>
    ) : (
      header.extended
    );

  return (
    <AppHeader
      title={header.title}
      showBack={header.showBack}
      onBack={header.onBack ?? (() => navigate(-1))}
      right={header.right}
      extended={extended}
      tone={header.tone}
    />
  );
}

export function usePageHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  right,
  extended,
  visible = true,
  tone,
}: PageHeaderState) {
  const store = useContext(PageHeaderStoreContext);
  const ownerIdRef = useRef<number | null>(null);
  if (store && ownerIdRef.current == null) {
    ownerIdRef.current = store.allocateOwnerId();
  }
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const rightRef = useRef(right);
  rightRef.current = right;
  const extendedRef = useRef(extended);
  extendedRef.current = extended;

  useLayoutEffect(() => {
    if (!store || ownerIdRef.current == null) return;

    const ownerId = ownerIdRef.current;
    store.setHeader(
      {
        title,
        subtitle,
        showBack,
        onBack: () => onBackRef.current?.(),
        right: rightRef.current,
        extended: extendedRef.current,
        visible,
        tone,
      },
      ownerId,
    );

    return () => {
      store.resetHeader(ownerId);
    };
  }, [store, showBack, subtitle, title, tone, visible]);
}
