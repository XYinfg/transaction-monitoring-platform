import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account information
        </p>
      </div>

      <div className="card">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <div className="text-sm text-gray-900">{user.firstName}</div>
            </div>

            <div>
              <label className="label">Last name</label>
              <div className="text-sm text-gray-900">{user.lastName}</div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="text-sm text-gray-900">{user.email}</div>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="text-sm">
                <span className="badge badge-info capitalize">{user.role}</span>
              </div>
            </div>

            <div>
              <label className="label">User ID</label>
              <div className="text-sm text-gray-600 font-mono">{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
