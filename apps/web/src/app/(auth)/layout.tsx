export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-500 mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DoTask</h1>
          <p className="text-sm text-gray-500 mt-1">할일 관리와 크루 공유 플랫폼</p>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  );
}
