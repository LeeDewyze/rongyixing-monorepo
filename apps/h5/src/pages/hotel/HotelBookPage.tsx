import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ProductType,
  credentialDisplayNumber,
  credentialDisplayType,
  type FlightAuthorizedContact,
  type FlightOutNumberField,
  type PassengerBookInfo,
} from "@ryx/shared-types";

import { FlightBookAddContactSheet } from "@/components/flight/FlightBookAddContactSheet";
import { FlightBookAgentPicker } from "@/components/flight/FlightBookAgentPicker";
import { FlightBookApproverSheet } from "@/components/flight/FlightBookApproverSheet";
import { FlightBookAuthorizedContacts } from "@/components/flight/FlightBookAuthorizedContacts";
import { FlightBookCostCenterSheet } from "@/components/flight/FlightBookCostCenterSheet";
import { FlightBookCredentialSheet } from "@/components/flight/FlightBookCredentialSheet";
import { FlightBookCredentialSwitchButton } from "@/components/flight/FlightBookExpandableSummaryCard";
import { FlightBookNotifyLanguageSheet } from "@/components/flight/FlightBookNotifyLanguageSheet";
import { FlightBookOrganizationSheet } from "@/components/flight/FlightBookOrganizationSheet";
import { FlightOutNumberPickerSheet } from "@/components/flight/FlightOutNumberPickerSheet";
import { HotelBookWarmReminderDialog } from "@/components/hotel/HotelBookWarmReminderDialog";
import { HotelBookArrivalTimeSheet } from "@/components/hotel/HotelBookArrivalTimeSheet";
import { HotelBookCreditCardSection } from "@/components/hotel/HotelBookCreditCardSection";
import { HotelBookFooter } from "@/components/hotel/HotelBookFooter";
import { HotelBookHeader } from "@/components/hotel/HotelBookHeader";
import { HotelBookNoticeSheet } from "@/components/hotel/HotelBookNoticeSheet";
import { HotelBookOptionRow } from "@/components/hotel/HotelBookOptionRow";
import { HotelBookPassengerDetails } from "@/components/hotel/HotelBookPassengerDetails";
import { HotelBookPayTypes } from "@/components/hotel/HotelBookPayTypes";
import { HotelBookPolicyBanner } from "@/components/hotel/HotelBookPolicyBanner";
import { HotelBookReminderBar } from "@/components/hotel/HotelBookReminderBar";
import { HotelBookRoomCard } from "@/components/hotel/HotelBookRoomCard";
import { HotelBookRoomSection } from "@/components/hotel/HotelBookRoomSection";
import { HotelBookServiceFeeRow } from "@/components/hotel/HotelBookServiceFeeRow";
import { HotelBookSummaryCard } from "@/components/hotel/HotelBookSummaryCard";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { useHotelBookPassengerForms } from "@/hooks/useHotelBookPassengerForms";
import { useHotelBookSelection, useHotelInitBook, useHotelSubmitBook } from "@/hooks/useHotelBook";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildHotelInitBookDto,
  buildHotelOrderBookDto,
  prepareHotelBookSubmitDto,
  buildHotelPassengerOutNumberFieldsMap,
  buildHotelWarmReminderParagraphs,
  calcHotelNights,
  createEmptyHotelCreditCardForm,
  resolveHotelArrivalTimeOptions,
  resolveHotelBillNights,
  resolveHotelBookDisplayAmount,
  resolveHotelBookOrderId,
  resolveHotelShowCreditCard,
  resolvePassengerServiceFee,
  validateHotelBookForms,
  type HotelCreditCardForm,
  type HotelNotifyLanguage,
} from "@/lib/hotel-book";
import { pollHotelCheckPay, shouldNavigateToPay } from "@/lib/hotel-book-check-pay";
import {
  parseHotelPayTypeOptions,
  resolveDefaultHotelPayType,
  resolveHotelBookTmcFlags,
  resolveHotelHoldMinutes,
  resolveTotalServiceFee,
} from "@/lib/hotel-book-pay";
import { clearHotelBookSelection, buildHotelBookDetailUrl } from "@/lib/hotel-book-session";
import { navigateBack } from "@/lib/navigation";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";
import { formatApiError } from "@/lib/formatApiError";
import { FLIGHT_NOTIFY_LANGUAGE_OPTIONS } from "@/lib/flight-book-notify";
import { replacePassengerCredential } from "@/lib/passenger-select-logic";
import { clearPassengerSelection } from "@/lib/passenger-selection";
import { scrollH5MainToTop } from "@/lib/scroll-h5-main";

