import { useMemo, useState, type FormEvent } from "react";
import type { Warehouse } from "../types";

type ReceiptStatus = "Awaiting dock" | "Picking" | "Scheduled" | "In transit" | "Posted";
type DateFilter = "All dates" | "Today" | "Tomorrow" | "Yesterday";

interface ReceiptRecord {
  reference: string;
  details: string;
  warehouse: Warehouse;
  status: ReceiptStatus;
  when: string;
  date: Exclude<DateFilter, "All dates">;
  units: number;
}

interface ReceiptsProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
}

const initialReceipts: ReceiptRecord[] = [
  { reference: "RCV-00418", details: "Paper & Form Co.", warehouse: "North Hub", status: "Awaiting dock", when: "Today · 09:40", date: "Today", units: 240 },
  { reference: "DO-00972", details: "Cedar & Finch", warehouse: "East Cross-dock", status: "Picking", when: "Today · 08:55", date: "Today", units: 84 },
  { reference: "TRF-00186", details: "North Hub → South Annex", warehouse: "North Hub", status: "Scheduled", when: "Tomorrow · 13:00", date: "Tomorrow", units: 62 },
  { reference: "RCV-00415", details: "Formwell Manufacturing", warehouse: "South Annex", status: "In transit", when: "Tomorrow · 15:20", date: "Tomorrow", units: 128 },
  { reference: "ADJ-00049", details: "Cycle count · aisle C4", warehouse: "North Hub", status: "Posted", when: "Yesterday · 16:12", date: "Yesterday", units: -6 },
];

const statuses: ("All statuses" | ReceiptStatus)[] = [
  "All statuses", "Awaiting dock", "Picking", "Scheduled", "In transit", "Posted",
];
const receiptWarehouses: Warehouse[] = ["North Hub", "East Cross-dock", "South Annex"];

function ReceiptIcon({ kind }: { kind: "arrow" | "calendar" | "close" | "dots" | "filter" | "pin" | "plus" | "search" | "warehouse" }) {
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
    case "arrow": return <svg {...props}><path d="M12 4v15m-7-7 7 7 7-7" /></svg>;
    case "calendar": return <svg {...props}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
    case "close": return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "dots": return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
    case "filter": return <svg {...props}><path d="M4 5h16l-6.5 7.5v5L10.5 19v-6.5L4 5Z" /></svg>;
    case "pin": return <svg {...props}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case "search": return <svg {...props}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    default: return <svg {...props}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M8 8h8M8 14h8M8 17h4" /></svg>;
  }
}

