export interface BulletinNotice {
  Id: string | number;
  Title: string;
  InsertTime?: string;
  /** Short summary shown above HTML body (legacy `Description`). */
  Description?: string;
  /** Rich HTML body (legacy `Detail`). */
  Detail?: string;
  /** Optional header image URL (legacy `FullFileName`). */
  FullFileName?: string;
  Url?: string;
}

export interface NoticeListParams {
  PageIndex?: number;
  PageSize?: number;
}
