
import { useMemo, useState, type FormEvent } from "react";
import type { Warehouse } from "../types";

type ProductWarehouse = "North Hub" | "East Cross-dock" | "South Annex";
type ProductCategory = "Lighting" | "Stationery" | "Workspace" | "Electronics";
type ProductStatus = "Healthy" | "Low" | "Out of stock";
type DialogMode = "create" | "edit" | "adjust" | "details";

interface InventoryProduct {
  name: string;
  sku: string;
  category: ProductCategory;
  warehouse: ProductWarehouse;
  onHand: number;
  reorderPoint: number;
  stockValue: number;
}

interface ProductsProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouse: "All warehouses" | Warehouse;
  onWarehouseChange: (value: "All warehouses" | Warehouse) => void;
}

const initialProducts: InventoryProduct[] = [
  { name: "Arc desk lamp / graphite", sku: "ARC-LMP-GR", category: "Lighting", warehouse: "North Hub", onHand: 48, reorderPoint: 24, stockValue: 4896 },
  { name: "Field notebook / 3-pack", sku: "FLD-NBK-03", category: "Stationery", warehouse: "East Cross-dock", onHand: 12, reorderPoint: 18, stockValue: 276 },
  { name: "Stacking tray / smoke", sku: "STK-TRY-SM", category: "Workspace", warehouse: "North Hub", onHand: 0, reorderPoint: 12, stockValue: 0 },
  { name: "Nori wireless keyboard", sku: "NRI-KBD-01", category: "Electronics", warehouse: "South Annex", onHand: 84, reorderPoint: 30, stockValue: 8316 },
  { name: "Cable clips / clay", sku: "CBL-CLP-CL", category: "Workspace", warehouse: "North Hub", onHand: 19, reorderPoint: 24, stockValue: 171 },
  { name: "Halo task light / ivory", sku: "HAL-TLK-IV", category: "Lighting", warehouse: "North Hub", onHand: 126, reorderPoint: 36, stockValue: 9072 },
  { name: "Grid memo pad / set of 2", sku: "GRD-MPD-02", category: "Stationery", warehouse: "East Cross-dock", onHand: 35, reorderPoint: 20, stockValue: 525 },
  { name: "Pico USB-C dock", sku: "PIC-DCK-07", category: "Electronics", warehouse: "South Annex", onHand: 7, reorderPoint: 15, stockValue: 1015 },
];

const categories: ProductCategory[] = ["Lighting", "Stationery", "Workspace", "Electronics"];
const productWarehouses: ProductWarehouse[] = ["North Hub", "East Cross-dock", "South Annex"];

function statusFor(product: InventoryProduct): ProductStatus {
  if (product.onHand === 0) return "Out of stock";
  if (product.onHand <= product.reorderPoint) return "Low";
  return "Healthy";
}

function ProductIcon({ kind = "box" }: { kind?: "box" | "pin" | "search" | "dots" | "plus" | "close" }) {
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
  if (kind === "pin") return <svg {...props}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
  if (kind === "search") return <svg {...props}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
  if (kind === "dots") return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
  if (kind === "plus") return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
  if (kind === "close") return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  return <svg {...props}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.6 8.2 4.5 8.2-4.5M12 12v9" /></svg>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function makeDraft(product?: InventoryProduct): InventoryProduct {
  return product
    ? { ...product }
    : { name: "", sku: "", category: "Lighting", warehouse: "North Hub", onHand: 0, reorderPoint: 1, stockValue: 0 };
}

