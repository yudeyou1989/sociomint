'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-semibold text-white mb-4">出现了错误</h1>
        <p className="text-gray-400 mb-8">应用程序遇到了意外错误</p>
        <button onClick={reset} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">重试</button>
      </div>
    </div>
  );
}
