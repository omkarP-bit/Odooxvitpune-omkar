const computeDueAt = ({ createdAt = new Date(), hours = 24 }) => {
    const due = new Date(createdAt);
    due.setHours(due.getHours() + Number(hours || 24));
    return due;
};

module.exports = { computeDueAt };
