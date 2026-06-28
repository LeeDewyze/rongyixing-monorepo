import { useState } from "react";

import { LegalDocumentSheet } from "@/components/contact/LegalDocumentSheet";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsMenuCard, SettingsMenuRow } from "@/components/settings/SettingsMenuCard";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
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
    <SettingsPageChrome title="联系我们" backTo="/home/mine">
      <div
        className={`flex flex-col gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 ${HOTEL_DETAIL_FONT}`}
      >
        <div className="px-3">
          <div className="overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF]">
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-brand-primary shadow-[0_2px_8px_rgba(39,104,250,0.12)]">
                  <img
                    src={PROFILE_ASSETS.menu.contact}
                    alt=""
                    className="size-5 object-contain"
                    aria-hidden
                  />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-tight text-brand-title">
                  融易行客服
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#8A94A6]">
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
    </SettingsPageChrome>
  );
}
