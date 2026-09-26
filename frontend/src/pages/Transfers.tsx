import { useMemo, useState, type FormEvent } from "react";
import type { Warehouse } from "../types";

type TransferStatus = "Scheduled" | "In transit" | "Received";
type DateFilter = "All dates" | "13 Mar" | "12 Mar" | "11 Mar";

interface TransferRecord {
  reference: string;
  details: string;
  source: Warehouse;
  destination: Warehouse;
  status: TransferStatus;
  when: string;
  date: Exclude<DateFilter, "All dates">;
  units: number;
}

interface TransfersProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
}

const initialTransfers: TransferRecord[] = [
  { reference: "TRF-00186", details: "Pico USB-C dock · 62 units", source: "North Hub", destination: "South Annex", status: "Scheduled", when: "13 Mar, 18:30", date: "13 Mar", units: 62 },
  { reference: "TRF-00185", details: "Field notebook / 3-pack · 36 units", source: "East Cross-dock", destination: "North Hub", status: "In transit", when: "12 Mar, 17:00", date: "12 Mar", units: 36 },
  { reference: "TRF-00184", details: "Nori wireless keyboard · 18 units", source: "South Annex", destination: "East Cross-dock", status: "Received", when: "11 Mar, 14:45", date: "11 Mar", units: 18 },
];

const transferStatuses: ("All statuses" | TransferStatus)[] = ["All statuses", "Scheduled", "In transit", "Received"];
const transferWarehouses: Warehouse[] = ["North Hub", "East Cross-dock", "South Annex"];

function TransferIcon({ kind }: { kind: "calendar" | "close" | "dots" | "filter" | "pin" | "plus" | "search" | "transfer" }) {
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
    default: return <svg {...props}><path d="M4 8h15l-3-3M20 16H5l3 3M19 8V5M5 16v3" /></svg>;
  }
}

