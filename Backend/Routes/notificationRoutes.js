const express = require("express");
const router = express.Router();
const { Notification } = require("../Model");
const { protect } = require("../MiddleWare/auth");

router.use(protect);

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipientId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 30,
    });
    const unreadCount = await Notification.count({
      where: { recipientId: req.user.id, isRead: false },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, recipientId: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { recipientId: req.user.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
