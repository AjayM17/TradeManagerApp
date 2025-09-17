export interface TradeEntry {
  id: string;
  name: string;
  quantity: number;
  entryprice: number;
  stoploss: number;
  initial_stoploss: number;
  status: string;
  trade_date: string;
  image?: string | null;
  created_at: string;
  is_primary: boolean;
  riskReward: string;
  riskRewardValue: number;
}

export interface Holding {
  id: string; // Added unique id
  name: string;
  totalQty: number;
  avgPrice: number;
  totalInvested: number;
  stoploss: number;
  trades: TradeEntry[];
  riskReward: string;
  riskRewardValue: number;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, current) => {
    const groupKey = String(current[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(current);
    return result;
  }, {} as Record<string, T[]>);
}

