import { useMemo, useState, type FormEvent } from "react";
import type { Warehouse } from "../types";

type AdjustmentStatus = "Awaiting review" | "Approved" | "Posted";
type DateFilter = "All dates" | "Today" | "Yesterday" | "11 Mar";

interface AdjustmentRecord {
  reference: string;
  details: string;
  warehouse: Warehouse;
  status: AdjustmentStatus;
  when: string;
  date: Exclude<DateFilter, "All dates">;
  units: number;
}

interface AdjustmentsProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
}

const initialAdjustments: AdjustmentRecord[] = [
  { reference: "ADJ-00049", details: "Cycle count · aisle C4", warehouse: "North Hub", status: "Posted", when: "Today · 09:40", date: "Today", units: -6 },
  { reference: "ADJ-00048", details: "Field notebook / 3-pack · damaged", warehouse: "East Cross-dock", status: "Awaiting review", when: "Today · 08:55", date: "Today", units: -4 },
  { reference: "ADJ-00047", details: "Pico USB-C dock · recount", warehouse: "South Annex", status: "Approved", when: "Yesterday · 16:12", date: "Yesterday", units: 12 },
  { reference: "ADJ-00046", details: "Cable clips / clay · stock found", warehouse: "North Hub", status: "Posted", when: "Yesterday · 14:30", date: "Yesterday", units: 8 },
  { reference: "ADJ-00045", details: "Nori wireless keyboard · cycle count", warehouse: "East Cross-dock", status: "Posted", when: "11 Mar · 11:05", date: "11 Mar", units: -2 },
];

const adjustmentStatuses: ("All statuses" | AdjustmentStatus)[] = ["All statuses", "Awaiting review", "Approved", "Posted"];
const adjustmentWarehouses: Warehouse[] = ["North Hub", "East Cross-dock", "South Annex"];

function AdjustmentIcon({ kind }: { kind: "calendar" | "close" | "dots" | "filter" | "pin" | "plus" | "search" | "sliders" }) {
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
    default: return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M10 16v4" /></svg>;
  }
}

