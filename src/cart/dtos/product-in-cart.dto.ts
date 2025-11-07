export interface StoreInCartDto {
  id: string;
  name: string;
}

export interface StockInCartDto {
  id: string;
  quantity: number;
  size: {
    id: number;
    name: string;
  };
}

export interface ProductInCartDto {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  image: string;
  price: number;
  discountRate: number | null;
  discountStartTime: string | null;
  discountEndTime: string | null;
  isSoldOut: boolean;

  stocks: StockInCartDto[];
  store: StoreInCartDto;
}
