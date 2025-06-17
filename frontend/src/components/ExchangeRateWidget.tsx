import { useExchangeRate } from '../hooks/useExchangeRate';

/**
 * 실시간 환율 정보를 보여주는 위젯 컴포넌트
 * Tailwind CSS를 사용하여 스타일링되어 있습니다.
 */
const ExchangeRateWidget = () => {
  const { rates, error } = useExchangeRate();

  if (error) return <div className="text-red-500 text-sm">환율 로딩 실패</div>;
  if (!rates) return <div className="text-sm text-gray-500">환율 불러오는 중...</div>;

  return (
    <div className="text-sm space-y-1">
      <p>💵 USD: {rates.USD} 원</p>
      <p>💴 JPY: {rates.JPY} 원</p>
      <p>💶 EUR: {rates.EUR} 원</p>
      <p>🇨🇳 CNY: {rates.CNY} 원</p>
      <p>💷 GBP: {rates.GBP} 원</p>
    </div>
  );
};

export default ExchangeRateWidget; 