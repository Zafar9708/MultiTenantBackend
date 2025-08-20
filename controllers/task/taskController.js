const Task = require('../../models/Task');
const User=require('../../models/User')
const AppError = require('../../utils/appError');

exports.createTask = async (req, res, next) => {
  try {
    console.log('Creating task with:', {
      body: req.body,
      user: { id: req.user.id, role: req.user.role, tenantId: req.user.tenantId }
    });

    const { title, description, dueDate } = req.body;
    const { id: userId, role: userRole, tenantId } = req.user;

    if (!title) {
      console.error('Validation failed: Title is required');
      return next(new AppError('Title is required', 400));
    }

    let assignedTo = userId; 
    if (req.body.assignedTo) {
      if (userRole === 'recruiter') {
        console.error('Permission denied: Recruiter trying to assign to others');
        return next(new AppError('Recruiters can only assign tasks to themselves', 403));
      }
      assignedTo = req.body.assignedTo;
    }

    if (userRole !== 'superadmin') {
      console.log('Verifying assignee:', assignedTo);
      const assignee = await User.findOne({
        _id: assignedTo,
        tenantId: tenantId
      }).select('_id');
      
      if (!assignee) {
        console.error('Assignee verification failed:', {
          assigneeId: assignedTo,
          tenantId
        });
        return next(new AppError('User not found in your tenant', 404));
      }
    }

    const taskData = {
      title,
      description,
      assignedTo,
      tenantId,
      status: 'pending',
      ...(dueDate && { dueDate: new Date(dueDate) })
    };

    console.log('Creating task with data:', taskData);

    const task = await Task.create(taskData);
    console.log('Task created successfully:', task._id);

    res.status(201).json({
      status: 'success',
      data: {
        task: {
          id: task._id,
          title: task.title,
          assignedTo: task.assignedTo,
          status: task.status,
          ...(task.dueDate && { dueDate: task.dueDate })
        }
      }
    });

  } catch (err) {
    console.error('Task creation failed:', {
      error: err.message,
      stack: err.stack,
      ...(err.errors && { mongoErrors: err.errors })
    });

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
    }

    if (err.name === 'CastError') {
      return next(new AppError('Invalid ID format', 400));
    }

    if (err.code === 11000) {
      return next(new AppError('Duplicate task detected', 409));
    }

    next(new AppError('Failed to create task', 500));
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    let query = { tenantId: req.user.tenantId };
    
    if (req.user.role === 'recruiter') {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'username email');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (err) {
    next(new AppError('Failed to fetch tasks', 500));
  }
};