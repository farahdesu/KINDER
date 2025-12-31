import React, { useState, useEffect } from 'react';
import './AdminUserStatus.css';
import api from '../../services/api';

const AdminUserStatus = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    accountStatus: 'active',
    accountStatusReason: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users?limit=100');
      setUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setStatusForm({
      accountStatus: user.accountStatus || 'active',
      accountStatusReason: user.accountStatusReason || ''
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/admin/users/${selectedUser._id}/status`, {
        accountStatus: statusForm.accountStatus,
        accountStatusReason: statusForm.accountStatusReason
      });

      // Update user in list
      setUsers(users.map(u => 
        u._id === selectedUser._id 
          ? { 
              ...u, 
              accountStatus: statusForm.accountStatus,
              accountStatusReason: statusForm.accountStatusReason
            }
          : u
      ));

      setShowStatusModal(false);
      setSelectedUser(null);
      alert('User status updated successfully!');
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#4caf50',
      warned: '#ff9800',
      banned: '#f44336'
    };
    return colors[status] || '#999';
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-user-status">
      <h2>👥 User Account Status Management</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(user.accountStatus) }}
                  >
                    {user.accountStatus || 'active'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit-status"
                    onClick={() => handleOpenStatusModal(user)}
                  >
                    Change Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowStatusModal(false)}
            >
              ✕
            </button>

            <h3>Change User Status</h3>
            <p><strong>{selectedUser.name}</strong> ({selectedUser.email})</p>

            <div className="form-group">
              <label>Account Status:</label>
              <select 
                value={statusForm.accountStatus}
                onChange={(e) => setStatusForm(prev => ({ ...prev, accountStatus: e.target.value }))}
              >
                <option value="active">🟢 Active - All features available</option>
                <option value="warned">🟠 Warned - Gets notification, all features work</option>
                <option value="banned">🔴 Banned - Can login but no booking feature</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reason (optional):</label>
              <textarea 
                value={statusForm.accountStatusReason}
                onChange={(e) => setStatusForm(prev => ({ ...prev, accountStatusReason: e.target.value }))}
                placeholder="Reason for status change..."
                rows="3"
              />
            </div>

            <button 
              className="btn-save"
              onClick={handleUpdateStatus}
            >
              Update Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserStatus;
