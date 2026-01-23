"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// GET /api/users/profile - current user profile
router.get("/profile", auth_1.authMiddleware, async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ message: "Not authenticated" });
    const user = await User_1.User.findById(req.userId).select("email name role createdAt");
    if (!user)
        return res.status(404).json({ message: "User not found" });
    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
    });
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map