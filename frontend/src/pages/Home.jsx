import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/api';
import ChatList from '../components/ChatList';
import NewChatForm from '../components/NewChatForm';
import { initSocket } from '../services/socket';

const Home = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const fetchChats = async () => {
    try {
      const response = await userService.getChats();
      // Check the response format and set chats correctly
      console.log("Chats response:", response.data);
      if (Array.isArray(response.data)) {
        setChats(response.data);
      } else if (response.data && Array.isArray(response.data.chats)) {
        setChats(response.data.chats);
      } else {
        setChats([]); // Fallback to empty array
        console.error("Unexpected chats format:", response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError('Failed to load chats');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize socket
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    socketRef.current = initSocket(token);

    fetchChats();

    // Socket event listeners for real-time updates
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server from Home');
    });

    socketRef.current.on('receive_message', (message) => {
      console.log('Message received in Home:', message);
      // Update chats when a new message arrives
      fetchChats();
    });
    
    socketRef.current.on('new_message_notification', (data) => {
      console.log('New message notification:', data);
      fetchChats();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('new_message_notification');
      }
    };
  }, [navigate]);


  const handleStartNewChat = async (mobile) => {
    try {
      // Clear previous errors
      setError('');
      
      // Don't allow chat with yourself
      if (mobile === currentUser.mobile) {
        setError("You can't chat with yourself");
        return;
      }
      
      // Check if the user exists
      const userResponse = await userService.findByMobile(mobile);
      console.log("User found:", userResponse.data);
      
      // Navigate to chat with this user
      navigate(`/chat/${mobile}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      if (error.response && error.response.status === 404) {
        setError('User not found. Make sure they are registered.');
      } else {
        setError('Failed to start chat. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChatClick = (chatId, otherUserMobile) => {
    navigate(`/chat/${otherUserMobile}`);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h2>Chat App</h2>
        <div className="user-info">
          <span>{currentUser?.mobile}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="home-content">
        <NewChatForm onSubmit={handleStartNewChat} error={error} />
        
        {loading ? (
          <div className="loading">Loading chats...</div>
        ) : (
          <ChatList 
            chats={chats} 
            currentUserMobile={currentUser?.mobile} 
            onChatClick={handleChatClick}
          />
        )}
      </div>
    </div>
  );
};

export default Home;