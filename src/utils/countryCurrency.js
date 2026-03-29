const DEFAULT_CURRENCY = 'INR';

const getCurrencyByCountry = async (countryName) => {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=currencies`);
    if (!response.ok) return DEFAULT_CURRENCY;

    const [country] = await response.json();
    const firstCurrencyCode = Object.keys(country?.currencies || {})[0];
    return firstCurrencyCode || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

module.exports = { getCurrencyByCountry, DEFAULT_CURRENCY };
