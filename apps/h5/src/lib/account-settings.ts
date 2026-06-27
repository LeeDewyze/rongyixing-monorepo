import { ApiError } from "@ryx/api";

import { formatApiError } from "@/lib/formatApiError";

const MOBILE_PATTERN = /^1\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePasswordChange(input: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null {
  if (!input.oldPassword.trim()) return "请输入原密码";
  if (!input.newPassword.trim()) return "请输入新密码";
  if (!input.confirmPassword.trim()) return "请再次输入新密码";
  if (input.newPassword !== input.confirmPassword) return "两次输入的新密码不一致";

  const complexityError = validatePasswordComplexity(input.newPassword);
  if (complexityError) return complexityError;

  if (input.oldPassword === input.newPassword) return "新密码不能与原密码相同";
  return null;
}

export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8 || password.length > 20) {
    return "密码需为8-20位，数字和英文的组合，不含空格";
  }
  if (/\s/.test(password)) {
    return "密码不能包含空格";
  }
  const hasDigit = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasDigit || !hasLetter) {
    return "密码需包含数字和英文的组合";
  }
  return null;
}

export function validateMobileNumber(mobile: string): string | null {
  const trimmed = mobile.trim();
  if (!trimmed) return "请输入手机号";
  if (!MOBILE_PATTERN.test(trimmed)) return "请输入正确的手机号";
  return null;
}

export function validateEmailAddress(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "请输入邮箱";
  if (!EMAIL_PATTERN.test(trimmed)) return "请输入正确的邮箱";
  return null;
}

export function validateVerificationCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return "请输入验证码";
  if (!/^\d{4,8}$/.test(trimmed)) return "请输入正确的验证码";
  return null;
}

const GENERIC_REQUEST_FAILURES = new Set([
  "Request failed",
  "请求失败",
  "请求失败，请稍后重试",
  "校验失败，请检查输入内容",
]);

/** User-facing message when SMS verification API rejects the code. */
export function formatVerificationError(error: unknown): string {
  const message = formatApiError(error);
  if (message.includes("验证码")) return message;
  if (error instanceof ApiError && error.code?.toLowerCase() === "validate") {
    return "验证码错误，请重新输入";
  }
  if (GENERIC_REQUEST_FAILURES.has(message)) {
    return "验证码错误，请重新输入";
  }
  return message;
}
