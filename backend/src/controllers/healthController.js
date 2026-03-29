const healthCheck = (req, res) => {
    res.status(200).json({ message: "Backend is running" });
};

module.exports = { healthCheck };
