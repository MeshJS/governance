import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import SummaryCards from "@/treasury/SummaryCards";
import MonthlyTrendChart from "@/treasury/MonthlyTrendChart";
import TopWithdrawalsChart from "@/treasury/TopWithdrawalsChart";
import FiltersToolbar, { Filters } from "@/treasury/FiltersToolbar";
import WithdrawalsTable from "@/treasury/WithdrawalsTable";
import DetailsModal from "@/treasury/DetailsModal";
import { useState } from "react";
import type { WithdrawalRecord } from "@/contexts/DataContext";

export default function Treasury() {
    const { withdrawals, loading, error, lastUpdated } = useDataContext();
    const [filters, setFilters] = useState<Filters>({ sort: 'approval_date_desc' });
    const [selected, setSelected] = useState<WithdrawalRecord | null>(null);

    // Filtering logic will be implemented later
    const filtered = withdrawals;

    return (
        <div>
            <Head>
                <title>Treasury | Cardano Dashboard</title>
            </Head>
            <main>
                <h1>Treasury</h1>
                <div style={{ marginBottom: 16 }}>
                    Last updated: {lastUpdated ? lastUpdated.toLocaleString("en-ZA", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <SummaryCards withdrawals={withdrawals} loading={loading} />
                    <MonthlyTrendChart withdrawals={withdrawals} loading={loading} />
                    <TopWithdrawalsChart withdrawals={withdrawals} loading={loading} />
                </div>
                <FiltersToolbar onChange={setFilters} />
                <WithdrawalsTable withdrawals={filtered} loading={loading} error={error} onRowClick={setSelected} />
                <DetailsModal record={selected} onClose={() => setSelected(null)} />
            </main>
        </div>
    );
} 