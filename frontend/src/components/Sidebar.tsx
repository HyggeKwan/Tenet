import ExchangeRateWidget from './ExchangeRateWidget';

/**
 * 사이드바 컴포넌트
 * 카테고리 메뉴와 실시간 환율 위젯을 포함합니다.
 */
const Sidebar = () => {
  return (
    <aside className="p-4 border-r border-gray-200 w-64 h-screen">
      <h2 className="font-bold mb-2">카테고리</h2>
      <ul className="mb-4 space-y-2">
        <li className="cursor-pointer hover:text-blue-600 transition-colors">📂 홈</li>
        <li className="cursor-pointer hover:text-blue-600 transition-colors">📈 차트</li>
        <li className="cursor-pointer hover:text-blue-600 transition-colors">💱 환율</li>
      </ul>

      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <h3 className="text-md font-semibold mb-1">💱 실시간 환율</h3>
        <ExchangeRateWidget />
      </div>
    </aside>
  );
};

export default Sidebar; 