export interface BulletinNotice {
  Id: string | number;
  Title: string;
  InsertTime?: string;
  Url?: string;
}

export interface NoticeListParams {
  PageIndex?: number;
  PageSize?: number;
}
