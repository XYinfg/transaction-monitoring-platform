import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', to: '/', icon: '📊', roles: ['user', 'analyst', 'admin'] },
  { name: 'Accounts', to: '/accounts', icon: '💳', roles: ['user', 'analyst', 'admin'] },
  { name: 'Transactions', to: '/transactions', icon: '💸', roles: ['user', 'analyst', 'admin'] },
  { name: 'Analytics', to: '/analytics', icon: '📈', roles: ['user', 'analyst', 'admin'] },
  { name: 'Alerts', to: '/alerts', icon: '🚨', roles: ['analyst', 'admin'] },
  { name: 'Rules', to: '/rules', icon: '⚖️', roles: ['admin'] },
  { name: 'Profile', to: '/profile', icon: '👤', roles: ['user', 'analyst', 'admin'] },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  const filteredNavigation = navigation.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false,
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 z-50 flex w-64 flex-col bg-white
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-primary-600">FinTrace</h1>
        </div>

        <nav className="flex flex-1 flex-col gap-y-4 px-4 py-6">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {filteredNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`
                  }
                  onClick={() => onClose()}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
