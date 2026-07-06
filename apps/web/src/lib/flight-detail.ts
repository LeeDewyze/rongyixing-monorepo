export interface FlightFareRuleSheetRow {
  Tag?: string;
  Name?: string;
  Description?: string;
  Details?: Array<{ name: string; value: unknown }>;
}
