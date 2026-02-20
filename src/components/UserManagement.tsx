'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'operator',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    setShowAddUser(false);
    setNewUser({ email: '', password: '', role: 'operator', firstName: '', lastName: '' });
    fetchUsers();
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    fetchUsers();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Add User
        </button>
      </div>

      {showAddUser && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-bold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="First Name"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="px-3 py-2 border rounded"
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
            >
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-6 py-4">{user.first_name} {user.last_name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleUserActive(user.id, user.is_active)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {user.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
