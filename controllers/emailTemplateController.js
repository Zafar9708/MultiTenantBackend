const EmailTemplate = require('../models/EmailTemplate');

const createTemplate = async (req, res) => {
    try {
        const template = new EmailTemplate(req.body);
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find();
        res.json(templates);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createTemplate,
    getAllTemplates
};

