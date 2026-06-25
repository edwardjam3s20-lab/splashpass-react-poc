import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" strokeWidth={active ? 0 : 2} fill={active ? 'white' : 'none'} />
      </svg>
    ),
  },
  {
    to: '/discover',
    label: 'Discover',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" fill={active ? 'currentColor' : 'none'} />
        <path d="M21 21l-4.3-4.3" stroke={active ? 'currentColor' : 'currentColor'} />
      </svg>
    ),
  },
  {
    to: '/bookings',
    label: 'Bookings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="3" fill={active ? 'currentColor' : 'none'} />
        <path d="M8 2v4M16 2v4M3 10h18" stroke={active ? 'white' : 'currentColor'} />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Account',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export function AppShell() {
  return (
    <div className="relative h-full w-full">
      <div className="h-full overflow-y-auto pb-[88px]">
        <Outlet />
      </div>

      {/* Floating pill nav */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-[100] flex rounded-[26px] p-2"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(235,235,237,0.8)',
          boxShadow: '0 8px 40px rgba(10,20,55,0.14), 0 2px 8px rgba(10,20,55,0.06)',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'relative flex flex-1 flex-col items-center gap-[3px] rounded-[18px] py-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-light',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-[18px]"
                    style={{ background: 'rgba(10,132,255,0.08)' }}
                  />
                )}
                <span
                  className="relative flex h-7 w-7 items-center justify-center transition-transform duration-200"
                  style={{ transform: isActive ? 'translateY(-1px)' : 'none' }}
                >
                  {item.icon(isActive)}
                </span>
                <span className="relative">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
