import { useMemo, useState } from "react";
import type { Warehouse } from "../types";

type MoveKind = "Receipt posted" | "Delivery picked" | "Cycle count adjusted" | "Transfer received";
type DateFilter = "All dates" | "Today" | "Yesterday";

interface Movement {
  reference: string;
  details: string;
  warehouse: Warehouse;
  status: MoveKind;
  when: string;
  date: Exclude<DateFilter, "All dates">;
  units: number;
}

interface MoveHistoryProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
}

const initialMovements: Movement[] = [
  { reference: "MOV-182", details: "Nori wireless keyboard · RCV-00412", warehouse: "North Hub", status: "Receipt posted", when: "12 min ago", date: "Today", units: 84 },
  { reference: "MOV-181", details: "Cedar & Finch · DO-00972", warehouse: "East Cross-dock", status: "Delivery picked", when: "34 min ago", date: "Today", units: -24 },
  { reference: "MOV-180", details: "Cable clips / clay · North Hub", warehouse: "North Hub", status: "Cycle count adjusted", when: "1 hr ago", date: "Today", units: -6 },
  { reference: "MOV-179", details: "Pico USB-C dock · East Cross-dock", warehouse: "East Cross-dock", status: "Transfer received", when: "2 hr ago", date: "Today", units: 18 },
];

const moveStatuses: ("All statuses" | MoveKind)[] = [
  "All statuses", "Receipt posted", "Delivery picked", "Cycle count adjusted", "Transfer received",
];

function HistoryIcon({ kind }: { kind: "calendar" | "close" | "dots" | "filter" | "history" | "pin" | "plus" | "search" }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (kind) {
    case "calendar": return <svg {...props}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
    case "close": return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "dots": return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
    case "filter": return <svg {...props}><path d="M4 5h16l-6.5 7.5v5L10.5 19v-6.5L4 5Z" /></svg>;
    case "pin": return <svg {...props}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case "search": return <svg {...props}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    default: return <svg {...props}><path d="M3.5 11a8.5 8.5 0 1 1 .8 4.3M3.5 4.5v6h6M12 7v5l3.5 2" /></svg>;
  }
}

