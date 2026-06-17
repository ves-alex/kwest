import { NavLink } from 'react-router-dom'
import { TABS } from '../navigation'

export default function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-forge-light bg-charcoal/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon, path }) => (
          <li key={id} className="flex-1">
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `group relative flex w-full flex-col items-center gap-1 px-2 py-3 transition-colors ${
                  isActive ? 'is-active' : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-6 top-0 h-px bg-ember"
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={
                      isActive
                        ? 'text-ember drop-shadow-[0_0_6px_rgba(124,45,18,0.6)]'
                        : 'text-ash transition-colors group-hover:text-cream'
                    }
                  />
                  <span
                    className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${
                      isActive ? 'text-cream' : 'text-ash group-hover:text-cream'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
