const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  dueDate: { type: String }, // Optional planned date
  paidDate: { type: String }, // Actual payment date
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  note: { type: String },
  receiptUrl: { type: String }, // Cloudinary URL for uploaded receipt/invoice
});

const expenseSchema = new mongoose.Schema({
  expenseName: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Venue', 'Food & Catering', 'Hotel & Stay', 'Transport', 'Decor', 'Photography', 'Gifts', 'Others'] 
  },
  totalAmount: { type: Number, required: true },
  vendorContact: { type: String }, // Optional phone/contact
  side: { type: String, enum: ['Both', 'Bride', 'Groom'], default: 'Both' },
  installments: [installmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);