import express from "express";

const router = express.Router();

router.get("/chat", (req, res) => {
    res.send("Chat Page");
});

export default router;