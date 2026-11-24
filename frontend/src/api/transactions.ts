import api from "./axios";
import { Transaction, TransactionListResponse } from "../types";

export interface CreateTransactionPayload {
  type: "envio" | "solicitud";
  amount_usd?: number;
  amount_gtq?: number;
  beneficiary_email?: string;
  note?: string;
}

export const getTransactions = async (
  page: number = 1,
  pageSize: number = 10,
  signal?: AbortSignal
): Promise<TransactionListResponse> => {
  const response = await api.get<TransactionListResponse>("/transactions/", {
    params: { page, page_size: pageSize },
    signal,
  });
  return response.data;
};

export const createTransaction = async (
  payload: CreateTransactionPayload
): Promise<Transaction> => {
  const response = await api.post<Transaction>("/transactions/", payload);
  return response.data;
};

export const confirmTransaction = async (id: number): Promise<Transaction> => {
  const response = await api.patch<Transaction>(`/transactions/${id}/confirm`);
  return response.data;
};
