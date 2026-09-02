import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookingSubmitTransition } from "@ryx/ui/components/booking/booking-submit-transition";
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
import { HotelBookTravelSection } from "@/components/hotel/HotelBookTravelSection";
import { PassengerSelectAlertDialog } from "@/components/passenger";
import { useBookOrgCostVisibility } from "@/hooks/useBookOrgCostVisibility";
import { useHotelBookPassengerForms } from "@/hooks/useHotelBookPassengerForms";
import { useHotelBookSelection, useHotelInitBook, useHotelSubmitBook } from "@/hooks/useHotelBook";
import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
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
  resolveHotelRoomPlanRulesDesc,
  resolveHotelShowCreditCard,
  resolvePassengerServiceFee,
  validateHotelBookForms,
  type HotelCreditCardForm,
  type HotelNotifyLanguage,
} from "@/lib/hotel-book";
import { pollHotelCheckPay, shouldNavigateToPay } from "@/lib/hotel-book-check-pay";
import {
  filterHotelPersonalPayTypeOptions,
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
import { buildPassengerSelectPath, clearPassengerSelection } from "@/lib/passenger-selection";
import { scrollH5MainToTop } from "@/lib/scroll-h5-main";
import {
  isBusinessTravelMode,
  loadHomeTravelMode,
  resolveProductChannel,
} from "@/lib/flight-travel-mode";
import { WEB_PAGE_BODY, WEB_PAGE_ROOT } from "@/lib/web-page-layout";

function resolveNotifyLanguageLabel(value: HotelNotifyLanguage): string {
  return FLIGHT_NOTIFY_LANGUAGE_OPTIONS.find((item) => item.value === value)?.label ?? "中文";
}

function resolveStaffAccountId(passenger: PassengerBookInfo): string | undefined {
  const fromPassenger =
    "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
  if (fromPassenger) return String(fromPassenger);
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

export function HotelBookPage() {
  const navigate = useNavigate();
  const { hotelId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { selection } = useHotelBookSelection();
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
  const [checkingPay, setCheckingPay] = useState(false);
  const [isLeavingAfterSubmit, setIsLeavingAfterSubmit] = useState(false);
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
  const [collapsedTravelSections, setCollapsedTravelSections] = useState<Record<string, boolean>>(
    {},
  );
  const [orgSheetPassengerId, setOrgSheetPassengerId] = useState<string | null>(null);
  const [costSheetPassengerId, setCostSheetPassengerId] = useState<string | null>(null);
  const [credentialSheetPassenger, setCredentialSheetPassenger] =
    useState<PassengerBookInfo | null>(null);
  /** Skip guard redirect when leaving after a successful submit. */
  const leavingAfterSubmitRef = useRef(false);
  const travelMode = useMemo(
    () =>
      searchParams.get("channel") === "tourist"
        ? "personal"
        : (selection?.travelMode ?? loadHomeTravelMode()),
    [searchParams, selection?.travelMode],
  );
  const isBusinessMode = isBusinessTravelMode(travelMode);
  const productChannel = resolveProductChannel(travelMode);
  const passengerContext = useBusinessSelfBookPassenger(ProductType.Hotel, isBusinessMode);
  const passengers = passengerContext.passengers;
  const setSelected = passengerContext.setSelected;
  const bookReturnTo = `/hotel/${encodeURIComponent(hotelId)}/book?${searchParams.toString()}`;

  useLayoutEffect(() => {
    scrollH5MainToTop();
  }, [hotelId]);

  useEffect(() => {
    if (leavingAfterSubmitRef.current) return;
    if (isBusinessMode && passengerContext.isLoading) return;
    if (!selection || (isBusinessMode && passengers.length === 0)) {
      setRedirecting(true);
      const detailUrl = selection ? buildHotelBookDetailUrl(selection) : null;
      const target = detailUrl ?? (hotelId ? `/hotel/${encodeURIComponent(hotelId)}` : "/home");
      navigate(target, { replace: true });
    }
  }, [hotelId, isBusinessMode, navigate, passengerContext.isLoading, passengers.length, selection]);

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
      travelMode,
      channel: productChannel,
    });
  }, [agentId, passengers, productChannel, selection, travelMode]);

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
        travelMode,
      }),
    [initBook.data, passengers, travelMode],
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

  const payOptions = useMemo(() => {
    const options = parseHotelPayTypeOptions(initBook.data?.PayTypes);
    return isBusinessMode ? options : filterHotelPersonalPayTypeOptions(options);
  }, [initBook.data?.PayTypes, isBusinessMode]);

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

  const requiresIllegalReason =
    isBusinessMode &&
    Boolean(selection?.policyRules?.length || initBook.data?.IllegalReasons?.length);

  const requiresApprover =
    isBusinessMode && Boolean(initBook.data?.Staffs?.some((staff) => staff.isAllowSelectApprove));

  const showCreditCard = selection
    ? resolveHotelShowCreditCard(selection, arrivalTime, initBook.data)
    : false;

  const personHoldMinutes = resolveHotelHoldMinutes(initBook.data);

  const cancelRule = selection ? resolveHotelRoomPlanRulesDesc(selection.plan) : "";

  function handleBack() {
    const fallback =
      (selection ? buildHotelBookDetailUrl(selection) : null) ??
      (hotelId ? `/hotel/${encodeURIComponent(hotelId)}` : "/hotel");
    navigateBack(navigate, fallback);
  }

  async function handleSubmit() {
    if (!selection) return;
    if (passengers.length === 0) {
      setAlertMessage("请选择入住人");
      return;
    }

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
      authorizedContacts: isBusinessMode ? authorizedContacts : [],
    });
    if (validationError) {
      setAlertMessage(validationError);
      return;
    }

    setAgreed(false);
    setWarmReminderOpen(true);
  }

  function finishBookNavigation(orderId?: string) {
    setIsLeavingAfterSubmit(true);
    leavingAfterSubmitRef.current = true;
    clearPassengerSelection(ProductType.Hotel);
    clearHotelBookSelection();

    if (orderId) {
      const detailPath =
        productChannel === "tourist"
          ? `/orders/hotel/${encodeURIComponent(orderId)}?channel=tourist`
          : `/orders/hotel/${encodeURIComponent(orderId)}`;
      navigate(detailPath, {
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
          globalArrivalTime: arrivalTime,
          globalNotifyLanguage: notifyLanguage,
          agentId: resolvedAgentId,
          creditCard: showCreditCard ? creditCard : undefined,
          outNumberFieldsByPassenger,
          initDto: initParams ?? undefined,
          init: initBook.data,
          travelMode,
          channel: productChannel,
          authorizedContacts: isBusinessMode ? authorizedContacts : [],
        }),
      );

      const result = await submitBook.mutateAsync(orderDto);
      const orderId = resolveHotelBookOrderId(result);

      if (result.IsCheckPay && result.TradeNo) {
        setCheckingPay(true);
        try {
          const checkPayReady = await pollHotelCheckPay(result.TradeNo, {
            channel: productChannel,
            productType: "Hotel",
          });
          if (shouldNavigateToPay({ travelPayType: payType, checkPayReady })) {
            setIsLeavingAfterSubmit(true);
            leavingAfterSubmitRef.current = true;
            clearPassengerSelection(ProductType.Hotel);
            clearHotelBookSelection();
            const payPath =
              productChannel === "tourist"
                ? `/hotel/pay/${encodeURIComponent(orderId)}?channel=tourist`
                : `/hotel/pay/${encodeURIComponent(orderId)}`;
            navigate(payPath, { replace: true });
            return;
          }
        } finally {
          setCheckingPay(false);
        }
      }

      finishBookNavigation(orderId);
    } catch (error) {
      setAlertMessage(formatApiError(error));
    }
  }

  if (isLeavingAfterSubmit) {
    return (
      <BookingSubmitTransition className={WEB_PAGE_ROOT} />
    );
  }

  if (redirecting || !selection) {
    return <div className={`${WEB_PAGE_ROOT} bg-[#F5F6F9]`} />;
  }

  if (initBook.isLoading) {
    return (
      <div className={`${WEB_PAGE_ROOT} bg-[#F5F6F9]`}>
        <HotelBookHeader onBack={handleBack} />
        <p className="p-6 text-center text-sm text-[#999999]">加载预订信息…</p>
      </div>
    );
  }

  if (initBook.error) {
    return (
      <div className={`${WEB_PAGE_ROOT} bg-[#F5F6F9]`}>
        <HotelBookHeader onBack={handleBack} />
        <p className="p-6 text-center text-sm text-[#ff4d4f]">{formatApiError(initBook.error)}</p>
      </div>
    );
  }

  const resolvedPayType = travelPayType ?? resolveDefaultHotelPayType(payOptions);
  const isSubmittingOrChecking = submitBook.isPending || checkingPay;

  return (
    <div className={`${WEB_PAGE_ROOT} bg-[#F5F6F9]`}>
      <HotelBookHeader onBack={handleBack} />
      <HotelBookReminderBar />

      <div className={`${WEB_PAGE_BODY} space-y-3 px-3 pt-2`}>
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

        {isBusinessMode && tmcAgents.length > 1 ? (
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

        {!isBusinessMode && passengers.length === 0 ? (
          <HotelBookRoomSection
            roomIndex={1}
            passenger={
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#8DB7FF] bg-[#F3F7FF] text-[14px] font-medium text-brand-primary active:opacity-80"
                onClick={() => navigate(buildPassengerSelectPath(ProductType.Hotel, bookReturnTo))}
              >
                <span className="text-[18px] leading-none" aria-hidden>
                  +
                </span>
                选择入住人
              </button>
            }
          />
        ) : null}

        {passengers.map((passenger, index) => {
          const form = forms[passenger.id];
          const credentialSubtitle = `${credentialDisplayType(passenger.credential)}：${credentialDisplayNumber(passenger.credential)}`;
          const canSwitchCredential = Boolean(resolveStaffAccountId(passenger));
          const fee = resolvePassengerServiceFee(passenger, initBook.data?.ServiceFees);

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
                      showOrganizations={isBusinessMode && showOrganizations}
                      showCostCenter={isBusinessMode && showCostCenter}
                      requiresApprover={requiresApprover}
                      isSkipApproveEnabled={isBusinessMode && Boolean(initBook.data?.isSkipApprove)}
                      outNumberFields={[]}
                      illegalReasons={isBusinessMode ? (initBook.data?.IllegalReasons ?? []) : []}
                      expenseTypes={isBusinessMode ? expenseTypeOptions : []}
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

        {isBusinessMode
          ? passengers.map((passenger) => (
              <HotelBookTravelSection
                key={passenger.id}
                fields={outNumberFieldsByPassenger[passenger.id] ?? []}
                values={forms[passenger.id]?.outNumbers ?? {}}
                expanded={!collapsedTravelSections[passenger.id]}
                subtitle={passengers.length > 1 ? passenger.credential.Name : undefined}
                onToggle={() =>
                  setCollapsedTravelSections((current) => ({
                    ...current,
                    [passenger.id]: !current[passenger.id],
                  }))
                }
                onOpenPicker={(field) => setOutNumberPicker({ passengerId: passenger.id, field })}
                onChange={(key, value) =>
                  updateForm(passenger.id, {
                    outNumbers: {
                      ...(forms[passenger.id]?.outNumbers ?? {}),
                      [key]: value,
                    },
                  })
                }
              />
            ))
          : null}

        {isBusinessMode ? (
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
              setNotifyContactId(accountId);
              setNotifySheetOpen(true);
            }}
          />
        ) : null}

        {showCreditCard ? (
          <HotelBookCreditCardSection
            value={creditCard}
            onChange={(patch) => setCreditCard((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {isBusinessMode ? (
          <HotelBookPayTypes
            options={payOptions}
            value={resolvedPayType}
            personHoldMinutes={personHoldMinutes}
            onChange={setTravelPayType}
          />
        ) : null}
      </div>

      <HotelBookFooter
        amount={displayAmount}
        disabled={isSubmittingOrChecking}
        pending={isSubmittingOrChecking}
        billOpen={billOpen}
        billNights={billNights}
        serviceFee={serviceFeeTotal}
        roomCount={Math.max(passengers.length, 1)}
        onBillToggle={() => setBillOpen((open) => !open)}
        onSubmit={() => void handleSubmit()}
      />

      {checkingPay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-8">
          <div className="w-full max-w-[18rem] rounded-2xl bg-white px-5 py-6 text-center shadow-lg">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#DCE8FF] border-t-[#2768FA]" />
            <p className="mt-4 text-[16px] font-semibold text-[#222222]">
              {productChannel === "tourist" ? "正在确认预订状态" : "正在确认支付状态"}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#666666]">
              {productChannel === "tourist"
                ? "订单已提交，请稍候，确认后将进入订单详情"
                : "订单已提交，请稍候，确认后将进入支付页面"}
            </p>
          </div>
        </div>
      ) : null}

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
        cancelRule={cancelRule}
        onClose={() => setNoticeOpen(false)}
      />

      <HotelBookWarmReminderDialog
        open={warmReminderOpen}
        paragraphs={warmReminderParagraphs}
        agreed={agreed}
        pending={isSubmittingOrChecking}
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
        open={isBusinessMode && addContactOpen}
        existingAccountIds={authorizedContacts.map((item) => item.accountId)}
        onClose={() => setAddContactOpen(false)}
        onSelect={(contact) => {
          setAuthorizedContacts((current) => [...current, contact]);
          setAddContactOpen(false);
        }}
      />

      <FlightBookApproverSheet
        open={isBusinessMode && approverSheetOpen}
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
        open={isBusinessMode && outNumberPicker != null}
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
        channel={productChannel}
        onClose={() => setCredentialSheetPassenger(null)}
        onSelect={(credential) => {
          if (!credentialSheetPassenger) return;
          setSelected(replacePassengerCredential(passengers, credentialSheetPassenger, credential));
        }}
      />

      <FlightBookOrganizationSheet
        open={isBusinessMode && orgSheetPassengerId != null}
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
        open={isBusinessMode && costSheetPassengerId != null}
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