export default function Adjustments({ search, onSearchChange, warehouse }: AdjustmentsProps) {
  const [records, setRecords] = useState(initialAdjustments);
  const [statusFilter, setStatusFilter] = useState<"All statuses" | AdjustmentStatus>("All statuses");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All dates");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdjustmentRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState({
    reference: "",
    details: "",
    warehouse: "North Hub" as Warehouse,
    units: -1,
    when: "",
  });

  const visibleAdjustments = useMemo(() => {
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

  function createAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = draft.reference.trim().toUpperCase();
    if (records.some((record) => record.reference.toLowerCase() === reference.toLowerCase())) {
      setFormError("An adjustment with that reference already exists.");
      return;
    }
    if (!draft.units) {
      setFormError("Adjustment units must be a non-zero number.");
      return;
    }
    const newAdjustment: AdjustmentRecord = {
      ...draft,
      reference,
      details: draft.details.trim(),
      status: "Awaiting review",
      when: draft.when.trim() || "Today · 12:00",
      date: "Today",
    };
    setRecords((current) => [newAdjustment, ...current]);
    setNotice(`${reference} was submitted for review.`);
    setDialogOpen(false);
    setFormError("");
    setDraft({ reference: "", details: "", warehouse: "North Hub", units: -1, when: "" });
  }

  function updateStatus(record: AdjustmentRecord, status: AdjustmentStatus) {
    setRecords((current) => current.map((item) => item.reference === record.reference ? { ...item, status } : item));
    setNotice(`${record.reference} was marked ${status.toLowerCase()}.`);
    setOpenMenu(null);
  }

  return (
    <section className="adjustments-page receipts-page" aria-labelledby="adjustments-title">
      <div className="adjustments-heading receipts-heading">
        <div>
          <span className="adjustments-eyebrow receipts-eyebrow">STOCK CORRECTIONS</span>
          <h1 id="adjustments-title"><AdjustmentIcon kind="sliders" /> Adjustments</h1>
          <p>Review count variances and keep the ledger accountable.</p>
        </div>
        <button className="adjustments-primary receipts-primary" type="button" onClick={() => { setFormError(""); setDialogOpen(true); }}>
          <AdjustmentIcon kind="plus" /> New adjustment
        </button>
      </div>

      {notice && <div className="adjustments-notice receipts-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><AdjustmentIcon kind="close" /></button></div>}

      <div className="adjustments-toolbar receipts-toolbar">
        <label className="adjustments-search receipts-search">
          <AdjustmentIcon kind="search" />
          <span className="sr-only">Search adjustments</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search adjustments" />
          {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><AdjustmentIcon kind="close" /></button>}
        </label>
        <label className="adjustments-select receipts-select">
          <AdjustmentIcon kind="filter" />
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            {adjustmentStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="adjustments-select adjustments-date-filter receipts-select receipts-date-filter">
          <AdjustmentIcon kind="calendar" />
          <span className="sr-only">Filter by date range</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="All dates">Date range</option><option>Today</option><option>Yesterday</option><option>11 Mar</option>
          </select>
        </label>
      </div>

      <section className="adjustments-panel receipts-panel" aria-label="Stock adjustment records">
        <div className="adjustments-panel-meta receipts-panel-meta"><span>{visibleAdjustments.length} {visibleAdjustments.length === 1 ? "record" : "records"}</span><span><i /> Live feed</span></div>
        <div className="adjustments-table-scroll receipts-table-scroll">
          <table className="adjustments-table receipts-table">
            <thead><tr><th>REFERENCE</th><th>DETAILS</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th>UNITS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleAdjustments.map((record) => (
                <tr key={record.reference}>
                  <td className="adjustments-reference receipts-reference">{record.reference}</td>
                  <td>{record.details}</td>
                  <td><span className="adjustments-location receipts-location"><AdjustmentIcon kind="pin" />{record.warehouse}</span></td>
                  <td><span className={`adjustments-status receipts-status adjustments-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}><i />{record.status}</span></td>
                  <td className="receipts-when">{record.when}</td>
                  <td className={`receipts-units${record.units < 0 ? " is-negative" : ""}`}>{record.units > 0 ? "+" : ""}{record.units}</td>
                  <td className="receipts-action-cell">
                    <button className="receipts-action" type="button" aria-label={`Actions for ${record.reference}`} aria-expanded={openMenu === record.reference} onClick={() => setOpenMenu((current) => current === record.reference ? null : record.reference)}><AdjustmentIcon kind="dots" /></button>
                    {openMenu === record.reference && <div className="receipts-row-menu">
                      <button type="button" onClick={() => { setDetailRecord(record); setOpenMenu(null); }}>View details</button>
                      {record.status === "Awaiting review" && <button type="button" onClick={() => updateStatus(record, "Approved")}>Approve</button>}
                      {record.status === "Approved" && <button type="button" onClick={() => updateStatus(record, "Posted")}>Post adjustment</button>}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleAdjustments.length === 0 && <div className="receipts-empty">No adjustments match these filters.<button type="button" onClick={() => { setStatusFilter("All statuses"); setDateFilter("All dates"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
      </section>

      {dialogOpen && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section className="receipts-modal" role="dialog" aria-modal="true" aria-labelledby="adjustments-modal-title">
            <header><div><span className="adjustments-eyebrow receipts-eyebrow">STOCK CORRECTIONS</span><h2 id="adjustments-modal-title">Record an adjustment</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close dialog"><AdjustmentIcon kind="close" /></button></header>
            {formError && <p className="receipts-form-error" role="alert">{formError}</p>}
            <form onSubmit={createAdjustment}>
              <label>Reference<input autoFocus required value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="e.g. ADJ-00050" /></label>
              <label>Reason or details<input required value={draft.details} onChange={(event) => setDraft((current) => ({ ...current, details: event.target.value }))} placeholder="e.g. Cycle count · aisle C4" /></label>
              <label>Warehouse<select value={draft.warehouse} onChange={(event) => setDraft((current) => ({ ...current, warehouse: event.target.value as Warehouse }))}>{adjustmentWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label>Counted at<input value={draft.when} onChange={(event) => setDraft((current) => ({ ...current, when: event.target.value }))} placeholder="Today · 12:00" /></label>
              <label>Unit adjustment<input type="number" required value={draft.units} onChange={(event) => setDraft((current) => ({ ...current, units: Number(event.target.value) }))} /></label>
              <footer><button className="receipts-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="receipts-primary" type="submit">Submit adjustment</button></footer>
            </form>
          </section>
        </div>
      )}

      {detailRecord && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <section className="receipts-modal receipts-details-modal" role="dialog" aria-modal="true" aria-labelledby="adjustments-details-title">
            <header><div><span className="adjustments-eyebrow receipts-eyebrow">ADJUSTMENT DETAILS</span><h2 id="adjustments-details-title">{detailRecord.reference}</h2></div><button type="button" onClick={() => setDetailRecord(null)} aria-label="Close dialog"><AdjustmentIcon kind="close" /></button></header>
            <dl><dt>Reason / details</dt><dd>{detailRecord.details}</dd><dt>Warehouse</dt><dd>{detailRecord.warehouse}</dd><dt>Status</dt><dd>{detailRecord.status}</dd><dt>When</dt><dd>{detailRecord.when}</dd><dt>Unit adjustment</dt><dd>{detailRecord.units > 0 ? "+" : ""}{detailRecord.units}</dd></dl>
            <footer><button className="receipts-secondary" type="button" onClick={() => setDetailRecord(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
