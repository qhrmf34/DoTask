export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-primary-500 p-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl">DoTask</span>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-white/90 text-2xl font-semibold leading-snug">
            할일을 관리하고<br />크루와 함께 성장하세요
          </p>
          <p className="text-white/60 text-sm">포모도로 타이머, 크루 채팅, 게시판까지</p>
        </div>
        <div className="flex gap-2">
          {['집중', '협업', '성장'].map((t) => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-white/15 text-white/80">{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">DoTask</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
