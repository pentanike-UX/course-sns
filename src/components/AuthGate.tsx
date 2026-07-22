"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import ActionBottomSheet from "@/components/ActionBottomSheet";

type GateOptions = {
  /** where to return after signing in (defaults to the current path) */
  next?: string;
  /** sheet copy — defaults to a generic "로그인이 필요해요" */
  title?: string;
  description?: string;
};

type AuthGateValue = {
  isAuthed: boolean;
  /**
   * Guests browse freely; meaningful actions (일기 등록·계획·따라가기, 좋아요·
   * 저장·팔로우·댓글) call this first. Returns true when the user is signed in
   * (proceed), or false after opening the login sheet (stop).
   */
  requireAuth: (opts?: GateOptions) => boolean;
};

const AuthGateContext = createContext<AuthGateValue>({
  isAuthed: true,
  requireAuth: () => true,
});

export function useAuthGate() {
  return useContext(AuthGateContext);
}

/**
 * App-wide login gate. Mounted once at the root so every screen (tabs, route
 * detail, profile) shares one login bottom sheet. The service is fully browsable
 * signed-out; this only intercepts write/personalize actions.
 */
export default function AuthGateProvider({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<GateOptions>({});

  const requireAuth = useCallback(
    (o?: GateOptions) => {
      if (isAuthed) return true;
      setOpts(o ?? {});
      setOpen(true);
      return false;
    },
    [isAuthed],
  );

  const next = opts.next ?? pathname ?? "/";

  return (
    <AuthGateContext.Provider value={{ isAuthed, requireAuth }}>
      {children}
      <ActionBottomSheet
        open={open}
        title={opts.title ?? "로그인이 필요해요"}
        description={
          opts.description ??
          "로그인하면 코스를 따라가고, 저장·후기를 남길 수 있어요. 둘러보기는 로그인 없이도 계속할 수 있어요."
        }
        primaryLabel="로그인 / 회원가입"
        secondaryLabel="계속 둘러보기"
        onClose={() => setOpen(false)}
        onPrimary={() => {
          setOpen(false);
          router.push(`/login?next=${encodeURIComponent(next)}`);
        }}
      />
    </AuthGateContext.Provider>
  );
}
