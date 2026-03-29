const convertCurrency = async ({ amount, fromCurrency, toCurrency }) => {
    if (String(fromCurrency).toUpperCase() === String(toCurrency).toUpperCase()) {
        return Number(amount);
    }

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${String(fromCurrency).toUpperCase()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch conversion rates");
    }

    const data = await response.json();
    const rate = data?.rates?.[String(toCurrency).toUpperCase()];

    if (!rate) {
        throw new Error(`Conversion rate not available for ${toCurrency}`);
    }

    return Number((Number(amount) * Number(rate)).toFixed(2));
};

module.exports = { convertCurrency };
