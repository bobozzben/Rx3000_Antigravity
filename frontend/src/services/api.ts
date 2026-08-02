import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface Product {
  code: string;
  name: string;
  spec: string;
  price: number;
  stock: number;
}

export interface Vendor {
  code: string;
  name: string;
}

export interface PurchaseLine {
  lineNo: number;
  productCode: string;
  productName: string;
  spec?: string;
  qty: number;
  price: number;
  amount: number;
  remarks?: string;
}

export interface PurchaseHeader {
  billNo: string;
  vendorCode: string;
  vendorName: string;
  total: number;
}

export interface PurchaseOrderPayload {
  header: PurchaseHeader;
  lines: PurchaseLine[];
}

export const api = {
  // Product Search
  searchProducts: async (query: string = ''): Promise<Product[]> => {
    const response = await axios.get<Product[]>(`${API_BASE_URL}/api/products/search`, {
      params: { q: query },
    });
    return response.data;
  },

  // Vendor Search
  searchVendors: async (query: string = ''): Promise<Vendor[]> => {
    const response = await axios.get<Vendor[]>(`${API_BASE_URL}/api/vendors/search`, {
      params: { q: query },
    });
    return response.data;
  },

  // Get Next Bill Number
  getNextBillNo: async (): Promise<string> => {
    const response = await axios.get<{ billNo: string }>(`${API_BASE_URL}/api/purchase/next-bill-no`);
    return response.data.billNo;
  },

  // Save Purchase Order
  savePurchaseOrder: async (payload: PurchaseOrderPayload) => {
    const response = await axios.post(`${API_BASE_URL}/api/purchase`, payload);
    return response.data;
  },
};
