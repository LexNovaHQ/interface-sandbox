(function () {
  "use strict";

  const VERSION = "interface_report_pagination.v2.accessible";
  const TABLE_PAGE_SIZE = 10;
  const DECK_PAGE_SIZE = 5;
  const state = new Map();

  window.InterfaceReportPagination = Object.freeze({
    version: VERSION,
    table_page_size: TABLE_PAGE_SIZE,
    deck_page_size: DECK_PAGE_SIZE,
    createPagedTable,
    createPagedDeck,
    reset
  });

  window.addEventListener("beforeprint", function () {
    document.documentElement.classList.add("report-print-expanded");
  });

  window.addEventListener("afterprint", function () {
    document.documentElement.classList.remove("report-print-expanded");
  });

  function createPagedTable({ id, caption = "", columns = [], rows = [], renderCell = defaultCellRenderer, emptyMessage = "No rows emitted." } = {}) {
    const componentId = stableId(id, "table");
    const shell = node("div", "report-table-shell");
    shell.dataset.reportPaginationId = componentId;
    shell.dataset.reportPaginationKind = "table";
    shell.setAttribute("role", "group");

    const table = node("table", "report-document-table");
    table.id = `${componentId}-table`;
    if (caption) {
      const tableCaption = node("caption", "report-table-caption", caption);
      tableCaption.id = `${componentId}-caption`;
      table.append(tableCaption);
      shell.setAttribute("aria-labelledby", tableCaption.id);
    } else {
      table.setAttribute("aria-label", "Report table");
      shell.setAttribute("aria-label", "Report table");
    }

    if (!Array.isArray(rows) || !rows.length) {
      const empty = node("p", "report-empty-state", emptyMessage);
      empty.setAttribute("role", "status");
      shell.append(empty);
      return shell;
    }

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const column of columns) {
      const th = node("th", "", column.label || column.key || "Column");
      th.scope = "col";
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    const rowNodes = rows.map(function (row, rowIndex) {
      const tr = document.createElement("tr");
      tr.dataset.reportRowIndex = String(rowIndex);
      for (const [columnIndex, column] of columns.entries()) {
        const td = document.createElement("td");
        td.dataset.reportColumn = column.key || String(columnIndex);
        const rendered = renderCell(row, column, rowIndex);
        appendValue(td, rendered);
        tr.append(td);
      }
      tbody.append(tr);
      return tr;
    });

    table.append(thead, tbody);
    shell.append(table);
    shell.append(buildControls({ componentId, total: rows.length, pageSize: TABLE_PAGE_SIZE, itemNodes: rowNodes, itemLabel: "rows" }));
    applyPage(componentId, { announce: false });
    return shell;
  }

  function createPagedDeck({ id, items = [], renderCard, caption = "", emptyMessage = "No detail items emitted." } = {}) {
    const componentId = stableId(id, "deck");
    const shell = node("div", "report-deck-shell");
    shell.dataset.reportPaginationId = componentId;
    shell.dataset.reportPaginationKind = "deck";
    shell.setAttribute("role", "group");

    if (caption) {
      const heading = node("div", "report-table-caption", caption);
      heading.id = `${componentId}-caption`;
      shell.append(heading);
      shell.setAttribute("aria-labelledby", heading.id);
    } else {
      shell.setAttribute("aria-label", "Report detail deck");
    }

    if (!Array.isArray(items) || !items.length) {
      const empty = node("p", "report-empty-state", emptyMessage);
      empty.setAttribute("role", "status");
      shell.append(empty);
      return shell;
    }

    const deck = node("div", "report-detail-deck");
    const cardNodes = items.map(function (item, index) {
      const card = typeof renderCard === "function" ? renderCard(item, index) : defaultCardRenderer(item, index);
      card.classList.add("report-detail-card");
      card.dataset.reportCardIndex = String(index);
      card.setAttribute("aria-setsize", String(items.length));
      card.setAttribute("aria-posinset", String(index + 1));
      deck.append(card);
      return card;
    });

    shell.append(deck);
    shell.append(buildControls({ componentId, total: items.length, pageSize: DECK_PAGE_SIZE, itemNodes: cardNodes, itemLabel: "cards" }));
    applyPage(componentId, { announce: false });
    return shell;
  }

  function buildControls({ componentId, total, pageSize, itemNodes, itemLabel }) {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    state.set(componentId, { page: 0, total, pageSize, pageCount, itemNodes });

    const controls = node("nav", "report-pagination no-print");
    controls.dataset.reportPaginationControls = componentId;
    controls.setAttribute("aria-label", `Pagination for ${componentId}`);
    const summary = node("span", "report-pagination-summary", "");
    summary.id = `${componentId}-pagination-summary`;
    summary.setAttribute("aria-live", "polite");
    summary.setAttribute("aria-atomic", "true");
    const actions = node("div", "report-pagination-actions");

    actions.append(
      pageButton("First", componentId, function () { setPage(componentId, 0); }),
      pageButton("Previous", componentId, function () { shiftPage(componentId, -1); }),
      pageButton("Next", componentId, function () { shiftPage(componentId, 1); }),
      pageButton("Last", componentId, function () { setPage(componentId, pageCount - 1); })
    );

    controls.append(summary, actions);
    controls.__summary = summary;
    controls.__itemLabel = itemLabel;
    controls.__buttons = [...actions.querySelectorAll("button")];
    return controls;
  }

  function applyPage(componentId, { announce = true } = {}) {
    const current = state.get(componentId);
    if (!current) return;
    const page = clamp(current.page, 0, current.pageCount - 1);
    current.page = page;
    const start = page * current.pageSize;
    const end = Math.min(start + current.pageSize, current.total);

    current.itemNodes.forEach(function (item, index) {
      const hidden = index < start || index >= end;
      item.classList.toggle("is-page-hidden", hidden);
      item.setAttribute("aria-hidden", hidden ? "true" : "false");
      if ("inert" in item) item.inert = hidden;
    });

    const shell = document.querySelector(`[data-report-pagination-id="${cssEscape(componentId)}"]`);
    const controls = shell?.querySelector(`[data-report-pagination-controls="${cssEscape(componentId)}"]`);
    if (!controls) return;
    controls.__summary.textContent = `Showing ${start + 1}–${end} of ${current.total} ${controls.__itemLabel} · Page ${page + 1} of ${current.pageCount}`;
    const [first, previous, next, last] = controls.__buttons;
    first.disabled = previous.disabled = page === 0;
    next.disabled = last.disabled = page >= current.pageCount - 1;
    controls.hidden = current.pageCount <= 1;

    if (announce) {
      shell?.dispatchEvent(new CustomEvent("interface:report-pagination-change", {
        bubbles: true,
        detail: { componentId, page: page + 1, pageCount: current.pageCount, start: start + 1, end, total: current.total }
      }));
    }
  }

  function setPage(componentId, page) {
    const current = state.get(componentId);
    if (!current) return;
    current.page = clamp(page, 0, current.pageCount - 1);
    applyPage(componentId);
    const shell = document.querySelector(`[data-report-pagination-id="${cssEscape(componentId)}"]`);
    shell?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
  }

  function shiftPage(componentId, delta) {
    const current = state.get(componentId);
    if (!current) return;
    setPage(componentId, current.page + delta);
  }

  function reset(componentId) {
    if (componentId) {
      state.delete(componentId);
      return;
    }
    state.clear();
  }

  function pageButton(label, componentId, handler) {
    const button = node("button", "report-page-button", label);
    button.type = "button";
    button.setAttribute("aria-label", `${label} page for ${componentId}`);
    button.addEventListener("click", handler);
    return button;
  }

  function defaultCellRenderer(row, column) {
    return valueAt(row, column.key);
  }

  function defaultCardRenderer(item, index) {
    const card = node("article", "report-detail-card");
    card.append(node("h4", "", `Detail ${index + 1}`), node("pre", "", JSON.stringify(item, null, 2)));
    return card;
  }

  function appendValue(parent, value) {
    if (value instanceof Node) {
      parent.append(value);
      return;
    }
    if (Array.isArray(value)) {
      parent.textContent = value.map(readableScalar).filter(Boolean).join(", ") || "—";
      return;
    }
    if (value && typeof value === "object") {
      parent.textContent = readableScalar(value) || "—";
      return;
    }
    parent.textContent = value === undefined || value === null || value === "" ? "—" : String(value);
  }

  function readableScalar(value) {
    if (value === undefined || value === null) return "";
    if (typeof value !== "object") return String(value);
    if (Array.isArray(value)) return value.map(readableScalar).filter(Boolean).join(", ");
    return String(value.label ?? value.normalized_name ?? value.public_name ?? value.name ?? value.code ?? value.token ?? value.value ?? "");
  }

  function valueAt(value, path) {
    if (!path) return value;
    return String(path).split(".").reduce(function (current, key) {
      return current === undefined || current === null ? undefined : current[key];
    }, value);
  }

  function stableId(value, fallback) {
    const raw = String(value || fallback || "report-component");
    return raw.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function cssEscape(value) {
    return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function reducedMotion() { return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true; }
})();
