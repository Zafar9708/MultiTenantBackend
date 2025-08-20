const Client = require('../models/Client');
const AppError = require('../utils/appError');

exports.addClient = async (req, res,next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new AppError("Clent name is required",))
        }
        const existing = await Client.findOne({ name });
        if (existing) {
            return next(new AppError("Client Already exits"))
        }

        const client = new Client({ name });
        await client.save();

        res.status(201).json({ success: true, message: 'Client added successfully', client });
    } catch (error) {
        console.error('Add Client Error:', error);
        return next(new AppError("Failed to add Client"))
    }
};

exports.getClients = async (req, res,next) => {
    try {
        const clients = await Client.find().sort({ name: 1 });
        res.status(200).json({ success: true, clients });
    } catch (error) {
        console.error('Get Clients Error:', error);
        return next(new AppError("Unable to fetch client"))
    }
};

exports.deleteClient = async (req, res,next) => {
    try {
        const clientId = req.params.id;

        const deleted = await Client.findByIdAndDelete(clientId);
        if (!deleted) {
            return next(new AppError("Client not found"))
        }

        res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete Client Error:', error);
        return next(new AppError("Unable to delete Client"))
    }
};


