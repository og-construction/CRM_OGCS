// src/controllers/quoteController.js
const Quote = require("../models/Quote");

const toNumber = (val) => {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
};

// --------------------------------------------------
// Sales Executive: Create quotation / invoice
// --------------------------------------------------
exports.createQuote = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Not authorized – user missing." });
    }

    const {
      type,
      customerName,
      companyName,
      customerEmail,
      customerPhone,
      projectName,
      items,
      taxPercent,
      notes,
    } = req.body;

    // Basic validation
    if (!type || !["quotation", "invoice"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type must be 'quotation' or 'invoice'." });
    }

    if (!customerName || !customerName.trim()) {
      return res
        .status(400)
        .json({ message: "Customer name is required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one line item is required." });
    }

    // Prepare cleaned items
    const cleanedItems = items
      .map((it) => {
        const description = (it.description || "").trim();
        const quantity = toNumber(it.quantity);
        const unitPrice = toNumber(it.unitPrice);
        const lineTotal = quantity * unitPrice;

        return {
          description,
          quantity,
          unitPrice,
          lineTotal,
        };
      })
      .filter((it) => it.description && it.quantity > 0);

    if (cleanedItems.length === 0) {
      return res.status(400).json({
        message: "All items invalid. Fill description, qty, price.",
      });
    }

    // Totals
    const taxP = toNumber(taxPercent);
    const subtotal = cleanedItems.reduce(
      (sum, it) => sum + it.lineTotal,
      0
    );
    const totalAmount = subtotal + (taxP / 100) * subtotal;

    // Create document
    const quote = await Quote.create({
      type,
      customerName: customerName.trim(),
      companyName: companyName || "",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      projectName: projectName || "",
      items: cleanedItems,
      taxPercent: taxP,
      notes: notes || "",
      subtotal,
      totalAmount,
      salesExecutive: req.user._id,
    });

    return res.status(201).json({
      status: "success",
      data: quote,
    });
  } catch (err) {
    console.error("createQuote error:", err);
    return res.status(500).json({
      message: "Server error while creating quotation/invoice",
    });
  }
};

// --------------------------------------------------
// Sales Executive: Fetch own quotations / invoices
// --------------------------------------------------
exports.getMyQuotes = async (req, res) => {
  try {
    const filter = { salesExecutive: req.user._id };

    if (req.query.type) filter.type = req.query.type;

    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      status: "success",
      data: quotes,
    });
  } catch (err) {
    console.error("getMyQuotes error:", err);
    return res.status(500).json({
      message: "Server error while fetching your quotations",
    });
  }
};

// --------------------------------------------------
// Admin: Fetch ALL quotations for approval dashboard
// --------------------------------------------------
exports.getAllQuotes = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const quotes = await Quote.find(filter)
      .populate("salesExecutive", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      status: "success",
      data: quotes,
    });
  } catch (err) {
    console.error("getAllQuotes error:", err);
    return res.status(500).json({
      message: "Server error while fetching all quotations",
    });
  }
};

// --------------------------------------------------
// Admin: Approve / Reject quotation or invoice
// --------------------------------------------------
exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'approved' or 'rejected'.",
      });
    }

    const quote = await Quote.findById(id);
    if (!quote) {
      return res
        .status(404)
        .json({ message: "Quotation not found." });
    }

    quote.status = status;
    quote.approvedBy = req.user._id;
    quote.approvedAt = new Date();

    await quote.save();

    return res.json({
      status: "success",
      data: quote,
    });
  } catch (err) {
    console.error("updateQuoteStatus error:", err);
    return res.status(500).json({
      message: "Server error while updating status",
    });
  }
};
