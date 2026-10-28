import { useEffect, useMemo, useState } from 'react';
import {
  Currency,
  MARKETS,
  LiveRates,
  calculateFx,
  estimateRate,
  fetchLiveRates,
  loadCachedRates,
  parseNum,
} from './fx';

export type RateSource = 'manual' | 'live' | 'cached' | 'estimate';
export type RefreshState = 'idle' | 'loading' | 'error';

export function useFxConverter() {
  const [home, setHomeState] = useState<Currency>('USD');
  const [marketId, setMarketId] = useState('EU');
  const [price, setPrice] = useState('49.99');
  const [spread, setSpread] = useState('1.5');
  const [fee, setFee] = useState('2.9');
  const [taxOverride, setTaxOverride] = useState<string | null>(null);
  const [manualRate, setManualRate] = useState<string | null>(null);
  const [stored, setStored] = useState<{ live: LiveRates; fresh: boolean } | null>(null);
  const [outcome, setOutcome] = useState<{ base: string; ok: boolean } | null>(null);

  const market = MARKETS.find((m) => m.id === marketId) ?? MARKETS[0];

  const [reloadTick, setReloadTick] = useState(0);

  // Show the cached table instantly, then try to replace it with live data.
  useEffect(() => {
    let dead = false;
    loadCachedRates(home).then((cached) => {
      if (!dead && cached) setStored((cur) => (cur?.live.base === home ? cur : { live: cached, fresh: false }));
    });
    fetchLiveRates(home)
      .then((live) => {
        if (dead) return;
        setStored({ live, fresh: true });
        setOutcome({ base: home, ok: true });
      })
      .catch(() => {
        if (!dead) setOutcome({ base: home, ok: false });
      });
    return () => {
      dead = true;
    };
  }, [home, reloadTick]);

  // Rates fetched for a previously selected base currency are ignored.
  const refresh: RefreshState = outcome?.base !== home ? 'loading' : outcome.ok ? 'idle' : 'error';
  const current = stored?.live.base === home ? stored : null;
  const liveRate = current?.live.rates[market.currency];
  const sameCurrency = home === market.currency;
  let rateSource: RateSource = 'estimate';
  let rateStr: string;
  if (sameCurrency) {
    rateStr = '1';
    rateSource = 'live';
  } else if (manualRate !== null) {
    rateStr = manualRate;
    rateSource = 'manual';
  } else if (liveRate) {
    rateStr = String(Number(liveRate.toPrecision(6)));
    rateSource = current?.fresh ? 'live' : 'cached';
  } else {
    rateStr = String(estimateRate(home, market.currency));
  }
  const taxStr = taxOverride ?? String(market.tax);

  const result = useMemo(
    () =>
      calculateFx({
        price: parseNum(price),
        rate: parseNum(rateStr),
        spreadPct: parseNum(spread),
        taxPct: parseNum(taxStr),
        feePct: parseNum(fee),
      }),
    [price, rateStr, spread, taxStr, fee],
  );

  return {
    home,
    setHome: (c: Currency) => {
      setHomeState(c);
      setManualRate(null);
    },
    market,
    setMarket: (id: string) => {
      setMarketId(id);
      setManualRate(null);
      setTaxOverride(null);
    },
    price,
    setPrice,
    spread,
    setSpread,
    fee,
    setFee,
    taxStr,
    setTax: setTaxOverride,
    rateStr,
    rateSource,
    setRate: setManualRate,
    useAutoRate: () => setManualRate(null),
    fetchedAt: current?.live.fetchedAt ?? null,
    refresh,
    reload: () => {
      setOutcome(null);
      setReloadTick((t) => t + 1);
    },
    result,
  };
}
