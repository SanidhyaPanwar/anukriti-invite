const Expense = require('../models/Expense');
const cloudinary = require('cloudinary').v2;

// Verify Secondary Financial PIN
exports.verifyFinancePin = async (req, res) => {
  const { pin } = req.body;
  const expectedPin = process.env.EXPENSE_PIN || "1234"; // Default fallback if not set

  if (pin === expectedPin) {
    return res.json({ success: true, message: "Authorized" });
  } else {
    return res.status(401).json({ error: "Invalid Financial PIN" });
  }
};

// Get All Expenses & Summary Calculations
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    
    // Calculate total budget, total paid, and pending across all records
    let totalBudget = 0;
    let totalPaid = 0;

    expenses.forEach(exp => {
      totalBudget += exp.totalAmount || 0;
      exp.installments.forEach(inst => {
        if (inst.status === 'Paid') {
          totalPaid += inst.amount || 0;
        }
      });
    });

    const totalPending = totalBudget - totalPaid;

    res.json({
      expenses,
      summary: {
        totalBudget,
        totalPaid,
        totalPending
      }
    });
  } catch (error) {
    console.error("Fetch Expenses Error:", error);
    res.status(500).json({ error: "Server error fetching expenses" });
  }
};

// Create New Expense
exports.createExpense = async (req, res) => {
  try {
    const { expenseName, category, totalAmount, vendorContact, side, installments } = req.body;
    
    const newExpense = new Expense({
      expenseName,
      category,
      totalAmount,
      vendorContact,
      side,
      installments: installments || []
    });

    await newExpense.save();
    res.json({ success: true, expense: newExpense });
  } catch (error) {
    console.error("Create Expense Error:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
};

// Add/Update Installment with Optional Cloudinary Upload
exports.manageInstallment = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { amount, dueDate, paidDate, status, note } = req.body;
    
    let receiptUrl = "";
    if (req.file) {
      // If a file was uploaded via multer/cloudinary middleware
      receiptUrl = req.file.path; 
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    expense.installments.push({
      amount: Number(amount),
      dueDate,
      paidDate,
      status: status || 'Pending',
      note,
      receiptUrl
    });

    await expense.save();
    res.json({ success: true, expense });
  } catch (error) {
    console.error("Manage Installment Error:", error);
    res.status(500).json({ error: "Failed to update installment" });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.expenseId);
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
};

// Update Expense (Name, Category, Total Amount, Vendor Contact, Side)
exports.updateExpense = async (req, res) => {
    try {
      const { expenseId } = req.params;
      const { expenseName, category, totalAmount, vendorContact, side } = req.body;
  
      const updatedExpense = await Expense.findByIdAndUpdate(
        expenseId,
        { expenseName, category, totalAmount, vendorContact, side },
        { new: true }
      );
  
      if (!updatedExpense) return res.status(404).json({ error: "Expense not found" });
      res.json({ success: true, expense: updatedExpense });
    } catch (error) {
      console.error("Update Expense Error:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  };