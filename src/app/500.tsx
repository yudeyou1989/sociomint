export default function Custom500() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <h1 className="text-6xl font-bold text-red-400 mb-4">500</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">
          服务器错误
        </h2>
        
        <p className="text-gray-400 mb-8">
          服务器遇到了内部错误，请稍后再试。
        </p>
        
        <a 
          href="/"
          className="inline-block bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
