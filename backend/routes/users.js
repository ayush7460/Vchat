// backend/routes/users.js - Correct the route
const express = require('express');
const usersController = require('../controllers/users');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all chats for current user
router.get('/chats/all', authMiddleware, usersController.getChats);  // Fixed route

// Get user by mobile number
router.get('/:mobile', authMiddleware, usersController.findByMobile);

module.exports = router;