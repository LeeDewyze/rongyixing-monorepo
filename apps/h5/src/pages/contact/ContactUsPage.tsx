import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { LegalDocumentSheet } from "@/components/contact/LegalDocumentSheet";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsMenuCard, SettingsMenuRow } from "@/components/settings/SettingsMenuCard";
import { SettingsSectionLabel } from "@/components/settings/SettingsSectionLabel";
import { PROFILE_ASSETS } from "@/config/profile-assets";
import { useTmcData } from "@/hooks/useTmcData";
import {
  contactUrlOptionsFromApiConfig,
  dialContactPhone,
  getPrivacyPolicyUrl,
  getUserAgreementUrl,
  resolveContactPhone,
} from "@/lib/contact-us";

type LegalDoc = "agreement" | "privacy" | null;

export function ContactUsPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });

  const { data: tmcData } = useTmcData();
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  const urlOptions = contactUrlOptionsFromApiConfig();
  const agreementUrl = getUserAgreementUrl(urlOptions);
  const privacyUrl = getPrivacyPolicyUrl(urlOptions);
  const contactPhone = resolveContactPhone(undefined, undefined, tmcData);

  const legalTitle =
    legalDoc === "agreement" ? "融易行用户协议" : legalDoc === "privacy" ? "隐私政策" : "";
  const legalUrl =
    legalDoc === "agreement" ? agreementUrl : legalDoc === "privacy" ? privacyUrl : "";

  return (
    <div className={`flex min-h-full flex-col bg-[#F5F6F9] ${HOTEL_DETAIL_FONT}`}>
      <div className="shrink-0 bg-gradient-to-b from-brand-header-start to-brand-header-end pt-[env(safe-area-inset-top)] shadow-[0_2px_12px_rgba(80,153,254,0.2)]">
        <div className="flex items-center px-1 pb-3 pt-1">
          <button
            type="button"
            className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
            aria-label="返回"
            onClick={() => navigate("/home/mine")}
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-white">
            联系我们
          </h1>
          <span className="w-10 shrink-0" />
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="px-3">
          <div className="overflow-hidden rounded-xl bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF]">
                <img
                  src={PROFILE_ASSETS.menu.contact}
                  alt=""
                  className="size-6 object-contain"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-brand-title">融易行客服</p>
                <p className="mt-1 text-[13px] leading-snug text-[#999999]">
                  咨询、投诉与建议，欢迎随时联系我们
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SettingsSectionLabel>法律条款</SettingsSectionLabel>
          <SettingsMenuCard>
            <SettingsMenuRow label="用户协议" onClick={() => setLegalDoc("agreement")} />
            <SettingsMenuRow label="隐私政策" onClick={() => setLegalDoc("privacy")} borderless />
          </SettingsMenuCard>
        </div>

        <div>
          <SettingsSectionLabel>客户服务</SettingsSectionLabel>
          <SettingsMenuCard>
            <SettingsMenuRow
              label="联系客服"
              value={contactPhone || undefined}
              onClick={() => dialContactPhone(contactPhone)}
              borderless
            />
          </SettingsMenuCard>
        </div>
      </div>

      <LegalDocumentSheet
        open={legalDoc !== null}
        title={legalTitle}
        url={legalUrl}
        onClose={() => setLegalDoc(null)}
      />
    </div>
  );
}
