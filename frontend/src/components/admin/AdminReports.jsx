import React, { useState, useEffect } from 'react';
import './AdminReports.css';
import api from '../../services/api';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Filter and pagination state
  const [filters, setFilters] = useState({
    status: 'all',
    userStatus: 'all',
    limit: 10,
    page: 1
  });

  const [updateForm, setUpdateForm] = useState({
    status: '',
    resolution: '',
    userStatus: '',
    adminNotes: ''
  });

  // Fetch reports
  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        status: filters.status,
        limit: filters.limit,
        page: filters.page
      });

      const response = await api.get(`/reports/admin/all?${params}`);
      let filteredReports = response.data.data.reports;
      
      // Filter by user account status
      if (filters.userStatus !== 'all') {
        filteredReports = filteredReports.filter(
          report => report.reportedUserId?.accountStatus === filters.userStatus
        );
      }
      
      setReports(filteredReports);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'status' ? 1 : prev.page // Reset page on status filter change
    }));
  };

  const handleOpenDetail = async (report) => {
    try {
      const response = await api.get(`/reports/admin/${report._id}`);
      setSelectedReport(response.data.data);
      setUpdateForm({
        status: response.data.data.status,
        resolution: response.data.data.resolution || '',
        userStatus: response.data.data.reportedUserId?.accountStatus || 'active',
        adminNotes: response.data.data.adminNotes || ''
      });
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load report details');
    }
  };

  const handleUpdateReport = async () => {
    setUpdateLoading(true);
    setUpdateError('');
    try {
      // Update report status
      const reportResponse = await api.put(`/reports/admin/${selectedReport._id}`, {
        status: updateForm.status,
        resolution: updateForm.resolution || undefined,
        adminNotes: updateForm.adminNotes
      });

      // Update user account status if changed
      if (updateForm.userStatus && updateForm.userStatus !== selectedReport.reportedUserId?.accountStatus) {
        await api.put(`/admin/users/${selectedReport.reportedUserId._id}/status`, {
          accountStatus: updateForm.userStatus,
          accountStatusReason: `Status changed via report #${selectedReport._id.slice(-6)}`
        });
      }

      // Update the report in the list
      setReports(reports.map(r => r._id === selectedReport._id ? reportResponse.data.data : r));
      setSelectedReport(reportResponse.data.data);
      setUpdateForm({
        status: reportResponse.data.data.status,
        resolution: reportResponse.data.data.resolution || '',
        userStatus: updateForm.userStatus,
        adminNotes: reportResponse.data.data.adminNotes || ''
      });

      // Refresh stats
      fetchStats();
      alert('Report and user status updated successfully!');
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update report');
      console.error('Error updating report:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#ff6b6b',
      under_review: '#ffd93d',
      resolved: '#6bcf7f',
      dismissed: '#999999'
    };
    return colors[status] || '#000';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#87ceeb',
      medium: '#ffa500',
      high: '#ff6b6b',
      critical: '#8b0000'
    };
    return colors[severity] || '#000';
  };

  const getResolutionColor = (resolution) => {
    const colors = {
      warning: '#ffa500',
      suspension: '#ff6b6b',
      ban: '#8b0000',
      no_action: '#999999'
    };
    return colors[resolution] || '#999999';
  };

  return (
    <div className="admin-reports">
      {/* Removed Report Management title and stats dashboard */}

      {/* Filters */}
      <div className="filters-section">
        <label>
          Filter by Status:
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>

        <label>
          Filter by User Status:
          <select 
            value={filters.userStatus} 
            onChange={(e) => handleFilterChange('userStatus', e.target.value)}
            className="user-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="warned">Warned</option>
            <option value="banned">Banned</option>
          </select>
        </label>

        <label>
          Items Per Page:
          <select 
            value={filters.limit} 
            onChange={(e) => handleFilterChange('limit', e.target.value)}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reports-table-container">
        {loading ? (
          <p className="loading">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="no-data">No reports found.</p>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Report Status</th>
                <th>User Status</th>
                <th>Category</th>
                <th>Booking</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id}>
                  <td className="report-id">{report._id.slice(-6)}</td>
                  <td>{report.reporterId?.name || 'Unknown'}</td>
                  <td>
                    <strong>{report.reportedUserId?.name || 'Unknown'}</strong>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(report.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {report.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(report.reportedUserId?.accountStatus || 'active'),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {(report.reportedUserId?.accountStatus || 'active').charAt(0).toUpperCase() + (report.reportedUserId?.accountStatus || 'active').slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className="badge-category">{report.category}</span>
                  </td>
                  <td>
                    {report.bookingId ? (
                      <span className="badge-booking">
                        {report.bookingId?.date?.split('T')[0]}
                        <br />
                        <small>Reports: {report.reportCountForBooking}/2</small>
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td className="date-cell">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      className="btn-view"
                      onClick={() => handleOpenDetail(report)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowDetailModal(false)}
            >
              ✕
            </button>

            <h3>Change User Account Status</h3>

            <div className="detail-section">
              <div className="detail-row">
                <strong>Reporter:</strong>
                <span>{selectedReport.reporterId?.name} ({selectedReport.reporterId?.email})</span>
              </div>
              <div className="detail-row">
                <strong>Reported User:</strong>
                <span>{selectedReport.reportedUserId?.name} ({selectedReport.reportedUserId?.email})</span>
              </div>
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedReport.category}</span>
              </div>
              <div className="detail-row">
                <strong>Severity:</strong>
                <span style={{ color: getSeverityColor(selectedReport.severity) }}>
                  {selectedReport.severity}
                </span>
              </div>
              {selectedReport.bookingId && (
                <div className="detail-row">
                  <strong>Related Booking:</strong>
                  <span>
                    {selectedReport.bookingId?.date?.split('T')[0]} 
                    {selectedReport.bookingId?.startTime && ` ${selectedReport.bookingId.startTime}`}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <strong>Description:</strong>
                <p className="description">{selectedReport.description}</p>
              </div>
            </div>

            <div className="detail-section">
              <h4>Admin Action</h4>
              
              <div className="form-group">
                <label>Change User Account Status:</label>
                <select 
                  value={updateForm.userStatus || selectedReport.reportedUserId?.accountStatus || 'active'}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, userStatus: e.target.value }))}
                  className="user-status-select"
                >
                  <option value="active">Active</option>
                  <option value="warned">Warned</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Report Status:</label>
                <select 
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea 
                  value={updateForm.adminNotes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Add notes..."
                  rows="3"
                />
              </div>

              {updateError && <div className="error-message">{updateError}</div>}

              <button 
                className="btn-update"
                onClick={handleUpdateReport}
                disabled={updateLoading}
              >
                {updateLoading ? 'Updating...' : 'Update'}
              </button>
            </div>

            {selectedReport.adminNotes && (
              <div className="detail-section">
                <h4>Previous Admin Notes</h4>
                <p className="admin-notes">{selectedReport.adminNotes}</p>
              </div>
            )}

            {selectedReport.resolvedAt && (
              <div className="detail-section">
                <small>
                  Resolved at: {new Date(selectedReport.resolvedAt).toLocaleString()}
                  {selectedReport.resolutionChangedBy && (
                    <br />
                  )}
                </small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
