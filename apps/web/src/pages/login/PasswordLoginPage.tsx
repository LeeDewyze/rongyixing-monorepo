import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@ryx/ui/components/ui/button";

import { usePasswordLogin } from "@/hooks/useAuth";
import { isAuthenticated } from "@/lib/auth";
import { resolveInternalReturnTo } from "@/lib/base-path";
import { getApiMode, getAppName } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from "@/lib/remember-credentials";

const inputClassName =
  "h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-base text-brand-title outline-none placeholder:text-[#999999] focus:border-brand-primary pc:h-12";

function getInitialFormState() {
  const remembered = loadRememberedCredentials();
  return {
    account: remembered?.account ?? "",
    password: remembered?.password ?? "",
    rememberChecked: remembered !== null,
  };
}

export function PasswordLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const login = usePasswordLogin();
  const initialForm = getInitialFormState();
  const [account, setAccount] = useState(initialForm.account);
  const [password, setPassword] = useState(initialForm.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberChecked, setRememberChecked] = useState(initialForm.rememberChecked);
  const [agreed, setAgreed] = useState(true);
  const [formHint, setFormHint] = useState<string | null>(null);

  async function handleLogin() {
    if (login.isPending) return;

    if (!account.trim()) {
      setFormHint("请输入账号");
      return;
    }
    if (!password) {
      setFormHint("请输入密码");
      return;
    }
    if (!agreed) {
      setFormHint("请先阅读并同意用户协议");
      return;
    }

    setFormHint(null);
    try {
      await login.mutateAsync({ Name: account.trim(), Password: password });
      if (rememberChecked) {
        saveRememberedCredentials(account.trim(), password);
      } else {
        clearRememberedCredentials();
      }
      navigate(resolveInternalReturnTo(returnTo, "/"));
    } catch {
      // Error surfaced via login.error
    }
  }

  const canSubmit = agreed && account.trim().length > 0 && password.length > 0;
  const apiMode = import.meta.env.DEV ? getApiMode() : null;
  const errorMessage = login.error ? formatApiError(login.error, "generic") : null;

  if (isAuthenticated()) {
    return <Navigate to={resolveInternalReturnTo(returnTo, "/")} replace />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F5F6F9] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] pc:max-w-lg pc:p-10">
        <p className="text-sm text-[#999999]">{getAppName()}</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-title pc:text-3xl">账号密码登录</h1>

        <div className="mt-8 space-y-4">
          <input
            type="text"
            autoComplete="username"
            placeholder="请输入账号"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className={inputClassName}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="登录密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClassName} pr-16`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 text-sm text-[#666666]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "隐藏" : "显示"}
            </button>
          </div>
        </div>

        {import.meta.env.DEV && apiMode === "mock" ? (
          <p className="mt-4 text-sm text-[#999999]">开发 Mock 模式：不会发起网络请求</p>
        ) : null}

        <Button
          type="button"
          className="mt-6 h-11 w-full rounded-lg bg-brand-primary text-base text-white hover:bg-brand-primary/90 pc:h-12"
          disabled={login.isPending || !canSubmit}
          onClick={() => void handleLogin()}
        >
          {login.isPending ? "登录中…" : "登录"}
        </Button>

        {formHint ? <p className="mt-3 text-sm text-amber-600">{formHint}</p> : null}
        {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}

        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-[#666666]">
          <input
            type="checkbox"
            checked={rememberChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setRememberChecked(checked);
              if (!checked) {
                clearRememberedCredentials();
              }
            }}
            className="size-4 accent-brand-primary"
          />
          <span>记住密码</span>
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-[#666666]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setFormHint(null);
            }}
            className="mt-0.5 size-4 shrink-0 accent-brand-primary"
          />
          <span>
            我已阅读并同意
            <span className="text-brand-primary">《用户协议》</span>
          </span>
        </label>
      </div>
    </div>
  );
}
