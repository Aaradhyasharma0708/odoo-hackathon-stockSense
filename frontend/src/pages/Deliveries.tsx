<<<<<<< HEAD
import { useMemo, useState, type FormEvent } from "react";
import type { Warehouse } from "../types";

type DeliveryStatus = "Awaiting dock" | "Picking" | "Scheduled" | "In transit" | "Posted";
type DateFilter = "All dates" | "Today" | "Tomorrow" | "Yesterday";

interface DeliveryRecord {
  reference: string;
  details: string;
  warehouse: Warehouse;
  status: DeliveryStatus;
  when: string;
  date: Exclude<DateFilter, "All dates">;
  units: number;
}

interface DeliveriesProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
}

const initialDeliveries: DeliveryRecord[] = [
  { reference: "RCV-00418", details: "Paper & Form Co.", warehouse: "North Hub", status: "Awaiting dock", when: "Today · 09:40", date: "Today", units: 240 },
  { reference: "DO-00972", details: "Cedar & Finch", warehouse: "East Cross-dock", status: "Picking", when: "Today · 08:55", date: "Today", units: 84 },
  { reference: "TRF-00186", details: "North Hub → South Annex", warehouse: "North Hub", status: "Scheduled", when: "Tomorrow · 13:00", date: "Tomorrow", units: 62 },
  { reference: "RCV-00415", details: "Formwell Manufacturing", warehouse: "South Annex", status: "In transit", when: "Tomorrow · 15:20", date: "Tomorrow", units: 128 },
  { reference: "ADJ-00049", details: "Cycle count · aisle C4", warehouse: "North Hub", status: "Posted", when: "Yesterday · 16:12", date: "Yesterday", units: -6 },
];

const statuses: ("All statuses" | DeliveryStatus)[] = [
  "All statuses", "Awaiting dock", "Picking", "Scheduled", "In transit", "Posted",
];
const deliveryWarehouses: Warehouse[] = ["North Hub", "East Cross-dock", "South Annex"];

function DeliveryIcon({ kind }: { kind: "calendar" | "close" | "dots" | "filter" | "pin" | "plus" | "search" | "truck" }) {
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
    default: return <svg {...props}><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></svg>;
  }
}