export default function Products({ search, onSearchChange, warehouse, onWarehouseChange }: ProductsProps) {
  const [products, setProducts] = useState(initialProducts);
  const [statusFilter, setStatusFilter] = useState<"All statuses" | ProductStatus>("All statuses");
  const [categoryFilter, setCategoryFilter] = useState<"All categories" | ProductCategory>("All categories");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [draft, setDraft] = useState<InventoryProduct>(() => makeDraft());
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesWarehouse = warehouse === "All warehouses" || product.warehouse === warehouse;
      const matchesStatus = statusFilter === "All statuses" || statusFor(product) === statusFilter;
      const matchesCategory = categoryFilter === "All categories" || product.category === categoryFilter;
      const matchesSearch = !query || [product.name, product.sku, product.category, product.warehouse]
        .some((value) => value.toLowerCase().includes(query));
      return matchesWarehouse && matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, products, search, statusFilter, warehouse]);

  function openDialog(mode: DialogMode, product?: InventoryProduct) {
    setSelectedProduct(product ?? null);
    setDraft(makeDraft(product));
    setFormError("");
    setDialogMode(mode);
    setOpenMenu(null);
  }

  function updateDraft<K extends keyof InventoryProduct>(field: K, value: InventoryProduct[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submitDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialogMode === "create") {
      if (products.some((product) => product.sku.toLowerCase() === draft.sku.trim().toLowerCase())) {
        setFormError("A product with that SKU already exists.");
        return;
      }
      setProducts((current) => [{ ...draft, name: draft.name.trim(), sku: draft.sku.trim().toUpperCase() }, ...current]);
      setNotice(`${draft.name.trim()} was added to the catalog.`);
    } else if (dialogMode === "edit" && selectedProduct) {
      if (products.some((product) => product.sku !== selectedProduct.sku && product.sku.toLowerCase() === draft.sku.trim().toLowerCase())) {
        setFormError("A product with that SKU already exists.");
        return;
      }
      setProducts((current) => current.map((product) => product.sku === selectedProduct.sku
        ? { ...draft, name: draft.name.trim(), sku: draft.sku.trim().toUpperCase() }
        : product));
      setNotice(`${draft.name.trim()} was updated.`);
    } else if (dialogMode === "adjust" && selectedProduct) {
      setProducts((current) => current.map((product) => product.sku === selectedProduct.sku
        ? { ...product, onHand: draft.onHand, stockValue: draft.stockValue }
        : product));
      setNotice(`${selectedProduct.name} stock was updated.`);
    }
    setDialogMode(null);
  }

  const warehouseCards: { name: ProductWarehouse; units: number; skus: number; abbreviation: string }[] = [
    { name: "North Hub", units: 193, skus: 4, abbreviation: "NH" },
    { name: "East Cross-dock", units: 47, skus: 2, abbreviation: "EC" },
    { name: "South Annex", units: 91, skus: 2, abbreviation: "SA" },
  ];

  return (
    <section className="products-page" aria-labelledby="products-title">
      <div className="products-heading">
        <div>
          <span className="products-eyebrow">INVENTORY CATALOG</span>
          <h1 id="products-title">Products <span>248</span></h1>
          <p>One view of every SKU, location, and replenishment signal.</p>
        </div>
        <button className="products-primary" type="button" onClick={() => { setNotice(""); openDialog("create"); }}>
          <ProductIcon kind="plus" /> New product
        </button>
      </div>

      {notice && <div className="products-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><ProductIcon kind="close" /></button></div>}

      <section className="warehouse-cards" aria-label="Warehouse inventory summary">
        {warehouseCards.map((card) => (
          <button
            className={`warehouse-card${warehouse === card.name ? " is-selected" : ""}`}
            key={card.name}
            type="button"
            onClick={() => onWarehouseChange(warehouse === card.name ? "All warehouses" : card.name)}
            aria-label={`${card.name}: ${card.units} units across ${card.skus} visible SKUs`}
            aria-pressed={warehouse === card.name}
          >
            <span className="warehouse-card-top"><span className="warehouse-card-icon"><ProductIcon kind="pin" /></span><span className="warehouse-abbreviation">{card.abbreviation}</span></span>
            <span className="warehouse-card-name">{card.name}</span>
            <span className="warehouse-card-metrics"><strong>{card.units}</strong><span>units</span><i /><span>{card.skus} visible SKUs</span></span>
          </button>
        ))}
      </section>

      <section className="products-panel" aria-label="Product inventory">
        <header className="products-panel-header">
          <div><span className="products-kicker">CATALOG OVERVIEW</span><h2>All products <span>{visibleProducts.length} shown</span></h2></div>
          <span className="products-sync"><i /> Synced just now</span>
        </header>
        <div className="products-toolbar">
          <label className="products-search">
            <ProductIcon kind="search" />
            <span className="sr-only">Search products</span>
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by product, SKU, or warehouse..." />
            {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><ProductIcon kind="close" /></button>}
          </label>
          <label className="products-filter">
            <span className="sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option>All statuses</option><option>Healthy</option><option>Low</option><option>Out of stock</option>
            </select>
          </label>
          <label className="products-filter">
            <span className="sr-only">Filter by category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}>
              <option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          {(statusFilter !== "All statuses" || categoryFilter !== "All categories" || search) && (
            <button className="products-clear" type="button" onClick={() => { setStatusFilter("All statuses"); setCategoryFilter("All categories"); onSearchChange(""); }}>Clear filters</button>
          )}
        </div>

        <div className="products-table-scroll">
          <table className="products-table">
            <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>WAREHOUSE</th><th>ON HAND</th><th>REORDER POINT</th><th>STOCK VALUE</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleProducts.map((product) => {
                const status = statusFor(product);
                return (
                  <tr key={product.sku}>
                    <td><span className="products-item-icon"><ProductIcon /></span><span className="products-item-copy"><strong>{product.name}</strong><small>{product.sku}</small></span></td>
                    <td><span className={`products-category products-category-${product.category.toLowerCase()}`}>{product.category}</span></td>
                    <td><span className="products-location"><ProductIcon kind="pin" />{product.warehouse}</span></td>
                    <td><strong className={`products-quantity${status === "Out of stock" ? " is-empty" : ""}`}>{product.onHand}</strong><span className="products-unit"> units</span></td>
                    <td className="products-reorder">{product.reorderPoint} units</td>
                    <td className="products-value">{formatCurrency(product.stockValue)}</td>
                    <td><span className={`products-status products-status-${status.toLowerCase().replaceAll(" ", "-")}`}><i />{status}</span></td>
                    <td className="products-action-cell">
                      <button className="products-action" type="button" aria-label={`Actions for ${product.name}`} aria-expanded={openMenu === product.sku} onClick={() => setOpenMenu((current) => current === product.sku ? null : product.sku)}><ProductIcon kind="dots" /></button>
                      {openMenu === product.sku && <div className="products-row-menu">
                        <button type="button" onClick={() => openDialog("details", product)}>View details</button>
                        <button type="button" onClick={() => openDialog("edit", product)}>Edit product</button>
                        <button type="button" onClick={() => openDialog("adjust", product)}>Adjust stock</button>
                      </div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleProducts.length === 0 && <div className="products-empty">No products match these filters. <button type="button" onClick={() => { setStatusFilter("All statuses"); setCategoryFilter("All categories"); onSearchChange(""); }}>Clear filters</button></div>}
        </div>
        <footer className="products-table-footer"><span>Showing <strong>{visibleProducts.length}</strong> of {products.length} products</span><span><i /> Inventory up to date</span></footer>
      </section>

      {dialogMode && (
        <div className="products-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogMode(null); }}>
          <section className="products-modal" role="dialog" aria-modal="true" aria-labelledby="products-modal-title">
            <header><div><span className="products-kicker">INVENTORY CATALOG</span><h2 id="products-modal-title">{dialogMode === "create" ? "Add a product" : dialogMode === "edit" ? "Edit product" : dialogMode === "adjust" ? "Adjust stock" : "Product details"}</h2></div><button className="products-modal-close" type="button" onClick={() => setDialogMode(null)} aria-label="Close dialog"><ProductIcon kind="close" /></button></header>
            {formError && <p className="products-form-error" role="alert">{formError}</p>}
            {dialogMode === "details" && selectedProduct ? (
              <div className="products-details">
                <strong>{selectedProduct.name}</strong><span>{selectedProduct.sku}</span>
                <dl><dt>Category</dt><dd>{selectedProduct.category}</dd><dt>Warehouse</dt><dd>{selectedProduct.warehouse}</dd><dt>On hand</dt><dd>{selectedProduct.onHand} units</dd><dt>Reorder point</dt><dd>{selectedProduct.reorderPoint} units</dd><dt>Stock value</dt><dd>{formatCurrency(selectedProduct.stockValue)}</dd><dt>Status</dt><dd>{statusFor(selectedProduct)}</dd></dl>
              </div>
            ) : (
              <form className="products-form" onSubmit={submitDialog}>
                {dialogMode !== "adjust" && <>
                  <label>Product name<input autoFocus required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="e.g. Arc desk lamp / graphite" /></label>
                  <label>SKU<input required value={draft.sku} onChange={(event) => updateDraft("sku", event.target.value)} placeholder="e.g. ARC-LMP-GR" /></label>
                  <label>Category<select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as ProductCategory)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label>Warehouse<select value={draft.warehouse} onChange={(event) => updateDraft("warehouse", event.target.value as ProductWarehouse)}>{productWarehouses.map((location) => <option key={location}>{location}</option>)}</select></label>
                </>}
                <label>{dialogMode === "adjust" ? "New on-hand quantity" : "On hand"}<input autoFocus={dialogMode === "adjust"} type="number" min="0" required value={draft.onHand} onChange={(event) => updateDraft("onHand", Number(event.target.value))} /></label>
                {dialogMode !== "adjust" && <>
                  <label>Reorder point<input type="number" min="0" required value={draft.reorderPoint} onChange={(event) => updateDraft("reorderPoint", Number(event.target.value))} /></label>
                </>}
                <label>Stock value ($)<input type="number" min="0" required value={draft.stockValue} onChange={(event) => updateDraft("stockValue", Number(event.target.value))} /></label>
                <footer><button className="products-secondary" type="button" onClick={() => setDialogMode(null)}>Cancel</button><button className="products-primary" type="submit">{dialogMode === "create" ? "Add product" : dialogMode === "edit" ? "Save changes" : "Update stock"}</button></footer>
              </form>
            )}
            {dialogMode === "details" && <footer className="products-details-actions"><button className="products-secondary" type="button" onClick={() => setDialogMode(null)}>Close</button><button className="products-primary" type="button" onClick={() => selectedProduct && openDialog("edit", selectedProduct)}>Edit product</button></footer>}
          </section>
        </div>
      )}
    </section>
  );
}
