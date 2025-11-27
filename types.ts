
export enum PaymentMethod {
  PIX = 'Pix',
  DINHEIRO = 'Dinheiro',
  DEBITO = 'Débito',
  CREDITO = 'Crédito'
}

export interface ServiceRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceDate: string; // ISO String YYYY-MM-DD
  serviceTime?: string; // HH:mm
  returnDate: string; // ISO String YYYY-MM-DD
  description: string;
  paymentMethod?: PaymentMethod; // Opcional no agendamento
  amount?: number; // Opcional no agendamento
  status: 'agendado' | 'concluido'; // Novo campo
  createdAt: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  total: number;
  count: number;
}

export interface MethodStats {
  name: string;
  value: number;
}