export default function Deliveries({ search, onSearchChange, warehouse }: DeliveriesProps) {
  const [records, setRecords] = useState(initialDeliveries);
  const [statusFilter, setStatusFilter] = useState<"All statuses" | DeliveryStatus>("All statuses");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All dates");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DeliveryRecord | null>(null);
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

  function createDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = draft.reference.trim().toUpperCase();
    if (records.some((record) => record.reference.toLowerCase() === reference.toLowerCase())) {
      setFormError("A record with that reference already exists.");
      return;
    }
    const newDelivery: DeliveryRecord = {
      ...draft,
      reference,
      details: draft.details.trim(),
      status: "Picking",
      date: "Today",
      when: draft.when.trim() || "Today · 12:00",
    };
    setRecords((current) => [newDelivery, ...current]);
    setNotice(`${reference} was added to the delivery queue.`);
    setDialogOpen(false);
    setFormError("");
    setDraft({ reference: "", details: "", warehouse: "North Hub", units: 1, when: "" });
  }

  function markPosted(record: DeliveryRecord) {
    setRecords((current) => current.map((item) => item.reference === record.reference
      ? { ...item, status: "Posted" }
      : item));
    setNotice(`${record.reference} was marked as posted.`);
    setOpenMenu(null);
  }

  return (
    <section className="deliveries-page receipts-page" aria-labelledby="deliveries-title">
      <div className="deliveries-heading receipts-heading">
        <div>
          <span className="deliveries-eyebrow receipts-eyebrow">OUTBOUND FLOW</span>
          <h1 id="deliveries-title"><DeliveryIcon kind="truck" /> Delivery orders</h1>
          <p>Keep every customer shipment moving with a clear pick queue.</p>
        </div>
        <button className="deliveries-primary receipts-primary" type="button" onClick={() => { setFormError(""); setDialogOpen(true); }}>
          <DeliveryIcon kind="plus" /> New delivery order
        </button>
      </div>

      {notice && <div className="deliveries-notice receipts-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><DeliveryIcon kind="close" /></button></div>}

      <div className="deliveries-toolbar receipts-toolbar">
        <label className="deliveries-search receipts-search">
          <DeliveryIcon kind="search" />
          <span className="sr-only">Search delivery orders</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search delivery orders" />
          {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><DeliveryIcon kind="close" /></button>}
        </label>
        <label className="deliveries-select deliveries-status-filter receipts-select receipts-status-filter">
          <DeliveryIcon kind="filter" />
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="deliveries-select deliveries-date-filter receipts-select receipts-date-filter">
          <DeliveryIcon kind="calendar" />
          <span className="sr-only">Filter by date range</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="All dates">Date range</option><option>Today</option><option>Tomorrow</option><option>Yesterday</option>
          </select>
        </label>
      </div>

      <section className="deliveries-panel receipts-panel" aria-label="Delivery order records">
        <div className="deliveries-panel-meta receipts-panel-meta"><span>{visibleRecords.length} {visibleRecords.length === 1 ? "record" : "records"}</span><span><i /> Live feed</span></div>
        <div className="deliveries-table-scroll receipts-table-scroll">
          <table className="deliveries-table receipts-table">
            <thead><tr><th>REFERENCE</th><th>DETAILS</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th>UNITS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.reference}>
                  <td className="deliveries-reference receipts-reference">{record.reference}</td>
                  <td>{record.details}</td>
                  <td><span className="deliveries-location receipts-location"><DeliveryIcon kind="pin" />{record.warehouse}</span></td>
                  <td><span className={`deliveries-status receipts-status receipts-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}><i />{record.status}</span></td>
                  <td className="deliveries-when receipts-when">{record.when}</td>
                  <td className={`deliveries-units receipts-units${record.units < 0 ? " is-negative" : ""}`}>{record.units > 0 ? "+" : ""}{record.units}</td>
                  <td className="deliveries-action-cell receipts-action-cell">
                    <button className="deliveries-action receipts-action" type="button" aria-label={`Actions for ${record.reference}`} aria-expanded={openMenu === record.reference} onClick={() => setOpenMenu((current) => current === record.reference ? null : record.reference)}><DeliveryIcon kind="dots" /></button>
                    {openMenu === record.reference && <div className="deliveries-row-menu receipts-row-menu">
                      <button type="button" onClick={() => { setDetailRecord(record); setOpenMenu(null); }}>View details</button>
                      {record.status !== "Posted" && <button type="button" onClick={() => markPosted(record)}>Mark as posted</button>}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRecords.length === 0 && <div className="deliveries-empty receipts-empty">No delivery orders match these filters.<button type="button" onClick={() => { setStatusFilter("All statuses"); setDateFilter("All dates"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
      </section>

      {dialogOpen && (
        <div className="deliveries-modal-backdrop receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section className="deliveries-modal receipts-modal" role="dialog" aria-modal="true" aria-labelledby="deliveries-modal-title">
            <header><div><span className="deliveries-eyebrow receipts-eyebrow">OUTBOUND FLOW</span><h2 id="deliveries-modal-title">Create a delivery order</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close dialog"><DeliveryIcon kind="close" /></button></header>
            {formError && <p className="deliveries-form-error" role="alert">{formError}</p>}
            <form onSubmit={createDelivery}>
              <label>Reference<input autoFocus required value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} placeholder="e.g. DO-00973" /></label>
              <label>Customer or details<input required value={draft.details} onChange={(event) => setDraft((current) => ({ ...current, details: event.target.value }))} placeholder="e.g. Cedar & Finch" /></label>
              <label>Warehouse<select value={draft.warehouse} onChange={(event) => setDraft((current) => ({ ...current, warehouse: event.target.value as Warehouse }))}>{deliveryWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label>Ship time<input value={draft.when} onChange={(event) => setDraft((current) => ({ ...current, when: event.target.value }))} placeholder="Today · 12:00" /></label>
              <label>Units<input type="number" min="1" required value={draft.units} onChange={(event) => setDraft((current) => ({ ...current, units: Number(event.target.value) }))} /></label>
              <footer><button className="deliveries-secondary receipts-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="deliveries-primary receipts-primary" type="submit">Create delivery</button></footer>
            </form>
          </section>
        </div>
      )}

      {detailRecord && (
        <div className="deliveries-modal-backdrop receipts-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <section className="deliveries-modal deliveries-details-modal receipts-modal receipts-details-modal" role="dialog" aria-modal="true" aria-labelledby="deliveries-details-title">
            <header><div><span className="deliveries-eyebrow receipts-eyebrow">DELIVERY ORDER DETAILS</span><h2 id="deliveries-details-title">{detailRecord.reference}</h2></div><button type="button" onClick={() => setDetailRecord(null)} aria-label="Close dialog"><DeliveryIcon kind="close" /></button></header>
            <dl><dt>Customer / details</dt><dd>{detailRecord.details}</dd><dt>Warehouse</dt><dd>{detailRecord.warehouse}</dd><dt>Status</dt><dd>{detailRecord.status}</dd><dt>When</dt><dd>{detailRecord.when}</dd><dt>Units</dt><dd>{detailRecord.units > 0 ? "+" : ""}{detailRecord.units}</dd></dl>
            <footer><button className="deliveries-secondary receipts-secondary" type="button" onClick={() => setDetailRecord(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </section>
  );
=======
export default function Deliveries() {
  return <div>Deliveries</div>;
>>>>>>> b7eb8b05e7825b3066a6f3f3316489adf64312db
}
