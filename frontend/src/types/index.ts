export type DashboardRole = "emisor" | "receptor";

export interface User {
  user_id: number;
  full_name: string;
  role: DashboardRole | "ambos";
  access_token: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  beneficiary_id: number | null;
  type: "envio" | "solicitud";
  status: "pendiente" | "confirmado";
  amount_usd: number;
  amount_gtq: number;
  exchange_rate: number;
  note: string | null;
  created_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
}
