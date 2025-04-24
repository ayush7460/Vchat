const User = require('../models/User');
const Chat = require('../models/Chat');

// Find a user by mobile number
exports.findByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;
    
    const user = await User.findOne({ mobile }).select('-__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all chats for the current user
// Get all chats for the current user
exports.getChats = async (req, res) => {
  try {
    const userMobile = req.user.mobile;
    
    const chats = await Chat.find({ participants: userMobile })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    
    // Get the other participant's information for each chat
    const chatData = await Promise.all(chats.map(async (chat) => {
      // Find the other participant mobile number
      const otherParticipantMobile = chat.participants.find(p => p !== userMobile);
      const otherParticipant = await User.findOne({ mobile: otherParticipantMobile }).select('-__v');
      
      // Get unread count for current user
      const unreadCount = (chat.unreadCounts && chat.unreadCounts[userMobile]) || 0;
      
      return {
        _id: chat._id,
        participants: [
          { mobile: userMobile },
          { mobile: otherParticipant.mobile, profilePicture: otherParticipant.profilePicture }
        ],
        lastMessage: chat.lastMessage,
        unreadCount: unreadCount,
        updatedAt: chat.updatedAt
      };
    }));
    
    res.json(chatData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};