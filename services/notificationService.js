const Notification = require('../models/Notification');

// Create a new notification and emit real-time event
const createNotification = async (data, io = null) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    // Populate the notification
    const populatedNotification = await Notification.findById(notification._id)
      .populate('performedBy', 'username email')
      .populate('jobId', 'jobName jobTitle')
      .populate('candidateId', 'firstName lastName email')
      .populate('interviewId', 'date startTime platform round');

    // Emit real-time notification to admins in the tenant
    if (io) {
      console.log('Emitting notification to tenant:', data.tenantId.toString());
      
      // Check if there are any clients in the tenant room
      const room = io.sockets.adapter.rooms.get(data.tenantId.toString());
      const clientCount = room ? room.size : 0;
      console.log(`Clients in room ${data.tenantId}: ${clientCount}`);
      
      if (clientCount > 0) {
        io.to(data.tenantId.toString()).emit('new-notification', populatedNotification);
        console.log(`✓ Emitted real-time notification to tenant: ${data.tenantId}`);
      } else {
        console.log(`✗ No clients in room ${data.tenantId}, notification not emitted`);
      }
    }
    
    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for admin users
const getAdminNotifications = async (tenantId, limit = 20) => {
  try {
    const notifications = await Notification.find({ tenantId })
      .populate('performedBy', 'username email')
      .populate('jobId', 'jobName jobTitle')
      .populate('candidateId', 'firstName lastName email')
      .populate('interviewId', 'date startTime platform round')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notifications as read
const markAsRead = async (notificationIds, tenantId) => {
  try {
    await Notification.updateMany(
      { _id: { $in: notificationIds }, tenantId },
      { $set: { read: true } }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

// Get unread notification count for admin
const getUnreadCount = async (tenantId) => {
  try {
    const count = await Notification.countDocuments({ 
      tenantId, 
      read: false 
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getAdminNotifications,
  markAsRead,
  getUnreadCount
};