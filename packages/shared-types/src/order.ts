export interface OrderListParams {
  PageIndex?: number;
  PageSize?: number;
  Status?: string;
  Keyword?: string;
}

export interface OrderListItem {
  OrderId: string;
  OrderNumber?: string;
  Status?: string;
  StatusName?: string;
  TotalAmount?: number;
  ProductName?: string;
  CreateTime?: string;
}

export interface OrderListResponse {
  Orders: OrderListItem[];
  TotalCount?: number;
}

export interface PayProcessParams {
  OrderId: string;
  PayOrderId?: string;
  PayType?: string;
}

export interface PayProcessResponse {
  Success?: boolean;
  Message?: string;
}