function resolveNotifyLanguageLabel(value: HotelNotifyLanguage): string {
  return FLIGHT_NOTIFY_LANGUAGE_OPTIONS.find((item) => item.value === value)?.label ?? "中文";
}

function resolveStaffAccountId(passenger: PassengerBookInfo): string | undefined {
  const fromPassenger = passenger.passenger.AccountId;
  if (fromPassenger) return String(fromPassenger);
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

export function HotelBookPage() {
  const navigate = useNavigate();
  const { hotelId = "" } = useParams();
  const { selection } = useHotelBookSelection();
  const { selected: passengers, setSelected } = usePassengerSelection(ProductType.Hotel);
  const submitBook = useHotelSubmitBook();
  const { showOrganizations, showCostCenter, organizations } = useBookOrgCostVisibility();

  const [redirecting, setRedirecting] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState("");
  const [notifyLanguage, setNotifyLanguage] = useState<HotelNotifyLanguage>("cn");
  const [notifyContactId, setNotifyContactId] = useState<string | null>(null);
  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [authorizedContacts, setAuthorizedContacts] = useState<FlightAuthorizedContact[]>([]);
  const [creditCard, setCreditCard] = useState<HotelCreditCardForm>(() =>
    createEmptyHotelCreditCardForm(),
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false);
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [warmReminderOpen, setWarmReminderOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [approverSheetOpen, setApproverSheetOpen] = useState(false);
  const [approverPassengerId, setApproverPassengerId] = useState<string | null>(null);
  const [outNumberPicker, setOutNumberPicker] = useState<{
    passengerId: string;
    field: FlightOutNumberField;
  } | null>(null);
  const [orgSheetPassengerId, setOrgSheetPassengerId] = useState<string | null>(null);
  const [costSheetPassengerId, setCostSheetPassengerId] = useState<string | null>(null);
  const [credentialSheetPassenger, setCredentialSheetPassenger] =
    useState<PassengerBookInfo | null>(null);
  /** Skip guard redirect when leaving after a successful submit. */
  const leavingAfterSubmitRef = useRef(false);

  useLayoutEffect(() => {
    scrollH5MainToTop();
  }, [hotelId]);

  useEffect(() => {
    if (leavingAfterSubmitRef.current) return;
    if (!selection || passengers.length === 0) {
      setRedirecting(true);
      const detailUrl = selection ? buildHotelBookDetailUrl(selection) : null;
      const target = detailUrl ?? (hotelId ? `/hotel/${encodeURIComponent(hotelId)}` : "/home");
      navigate(target, { replace: true });
    }
  }, [hotelId, navigate, passengers.length, selection]);

  const arrivalOptions = useMemo(
    () => (selection ? resolveHotelArrivalTimeOptions(selection, selection.checkIn) : []),
    [selection],
  );

  useEffect(() => {
    if (arrivalOptions.length && !arrivalTime) {
      setArrivalTime(arrivalOptions[0] ?? "");
    }
  }, [arrivalOptions, arrivalTime]);

  const initParams = useMemo(() => {
    if (!selection || passengers.length === 0) return null;
    return buildHotelInitBookDto({
      selection,
      passengers,
      agentId: agentId ?? undefined,
    });
  }, [agentId, passengers, selection]);

  const initBook = useHotelInitBook(initParams);

  useLayoutEffect(() => {
    if (redirecting || !selection || initBook.isLoading || initBook.error) return;
    scrollH5MainToTop();
  }, [initBook.error, initBook.isLoading, redirecting, selection]);

  const tmcAgents = initBook.data?.TmcServices ?? [];
  const resolvedAgentId =
    agentId ?? (tmcAgents.length === 1 ? String(tmcAgents[0]?.Id ?? "") : undefined);

  const outNumberFieldsByPassenger = useMemo(
    () =>
      buildHotelPassengerOutNumberFieldsMap({
        passengers,
        staffs: initBook.data?.Staffs,
        init: initBook.data,
      }),
    [initBook.data, passengers],
  );

  const expenseTypeOptions = useMemo(
    () =>
      (initBook.data?.ExpenseTypes ?? []).map((item) => ({
        id: item.Id,
        name: item.Name,
      })),
    [initBook.data?.ExpenseTypes],
  );

  const { forms, updateForm, toggleExpanded } = useHotelBookPassengerForms(
    passengers,
    initBook.data?.Staffs,
    arrivalTime,
  );

  const payOptions = useMemo(
    () => parseHotelPayTypeOptions(initBook.data?.PayTypes),
    [initBook.data?.PayTypes],
  );

  useEffect(() => {
    if (!payOptions.length) return;
    if (travelPayType == null || !payOptions.some((option) => option.value === travelPayType)) {
      setTravelPayType(resolveDefaultHotelPayType(payOptions));
    }
  }, [payOptions, travelPayType]);

  const tmcFlags = resolveHotelBookTmcFlags(initBook.data);
  const nights = selection ? calcHotelNights(selection.checkIn, selection.checkOut) : 1;
  const billNights = selection ? resolveHotelBillNights(selection) : [];
  const serviceFeeTotal = resolveTotalServiceFee(passengers, initBook.data?.ServiceFees);
  const displayAmount = selection
    ? resolveHotelBookDisplayAmount({
        init: initBook.data,
        selection,
        passengers,
      }) + serviceFeeTotal
    : 0;

  const warmReminderParagraphs = useMemo(() => buildHotelWarmReminderParagraphs(), []);

  const requiresIllegalReason = Boolean(
    selection?.policyRules?.length || initBook.data?.IllegalReasons?.length,
  );

  const requiresApprover = Boolean(
    initBook.data?.Staffs?.some((staff) => staff.isAllowSelectApprove),
  );

  const showCreditCard = selection
    ? resolveHotelShowCreditCard(selection, arrivalTime, initBook.data)
    : false;

  const personHoldMinutes = resolveHotelHoldMinutes(initBook.data);

  const cancelRule =
    (selection?.plan.VariablesObj?.RoomRateRule as string | undefined) ??
    selection?.plan.CancelPolicy;

  function handleBack() {
    const fallback =
      (selection ? buildHotelBookDetailUrl(selection) : null) ??
      (hotelId ? `/hotel/${encodeURIComponent(hotelId)}` : "/hotel");
    navigateBack(navigate, fallback);
  }

  async function handleSubmit() {
    if (!selection) return;

    const validationError = validateHotelBookForms({
      passengers,
      forms,
      arrivalTime,
      init: initBook.data,
      requiresIllegalReason,
      requiresApprover,
      outNumberFieldsByPassenger,
      showCreditCard,
      creditCard,
      authorizedContacts,
    });
    if (validationError) {
      setAlertMessage(validationError);
      return;
    }

    setAgreed(false);
    setWarmReminderOpen(true);
  }

  function finishBookNavigation(orderId?: string) {
    leavingAfterSubmitRef.current = true;
    clearPassengerSelection(ProductType.Hotel);
    clearHotelBookSelection();

    if (orderId) {
      navigate(`/orders/hotel/${encodeURIComponent(orderId)}`, {
        replace: true,
        state: { bookedOrderId: orderId, product: "hotel" },
      });
      return;
    }

    navigate(`/home/orders?tab=${TAB_ID_TO_PARAM.hotel}`, { replace: true });
  }

  async function executeSubmit() {
    if (!selection) return;
    const payType = travelPayType ?? resolveDefaultHotelPayType(payOptions);

    try {
      const orderDto = prepareHotelBookSubmitDto(
        buildHotelOrderBookDto({
          selection,
          passengers,
          forms,
          travelPayType: payType,
          authorizedContacts,
          globalArrivalTime: arrivalTime,
          globalNotifyLanguage: notifyLanguage,
          agentId: resolvedAgentId,
          creditCard: showCreditCard ? creditCard : undefined,
          outNumberFieldsByPassenger,
          initDto: initParams ?? undefined,
        }),
      );

      const result = await submitBook.mutateAsync(orderDto);
      const orderId = resolveHotelBookOrderId(result);

      if (result.IsCheckPay && result.TradeNo) {
        const checkPayReady = await pollHotelCheckPay(result.TradeNo);
        if (shouldNavigateToPay({ travelPayType: payType, checkPayReady })) {
          leavingAfterSubmitRef.current = true;
          clearPassengerSelection(ProductType.Hotel);
          clearHotelBookSelection();
          navigate(`/hotel/pay/${encodeURIComponent(orderId)}`, { replace: true });
          return;
        }
      }

      finishBookNavigation(orderId);
    } catch (error) {
      setAlertMessage(formatApiError(error));
    }
  }

  if (redirecting || !selection) {
    return <div className="min-h-dvh bg-[#F5F6F9]" />;
  }

  if (initBook.isLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#F5F6F9]">
        <HotelBookHeader onBack={handleBack} />
        <p className="p-6 text-center text-sm text-[#999999]">加载预订信息…</p>
      </div>
    );
  }

  if (initBook.error) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#F5F6F9]">
        <HotelBookHeader onBack={handleBack} />
        <p className="p-6 text-center text-sm text-[#ff4d4f]">{formatApiError(initBook.error)}</p>
      </div>
    );
  }

  const resolvedPayType = travelPayType ?? resolveDefaultHotelPayType(payOptions);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F6F9]">
      <HotelBookHeader onBack={handleBack} />
      <HotelBookReminderBar />

      <div className="flex-1 space-y-3 px-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-2">
        <HotelBookSummaryCard
          hotelName={selection.hotelName}
          checkIn={selection.checkIn}
          checkOut={selection.checkOut}
          nights={nights}
          roomName={selection.room.RoomName}
          breakfast={selection.plan.Breakfast}
          cancelRule={cancelRule}
          onOpenNotice={() => setNoticeOpen(true)}
        />

        {tmcAgents.length > 1 ? (
          <FlightBookAgentPicker
            agents={tmcAgents}
            value={agentId ?? String(tmcAgents[0]?.Id ?? "")}
            onChange={(nextAgentId) => setAgentId(nextAgentId)}
          />
        ) : null}

        <HotelBookOptionRow
          label="到店时间"
          value={arrivalTime || "请选择"}
          required
          onClick={() => setArrivalSheetOpen(true)}
        />
        {tmcFlags.isDisplayNotifyLanguage ? (
          <HotelBookOptionRow
            label="通知语言"
            value={resolveNotifyLanguageLabel(notifyLanguage)}
            onClick={() => setNotifySheetOpen(true)}
          />
        ) : null}

        {selection.policyRules?.length ? (
          <HotelBookPolicyBanner rules={selection.policyRules} />
        ) : null}

        {passengers.map((passenger, index) => {
          const form = forms[passenger.id];
          const credentialSubtitle = `${credentialDisplayType(passenger.credential)}：${credentialDisplayNumber(passenger.credential)}`;
          const canSwitchCredential = Boolean(resolveStaffAccountId(passenger));
          const fee = resolvePassengerServiceFee(passenger, initBook.data?.ServiceFees);
          const outNumberFields = outNumberFieldsByPassenger[passenger.id] ?? [];

          const showServiceFee = tmcFlags.isShowServiceFee && fee > 0;

          return (
            <HotelBookRoomSection
              key={passenger.id}
              roomIndex={index + 1}
              serviceFee={
                showServiceFee ? <HotelBookServiceFeeRow amount={fee} inset /> : undefined
              }
              passenger={
                <HotelBookRoomCard
                  passengerName={passenger.credential.Name ?? ""}
                  credentialSubtitle={credentialSubtitle}
                  expanded={form?.expanded ?? false}
                  onToggleExpand={() => toggleExpanded(passenger.id)}
                  credentialSwitchAction={
                    canSwitchCredential ? (
                      <FlightBookCredentialSwitchButton
                        onClick={() => setCredentialSheetPassenger(passenger)}
                      />
                    ) : undefined
                  }
                >
                  {form ? (
                    <HotelBookPassengerDetails
                      form={form}
                      showOrganizations={showOrganizations}
                      showCostCenter={showCostCenter}
                      requiresApprover={requiresApprover}
                      isSkipApproveEnabled={Boolean(initBook.data?.isSkipApprove)}
                      outNumberFields={outNumberFields}
                      illegalReasons={initBook.data?.IllegalReasons ?? []}
                      expenseTypes={expenseTypeOptions}
                      requiresIllegalReason={requiresIllegalReason}
                      onUpdateForm={(patch) => updateForm(passenger.id, patch)}
                      onOpenOrganization={() => setOrgSheetPassengerId(passenger.id)}
                      onOpenCostCenter={() => setCostSheetPassengerId(passenger.id)}
                      onOpenApprover={() => {
                        setApproverPassengerId(passenger.id);
                        setApproverSheetOpen(true);
                      }}
                      onOpenOutNumberPicker={(field) =>
                        setOutNumberPicker({ passengerId: passenger.id, field })
                      }
                    />
                  ) : null}
                </HotelBookRoomCard>
              }
            />
          );
        })}

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
              current.map((item) => (item.accountId === accountId ? { ...item, ...patch } : item)),
            )
          }
          onOpenNotifyLanguage={(accountId) => {
            setNotifyContactId(accountId);
            setNotifySheetOpen(true);
          }}
        />

        {showCreditCard ? (
          <HotelBookCreditCardSection
            value={creditCard}
            onChange={(patch) => setCreditCard((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        <HotelBookPayTypes
          options={payOptions}
          value={resolvedPayType}
          personHoldMinutes={personHoldMinutes}
          onChange={setTravelPayType}
        />
      </div>

      <HotelBookFooter
        amount={displayAmount}
        disabled={submitBook.isPending}
        pending={submitBook.isPending}
        billOpen={billOpen}
        billNights={billNights}
        serviceFee={serviceFeeTotal}
        roomCount={Math.max(passengers.length, 1)}
        onBillToggle={() => setBillOpen((open) => !open)}
        onSubmit={() => void handleSubmit()}
      />

      <HotelBookArrivalTimeSheet
        open={arrivalSheetOpen}
        options={arrivalOptions}
        selected={arrivalTime}
        onClose={() => setArrivalSheetOpen(false)}
        onSelect={(value) => {
          setArrivalTime(value);
          setArrivalSheetOpen(false);
        }}
      />

      <FlightBookNotifyLanguageSheet
        open={notifySheetOpen}
        value={
          notifyContactId
            ? ((authorizedContacts.find((item) => item.accountId === notifyContactId)
                ?.notifyLanguage as HotelNotifyLanguage | undefined) ?? "cn")
            : notifyLanguage
        }
        onClose={() => {
          setNotifySheetOpen(false);
          setNotifyContactId(null);
        }}
        onSelect={(value) => {
          if (notifyContactId) {
            setAuthorizedContacts((current) =>
              current.map((item) =>
                item.accountId === notifyContactId ? { ...item, notifyLanguage: value } : item,
              ),
            );
          } else {
            setNotifyLanguage(value as HotelNotifyLanguage);
          }
          setNotifySheetOpen(false);
          setNotifyContactId(null);
        }}
      />

      <HotelBookNoticeSheet
        open={noticeOpen}
        checkInOutTime={selection.checkInOutTime}
        bookingNotice={selection.bookingNotice}
        onClose={() => setNoticeOpen(false)}
      />

      <HotelBookWarmReminderDialog
        open={warmReminderOpen}
        paragraphs={warmReminderParagraphs}
        agreed={agreed}
        pending={submitBook.isPending}
        showCreditCard={showCreditCard}
        onAgreedChange={setAgreed}
        onConfirm={() => {
          if (!agreed) return;
          setWarmReminderOpen(false);
          void executeSubmit();
        }}
        onClose={() => setWarmReminderOpen(false)}
      />

      <FlightBookAddContactSheet
        open={addContactOpen}
        existingAccountIds={authorizedContacts.map((item) => item.accountId)}
        onClose={() => setAddContactOpen(false)}
        onSelect={(contact) => {
          setAuthorizedContacts((current) => [...current, contact]);
          setAddContactOpen(false);
        }}
      />

      <FlightBookApproverSheet
        open={approverSheetOpen}
        onClose={() => setApproverSheetOpen(false)}
        onSelect={(approver) => {
          if (approverPassengerId) {
            updateForm(approverPassengerId, {
              approvalId: approver.accountId,
              approvalName: approver.name,
            });
          }
          setApproverSheetOpen(false);
        }}
      />

      <FlightOutNumberPickerSheet
        open={outNumberPicker != null}
        field={outNumberPicker?.field ?? null}
        selected={
          outNumberPicker
            ? (forms[outNumberPicker.passengerId]?.outNumbers[outNumberPicker.field.key] ??
              outNumberPicker.field.value)
            : undefined
        }
        onClose={() => setOutNumberPicker(null)}
        onSelect={(value) => {
          if (!outNumberPicker) return;
          const { passengerId, field } = outNumberPicker;
          updateForm(passengerId, {
            outNumbers: {
              ...forms[passengerId]?.outNumbers,
              [field.key]: value,
            },
          });
          setOutNumberPicker(null);
        }}
      />

      <FlightBookCredentialSheet
        open={credentialSheetPassenger != null}
        passenger={credentialSheetPassenger}
        productType={ProductType.Hotel}
        onClose={() => setCredentialSheetPassenger(null)}
        onSelect={(credential) => {
          if (!credentialSheetPassenger) return;
          setSelected(replacePassengerCredential(passengers, credentialSheetPassenger, credential));
        }}
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

      <PassengerSelectAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}
