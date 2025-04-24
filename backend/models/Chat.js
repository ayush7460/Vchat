const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: String,  // Mobile numbers of participants
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}  // Will store mobile numbers as keys and unread counts as values
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on participants to ensure unique chats between two users
// ChatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);