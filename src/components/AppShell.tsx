import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    to: '/plans',
    label: 'Plans',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
        <path d="M7 15h2m4 0h4" />
      </svg>
    ),
  },
  {
    to: '/loyalty',
    label: 'Rewards',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Account',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
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

      <nav className="fixed bottom-3 left-3 right-3 z-[100] flex rounded-[26px] border border-slate-200/70 bg-white/97 p-2 shadow-[0_8px_40px_rgba(11,20,55,0.16),0_2px_8px_rgba(11,20,55,0.08)] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'relative flex flex-1 flex-col items-center gap-1 rounded-[18px] py-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
                isActive ? 'text-accent' : 'text-muted-2',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-[3px] bg-accent" />
                )}
                <span
                  className={[
                    'flex h-7 w-7 items-center justify-center transition-transform',
                    isActive ? '-translate-y-px' : '',
                  ].join(' ')}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
