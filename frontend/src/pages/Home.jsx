import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/api';
import ChatList from '../components/ChatList';
import NewChatForm from '../components/NewChatForm';
import { getSocket, initSocket } from '../services/socket';

const Home = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);


  useEffect(() => {
    // Initialize socket
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    socketRef.current = initSocket(token);

    const fetchChats = async () => {
      try {
        const response = await userService.getChats();
        setChats(response.data.chats || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError('Failed to load chats');
        setLoading(false);
      }
    };

    fetchChats();

    // Listen for new messages to update chat list
    socketRef.current.on('receive_message', (message) => {
      // Update chats when a new message arrives
      fetchChats();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
      }
    };
  }, [navigate]);

  const handleStartNewChat = async (mobile) => {
    try {
      const response = await userService.findByMobile(mobile);
      if (response.data) {
        // Check if chat already exists
        const existingChat = chats.find(chat => chat.participants.some(p => p.mobile === mobile));
        
        if (existingChat) {
          navigate(`/chat/${mobile}`);
        } else {
          // Start a new chat and redirect
          navigate(`/chat/${mobile}`);
        }
      }
    } catch (error) {
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