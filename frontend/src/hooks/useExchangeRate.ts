import { useEffect, useState } from 'react';
import { fetchExchangeRates } from '../api/exchangeRateFetcher';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5분

/**
 * 환율 정보를 가져오고 5분마다 업데이트하는 커스텀 훅
 * 
 * @returns {Object} rates - 각 통화별 환율 정보
 * @returns {Object} error - 에러 발생 시 에러 메시지
 * 
 * @example
 * const { rates, error } = useExchangeRate();
 * if (rates) {
 *   console.log('USD:', rates.USD);
 *   console.log('JPY:', rates.JPY);
 * }
 */
export const useExchangeRate = () => {
  const [rates, setRates] = useState<{ [key: string]: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRates = async () => {
    try {
      const data = await fetchExchangeRates();
      setRates(data);
      setError(null);
    } catch (e) {
      setError('불러오기 실패');
    }
  };

  useEffect(() => {
    loadRates(); // 처음 로딩
    const interval = setInterval(loadRates, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { rates, error };
}; 