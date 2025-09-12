export interface TradeEntry {
  id: string;
  name: string;
  quantity: number;
  entryprice: number;
  stoploss: number;
  status: string;
  trade_date: string;
  image?: string | null;
  created_at: string;
  is_primary: boolean
}

export interface Holding {
  id: string; // Added unique id
  name: string;
  totalQty: number;
  avgPrice: number;
  totalInvested: number;
  stoploss: number;
  trades: TradeEntry[];
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

export function transformHoldings(data: TradeEntry[]): Holding[] {
  const grouped = groupBy(data, 'name');

  return Object.keys(grouped).map((symbol, index) => {
    const trades = grouped[symbol];

    const totalQty = trades.reduce((acc, t) => acc + (t.quantity || 0), 0);
    const totalInvested = trades.reduce((acc, t) => acc + ((t.quantity || 0) * (t.entryprice || 0)), 0);
    const avgPrice = totalQty > 0 ? totalInvested / totalQty : 0;

    return {
      id: `${symbol}-${index}`, // unique id per holding
      name: symbol,
      totalQty,
      avgPrice,
      totalInvested,
      stoploss: trades[0]?.stoploss || 0,
      trades: trades.map(t => ({
        ...t,
        quantity: t.quantity || 0,
        entryprice: t.entryprice || 0,
        stoploss: t.stoploss || 0,
        trade_date: t.trade_date || new Date().toISOString()
      }))
    };
  });
}
