"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversationController_1 = require("../controllers/conversationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.get("/", conversationController_1.getConversations);
router.get("/:id", conversationController_1.getConversation);
router.post("/", conversationController_1.createConversation);
router.delete("/:id", conversationController_1.deleteConversation);
router.patch("/:id/title", conversationController_1.updateConversationTitle);
exports.default = router;
