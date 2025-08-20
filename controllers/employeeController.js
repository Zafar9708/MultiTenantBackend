const Employee = require("../models/Employee");
const { sendWelcomeEmail } = require("../services/emailService");


exports.createEmployee = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const { tenantId } = req.user;


    // Validate input
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false,
        error: "Name, email and role are required" 
      });
    }


    // Check if employee already exists in this tenant
    const existingEmployee = await Employee.findOne({ email, tenantId });
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: "Employee with this email already exists"
      });
    }


    const employee = await Employee.create({ 
      name, 
      email, 
      role,
      tenantId
    });


    // Send welcome email
    try {
      await sendWelcomeEmail(email, name, role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }


    res.status(201).json({
      success: true,
      data: employee
    });


  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


exports.getEmployees = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { role, isActive } = req.query;


    // Build filter
    const filter = { tenantId };
    if (role) filter.role = role;
    if (isActive) filter.isActive = isActive === 'true';


    const employees = await Employee.find(filter)
      .sort({ name: 1 })
      .select('-__v');


    res.json({
      success: true,
      count: employees.length,
      data: employees
    });


  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


exports.getEmployeeById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenantId
    }).select('-__v');


    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }


    res.json({
      success: true,
      data: employee
    });


  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


exports.updateEmployee = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, role, isActive } = req.body;


    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, role, isActive },
      { new: true, runValidators: true }
    ).select('-__v');


    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }


    res.json({
      success: true,
      data: employee
    });


  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


exports.deleteEmployee = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      tenantId
    });


    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }


    res.json({
      success: true,
      data: {}
    });


  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};