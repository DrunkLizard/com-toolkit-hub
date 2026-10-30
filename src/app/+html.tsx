import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE = 'https://ecomstack.online';

const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/profit#app`,
  name: 'Shopify Profit Calculator',
  alternateName: 'EcomStack Profit Calculator',
  url: `${SITE}/profit`,
  description:
    'Free Shopify profit calculator. Enter price, COGS, shipping, payment gateway fees and ad spend to get net profit, net margin, break-even ROAS and target CPA instantly.',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'E-commerce profit calculator',
  operatingSystem: 'Web, iOS, Android',
  browserRequirements: 'Requires JavaScript',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    'Net profit and net margin calculation',
    'Break-even ROAS calculation',
    'Target CPA calculation',
    'Payment gateway fee modelling (percentage + fixed fee)',
    'Shipping charged vs. shipping cost',
    'Units sold or clicks-times-conversion volume modes',
    'Saved product presets stored on your device',
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'Shopify merchants, dropshippers and e-commerce marketers',
  },
  publisher: {
    '@type': 'Organization',
    name: 'EcomStack',
    url: SITE,
  },
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
