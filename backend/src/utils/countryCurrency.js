const DEFAULT_CURRENCY = "USD";

const getCurrencyByCountry = async (countryName) => {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
        if (!response.ok) {
            return DEFAULT_CURRENCY;
        }

        const countries = await response.json();
        const normalizedTarget = String(countryName || "").trim().toLowerCase();

        const match = countries.find((country) => {
            const common = country?.name?.common ? String(country.name.common).toLowerCase() : "";
            const official = country?.name?.official ? String(country.name.official).toLowerCase() : "";
            return common === normalizedTarget || official === normalizedTarget;
        });

        if (!match || !match.currencies) {
            return DEFAULT_CURRENCY;
        }

        const firstCurrencyCode = Object.keys(match.currencies)[0];
        return firstCurrencyCode || DEFAULT_CURRENCY;
    } catch (error) {
        return DEFAULT_CURRENCY;
    }
};

module.exports = { getCurrencyByCountry, DEFAULT_CURRENCY };
