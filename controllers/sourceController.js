const Source = require("../models/Source");
const AppError = require("../utils/appError");

// @desc    Get all sources for a tenant
// @route   GET /api/v1/sources
// @access  Private (Recruiter/Admin)
exports.getSources = async (req, res) => {
  const { tenantId } = req.user; // Assuming tenantId comes from auth middleware

  const sources = await Source.find({ tenantId }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: sources.length,
    data: sources,
  });
};

// @desc    Add a new source (default or custom)
// @route   POST /api/v1/sources
// @access  Private (Admin)
exports.addSource = async (req, res,next) => {
  const { tenantId } = req.user;
  const { name, isCustom = false } = req.body;

  // Check if source already exists for this tenant
  const existingSource = await Source.findOne({ name, tenantId });
  if (existingSource) {
    throw next(new AppError("Source already exists"));
  }

  const source = await Source.create({
    name,
    isCustom,
    tenantId,
  });

  res.status(201).json({
    success: true,
    data: source,
  });
};

// @desc    Update a source
// @route   PUT /api/v1/sources/:id
// @access  Private (Admin)
exports.updateSource = async (req, res,next) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name } = req.body;

  const source = await Source.findOneAndUpdate(
    { _id: id, tenantId },
    { name },
    { new: true, runValidators: true }
  );

  if (!source) {
    throw next(new AppError(`Source not found with id ${id}`));
  }

  res.status(200).json({
    success: true,
    data: source,
  });
};

// @desc    Delete a source (only custom sources can be deleted)
// @route   DELETE /api/v1/sources/:id
// @access  Private (Admin)
exports.deleteSource = async (req, res,next) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const source = await Source.findOne({ _id: id, tenantId });

  if (!source) {
    throw next(new AppError(`Source not found with id ${id}`));
  }

  // Prevent deletion of default sources
  if (!source.isCustom) {
    throw next (new AppError("Cannot delete default sources"));
  }

  await source.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
};




exports.initializeDefaultSources = async (req, res) => {
  const { tenantId } = req.user;

  await Source.initializeDefaults(tenantId);

  res.status(200).json({
    success: true,
    message: "Default sources initialized",
  });
};