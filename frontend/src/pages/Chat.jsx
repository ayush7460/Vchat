import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { messageService } from '../services/api';
import { initSocket } from '../services/socket';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const { mobile } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Initialize socket
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    socketRef.current = initSocket(token);

    // Fetch messages
    const getMessages = async () => {
      try {
        const response = await messageService.getMessages(mobile);
        console.log("Message response:", response.data);
        
        if (response.data && Array.isArray(response.data.messages)) {
          setMessages(response.data.messages);
          setChatId(response.data.chatId);
          
          // Mark messages as read via socket
          if (response.data.chatId && socketRef.current) {
            socketRef.current.emit('mark_read', {
              chatId: response.data.chatId,
              sender: mobile
            });
          }
        } else {
          console.error("Expected messages array, got:", response.data);
          setError("Invalid message format from server");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError('Failed to load messages');
        setLoading(false);
      }
    };

    getMessages();

    // Set up socket listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server in Chat');
    });

    socketRef.current.on('receive_message', (message) => {
      console.log('Received message in Chat:', message);
      // Add message to state if it belongs to this chat
      if ((message.sender === mobile && message.receiver === currentUser.mobile) ||
          (message.sender === currentUser.mobile && message.receiver === mobile)) {
        setMessages(prev => [...prev, message]);
        
        // Mark message as read if receiver is current user
        if (message.sender === mobile && message.receiver === currentUser.mobile && chatId) {
          socketRef.current.emit('mark_read', {
            chatId: chatId,
            sender: mobile
          });
        }
      }
    });

    // Clean up
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
      }
    };
  }, [mobile, currentUser, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text) => {
    try {
      const messageData = {
        receiver: mobile,
        text: text
      };
      
      // If we have a chatId, include it in the request
      if (chatId) {
        messageData.chatId = chatId;
      }
      
      const response = await messageService.sendMessage(mobile, text, chatId);
      console.log("Message sent response:", response.data);
      
      // Optionally, for immediate feedback, you can add the message to state:
      const newMessage = {
        _id: Date.now(), // Temporary ID until server message arrives
        sender: currentUser.mobile,
        receiver: mobile,
        text: text,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError('Failed to send message');
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <button className="back-btn" onClick={handleBackClick}>Back</button>
        <div className="chat-user-info">
          <h3>{otherUser ? otherUser.mobile : mobile}</h3>
        </div>
      </header>

      <div className="chat-content">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <MessageList 
            messages={messages} 
            currentUserMobile={currentUser.mobile} 
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chat;