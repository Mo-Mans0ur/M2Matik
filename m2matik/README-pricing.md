# Pricing data pipeline

- Source: `public/data/priser-til-beregning.xlsx`
- Generator: `scripts/generate-prices.cjs`
- Output: `public/data/priser.json` with shape `{ base, extras }`

## Usage

- Generate JSON after updating the Excel sheet:
- npm run prices:generate

## Calculations

- baseTotal = startpris + (m2pris _ areaM2 _ factor)
- factor: lav=faktorLav, normal=1, høj=faktorHøj
- extrasTotal = sum(fixed | per_m2\*areaM2) for picked add-ons
- total = baseTotal + extrasTotal

## Business rules

- Høje paneler and Stuk are independent lines with their own area/quality. They do not depend on the painting percentage.

## Testing

- Run unit tests:
- npm test
