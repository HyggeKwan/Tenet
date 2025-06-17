/**
 * Exchange rate fetcher module that retrieves current exchange rates for USD, JPY, CNY, EUR, and GBP against KRW
 * using the exchangerate.host API.
 */

export const fetchExchangeRates = async () => {
  const symbols = 'USD,JPY,CNY,EUR,GBP';
  const res = await fetch(`https://api.exchangerate.host/latest?base=KRW&symbols=${symbols}`);
  if (!res.ok) throw new Error('환율 데이터를 불러오지 못했습니다.');
  const data = await res.json();
  return {
    USD: (1 / data.rates.USD).toFixed(2),
    JPY: (1 / data.rates.JPY).toFixed(2),
    CNY: (1 / data.rates.CNY).toFixed(2),
    EUR: (1 / data.rates.EUR).toFixed(2),
    GBP: (1 / data.rates.GBP).toFixed(2),
  };
}; 