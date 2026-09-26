import { useMemo, useState, type ComponentType } from "react";
import type {
  DashboardStats,
  LedgerEntry,
  Operation,
  OperationStatus,
  ProductCategory,
  StockAlert,
  User,
  Warehouse,
} from "../types";
import Adjustments from "./Adjustments";
import Deliveries from "./Deliveries";
import MoveHistory from "./MoveHistory";
import Profile from "./Profile";
import Products from "./Products";
import Receipts from "./Receipts";
import Settings from "./Settings";
import Stock from "./Stock";
import Transfers from "./Transfers";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type DocumentFilter = "All" | "Receipts" | "Delivery" | "Internal" | "Adjustments";
type PageKey =
  | "Overview"
  | "Products"
  | "Receipts"
  | "Delivery Orders"
  | "Transfers"
  | "Adjustments"
  | "Move History"
  | "Settings"
  | "My Profile"
  | "Stock";

const warehouses: ("All warehouses" | Warehouse)[] = [
  "All warehouses",
  "Main Warehouse",
  "Production Floor",
  "Rack A",
  "Rack B",
  "North Hub",
  "South Annex",
  "East Cross-dock",
];

const operations: Operation[] = [
  {
    reference: "RCV-00418",
    type: "Receipt",
    product: "Field notebook / 3-pack",
    sku: "FLD-NBK-03",
    quantity: "84 units",
    location: "North Hub",
    status: "Waiting",
    statusLabel: "Awaiting dock",
    category: "Stationery",
    counterparty: "Paper & Form Co.",
    time: "Today · 09:40",
    icon: "receipt",
  },
  {
    reference: "DO-00972",
    type: "Delivery",
    product: "Pico USB-C dock",
    sku: "PIC-DCK-07",
    quantity: "24 units",
    location: "East Cross-dock",
    status: "Ready",
    statusLabel: "Picking",
    category: "Electronics",
    counterparty: "Cedar & Finch",
    time: "Today · 08:55",
    icon: "delivery",
  },
  {
    reference: "TRF-00186",
    type: "Internal",
    product: "Stacking tray / smoke",
    sku: "STK-TRY-SM",
    quantity: "116 units",
    location: "North Hub",
    status: "Ready",
    statusLabel: "Scheduled",
    category: "Furniture",
    counterparty: "North Hub → South Annex",
    time: "Tomorrow · 13:00",
    icon: "transfer",
  },
  {
    reference: "RCV-00415",
    type: "Receipt",
    product: "Cable clips / clay",
    sku: "CBL-CLP-CL",
    quantity: "36 units",
    location: "South Annex",
    status: "Waiting",
    statusLabel: "In transit",
    category: "Electronics",
    counterparty: "Formwell Manufacturing",
    time: "Tomorrow · 15:20",
    icon: "receipt",
  },
  {
    reference: "ADJ-00064",
    type: "Adjustment",
    product: "Steel sheets / coil",
    sku: "ST-SHT-21",
    quantity: "-6 units",
    location: "Main Warehouse",
    status: "Done",
    statusLabel: "Done",
    category: "Metal",
    counterparty: "Cycle count",
    time: "Yesterday · 16:10",
    icon: "adjustment",
  },
];

const stockAlerts: StockAlert[] = [
  { product: "Field notebook / 3-pack", sku: "FLD-NBK-03", location: "East Cross-dock", onHand: 12, status: "Low", category: "Stationery" },
  { product: "Stacking tray / smoke", sku: "STK-TRY-SM", location: "North Hub", onHand: 0, status: "Out of stock", category: "Furniture" },
  { product: "Cable clips / clay", sku: "CBL-CLP-CL", location: "North Hub", onHand: 19, status: "Low", category: "Electronics" },
  { product: "Pico USB-C dock", sku: "PIC-DCK-07", location: "South Annex", onHand: 7, status: "Low", category: "Electronics" },
];

const ledgerEntries: LedgerEntry[] = [
  { description: "Receipt posted", detail: "Noir wireless keyboard · RCV-00412", quantity: 84, time: "12 min ago", kind: "receipt" },
  { description: "Delivery picked", detail: "Cedar & Finch · DO-00972", quantity: -24, time: "34 min ago", kind: "delivery" },
  { description: "Cycle count adjusted", detail: "Cable clips / clay · North Hub", quantity: -6, time: "1 hr ago", kind: "adjustment" },
  { description: "Transfer received", detail: "Pico USB-C dock · East Cross-dock", quantity: 18, time: "2 hr ago", kind: "transfer" },
];

