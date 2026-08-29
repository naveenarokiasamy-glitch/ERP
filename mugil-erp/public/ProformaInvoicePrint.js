/* ====================================================================
   ProformaInvoicePrint.js
   Standalone print renderer for the Proforma Invoice.

   Consumes the SAME data shape used by the existing React form
   (Proformainvoiceform.jsx) and does not alter it:

     data.supplier        { name, gstNumber, address, city, state,
                             stateCode, phone, email, contactPerson }
     data.invoiceDetails  { invoiceNumber, date, deliveryNote,
                             referenceNumber, referenceDate,
                             buyerOrderNumber, dispatchDocNumber,
                             dispatchedThrough, destination,
                             termsOfDelivery, modeOfPayment }
     data.items[]         { description, hsn, quantity, unit, rate,
                             discount }
     data.taxSummary      { cgstPercent, sgstPercent, igstPercent,
                             roundOff, taxAmountInWords }
     data.declaration     string

   DATA GAP NOTE
   -------------
   The existing form does not collect Consignee/Buyer (customer)
   details or the company's bank details, even though the original
   PDF prints both. Rather than invent that information, this
   renderer optionally accepts it under three extra, backward-
   compatible keys and falls back to a blank-but-correctly-bordered
   section when they are not supplied, so nothing here is ever
   hardcoded from the PDF:

     data.consignee   = { name, address, city, state, stateCode }
     data.buyer       = { name, address, city, state, stateCode }
     data.bankDetails = { accountHolder, bankName, accountNumber,
                           branchIfsc }

   This file never writes to localStorage, never modifies the form,
   and never changes any calculation beyond what is needed to render
   the same numbers the form already computes (rowAmount logic is
   copied verbatim from Proformainvoiceform.jsx).
   ==================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "mei_proforma_invoice_draft";

  /* ------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------ */

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value === null || value === undefined ? "" : String(value);
  }

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function formatAmount(value, decimals) {
    var d = decimals === undefined ? 2 : decimals;
    var n = num(value);
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }

  function formatPercent(value) {
    var n = num(value);
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return formatAmount(n, 2);
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDateDDMonYY(value) {
    if (!value) return "";
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    var dd = String(d.getUTCDate()).padStart(2, "0");
    var mon = MONTHS[d.getUTCMonth()];
    var yy = String(d.getUTCFullYear()).slice(-2);
    return dd + "-" + mon + "-" + yy;
  }

  /* ------------------------------------------------------------------
     Number to words (Indian numbering system: crore / lakh / thousand)
     ------------------------------------------------------------------ */

  var ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"];
  var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigitWords(n) {
    if (n < 20) return ONES[n];
    var t = Math.floor(n / 10);
    var o = n % 10;
    return TENS[t] + (o ? " " + ONES[o] : "");
  }

  function threeDigitWords(n) {
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var str = "";
    if (h) str += ONES[h] + " Hundred";
    if (rest) str += (str ? " " : "") + twoDigitWords(rest);
    return str;
  }

  function integerToWordsIndian(value) {
    var n = Math.round(Math.abs(value));
    if (n === 0) return "Zero";
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var thousand = Math.floor(n / 1000); n %= 1000;
    var hundred = n;

    var parts = [];
    if (crore) parts.push(threeDigitWords(crore) + " Crore");
    if (lakh) parts.push(twoDigitWords(lakh) + " Lakh");
    if (thousand) parts.push(twoDigitWords(thousand) + " Thousand");
    if (hundred) parts.push(threeDigitWords(hundred));
    return parts.join(" ");
  }

  function amountToWordsIndian(value) {
    var n = num(value);
    var rupees = Math.floor(Math.abs(n) + 1e-6);
    var paise = Math.round((Math.abs(n) - rupees) * 100);
    var words = "INR " + integerToWordsIndian(rupees);
    if (paise > 0) {
      words += " and " + integerToWordsIndian(paise) + " Paise";
    }
    words += " Only";
    return words;
  }

  /* ------------------------------------------------------------------
     Invoice calculations
     (rowAmount mirrors Proformainvoiceform.jsx exactly — do not change)
     ------------------------------------------------------------------ */

  function rowAmount(item) {
    var qty = num(item.quantity);
    var rate = num(item.rate);
    var disc = num(item.discount);
    var gross = qty * rate;
    return gross - (gross * disc) / 100;
  }

  function computeTotals(data) {
    var items = Array.isArray(data.items) ? data.items : [];
    var taxSummary = data.taxSummary || {};

    // Skip purely empty placeholder rows (no description and no qty/rate) —
    // the form always keeps at least one blank row present.
    var rows = items
      .map(function (item) {
        return { item: item, amount: rowAmount(item) };
      })
      .filter(function (r) {
        var hasText = (r.item.description || "").trim().length > 0;
        var hasQty = num(r.item.quantity) !== 0;
        var hasRate = num(r.item.rate) !== 0;
        return hasText || hasQty || hasRate;
      });

    var subtotal = rows.reduce(function (sum, r) { return sum + r.amount; }, 0);

    var cgstPercent = num(taxSummary.cgstPercent);
    var sgstPercent = num(taxSummary.sgstPercent);
    var igstPercent = num(taxSummary.igstPercent);
    var totalTaxPercent = cgstPercent + sgstPercent + igstPercent;

    var taxLines = [];
    if (cgstPercent > 0) {
      taxLines.push({ label: "CGST", percent: cgstPercent, amount: subtotal * (cgstPercent / 100) });
    }
    if (sgstPercent > 0) {
      taxLines.push({ label: "SGST", percent: sgstPercent, amount: subtotal * (sgstPercent / 100) });
    }
    if (igstPercent > 0) {
      taxLines.push({ label: "IGST", percent: igstPercent, amount: subtotal * (igstPercent / 100) });
    }

    var taxAmount = subtotal * (totalTaxPercent / 100);
    var roundOff = num(taxSummary.roundOff);
    var grandTotal = subtotal + taxAmount + roundOff;

    // HSN/SAC summary, grouped by HSN/SAC code. To match the original
    // template's printed figures exactly, each group's "Taxable Value"
    // column is the group's taxable value PLUS its proportional share
    // of tax (not the taxable value alone) — verified against the
    // reference PDF's own numbers.
    var groupOrder = [];
    var groupMap = {};
    rows.forEach(function (r) {
      var key = (r.item.hsn || "").trim() || "\u2014";
      if (!groupMap[key]) {
        groupMap[key] = 0;
        groupOrder.push(key);
      }
      groupMap[key] += r.amount;
    });
    var hsnRows = groupOrder.map(function (key) {
      var taxable = groupMap[key];
      var value = taxable * (1 + totalTaxPercent / 100);
      return { hsn: key, value: value };
    });
    var hsnTotal = hsnRows.reduce(function (sum, g) { return sum + g.value; }, 0);

    var amountInWords =
      (taxSummary.amountInWords && String(taxSummary.amountInWords).trim()) ||
      amountToWordsIndian(grandTotal);

    var taxAmountInWords =
      (taxSummary.taxAmountInWords && String(taxSummary.taxAmountInWords).trim()) || "NIL";

    return {
      rows: rows,
      subtotal: subtotal,
      taxLines: taxLines,
      taxAmount: taxAmount,
      roundOff: roundOff,
      grandTotal: grandTotal,
      hsnRows: hsnRows,
      hsnTotal: hsnTotal,
      amountInWords: amountInWords,
      taxAmountInWords: taxAmountInWords,
    };
  }

  /* ------------------------------------------------------------------
     Dynamic row builders
     ------------------------------------------------------------------ */

  function buildItemRows(totals) {
    var tbody = document.getElementById("itemRows");
    if (!tbody) return;
    var html = "";
    totals.rows.forEach(function (r, idx) {
      var item = r.item;
      var qtyText = item.quantity !== "" && item.quantity !== null && item.quantity !== undefined
        ? formatAmount(item.quantity)
        : "";
      var qtyCell = qtyText + (item.unit ? " " + escapeHtml(item.unit) : "");
      var rateText = item.rate !== "" && item.rate !== null && item.rate !== undefined
        ? formatAmount(item.rate)
        : "";
      var discText = num(item.discount) > 0 ? formatPercent(item.discount) + " %" : "";

      html +=
        "<tr>" +
        '<td class="item-sl">' + (idx + 1) + "</td>" +
        '<td class="item-desc">' + escapeHtml(item.description || "") + "</td>" +
        "<td>" + escapeHtml(item.hsn || "") + "</td>" +
        '<td class="num">' + qtyCell + "</td>" +
        '<td class="num">' + rateText + "</td>" +
        '<td class="center">' + escapeHtml(item.unit || "") + "</td>" +
        '<td class="num">' + discText + "</td>" +
        '<td class="num">' + formatAmount(r.amount) + "</td>" +
        "</tr>";
    });
    tbody.innerHTML = html;
  }

  function buildFooterRows(totals) {
    var tbody = document.getElementById("itemFooterRows");
    if (!tbody) return;
    var html = "";

    // Flexible blank area — height is set dynamically by fitToOnePage().
    // Eight separate cells (not one colspan cell) so the column grid
    // lines continue visually through the empty space.
    html +=
      '<tr class="spacer-row" id="spacerRow">' +
      "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>" +
      "</tr>";

    html +=
      '<tr class="subtotal-row"><td class="right-label" colspan="7">&nbsp;</td>' +
      '<td class="num">' + formatAmount(totals.subtotal) + "</td></tr>";

    totals.taxLines.forEach(function (t) {
      html +=
        '<tr class="tax-row"><td class="right-label" colspan="7">' +
        escapeHtml(t.label) + " " + formatPercent(t.percent) + " %</td>" +
        '<td class="num">' + formatAmount(t.amount) + "</td></tr>";
    });

    html +=
      '<tr class="roundoff-row"><td class="right-label" colspan="7">R/O</td>' +
      '<td class="num">' + formatAmount(totals.roundOff) + "</td></tr>";

    html +=
      '<tr class="total-row"><td class="right-label" colspan="7">Total</td>' +
      '<td class="num">&#8377; ' + formatAmount(totals.grandTotal) + "</td></tr>";

    tbody.innerHTML = html;
  }

  function buildHsnRows(totals) {
    var tbody = document.getElementById("hsnRows");
    if (!tbody) return;
    var html = "";
    totals.hsnRows.forEach(function (g) {
      html +=
        "<tr><td>" + escapeHtml(g.hsn) + '</td><td class="num">' +
        formatAmount(g.value) + "</td></tr>";
    });
    tbody.innerHTML = html;
    setText("f-hsnTotal", formatAmount(totals.hsnTotal));
  }

  /* ------------------------------------------------------------------
     Dynamic page-height fitting
     ------------------------------------------------------------------ */

  function pxPerMm() {
    var probe = document.getElementById("mmProbe");
    var w = probe ? probe.getBoundingClientRect().width : 0;
    return w > 0 ? w : 96 / 25.4; // fallback: assume 96dpi
  }

  function fitToOnePage() {
    var page = document.getElementById("invoicePage");
    var outer = page ? page.querySelector(".outer-border") : null;
    var spacerRow = document.getElementById("spacerRow");
    if (!page || !outer || !spacerRow) return;

    page.classList.remove("compact", "compact-2");
    var spacerCells = spacerRow.querySelectorAll("td");
    for (var i = 0; i < spacerCells.length; i++) spacerCells[i].style.height = "0px";

    requestAnimationFrame(function () {
      var mm = pxPerMm();
      var pagePaddingPx = 6 * mm * 2; // .page has 6mm top + 6mm bottom padding
      var pageHeightPx = 297 * mm;
      var availablePx = pageHeightPx - pagePaddingPx;

      var contentHeight = outer.getBoundingClientRect().height;
      var deficit = availablePx - contentHeight;

      function applySpacerHeight(px) {
        var cells = spacerRow.querySelectorAll("td");
        for (var j = 0; j < cells.length; j++) cells[j].style.height = px + "px";
      }

      if (deficit >= 0) {
        // Fewer items: expand the blank area to fill the page.
        var minSpacer = 4 * mm;
        applySpacerHeight(Math.max(minSpacer, deficit));
        return;
      }

      // More items than fit at normal size with a zero-height spacer:
      // step down through compact modes rather than shrinking further.
      page.classList.add("compact");
      requestAnimationFrame(function () {
        var h1 = outer.getBoundingClientRect().height;
        if (h1 <= availablePx) return;
        page.classList.add("compact-2");
        // If it still overflows here, the item list is genuinely too
        // long for one A4 page at a readable size and the browser's
        // print engine will carry the remainder onto a second page.
      });
    });
  }

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */

  function render(data) {
    var emptyState = document.getElementById("emptyState");
    var pageWrap = document.getElementById("pageWrap");
    if (emptyState) emptyState.style.display = "none";
    if (pageWrap) pageWrap.style.display = "flex";

    var supplier = data.supplier || {};
    var invoiceDetails = data.invoiceDetails || {};
    var consignee = data.consignee || {};
    var buyer = data.buyer || {};
    var bank = data.bankDetails || {};

    setText("f-supplier-name", supplier.name);
    setText("f-supplier-address", supplier.address);
    setText("f-supplier-city", supplier.city);

    var msmeEl = document.getElementById("f-supplier-msme");
    if (msmeEl) {
      if (supplier.msme) {
        msmeEl.style.display = "";
        msmeEl.textContent = "MSME - " + supplier.msme;
      } else {
        msmeEl.style.display = "none";
      }
    }

    setText("f-supplier-gstin", "GSTIN/UIN: " + (supplier.gstNumber || ""));
    setText(
      "f-supplier-statecode",
      supplier.state || supplier.stateCode
        ? "State Name : " + (supplier.state || "") + ", Code : " + (supplier.stateCode || "")
        : ""
    );
    setText("f-supplier-email", "E-Mail : " + (supplier.email || ""));

    setText("f-invoiceNumber", invoiceDetails.invoiceNumber);
    setText("f-date", formatDateDDMonYY(invoiceDetails.date));
    setText("f-deliveryNote", invoiceDetails.deliveryNote);
    setText("f-modeOfPayment", invoiceDetails.modeOfPayment);
    setText(
  "f-buyerOrderDate",
  formatDateDDMonYY(invoiceDetails.date)
);

setText(
  "f-deliveryNoteDate",
  formatDateDDMonYY(invoiceDetails.date)
);

setText(
  "f-otherReferences",
  invoiceDetails.otherReferences || ""
);

    var refBits = [];
    if (invoiceDetails.referenceNumber) refBits.push(invoiceDetails.referenceNumber);
    if (invoiceDetails.referenceDate) refBits.push("dt. " + formatDateDDMonYY(invoiceDetails.referenceDate));
    setText("f-referenceNoDate", refBits.join(" "));

    setText("f-buyerOrderNumber", invoiceDetails.buyerOrderNumber);
    setText("f-dispatchDocNumber", invoiceDetails.dispatchDocNumber);
    setText("f-dispatchedThrough", invoiceDetails.dispatchedThrough);
    setText("f-destination", invoiceDetails.destination);
    setText("f-termsOfDelivery", invoiceDetails.termsOfDelivery);

    // Consignee / Buyer — optional (see DATA GAP NOTE at top of file).
    setText("f-consignee-name", consignee.name || "");
    setText("f-consignee-address", [consignee.address, consignee.city].filter(Boolean).join(", "));
    setText(
      "f-consignee-statecode",
      consignee.state ? "State Name : " + consignee.state + (consignee.stateCode ? ", Code : " + consignee.stateCode : "") : ""
    );

    setText("f-buyer-name", buyer.name || "");
    setText("f-buyer-address", [buyer.address, buyer.city].filter(Boolean).join(", "));
    setText(
      "f-buyer-statecode",
      buyer.state ? "State Name : " + buyer.state + (buyer.stateCode ? ", Code : " + buyer.stateCode : "") : ""
    );

    // Bank details — optional (see DATA GAP NOTE at top of file).
    setText("f-bankHolder", bank.accountHolder || "");
    setText("f-bankName", bank.bankName || "");
    setText("f-bankAccount", bank.accountNumber || "");
    setText("f-bankBranchIfsc", bank.branchIfsc || "");
    setText("f-forCompany", supplier.name ? "for " + String(supplier.name).toUpperCase() : "");

    setText("f-declaration", data.declaration || "");

    var totals = computeTotals(data);
    buildItemRows(totals);
    buildFooterRows(totals);
    buildHsnRows(totals);
    setText("f-amountInWords", totals.amountInWords);
    setText("f-taxAmountInWords", totals.taxAmountInWords);

    fitToOnePage();
  }

  /* ------------------------------------------------------------------
     Data loading — does not read from or write to the form's own
     state. Priority: an in-page global (for direct embedding) ->
     postMessage from an opener window (for live/unsaved data) ->
     the same localStorage draft key the form's "Save Draft" button
     already writes to (works today with zero changes to the form).
     ------------------------------------------------------------------ */

  function isValidInvoiceData(data) {
    return !!(data && typeof data === "object" && (data.supplier || data.invoiceDetails || data.items));
  }

  function loadFromLocalStorage() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function showEmptyState() {
    var emptyState = document.getElementById("emptyState");
    var pageWrap = document.getElementById("pageWrap");
    if (emptyState) emptyState.style.display = "block";
    if (pageWrap) pageWrap.style.display = "none";
  }

  function init() {
    var data = isValidInvoiceData(window.PROFORMA_INVOICE_DATA)
      ? window.PROFORMA_INVOICE_DATA
      : loadFromLocalStorage();

    if (isValidInvoiceData(data)) {
      render(data);
    } else {
      showEmptyState();
    }

    window.addEventListener("message", function (event) {
      var msg = event.data;
      if (msg && msg.type === "PROFORMA_INVOICE_DATA" && isValidInvoiceData(msg.data)) {
        render(msg.data);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();

    var btnPrint = document.getElementById("btnPrint");
    if (btnPrint) btnPrint.addEventListener("click", function () { window.print(); });

    var btnBack = document.getElementById("btnBack");
    if (btnBack) {
      btnBack.addEventListener("click", function () {
        if (window.opener) {
          window.close();
        } else if (window.history.length > 1) {
          window.history.back();
        }
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitToOnePage, 150);
    });

    window.addEventListener("beforeprint", fitToOnePage);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitToOnePage);
    }
  });

  // Exposed for direct/embedded use (e.g. a future integration that
  // calls window.ProformaInvoicePrint.render(data) or postMessages it).
  window.ProformaInvoicePrint = {
    render: render,
    computeTotals: computeTotals,
  };
})();
