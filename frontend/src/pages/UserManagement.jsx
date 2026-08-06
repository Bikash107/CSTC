import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { RoleBadge } from '../components/Badges';
import { getUsers, updateUserRole } from '../api/api';
import { useToast } from '../context/ToastContext';

const ROLES = ['customer', 'agent', 'admin'];

export default function UserManagement() {
  const toast = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    getUsers()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated successfully!');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="dashboard-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage user roles — promote customers to agents or admins</p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            type="search"
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        {loading ? (
          <div className="loading-spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No users found</h3>
          </div>
        ) : (
          <div className="users-table">
            <div className="users-header">
              <span>Name</span>
              <span className="col-email">Email</span>
              <span>Role</span>
              <span>Change Role</span>
            </div>
            {filtered.map((u) => (
              <div key={u._id} className="user-row">
                <div className="user-name">{u.name}</div>
                <div className="user-email col-email">{u.email}</div>
                <RoleBadge role={u.role} />
                <select
                  className="form-select"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={updating === u._id}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