export default function Receipts({ search, onSearchChange, warehouse }: ReceiptsProps) {
  const [records, setRecords] = useState(initialReceipts);
  const [statusFilter, setStatusFilter] = useState<"All statuses" | ReceiptStatus>("All statuses");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All dates");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ReceiptRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState({
    reference: "",
    details: "",
    warehouse: "North Hub" as Warehouse,
    units: 1,
    when: "",
  });

  const visibleRecords = useMemo(() => {
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

  function createReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = draft.reference.trim().toUpperCase();
    if (records.some((record) => record.reference.toLowerCase() === reference.toLowerCase())) {
      setFormError("A record with that reference already exists.");
      return;
    }
    const date = "Today";
    const newReceipt: ReceiptRecord = {
      ...draft,
      reference,
      details: draft.details.trim(),
      status: "Awaiting dock",
      date,
      when: draft.when.trim() || "Today · 12:00",
    };
    setRecords((current) => [newReceipt, ...current]);
    setNotice(`${reference} was added to the receipts queue.`);
    setDialogOpen(false);
    setFormError("");
    setDraft({ reference: "", details: "", warehouse: "North Hub", units: 1, when: "" });
  }

  function markPosted(record: ReceiptRecord) {
    setRecords((current) => current.map((item) => item.reference === record.reference
      ? { ...item, status: "Posted" }
      : item));
    setNotice(`${record.reference} was marked as posted.`);
    setOpenMenu(null);
  }

  return (
    <section className="receipts-page" aria-labelledby="receipts-title">
      <div className="receipts-heading">
        <div>
          <span className="receipts-eyebrow">INBOUND FLOW</span>
          <h1 id="receipts-title"><ReceiptIcon kind="arrow" /> Receipts</h1>
          <p>Track arriving stock from purchase order to putaway.</p>
        </div>
        <button className="receipts-primary" type="button" onClick={() => { setFormError(""); setDialogOpen(true); }}>
          <ReceiptIcon kind="plus" /> New receipt
        </button>
      </div>

      {notice && <div className="receipts-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><ReceiptIcon kind="close" /></button></div>}

      <div className="receipts-toolbar">
        <label className="receipts-search">
          <ReceiptIcon kind="search" />
          <span className="sr-only">Search receipts</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search receipts" />
          {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><ReceiptIcon kind="close" /></button>}
        </label>
        <label className="receipts-select receipts-status-filter">
          <ReceiptIcon kind="filter" />
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="receipts-select receipts-date-filter">
          <ReceiptIcon kind="calendar" />
          <span className="sr-only">Filter by date range</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="All dates">Date range</option><option>Today</option><option>Tomorrow</option><option>Yesterday</option>
          </select>
        </label>
      </div>

      <section className="receipts-panel" aria-label="Receipt records">
        <div className="receipts-panel-meta"><span>{visibleRecords.length} {visibleRecords.length === 1 ? "record" : "records"}</span><span><i /> Live feed</span></div>
        <div className="receipts-table-scroll">
          <table className="receipts-table">
            <thead><tr><th>REFERENCE</th><th>DETAILS</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th>UNITS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.reference}>
                  <td className="receipts-reference">{record.reference}</td>
                  <td>{record.details}</td>
                  <td><span className="receipts-location"><ReceiptIcon kind="pin" />{record.warehouse}</span></td>
                  <td><span className={`receipts-status receipts-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}><i />{record.status}</span></td>
                  <td className="receipts-when">{record.when}</td>
                  <td className={`receipts-units${record.units < 0 ? " is-negative" : ""}`}>{record.units > 0 ? "+" : ""}{record.units}</td>
                  <td className="receipts-action-cell">
                    <button className="receipts-action" type="button" aria-label={`Actions for ${record.reference}`} aria-expanded={openMenu === record.reference} onClick={() => setOpenMenu((current) => current === record.reference ? null : record.reference)}><ReceiptIcon kind="dots" /></button>
                    {openMenu === record.reference && <div className="receipts-row-menu">
                      <button type="button" onClick={() => { setDetailRecord(record); setOpenMenu(null); }}>View details</button>
                      {record.status !== "Posted" && <button type="button" onClick={() => markPosted(record)}>Mark as posted</button>}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRecords.length === 0 && <div className="receipts-empty">No receipts match these filters.<button type="button" onClick={() => { setStatusFilter("All statuses"); setDateFilter("All dates"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
      </section>

      {dialogOpen && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section className="receipts-modal" role="dialog" aria-modal="true" aria-labelledby="receipts-modal-title">
            <header><div><span className="receipts-eyebrow">INBOUND FLOW</span><h2 id="receipts-modal-title">Create a receipt</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close dialog"><ReceiptIcon kind="close" /></button></header>
            {formError && <p className="receipts-form-error" role="alert">{formError}</p>}
            <form onSubmit={createReceipt}>
              <label>Reference<input autoFocus required value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="e.g. RCV-00419" /></label>
              <label>Supplier or details<input required value={draft.details} onChange={(event) => setDraft((current) => ({ ...current, details: event.target.value }))} placeholder="e.g. Paper & Form Co." /></label>
              <label>Warehouse<select value={draft.warehouse} onChange={(event) => setDraft((current) => ({ ...current, warehouse: event.target.value as Warehouse }))}>{receiptWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label>Expected time<input value={draft.when} onChange={(event) => setDraft((current) => ({ ...current, when: event.target.value }))} placeholder="Today · 12:00" /></label>
              <label>Units<input type="number" min="1" required value={draft.units} onChange={(event) => setDraft((current) => ({ ...current, units: Number(event.target.value) }))} /></label>
              <footer><button className="receipts-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="receipts-primary" type="submit">Create receipt</button></footer>
            </form>
          </section>
        </div>
      )}

      {detailRecord && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <section className="receipts-modal receipts-details-modal" role="dialog" aria-modal="true" aria-labelledby="receipts-details-title">
            <header><div><span className="receipts-eyebrow">RECEIPT DETAILS</span><h2 id="receipts-details-title">{detailRecord.reference}</h2></div><button type="button" onClick={() => setDetailRecord(null)} aria-label="Close dialog"><ReceiptIcon kind="close" /></button></header>
            <dl><dt>Supplier / details</dt><dd>{detailRecord.details}</dd><dt>Warehouse</dt><dd>{detailRecord.warehouse}</dd><dt>Status</dt><dd>{detailRecord.status}</dd><dt>When</dt><dd>{detailRecord.when}</dd><dt>Units</dt><dd>{detailRecord.units > 0 ? "+" : ""}{detailRecord.units}</dd></dl>
            <footer><button className="receipts-secondary" type="button" onClick={() => setDetailRecord(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
