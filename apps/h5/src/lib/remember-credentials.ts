const REMEMBER_KEY = "ryx_remember_password";
const ACCOUNT_KEY = "ryx_saved_login_account";
const PASSWORD_KEY = "ryx_saved_login_password";

export function isRememberPasswordEnabled(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function loadRememberedCredentials(): { account: string; password: string } | null {
  if (!isRememberPasswordEnabled()) {
    return null;
  }
  const account = localStorage.getItem(ACCOUNT_KEY)?.trim() ?? "";
  const password = localStorage.getItem(PASSWORD_KEY) ?? "";
  if (!account) {
    return null;
  }
  return { account, password };
}

export function saveRememberedCredentials(account: string, password: string): void {
  localStorage.setItem(REMEMBER_KEY, "1");
  localStorage.setItem(ACCOUNT_KEY, account);
  localStorage.setItem(PASSWORD_KEY, password);
}

export function clearRememberedCredentials(): void {
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}
