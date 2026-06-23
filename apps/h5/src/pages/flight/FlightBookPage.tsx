import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductType, type FlightAuthorizedContact, type FlightInitStaff } from "@ryx/shared-types";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";

import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookBillSheet } from "@/components/flight/FlightBookBillSheet";
import { FlightBookOrganizationSheet } from "@/components/flight/FlightBookOrganizationSheet";
import { FlightBookAuthorizedContacts } from "@/components/flight/FlightBookAuthorizedContacts";
import { FlightBookExtras } from "@/components/flight/FlightBookExtras";
import { FlightBookFooter } from "@/components/flight/FlightBookFooter";
import { FlightBookNotifyLanguageSheet } from "@/components/flight/FlightBookNotifyLanguageSheet";
import { FlightBookPassengers } from "@/components/flight/FlightBookPassengers";
import { FlightBookPayTypes } from "@/components/flight/FlightBookPayTypes";
import { FlightBookSummary } from "@/components/flight/FlightBookSummary";
import { FlightCabinsHeader } from "@/components/flight/FlightCabinsHeader";
import { FlightFareRulesSheet } from "@/components/flight/FlightFareRulesSheet";
import { usePageHeader } from "@/components/layout";
import { FLIGHT_CABINS_HEADER_BG } from "@/config/flight-cabins";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { useFlightBookPassengerForms } from "@/hooks/useFlightBookPassengerForms";
import {
  useFlightBookSelection,
  useFlightInitBook,
  useFlightSubmitBook,
} from "@/hooks/useFlightBook";
import {
  buildFlightOrderBookDto,
  resolveFlightBookBillBreakdown,
  resolveFlightBookDisplayAmount,
  resolveFlightBookOrderId,
} from "@/lib/flight-book";
import {
  FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";
import {
  parseFlightPayTypeOptions,
  resolveDefaultFlightPayType,
  resolveFlightBookTmcFlags,
  resolveFlightHoldMinutes,
  resolveTotalServiceFee,
} from "@/lib/flight-book-pay";
import { buildCabinsHref, clearFlightBookSelection } from "@/lib/flight-book-session";
import { usePassengerSelection } from "@/hooks/usePassenger";
import { replacePassengerCredential } from "@/lib/passenger-select-logic";
import {
  accountIdFromNotifyTarget,
  authorizedContactNotifyTarget,
  isAuthorizedContactNotifyTarget,
  validateAuthorizedContacts,
} from "@/lib/flight-book-contacts";
import { validatePassengerBookForms, resolvePassengerFormMobile } from "@/lib/flight-book-passenger-form";
import { isFlightListTimedOut } from "@/lib/flight-list-refresh";
import { formatApiError } from "@/lib/formatApiError";
import { clearPassengerSelection } from "@/lib/passenger-selection";

export function FlightBookPage() {
  const navigate = useNavigate();
  const { selection } = useFlightBookSelection();
  const { selected, setSelected } = usePassengerSelection(ProductType.Flight);
  const submitBook = useFlightSubmitBook();

  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [notifyLanguageOpen, setNotifyLanguageOpen] = useState(false);
  const [notifyLanguageTarget, setNotifyLanguageTarget] = useState<"order" | string>("order");
  const [notifyLanguage, setNotifyLanguage] = useState<FlightNotifyLanguage>(
    FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  );
  const [authorizedContacts, setAuthorizedContacts] = useState<FlightAuthorizedContact[]>([]);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [orgSheetPassengerId, setOrgSheetPassengerId] = useState<string | null>(null);
  const [costSheetPassengerId, setCostSheetPassengerId] = useState<string | null>(null);
  const [credentialSheetPassenger, setCredentialSheetPassenger] =
    useState<import("@ryx/shared-types").PassengerBookInfo | null>(null);

  const returnTo = "/flight/book";

  const initParams = useMemo(() => {
    if (!selection || selected.length === 0) return null;
    return buildFlightOrderBookDto({
      selection,
      passengers: selected,
    });
  }, [selection, selected]);

  const initBook = useFlightInitBook(initParams);
  const initStaffs = initBook.data?.Staffs as FlightInitStaff[] | undefined;
  const { forms, orderedForms, updateForm } = useFlightBookPassengerForms(
    selected,
    initStaffs,
  );
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility();

  const payOptions = useMemo(
    () => parseFlightPayTypeOptions(initBook.data?.PayTypes),
    [initBook.data?.PayTypes],
  );

  const resolvedPayType = travelPayType ?? resolveDefaultFlightPayType(payOptions);
  const personHoldMinutes = resolveFlightHoldMinutes(initBook.data);

  useEffect(() => {
    if (!selection) {
      navigate("/flight/list", { replace: true });
    }
  }, [navigate, selection]);

  useEffect(() => {
    if (travelPayType != null || !payOptions.length) return;
    setTravelPayType(resolveDefaultFlightPayType(payOptions));
  }, [payOptions, travelPayType]);

  usePageHeader({ visible: false });

  const serviceFees = initBook.data?.ServiceFees;
  const tmcFlags = resolveFlightBookTmcFlags(initBook.data);
  const totalServiceFee = resolveTotalServiceFee(selected, serviceFees);
  const billBreakdown = useMemo(() => {
    if (!selection || selected.length === 0) return null;
    return resolveFlightBookBillBreakdown({ selection, passengers: selected, serviceFees });
  }, [selection, selected, serviceFees]);
  const orderAmount = selection
    ? resolveFlightBookDisplayAmount(selection, selected, serviceFees)
    : 0;

  if (!selection) {
    return null;
  }

  const timedOut = isFlightListTimedOut(selection.priceSnapshotAt);
  const isPending = initBook.isFetching || submitBook.isPending;
  const error = initBook.error ?? submitBook.error;

  function handleBack() {
    navigate(buildCabinsHref(selection));
  }

  async function handleSubmit() {
    if (!selection || selected.length === 0 || !initParams || !agreed) return;
    if (timedOut) {
      window.alert("您的停留时间过长，价格信息可能发生变动，请重新查询");
      navigate(buildCabinsHref(selection));
      return;
    }

    const passengerValidationError = validatePassengerBookForms(selected, forms);
    if (passengerValidationError) {
      const invalidPassenger = selected.find((passenger) => {
        const form = forms[passenger.id];
        return form && !resolvePassengerFormMobile(form);
      });
      if (invalidPassenger) {
        updateForm(invalidPassenger.id, { expanded: true });
      }
      window.alert(passengerValidationError);
      return;
    }

    const contactValidationError = validateAuthorizedContacts(authorizedContacts);
    if (contactValidationError) {
      window.alert(contactValidationError);
      return;
    }

    const first = selected[0]?.credential;
    const bookDto = buildFlightOrderBookDto({
      selection,
      passengers: selected,
      passengerForms: forms,
      travelPayType: resolvedPayType,
      messageLang: notifyLanguage,
      authorizedContacts,
      linkman: first?.Name
        ? { name: first.Name, mobile: first.Mobile ?? "", messageLang: notifyLanguage }
        : undefined,
    });

    const result = await submitBook.mutateAsync(bookDto);
    const orderId = resolveFlightBookOrderId(result);
    clearFlightBookSelection();
    clearPassengerSelection(ProductType.Flight);
    navigate("/orders", {
      replace: true,
      state: orderId ? { bookedOrderId: orderId, product: "flight" } : undefined,
    });
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f8] pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
      <div
        className="sticky top-0 z-20 shrink-0 pt-[env(safe-area-inset-top)]"
        style={{
          backgroundColor: FLIGHT_CABINS_HEADER_BG,
          backgroundImage:
            "linear-gradient(180deg, #8fc5ff 0%, #cfe3ff 58%, #f2f4f8 100%)",
        }}
      >
        <FlightCabinsHeader title="确认信息及预订" onBack={handleBack} />
        <FlightBookSummary selection={selection} onShowRules={() => setRulesOpen(true)} />
      </div>

      <div className="space-y-3 px-3 py-3">
        <FlightBookPassengers
          returnTo={returnTo}
          passengers={selected}
          forms={orderedForms}
          showOrganizations={showOrganizations}
          showCostCenter={showCostCenter}
          onUpdateForm={updateForm}
          onOpenOrganization={setOrgSheetPassengerId}
          onOpenCostCenter={setCostSheetPassengerId}
          onChangeCredential={setCredentialSheetPassenger}
        />

        {!initBook.isFetching ? (
          <FlightBookExtras
            showNotifyLanguage={tmcFlags.isDisplayNotifyLanguage}
            showServiceFee={tmcFlags.isShowServiceFee}
            notifyLanguage={notifyLanguage}
            serviceFee={totalServiceFee}
            onOpenNotifyLanguage={() => {
              setNotifyLanguageTarget("order");
              setNotifyLanguageOpen(true);
            }}
          />
        ) : (
          <p className="text-center text-[13px] text-[#808080]">正在初始化订单…</p>
        )}

        <FlightBookAuthorizedContacts
          contacts={authorizedContacts}
          onAdd={() => setAddContactOpen(true)}
          onRemove={(accountId) =>
            setAuthorizedContacts((current) =>
              current.filter((item) => item.accountId !== accountId),
            )
          }
          onUpdate={(accountId, patch) =>
            setAuthorizedContacts((current) =>
              current.map((item) =>
                item.accountId === accountId ? { ...item, ...patch } : item,
              ),
            )
          }
          onOpenNotifyLanguage={(accountId) => {
            setNotifyLanguageTarget(authorizedContactNotifyTarget(accountId));
            setNotifyLanguageOpen(true);
          }}
        />

        {!initBook.isFetching ? (
          <FlightBookPayTypes
            options={payOptions}
            value={resolvedPayType}
            personHoldMinutes={personHoldMinutes}
            onChange={setTravelPayType}
          />
        ) : null}

        {timedOut ? (
          <p className="text-[13px] text-[#ff8d1a]">
            价格信息可能已过期，提交前请返回舱位页重新查询。
          </p>
        ) : null}

        {error ? (
          <p className="text-[13px] text-destructive">{formatApiError(error)}</p>
        ) : null}
      </div>

      <FlightBookFooter
        amount={orderAmount}
        agreed={agreed}
        pending={isPending}
        disabled={selected.length === 0 || isPending || initBook.isError}
        onAgreedChange={setAgreed}
        onShowBill={() => setBillOpen(true)}
        onSubmit={() => void handleSubmit()}
      />

      <FlightFareRulesSheet
        open={rulesOpen}
        fare={selection.fare}
        onClose={() => setRulesOpen(false)}
      />

      <FlightBookBillSheet
        open={billOpen}
        breakdown={billBreakdown}
        onClose={() => setBillOpen(false)}
      />

      <FlightBookNotifyLanguageSheet
        open={notifyLanguageOpen}
        value={
          notifyLanguageTarget === "order"
            ? notifyLanguage
            : ((authorizedContacts.find(
                (item) =>
                  item.accountId ===
                  (isAuthorizedContactNotifyTarget(notifyLanguageTarget)
                    ? accountIdFromNotifyTarget(notifyLanguageTarget)
                    : notifyLanguageTarget),
              )?.notifyLanguage ?? FLIGHT_NOTIFY_LANGUAGE_DEFAULT) as FlightNotifyLanguage)
        }
        onClose={() => setNotifyLanguageOpen(false)}
        onSelect={(value) => {
          if (notifyLanguageTarget === "order") {
            setNotifyLanguage(value);
          } else {
            const accountId = isAuthorizedContactNotifyTarget(notifyLanguageTarget)
              ? accountIdFromNotifyTarget(notifyLanguageTarget)
              : notifyLanguageTarget;
            setAuthorizedContacts((current) =>
              current.map((item) =>
                item.accountId === accountId ? { ...item, notifyLanguage: value } : item,
              ),
            );
          }
        }}
      />

      <FlightBookCredentialSheet
        open={credentialSheetPassenger != null}
        passenger={credentialSheetPassenger}
        onClose={() => setCredentialSheetPassenger(null)}
        onSelect={(credential) => {
          if (!credentialSheetPassenger) return;
          setSelected(replacePassengerCredential(selected, credentialSheetPassenger, credential));
        }}
      />

      <FlightBookAddContactSheet
        open={addContactOpen}
        existingAccountIds={authorizedContacts.map((item) => item.accountId)}
        onClose={() => setAddContactOpen(false)}
        onSelect={(contact) =>
          setAuthorizedContacts((current) => [...current, contact])
        }
      />

      <FlightBookOrganizationSheet
        open={orgSheetPassengerId != null}
        organizations={organizations}
        selectedCode={
          orgSheetPassengerId ? forms[orgSheetPassengerId]?.organization.code : undefined
        }
        onClose={() => setOrgSheetPassengerId(null)}
        onSelect={(organization) => {
          if (!orgSheetPassengerId) return;
          updateForm(orgSheetPassengerId, {
            organization,
            otherOrganizationName: "",
          });
        }}
      />

      <FlightBookCostCenterSheet
        open={costSheetPassengerId != null}
        selectedCode={
          costSheetPassengerId ? forms[costSheetPassengerId]?.costCenter.code : undefined
        }
        onClose={() => setCostSheetPassengerId(null)}
        onSelect={(costCenter) => {
          if (!costSheetPassengerId) return;
          updateForm(costSheetPassengerId, {
            costCenter,
            otherCostCenterName: "",
            otherCostCenterCode: "",
          });
        }}
      />
    </div>
  );
}