export default function Transfers({ search, onSearchChange, warehouse }: TransfersProps) {
  const [records, setRecords] = useState(initialTransfers);
  const [statusFilter, setStatusFilter] = useState<"All statuses" | TransferStatus>("All statuses");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All dates");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TransferRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState({
    reference: "",
    details: "",
    source: "North Hub" as Warehouse,
    destination: "South Annex" as Warehouse,
    units: 1,
    when: "",
  });

  const visibleTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesWarehouse = warehouse === "All warehouses" || record.source === warehouse || record.destination === warehouse;
      const matchesStatus = statusFilter === "All statuses" || record.status === statusFilter;
      const matchesDate = dateFilter === "All dates" || record.date === dateFilter;
      const matchesSearch = !query || [
        record.reference, record.details, record.source, record.destination, record.status,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesWarehouse && matchesStatus && matchesDate && matchesSearch;
    });
  }, [dateFilter, records, search, statusFilter, warehouse]);

  function createTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = draft.reference.trim().toUpperCase();
    if (records.some((record) => record.reference.toLowerCase() === reference.toLowerCase())) {
      setFormError("A transfer with that reference already exists.");
      return;
    }
    if (draft.source === draft.destination) {
      setFormError("Choose two different warehouses for the transfer.");
      return;
    }
    const newTransfer: TransferRecord = {
      ...draft,
      reference,
      details: `${draft.details.trim()} · ${draft.units} units`,
      status: "Scheduled",
      when: draft.when.trim() || "13 Mar, 18:30",
      date: "13 Mar",
    };
    setRecords((current) => [newTransfer, ...current]);
    setNotice(`${reference} was added to the transfer schedule.`);
    setDialogOpen(false);
    setFormError("");
    setDraft({ reference: "", details: "", source: "North Hub", destination: "South Annex", units: 1, when: "" });
  }

  function updateStatus(record: TransferRecord, status: TransferStatus) {
    setRecords((current) => current.map((item) => item.reference === record.reference ? { ...item, status } : item));
    setNotice(`${record.reference} was marked ${status.toLowerCase()}.`);
    setOpenMenu(null);
  }

  return (
    <section className="transfers-page receipts-page" aria-labelledby="transfers-title">
      <div className="transfers-heading receipts-heading">
        <div>
          <span className="transfers-eyebrow receipts-eyebrow">NETWORK MOVES</span>
          <h1 id="transfers-title"><TransferIcon kind="transfer" /> Transfers</h1>
          <p>Schedule stock between warehouses before the next demand spike.</p>
        </div>
        <button className="transfers-primary receipts-primary" type="button" onClick={() => { setFormError(""); setDialogOpen(true); }}>
          <TransferIcon kind="plus" /> Schedule transfer
        </button>
      </div>

      {notice && <div className="transfers-notice receipts-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><TransferIcon kind="close" /></button></div>}

      <div className="transfers-toolbar receipts-toolbar">
        <label className="transfers-search receipts-search">
          <TransferIcon kind="search" />
          <span className="sr-only">Search transfers</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search transfers" />
          {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><TransferIcon kind="close" /></button>}
        </label>
        <label className="transfers-select receipts-select">
          <TransferIcon kind="filter" />
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            {transferStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="transfers-select transfers-date-filter receipts-select receipts-date-filter">
          <TransferIcon kind="calendar" />
          <span className="sr-only">Filter by date range</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="All dates">Date range</option><option>13 Mar</option><option>12 Mar</option><option>11 Mar</option>
          </select>
        </label>
      </div>

      <section className="transfers-panel receipts-panel" aria-label="Transfer schedule">
        <div className="transfers-panel-meta receipts-panel-meta"><span>{visibleTransfers.length} {visibleTransfers.length === 1 ? "record" : "records"}</span><span><i /> API schedule</span></div>
        <div className="transfers-table-scroll receipts-table-scroll">
          <table className="transfers-table receipts-table">
            <thead><tr><th>REFERENCE</th><th>DETAILS</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th>UNITS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleTransfers.map((record) => (
                <tr key={record.reference}>
                  <td className="transfers-reference receipts-reference">{record.reference}</td>
                  <td>{record.details}</td>
                  <td><span className="transfers-location receipts-location"><TransferIcon kind="pin" />{record.source} → {record.destination}</span></td>
                  <td><span className={`transfers-status receipts-status transfers-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}><i />{record.status}</span></td>
                  <td className="receipts-when">{record.when}</td>
                  <td className="receipts-units">+{record.units}</td>
                  <td className="receipts-action-cell">
                    <button className="receipts-action" type="button" aria-label={`Actions for ${record.reference}`} aria-expanded={openMenu === record.reference} onClick={() => setOpenMenu((current) => current === record.reference ? null : record.reference)}><TransferIcon kind="dots" /></button>
                    {openMenu === record.reference && <div className="receipts-row-menu">
                      <button type="button" onClick={() => { setDetailRecord(record); setOpenMenu(null); }}>View details</button>
                      {record.status === "Scheduled" && <button type="button" onClick={() => updateStatus(record, "In transit")}>Mark in transit</button>}
                      {record.status === "In transit" && <button type="button" onClick={() => updateStatus(record, "Received")}>Mark received</button>}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleTransfers.length === 0 && <div className="receipts-empty">No transfers match these filters.<button type="button" onClick={() => { setStatusFilter("All statuses"); setDateFilter("All dates"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
      </section>

      {dialogOpen && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section className="receipts-modal" role="dialog" aria-modal="true" aria-labelledby="transfers-modal-title">
            <header><div><span className="transfers-eyebrow receipts-eyebrow">NETWORK MOVES</span><h2 id="transfers-modal-title">Schedule a transfer</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close dialog"><TransferIcon kind="close" /></button></header>
            {formError && <p className="receipts-form-error" role="alert">{formError}</p>}
            <form onSubmit={createTransfer}>
              <label>Reference<input autoFocus required value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="e.g. TRF-00187" /></label>
              <label>Product or details<input required value={draft.details} onChange={(event) => setDraft((current) => ({ ...current, details: event.target.value }))} placeholder="e.g. Pico USB-C dock" /></label>
              <label>From warehouse<select value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value as Warehouse }))}>{transferWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label>To warehouse<select value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value as Warehouse }))}>{transferWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label>Scheduled time<input value={draft.when} onChange={(event) => setDraft((current) => ({ ...current, when: event.target.value }))} placeholder="13 Mar, 18:30" /></label>
              <label>Units<input type="number" min="1" required value={draft.units} onChange={(event) => setDraft((current) => ({ ...current, units: Number(event.target.value) }))} /></label>
              <footer><button className="receipts-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="receipts-primary" type="submit">Schedule transfer</button></footer>
            </form>
          </section>
        </div>
      )}

      {detailRecord && (
        <div className="receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <section className="receipts-modal receipts-details-modal" role="dialog" aria-modal="true" aria-labelledby="transfers-details-title">
            <header><div><span className="transfers-eyebrow receipts-eyebrow">TRANSFER DETAILS</span><h2 id="transfers-details-title">{detailRecord.reference}</h2></div><button type="button" onClick={() => setDetailRecord(null)} aria-label="Close dialog"><TransferIcon kind="close" /></button></header>
            <dl><dt>Product / details</dt><dd>{detailRecord.details}</dd><dt>From warehouse</dt><dd>{detailRecord.source}</dd><dt>To warehouse</dt><dd>{detailRecord.destination}</dd><dt>Status</dt><dd>{detailRecord.status}</dd><dt>When</dt><dd>{detailRecord.when}</dd><dt>Units</dt><dd>+{detailRecord.units}</dd></dl>
            <footer><button className="receipts-secondary" type="button" onClick={() => setDetailRecord(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
