const {
  createNotification,
  getAdminNotifications,
  markAsRead,
  getUnreadCount
} = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const { limit } = req.query;
    const { tenantId, role } = req.user;
    
    // Only admins can view notifications
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins can view notifications.'
      });
    }
    
    const notifications = await getAdminNotifications(tenantId, limit);
    
    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const { tenantId, role } = req.user;
    
    // Only admins can mark notifications as read
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins can mark notifications as read.'
      });
    }
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: 'Notification IDs array is required'
      });
    }
    
    await markAsRead(notificationIds, tenantId);
    
    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const { tenantId, role } = req.user;
    
    // Only admins can view notification count
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins can view notification count.'
      });
    }
    
    const count = await getUnreadCount(tenantId);
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread notification count'
    });
  }
};

module.exports = {
  createNotification, // Make sure this is exported
  getNotifications,
  markNotificationsAsRead,
  getUnreadNotificationCount
};