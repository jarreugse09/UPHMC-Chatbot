"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConversationTitle = exports.deleteConversation = exports.createConversation = exports.getConversation = exports.getConversations = void 0;
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation_1.default.find({ userId: req.user?.userId })
            .sort({ updatedAt: -1 })
            .limit(50);
        res.json({ conversations });
    }
    catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
};
exports.getConversations = getConversations;
const getConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation_1.default.findOne({
            _id: id,
            userId: req.user?.userId,
        });
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        const messages = await Message_1.default.find({ conversationId: id }).sort({
            timestamp: 1,
        });
        res.json({ conversation, messages });
    }
    catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ message: "Failed to fetch conversation" });
    }
};
exports.getConversation = getConversation;
const createConversation = async (req, res) => {
    try {
        const { title } = req.body;
        const conversation = new Conversation_1.default({
            userId: req.user?.userId,
            title: title || "New Conversation",
        });
        await conversation.save();
        res.status(201).json({ conversation });
    }
    catch (error) {
        console.error("Create conversation error:", error);
        res.status(500).json({ message: "Failed to create conversation" });
    }
};
exports.createConversation = createConversation;
const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation_1.default.findOneAndDelete({
            _id: id,
            userId: req.user?.userId,
        });
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        await Message_1.default.deleteMany({ conversationId: id });
        res.json({ message: "Conversation deleted successfully" });
    }
    catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({ message: "Failed to delete conversation" });
    }
};
exports.deleteConversation = deleteConversation;
const updateConversationTitle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const conversation = await Conversation_1.default.findOneAndUpdate({ _id: id, userId: req.user?.userId }, { title }, { new: true });
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.json({ conversation });
    }
    catch (error) {
        console.error("Update conversation error:", error);
        res.status(500).json({ message: "Failed to update conversation" });
    }
};
exports.updateConversationTitle = updateConversationTitle;
