# 🇮🇳 India Tax Calculator — New Regime FY 2025–26

A clean, interactive React app to calculate your **required gross/CTC** for any desired monthly in-hand salary under India's New Tax Regime.

## Features

- Enter any monthly in-hand target — results update instantly
- Quick presets (₹1L → ₹3L/month)
- Full annual breakdown: gross CTC, standard deduction, income tax, cess
- Slab-wise tax visualization
- Effective tax rate + monthly tax deduction at a glance

## Tax Rules Applied

- **Standard Deduction**: ₹75,000
- **Section 87A Rebate**: Zero tax if taxable income ≤ ₹12L
- **Health & Education Cess**: 4% on income tax
- Slabs per Budget 2025–26

## Stack

React · Tailwind-free (inline styles) · No external dependencies

## Usage

```bash
# Drop into any React project
cp index.jsx src/components/
```

Then import and render `<TaxCalculator />`.

## Disclaimer

Assumes only the standard deduction. Does not account for EPF, professional tax, HRA, or other components. For reference only — consult a CA for financial decisions.
