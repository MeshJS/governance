# Mesh Governance Dashboard

A comprehensive Next.js dashboard that provides transparency into Mesh's governance activities by visualizing data from multiple sources including Project Catalyst proposals, DRep voting decisions, and Mesh SDK usage statistics.

## 🎯 Purpose

This dashboard serves as a central hub for tracking and visualizing:

- Project Catalyst proposal funding and milestone completion status
- DRep voting decisions with detailed rationales
- Mesh SDK usage metrics and GitHub contributor statistics

The data is automatically refreshed weekly through Incremental Static Regeneration (ISR), pulling from GitHub-hosted JSON files.

## 🔍 Key Features

- **Catalyst Proposals**: Track funded proposals, budget distribution, and milestone progress
- **DRep Voting**: View voting history, rationales, and epoch information
- **Mesh Stats**: Monitor SDK usage trends, GitHub contributions, and dependency statistics
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: CSS Modules
- **Data Visualization**: Recharts/Chart.js
- **Tables**: React Table
- **Deployment**: Vercel/Netlify
- **Data Source**: GitHub-hosted JSON files

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