const stats: DashboardStats = {
  totalStockUnits: 19473,
  lowStockItems: 17,
  pendingReceipts: 6,
  pendingDeliveries: 4,
  scheduledTransfers: 2,
};

const locationStock: Record<Warehouse, number> = {
  "Main Warehouse": 6280,
  "Production Floor": 4160,
  "Rack A": 2315,
  "Rack B": 1985,
  "North Hub": 1530,
  "South Annex": 1870,
  "East Cross-dock": 1333,
};

const pageComponents: Partial<Record<PageKey, ComponentType>> = {
  Products,
  Receipts,
  "Delivery Orders": Deliveries,
  Transfers,
  Adjustments,
  "Move History": MoveHistory,
  Settings,
  "My Profile": Profile,
  Stock,
};

const mainNavigation: { label: PageKey; icon: string; count?: string }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Products", icon: "box", count: "248" },
  { label: "Receipts", icon: "inbox", count: "6" },
  { label: "Delivery Orders", icon: "outbox", count: "4" },
  { label: "Transfers", icon: "transfer", count: "3" },
  { label: "Adjustments", icon: "adjustment" },
  { label: "Move History", icon: "history" },
  { label: "Settings", icon: "settings" },
];

function Icon({ name, size = 17 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
    case "box":
      return <svg {...common}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.6 8.2 4.5 8.2-4.5M12 12.1V21" /></svg>;
    case "inbox":
    case "receipt":
      return <svg {...common}><path d="M4 4.5h16v15H4z" /><path d="M4 14h4l1.5 2h5L16 14h4M8 8h8" /></svg>;
    case "outbox":
    case "delivery":
      return <svg {...common}><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></svg>;
    case "transfer":
      return <svg {...common}><path d="M4 8h15l-3-3M20 16H5l3 3" /><path d="M19 8v-3M5 16v3" /></svg>;
    case "adjustment":
      return <svg {...common}><path d="M12 4v16M5 12h14" /><circle cx="12" cy="12" r="9" /></svg>;
    case "history":
      return <svg {...common}><path d="M3.5 11a8.5 8.5 0 1 1 .8 4.3" /><path d="M3.5 4.5v6h6M12 7v5l3.5 2" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.3 1-1.5 2.6-1.6-.6a8 8 0 0 1-1.7 1l-.3 1.7h-3l-.3-1.7a8 8 0 0 1-1.7-1l-1.6.6-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.6.6a8 8 0 0 1 1.7-1l.3-1.7h3l.3 1.7a8 8 0 0 1 1.7 1l1.6-.6 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17" /></svg>;
    case "pin":
      return <svg {...common}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
    case "alert":
      return <svg {...common}><path d="m10.3 4.3-7 12.1A2 2 0 0 0 5 19.5h14a2 2 0 0 0 1.7-3.1l-7-12.1a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "package":
      return <svg {...common}><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="m4.3 7.4 7.7 4.1 7.7-4.1M12 11.5V21" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.3 3.2-5 7-5s6.5 1.7 7 5" /></svg>;
    case "logout":
      return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></svg>;
    case "dots":
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
    case "receipt-ledger":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4l2.5 1.5" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function getUsername(user: User) {
  return user.email.split("@")[0] || user.fullName;
}

function getGreetingName(user: User) {
  return user.fullName.trim().split(/\s+/)[0] || "there";
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activePage, setActivePage] = useState<PageKey>("Overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<"All warehouses" | Warehouse>("All warehouses");
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | OperationStatus>("All");
  const [locationFilter, setLocationFilter] = useState<"All locations" | Warehouse>("All locations");
  const [categoryFilter, setCategoryFilter] = useState<"All categories" | ProductCategory>("All categories");
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newOperationOpen, setNewOperationOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  const filteredOperations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return operations.filter((operation) => {
      const typeMatches =
        documentFilter === "All" ||
        (documentFilter === "Receipts" && operation.type === "Receipt") ||
        (documentFilter === "Delivery" && operation.type === "Delivery") ||
        (documentFilter === "Internal" && operation.type === "Internal") ||
        (documentFilter === "Adjustments" && operation.type === "Adjustment");
      const statusMatches = statusFilter === "All" || operation.status === statusFilter;
      const warehouseMatches =
        (selectedWarehouse === "All warehouses" || operation.location === selectedWarehouse) &&
        (locationFilter === "All locations" || operation.location === locationFilter);
      const categoryMatches = categoryFilter === "All categories" || operation.category === categoryFilter;
      const searchMatches =
        !query ||
        [operation.product, operation.sku, operation.reference, operation.counterparty, operation.location]
          .some((value) => value.toLowerCase().includes(query));
      return typeMatches && statusMatches && warehouseMatches && categoryMatches && searchMatches;
    });
  }, [categoryFilter, documentFilter, locationFilter, search, selectedWarehouse, statusFilter]);

  const warehouseOperations = useMemo(
    () => operations.filter((operation) => selectedWarehouse === "All warehouses" || operation.location === selectedWarehouse),
    [selectedWarehouse],
  );

  const filteredAlerts = useMemo(
    () => stockAlerts.filter((alert) => selectedWarehouse === "All warehouses" || alert.location === selectedWarehouse),
    [selectedWarehouse],
  );

  const totalStockUnits =
    selectedWarehouse === "All warehouses"
      ? stats.totalStockUnits
      : locationStock[selectedWarehouse];
  const urgentAlertCount =
    selectedWarehouse === "All warehouses"
      ? 5
      : filteredAlerts.filter((item) => item.status === "Out of stock").length;

  function resetOperationFilters() {
    setDocumentFilter("All");
    setStatusFilter("All");
    setLocationFilter("All locations");
    setCategoryFilter("All categories");
    setSearch("");
  }

  function setPage(page: PageKey) {
    setActivePage(page);
    setProfileOpen(false);
    setNewOperationOpen(false);
    setNotice("");
  }

  function handleOperationAction(label: string) {
    setNewOperationOpen(false);
    setNotice(`${label} workflow will be available soon.`);
  }

  const Placeholder = pageComponents[activePage];

  return (
    <div className="ss-app">
      <header className="ss-header">
        <button className="ss-brand" type="button" onClick={() => setPage("Overview")} aria-label="StockSense overview">
          <span className="ss-brand-mark"><span /><span /><span /></span>
          <span className="ss-brand-copy"><strong>stocksense</strong><small>INVENTORY INTELLIGENCE</small></span>
        </button>
        <nav className="ss-nav" aria-label="Main navigation">
          {mainNavigation.map((item) => (
            <button
              className={`ss-nav-item${activePage === item.label ? " is-active" : ""}`}
              key={item.label}
              type="button"
              onClick={() => setPage(item.label)}
              aria-current={activePage === item.label ? "page" : undefined}
            >
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
              {item.count && <small>{item.count}</small>}
            </button>
          ))}
        </nav>
        <div className="ss-header-tools">
          <label className="ss-warehouse-select">
            <Icon name="pin" size={15} />
            <span className="sr-only">Select warehouse</span>
            <select
              value={selectedWarehouse}
              onChange={(event) => setSelectedWarehouse(event.target.value as "All warehouses" | Warehouse)}
            >
              {warehouses.map((warehouse) => <option key={warehouse}>{warehouse}</option>)}
            </select>
          </label>
          <label className="ss-global-search">
            <Icon name="search" size={16} />
            <span className="sr-only">Search inventory</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setPage("Overview")}
              placeholder="Search inventory"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="ss-popover-anchor">
            <button
              className={`ss-icon-button${notificationsOpen ? " is-open" : ""}`}
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setProfileOpen(false);
              }}
            >
              <Icon name="bell" size={18} /><i />
            </button>
            {notificationsOpen && (
              <div className="ss-popover ss-notification-popover">
                <strong>Notifications</strong>
                <p><span className="ss-notice-dot" /> 5 products are below reorder level.</p>
                <p><span className="ss-notice-dot ss-dot-blue" /> 2 receipts are due before noon.</p>
                <button type="button" onClick={() => setNotificationsOpen(false)}>Mark as seen</button>
              </div>
            )}
          </div>
          <div className="ss-popover-anchor">
            <button
              className="ss-user-button"
              type="button"
              aria-label={`${getUsername(user)}, ${user.role}`}
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotificationsOpen(false);
              }}
            >
              <span className="ss-avatar">{getInitials(getUsername(user)) || "AM"}</span>
              <span className="ss-user-copy"><strong>{getUsername(user)}</strong><small>{user.role}</small></span>
              <span className="ss-chevron">⌄</span>
            </button>
            {profileOpen && (
              <div className="ss-popover ss-profile-popover">
                <div className="ss-profile-summary"><span className="ss-avatar">{getInitials(user.fullName) || "AM"}</span><span><strong>{user.fullName}</strong><small>{user.email}</small></span></div>
                <button type="button" onClick={() => setPage("My Profile")}><Icon name="user" size={15} /> My Profile</button>
                <button type="button" onClick={() => setPage("Settings")}><Icon name="settings" size={15} /> Settings</button>
                <button className="ss-logout" type="button" onClick={onLogout}><Icon name="logout" size={15} /> Logout</button>
              </div>
            )}
          </div>
          <div className="ss-popover-anchor ss-new-operation-anchor">
            <button
              className="ss-primary-button"
              type="button"
              onClick={() => {
                setNewOperationOpen((open) => !open);
                setProfileOpen(false);
                setNotificationsOpen(false);
              }}
            >
              <Icon name="plus" size={16} /> New operation
            </button>
            {newOperationOpen && (
              <div className="ss-popover ss-operation-popover">
                <strong>Create an operation</strong>
                {(["Receipt", "Delivery Order", "Internal Transfer", "Adjustment"] as const).map((label) => (
                  <button type="button" key={label} onClick={() => handleOperationAction(label)}>
                    <Icon name={label === "Receipt" ? "inbox" : label === "Delivery Order" ? "outbox" : label === "Internal Transfer" ? "transfer" : "adjustment"} size={15} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="ss-main">
        {activePage === "Overview" ? (
          <>
            <section className="ss-welcome">
              <div>
                <div className="ss-date-line"><Icon name="calendar" size={13} /> TUESDAY, 12 MARCH 2024 <span>·</span> 09:42 UTC</div>
                <h1>Good morning, {getGreetingName(user)}<span className="ss-welcome-period">.</span><i className="ss-greeting-dot" /></h1>
                <p>Here is the pulse of your inventory network.</p>
              </div>
              <button className="ss-add-product" type="button" onClick={() => setPage("Products")}>
                <Icon name="package" size={16} /> Add product
              </button>
            </section>

            {notice && <div className="ss-inline-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}

            <section className="ss-kpi-grid" aria-label="Inventory key performance indicators">
              <article className="ss-kpi ss-kpi-green">
                <div className="ss-kpi-label">TOTAL STOCK UNITS</div>
                <span className="ss-kpi-icon"><Icon name="box" size={18} /></span>
                <strong className="ss-kpi-value">{formatNumber(totalStockUnits)}</strong>
                <span className="ss-kpi-foot"><b>↗ 4.8%</b> vs last month</span>
                <span className="ss-kpi-decoration" />
              </article>
              <article className="ss-kpi ss-kpi-orange">
                <div className="ss-kpi-label">LOW STOCK ITEMS</div>
                <span className="ss-kpi-icon"><Icon name="alert" size={17} /></span>
                <strong className="ss-kpi-value">{selectedWarehouse === "All warehouses" ? stats.lowStockItems : filteredAlerts.length}</strong>
                <span className="ss-kpi-foot"><b>{urgentAlertCount} {urgentAlertCount === 1 ? "needs" : "need"} action</b> today</span>
                <span className="ss-kpi-decoration" />
              </article>
              <article className="ss-kpi ss-kpi-blue">
                <div className="ss-kpi-label">PENDING RECEIPTS</div>
                <span className="ss-kpi-icon"><Icon name="inbox" size={18} /></span>
                <strong className="ss-kpi-value">{selectedWarehouse === "All warehouses" ? stats.pendingReceipts : warehouseOperations.filter((item) => item.type === "Receipt" && item.status !== "Done" && item.status !== "Canceled").length}</strong>
                <span className="ss-kpi-foot"><b>2 due before noon</b></span>
                <span className="ss-kpi-decoration" />
              </article>
              <article className="ss-kpi ss-kpi-navy">
                <div className="ss-kpi-label">PENDING DELIVERIES</div>
                <span className="ss-kpi-icon"><Icon name="outbox" size={18} /></span>
                <strong className="ss-kpi-value">{selectedWarehouse === "All warehouses" ? stats.pendingDeliveries : warehouseOperations.filter((item) => item.type === "Delivery" && item.status !== "Done" && item.status !== "Canceled").length}</strong>
                <span className="ss-kpi-foot"><b>84 units</b> being picked</span>
                <span className="ss-kpi-decoration" />
              </article>
              <article className="ss-kpi ss-kpi-purple">
                <div className="ss-kpi-label">INTERNAL TRANSFERS</div>
                <span className="ss-kpi-icon"><Icon name="transfer" size={18} /></span>
                <strong className="ss-kpi-value">{selectedWarehouse === "All warehouses" ? stats.scheduledTransfers : warehouseOperations.filter((item) => item.type === "Internal" && item.status !== "Done" && item.status !== "Canceled").length}</strong>
                <span className="ss-kpi-foot"><b>116 units moving</b> · <button type="button" onClick={() => setPage("Transfers")}>View schedule</button></span>
                <span className="ss-kpi-decoration" />
              </article>
            </section>

            <section className="ss-dashboard-columns">
              <article className="ss-panel ss-alert-panel">
                <header className="ss-panel-heading">
                  <div><span className="ss-section-kicker">NEEDS ATTENTION</span><h2>Stock alerts <span>{filteredAlerts.length}</span></h2></div>
                  <button className="ss-link-button" type="button" onClick={() => setPage("Stock")}>View all <Icon name="arrow" size={14} /></button>
                </header>
                <div className="ss-alert-list">
                  {filteredAlerts.map((alert) => (
                    <div className="ss-alert-row" key={alert.sku}>
                      <span className={`ss-alert-icon${alert.status === "Out of stock" ? " is-out" : ""}`}><Icon name="alert" size={17} /></span>
                      <span className="ss-alert-product"><strong>{alert.product}</strong><small>{alert.sku} <i>·</i> {alert.location}</small></span>
                      <span className="ss-alert-stock"><strong>{alert.onHand}</strong><small>on hand</small></span>
                      <span className={`ss-alert-badge${alert.status === "Out of stock" ? " is-out" : ""}`}><i />{alert.status}</span>
                    </div>
                  ))}
                  {filteredAlerts.length === 0 && <div className="ss-empty-alert">No stock alerts for this warehouse.</div>}
                </div>
              </article>

              <article className="ss-panel ss-operations-panel">
                <header className="ss-panel-heading ss-operations-heading">
                  <div><span className="ss-section-kicker">FLOW MONITOR</span><h2>Operations <span>{filteredOperations.length}</span></h2></div>
                  <button className="ss-link-button ss-queue-link" type="button" onClick={resetOperationFilters}>Open queue <Icon name="arrow" size={14} /></button>
                </header>
                <div className="ss-operation-filters">
                  <label><span className="sr-only">Document type</span><select value={documentFilter} onChange={(event) => setDocumentFilter(event.target.value as DocumentFilter)}><option value="All">All document</option><option value="Receipts">Receipts</option><option value="Delivery">Delivery</option><option value="Internal">Internal</option><option value="Adjustments">Adjustments</option></select></label>
                  <label><span className="sr-only">Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | OperationStatus)}><option value="All">All statuses</option><option>Draft</option><option>Waiting</option><option>Ready</option><option>Done</option><option>Canceled</option></select></label>
                  <label><span className="sr-only">Location</span><select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as "All locations" | Warehouse)}><option value="All locations">All locations</option>{warehouses.slice(1).map((warehouse) => <option key={warehouse}>{warehouse}</option>)}</select></label>
                  <label><span className="sr-only">Product category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "All categories" | ProductCategory)}><option value="All categories">All categories</option><option>Metal</option><option>Furniture</option><option>Electronics</option><option>Stationery</option></select></label>
                  {(documentFilter !== "All" || statusFilter !== "All" || locationFilter !== "All locations" || categoryFilter !== "All categories" || search) && <button className="ss-reset-filters" type="button" onClick={resetOperationFilters}>Reset</button>}
                </div>
                <div className="ss-operation-table-wrap">
                  <table className="ss-operation-table">
                    <thead><tr><th>DOCUMENT</th><th>WAREHOUSE</th><th>STATUS</th><th>WHEN</th><th><span className="sr-only">More</span></th></tr></thead>
                    <tbody>
                      {filteredOperations.map((operation) => (
                        <tr key={operation.reference}>
                          <td>
                            <span className={`ss-document-icon ss-doc-${operation.icon ?? "receipt"}`}><Icon name={operation.icon ?? "receipt"} size={16} /></span>
                            <span className="ss-document-copy"><strong>{operation.reference}</strong><small>{operation.counterparty}</small></span>
                          </td>
                          <td><span className="ss-location"><Icon name="pin" size={14} />{operation.location}</span></td>
                          <td><span className={`ss-operation-status ss-status-${operation.status.toLowerCase()}`}><i />{operation.statusLabel ?? operation.status}</span></td>
                          <td className="ss-operation-time">{operation.time}</td>
                          <td className="ss-row-action-cell">
                            <button className="ss-row-action" type="button" aria-label={`More options for ${operation.reference}`} aria-expanded={openRowMenu === operation.reference} onClick={() => setOpenRowMenu((current) => current === operation.reference ? null : operation.reference)}><Icon name="dots" size={17} /></button>
                            {openRowMenu === operation.reference && <div className="ss-row-popover"><button type="button" onClick={() => { setNotice(`${operation.reference} details will be available soon.`); setOpenRowMenu(null); }}>View details</button><button type="button" onClick={() => setOpenRowMenu(null)}>Close menu</button></div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOperations.length === 0 && <div className="ss-empty-operations">No operations match these filters.<button type="button" onClick={resetOperationFilters}>Clear filters</button></div>}
                </div>
                <footer className="ss-operations-footer">Showing {filteredOperations.length} of {warehouseOperations.length} operations <span>·</span> Live queue</footer>
              </article>
            </section>

            <section className="ss-panel ss-ledger-panel">
              <header className="ss-panel-heading">
                <div><span className="ss-section-kicker">LIVE FEED</span><h2>Stock ledger</h2></div>
                <Icon name="history" size={19} />
              </header>
              <div className="ss-ledger-list">
                {ledgerEntries.map((entry) => (
                  <div className="ss-ledger-row" key={`${entry.description}-${entry.time}`}>
                    <span className={`ss-ledger-icon ss-ledger-${entry.kind}`}><Icon name={entry.kind === "receipt" ? "inbox" : entry.kind === "delivery" ? "outbox" : entry.kind === "transfer" ? "transfer" : "adjustment"} size={16} /></span>
                    <span className="ss-ledger-copy"><strong>{entry.description}</strong><small>{entry.detail}</small></span>
                    <strong className={`ss-ledger-quantity${entry.quantity > 0 ? " is-positive" : " is-negative"}`}>{entry.quantity > 0 ? "+" : "−"}{Math.abs(entry.quantity)}</strong>
                    <span className="ss-ledger-time">{entry.time}</span>
                  </div>
                ))}
              </div>
              <footer className="ss-ledger-footer"><button className="ss-link-button" type="button" onClick={() => setPage("Move History")}>View movement history <Icon name="arrow" size={14} /></button></footer>
            </section>

            <footer className="ss-page-footer"><span>StockSense <i>·</i> Inventory intelligence</span><span>Showing data for <strong>{selectedWarehouse}</strong></span></footer>
          </>
        ) : (
          <section className="ss-placeholder-page">
            <div className="ss-date-line"><Icon name="grid" size={13} /> WORKSPACE <span>·</span> {activePage.toUpperCase()}</div>
            <h1>{activePage}</h1>
            <p>This area is ready for the {activePage.toLowerCase()} workflow.</p>
            {Placeholder ? <Placeholder /> : <div className="ss-placeholder-card">{activePage} functionality will be available soon.</div>}
            <button className="ss-add-product" type="button" onClick={() => setPage("Overview")}><Icon name="arrow" size={15} /> Back to overview</button>
          </section>
        )}
      </main>
    </div>
  );
}
