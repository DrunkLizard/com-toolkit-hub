export type Partner = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  /** Plain site URL. */
  url: string;
  /** Set to your tracked affiliate / bounty link; the panel prefers it over `url`. */
  affiliateUrl?: string;
};

export type ToolId = 'profit' | 'fx' | 'expenses';

export const PARTNERS: Record<ToolId, Partner[]> = {
  profit: [
    { id: 'shopify', name: 'Shopify', category: 'Storefront', blurb: 'Launch and scale your store with built-in checkout.', url: 'https://www.shopify.com' },
    { id: 'triplewhale', name: 'Triple Whale', category: 'Ad attribution', blurb: 'See true blended ROAS across every ad channel.', url: 'https://www.triplewhale.com' },
    { id: 'klaviyo', name: 'Klaviyo', category: 'Email & SMS', blurb: 'Lift margin with owned-channel retention.', url: 'https://www.klaviyo.com' },
  ],
  fx: [
    { id: 'wise', name: 'Wise Business', category: 'Multi-currency banking', blurb: 'Receive and convert at the mid-market rate.', url: 'https://wise.com/business' },
    { id: 'payoneer', name: 'Payoneer', category: 'Cross-border payouts', blurb: 'Get paid by marketplaces and clients worldwide.', url: 'https://www.payoneer.com' },
    { id: 'taxjar', name: 'TaxJar', category: 'Sales tax automation', blurb: 'Automate VAT/GST collection and filing.', url: 'https://www.taxjar.com' },
  ],
  expenses: [
    { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', blurb: 'Turn overhead into books and tax-ready reports.', url: 'https://quickbooks.intuit.com' },
    { id: 'xero', name: 'Xero', category: 'Accounting', blurb: 'Bank feeds and reconciliation for small merchants.', url: 'https://www.xero.com' },
    { id: 'relay', name: 'Relay', category: 'Business banking', blurb: 'Separate accounts to track spend by category.', url: 'https://relayfi.com' },
  ],
};