export default function MoveHistory({ search, onSearchChange, warehouse }: MoveHistoryProps) {
  const records = initialMovements;
  const [statusFilter, setStatusFilter] = useState<"All statuses" | MoveKind>("All statuses");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All dates");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<Movement | null>(null);
  const [notice, setNotice] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const visibleMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesWarehouse = warehouse === "All warehouses" || record.warehouse === warehouse;
      const matchesStatus = statusFilter === "All statuses" || record.status === statusFilter;
      const matchesDate = dateFilter === "All dates" || record.date === dateFilter;
      const matchesSearch = !query || [record.reference, record.details, record.warehouse, record.status]
        .some((value) => value.toLowerCase().includes(query));
      return matchesWarehouse && matchesStatus && matchesDate && matchesSearch;
    });
  }, [dateFilter, records, search, statusFilter, warehouse]);

  function exportHistory() {
    const headings = ["Reference", "Details", "Warehouse", "Status", "When", "Units"];
    const csv = [
      headings,
      ...visibleMovements.map((record) => [
        record.reference, record.details, record.warehouse, record.status, record.when, String(record.units),
      ]),
    ].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stocksense-move-history.csv";
    link.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    setNotice(`${visibleMovements.length} movement records exported.`);
  }

  return (
    <section className="move-history-page receipts-page" aria-labelledby="move-history-title">
      <div className="move-history-heading receipts-heading">
        <div>
          <span className="move-history-eyebrow receipts-eyebrow">AUDIT TRAIL</span>
          <h1 id="move-history-title"><HistoryIcon kind="history" /> Move history</h1>
          <p>A chronological ledger of every unit entering, leaving, or moving.</p>
        </div>
        <button className="move-history-primary receipts-primary" type="button" onClick={() => setExportDialogOpen(true)}>
          <HistoryIcon kind="plus" /> Export history
        </button>
      </div>

      {notice && <div className="move-history-notice receipts-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><HistoryIcon kind="close" /></button></div>}

      <div className="move-history-toolbar receipts-toolbar">
        <label className="move-history-search receipts-search">
          <HistoryIcon kind="search" />
          <span className="sr-only">Search move history</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search move history" />
          {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><HistoryIcon kind="close" /></button>}
        </label>
        <label className="move-history-select receipts-select">
          <HistoryIcon kind="filter" />
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            {moveStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="move-history-select move-history-date-filter receipts-select receipts-date-filter">
          <HistoryIcon kind="calendar" />
          <span className="sr-only">Filter by date range</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="All dates">Date range</option><option>Today</option><option>Yesterday</option>
          </select>
        </label>
      </div>

      <section className="move-history-panel receipts-panel" aria-label="Inventory movement ledger">
        <div className="move-history-panel-meta receipts-panel-meta"><span>{visibleMovements.length} {visibleMovements.length === 1 ? "record" : "records"}</span><span><i /> Live feed</span></div>
        <div className="move-history-table-scroll receipts-table-scroll">
          <table className="move-history-table receipts-table">
            <thead><tr><th>REFERENCE</th><th>DETAILS</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th>UNITS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleMovements.map((record) => (
                <tr key={record.reference}>
                  <td className="move-history-reference receipts-reference">{record.reference}</td>
                  <td>{record.details}</td>
                  <td><span className="move-history-location receipts-location"><HistoryIcon kind="pin" />{record.warehouse}</span></td>
                  <td><span className="move-history-status receipts-status"><i />{record.status}</span></td>
                  <td className="receipts-when">{record.when}</td>
                  <td className={`receipts-units${record.units < 0 ? " is-negative" : ""}`}>{record.units > 0 ? "+" : ""}{record.units}</td>
                  <td className="receipts-action-cell">
                    <button className="receipts-action" type="button" aria-label={`Actions for ${record.reference}`} aria-expanded={openMenu === record.reference} onClick={() => setOpenMenu((current) => current === record.reference ? null : record.reference)}><HistoryIcon kind="dots" /></button>
                    {openMenu === record.reference && <div className="receipts-row-menu">
                      <button type="button" onClick={() => { setDetailRecord(record); setOpenMenu(null); }}>View details</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleMovements.length === 0 && <div className="receipts-empty">No movements match these filters.<button type="button" onClick={() => { setStatusFilter("All statuses"); setDateFilter("All dates"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
      </section>

      {exportDialogOpen && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportDialogOpen(false); }}>
          <section className="receipts-modal move-history-export-modal" role="dialog" aria-modal="true" aria-labelledby="move-history-export-title">
            <header><div><span className="move-history-eyebrow receipts-eyebrow">AUDIT TRAIL</span><h2 id="move-history-export-title">Export move history</h2></div><button type="button" onClick={() => setExportDialogOpen(false)} aria-label="Close dialog"><HistoryIcon kind="close" /></button></header>
            <p>Export the {visibleMovements.length} records currently shown, including applied filters.</p>
            <footer><button className="receipts-secondary" type="button" onClick={() => setExportDialogOpen(false)}>Cancel</button><button className="receipts-primary" type="button" onClick={exportHistory}>Download CSV</button></footer>
          </section>
        </div>
      )}

      {detailRecord && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <section className="receipts-modal receipts-details-modal" role="dialog" aria-modal="true" aria-labelledby="move-history-details-title">
            <header><div><span className="move-history-eyebrow receipts-eyebrow">MOVEMENT DETAILS</span><h2 id="move-history-details-title">{detailRecord.reference}</h2></div><button type="button" onClick={() => setDetailRecord(null)} aria-label="Close dialog"><HistoryIcon kind="close" /></button></header>
            <dl><dt>Details</dt><dd>{detailRecord.details}</dd><dt>Warehouse</dt><dd>{detailRecord.warehouse}</dd><dt>Movement</dt><dd>{detailRecord.status}</dd><dt>When</dt><dd>{detailRecord.when}</dd><dt>Units</dt><dd>{detailRecord.units > 0 ? "+" : ""}{detailRecord.units}</dd></dl>
            <footer><button className="receipts-secondary" type="button" onClick={() => setDetailRecord(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
