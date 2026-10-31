import { Card, Hint, Row, Stat } from '@/components/ui';
import { landedCost } from '@/components/charts/chartEngines';
import { useToolkit } from '@/components/ToolkitContext';
import { fmtMoney, parseNum } from '@/engines/fx';

/** Landed-cost and seller-payout cards. Rendered inline on mobile, in the side column on desktop. */
export function FxResultsCards() {
  const fx = useToolkit().fx;
  const { market, home, result: r } = fx;
  const local = market.currency;
  const landed = landedCost({
    basePrice: parseNum(fx.price),
    rate: parseNum(fx.rateStr),
    spreadPct: parseNum(fx.spread),
    tariffPct: parseNum(fx.tariff),
    vatPct: parseNum(fx.taxStr),
  });

  return (
    <>
      <Card title="Landed cost (importer's total cost)">
        <Hint>
          What goods cost once imported: FX spread, customs duty and {market.taxLabel} on top of the converted price. Not the
          checkout price.
        </Hint>
        <Row>
          <Stat label="FX conversion loss" value={fmtMoney(landed.fxLoss, local)} tone="bad" />
          <Stat label="Customs / duties" value={fmtMoney(landed.duties, local)} tone="bad" />
          <Stat label={`Landed cost (${local})`} value={fmtMoney(landed.total, local)} tone="good" hint="Base × rate, + FX loss, + tariff, + tax" />
        </Row>
      </Card>

      <Card title="You receive (seller payout)">
        <Hint>Here the FX spread and payment fee are costs to you, deducted from your payout.</Hint>
        <Row>
          <Stat label="FX spread cost" value={fmtMoney(r.spreadCost, local)} tone="bad" />
          <Stat label="Payment fee" value={fmtMoney(r.feeCost, local)} tone="bad" />
          <Stat label={`Payout (${local})`} value={fmtMoney(r.payoutLocal, local)} />
          <Stat label={`Payout (${home})`} value={fmtMoney(r.payoutHome, home)} tone="good" hint="Excludes tax, which you remit" />
        </Row>
      </Card>
    </>
  );
}
