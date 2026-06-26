import { CredentialType } from "@ryx/shared-types";

/** Legacy `member-credential-management` name tips — keep in sync with beeant HTML. */
export const CREDENTIAL_NAME_RULES = [
  "确认姓名中生僻字无法输入时，可用生僻字拼音或同音字替代。",
  "输入姓名保存后，遇有系统无法正确显示的汉字，可用该汉字的拼音或同音字重新修改后保存。",
  "姓名中有繁体字无法输入时，可用简体替代。",
  "姓名较长，汉字与英文字符合计超过30个(1个汉字算2个字符)的，需按姓名中第一个汉字或英文字符开始按顺序连续输入30个字符(空格字符不输入)，其中英文字符输入时不区别大小写。",
  "姓名中有“.”或“。”时，请仔细辨析身份证件原件上的“.”或“。”，准确输入。",
  "姓名中有“·”时，请使用空格替换。",
  "中国护照用户请填写证件上的中文姓名。",
  "外籍护照用户请填写证件上的英文姓名。",
] as const;

export const CREDENTIAL_NAME_MAX_UNITS = 30;

/** Legacy IdCardReg — 18-digit with last digit X/x allowed. */
const ID_CARD_PATTERN = /^\d{17}[\dxX]$/;

const MIDDLE_DOT_PATTERN = /[\u00b7\u2022\u2024\u2027\u30fb\u0387\u2219\u22c5\u25cf]/g;
const SMART_QUOTE_PATTERN = /[\u201c\u201d\u2018\u2019\u300c\u300d\u300e\u300f]/g;

function isCjkHan(char: string): boolean {
  const code = char.codePointAt(0);
  if (code == null) return false;
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

/** Weight for rule 4 — 1 Han = 2 units, others = 1. */
export function credentialNameWeight(char: string): number {
  return isCjkHan(char) ? 2 : 1;
}

export function credentialNameTotalUnits(name: string): number {
  return [...name].reduce((sum, char) => sum + credentialNameWeight(char), 0);
}

/**
 * Normalize name on input/save:
 * - rule 6: middle dot / smart quotes → space, then strip spaces (rule 4)
 * - rule 4: truncate to first 30 units from start
 */
export function normalizeCredentialName(raw: string): string {
  const replaced = raw.replace(MIDDLE_DOT_PATTERN, " ").replace(SMART_QUOTE_PATTERN, " ");
  const withoutSpaces = replaced.replace(/\s+/g, "");

  let units = 0;
  let result = "";
  for (const char of withoutSpaces) {
    const weight = credentialNameWeight(char);
    if (units + weight > CREDENTIAL_NAME_MAX_UNITS) break;
    result += char;
    units += weight;
  }
  return result;
}


const ENGLISH_NAME_PATTERN = /^[a-zA-Z\s./\-]+$/;

export function validateCredentialName(name: string, credentialType: number): string | null {
  const normalized = normalizeCredentialName(name);
  if (!normalized) return "请输入姓名";

  const hasHan = [...normalized].some(isCjkHan);
  const hasLatin = /[a-zA-Z]/.test(normalized);

  if (credentialType === CredentialType.IdCard) {
    // Rules 1–2 allow pinyin/homophone when rare characters cannot be entered.
    if (!hasHan && !hasLatin) {
      return "身份证姓名请输入中文或拼音";
    }
    return null;
  }

  if (credentialType === CredentialType.Passport) {
    if (hasHan && hasLatin) {
      return "护照姓名请填写中文或英文，请勿混用";
    }
    if (hasLatin && !ENGLISH_NAME_PATTERN.test(normalized)) {
      return "外籍护照请填写证件上的英文姓名";
    }
  }

  return null;
}

/** Check if the 8-digit birthday substring is a valid date. */
function isValidBirthdaySegment(yyyymmdd: string): boolean {
  const y = Number(yyyymmdd.substring(0, 4));
  const m = Number(yyyymmdd.substring(4, 6));
  const d = Number(yyyymmdd.substring(6, 8));
  if (y < 1900 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Legacy `IdCardReg` validation — 18-digit Chinese ID card number.
 * Checks format (18 chars, first 17 digits, last digit or X/x) and birthday validity.
 */
export function validateCredentialNumber(
  number: string,
  credentialType: number,
): string | null {
  const trimmed = number.trim();
  if (!trimmed) return "请输入证件号码";

  if (credentialType === CredentialType.IdCard) {
    if (!ID_CARD_PATTERN.test(trimmed)) {
      return "身份证号码格式不正确，请输入18位有效身份证号";
    }
    if (!isValidBirthdaySegment(trimmed.substring(6, 14))) {
      return "身份证号码中出生日期无效";
    }
  }

  return null;
}

/** Legacy ID card gender auto-detection: odd 17th digit = M, even = F. */
export function detectIdCardGender(idCardNumber: string): string | null {
  const trimmed = idCardNumber.trim();
  if (!ID_CARD_PATTERN.test(trimmed)) return null;
  const genderDigit = Number(trimmed.charAt(16));
  if (Number.isNaN(genderDigit)) return null;
  return genderDigit % 2 === 1 ? "M" : "F";
}
