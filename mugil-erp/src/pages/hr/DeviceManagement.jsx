import React, { useState, useMemo } from 'react';
import { getDevices, testConnection, syncEmployees, syncAttendance } from '../../data/hrData';
import './DeviceManagement.css';


import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

function statusClassName(status) {
  const normalized = String(status || '').toLowerCase();
  return `status-badge status-badge--${normalized}`;
}

function formatTimestamp(value) {
  if (!value) return '—';
  return value;
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState(() => getDevices());
  const [search, setSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  const refreshDevices = () => setDevices([...getDevices()]);

  const pushLog = (entry) => {
    setActivityLog((prev) => [entry, ...prev].slice(0, 8));
  };

  const handleTestConnection = (device) => {
    const result = testConnection(device.id);
    pushLog({
      id: `${device.id}-test-${Date.now()}`,
      deviceName: device.deviceName,
      message: result.success
        ? `Connection successful (${result.latencyMs} ms)`
        : 'Connection failed - device offline',
      success: result.success,
    });
  };

  const handleSyncEmployees = (device) => {
    const result = syncEmployees(device.id);
    pushLog({
      id: `${device.id}-syncemp-${Date.now()}`,
      deviceName: device.deviceName,
      message: result.success
        ? `Synced ${result.employeesSynced} employee(s)`
        : 'Employee sync failed',
      success: result.success,
    });
  };

  const handleSyncAttendance = (device) => {
    const result = syncAttendance(device.id);
    pushLog({
      id: `${device.id}-syncatt-${Date.now()}`,
      deviceName: device.deviceName,
      message: result.success
        ? `Synced ${result.recordsSynced} attendance record(s)`
        : 'Attendance sync failed',
      success: result.success,
    });
    refreshDevices();
  };

  const filteredDevices = useMemo(() => {
    if (!search.trim()) return devices;
    const keyword = search.trim().toLowerCase();
    return devices.filter(
      (d) =>
        d.deviceName.toLowerCase().includes(keyword) ||
        d.brand.toLowerCase().includes(keyword) ||
        d.model.toLowerCase().includes(keyword) ||
        d.location.toLowerCase().includes(keyword) ||
        d.ip.toLowerCase().includes(keyword)
    );
  }, [devices, search]);

  const summary = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.status === 'Online').length;
    const offline = total - online;
    const lastSync = devices.reduce((latest, d) => {
      if (!d.lastSync) return latest;
      if (!latest) return d.lastSync;
      return d.lastSync > latest ? d.lastSync : latest;
    }, null);
    return { total, online, offline, lastSync };
  }, [devices]);
const navigate = useNavigate();
const handleBack = () => {
    navigate("/hr");
  };

  return (
     <>
          <Header />
    <div className="device-management-page">
       <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
      <header className="page-header">
        <div className="page-header-title">
          <h1>Device Management</h1>
          <p className="page-header-subtitle">Monitor and manage biometric attendance devices.</p>
        </div>
        <div className="page-header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search device, brand, model, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={refreshDevices}>
            Refresh
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-card-label">Total Devices</span>
          <span className="summary-card-value">{summary.total}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Online</span>
          <span className="summary-card-value">{summary.online}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Offline</span>
          <span className="summary-card-value">{summary.offline}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Last Sync</span>
          <span className="summary-card-value">{formatTimestamp(summary.lastSync)}</span>
        </div>
      </section>

      <section className="table-wrapper">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device Name</th>
              <th>Brand</th>
              <th>Model</th>
              <th>IP</th>
              <th>Port</th>
              <th>Firmware</th>
              <th>Location</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={10} className="table-empty-row">
                  No devices found.
                </td>
              </tr>
            )}
            {filteredDevices.map((device) => (
              <tr key={device.id}>
                <td>{device.deviceName}</td>
                <td>{device.brand}</td>
                <td>{device.model}</td>
                <td>{device.ip}</td>
                <td>{device.port}</td>
                <td>{device.firmware}</td>
                <td>{device.location}</td>
                <td>
                  <span className={statusClassName(device.status)}>{device.status}</span>
                </td>
                <td>{formatTimestamp(device.lastSync)}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="btn btn-link" onClick={() => handleTestConnection(device)}>
                      Test Connection
                    </button>
                    <button type="button" className="btn btn-link" onClick={() => handleSyncEmployees(device)}>
                      Sync Employees
                    </button>
                    <button type="button" className="btn btn-link" onClick={() => handleSyncAttendance(device)}>
                      Sync Attendance
                    </button>
                    <button type="button" className="btn btn-link" onClick={() => setSelectedDevice(device)}>
                      View Device
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {activityLog.length > 0 && (
        <section className="device-activity-log">
          <h2 className="device-activity-log-title">Recent Activity</h2>
          <ul className="device-activity-list">
            {activityLog.map((entry) => (
              <li
                key={entry.id}
                className={`device-activity-item ${
                  entry.success ? 'device-activity-item--success' : 'device-activity-item--error'
                }`}
              >
                <span className="device-activity-device">{entry.deviceName}</span>
                <span className="device-activity-message">{entry.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDevice.deviceName}</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedDevice(null)}>
                ×
              </button>
            </div>
            <div className="device-details">
              <div className="device-detail-row">
                <span className="device-detail-label">Brand</span>
                <span className="device-detail-value">{selectedDevice.brand}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Model</span>
                <span className="device-detail-value">{selectedDevice.model}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Serial Number</span>
                <span className="device-detail-value">{selectedDevice.serialNumber}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">IP Address</span>
                <span className="device-detail-value">{selectedDevice.ip}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Port</span>
                <span className="device-detail-value">{selectedDevice.port}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Firmware</span>
                <span className="device-detail-value">{selectedDevice.firmware}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Location</span>
                <span className="device-detail-value">{selectedDevice.location}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Status</span>
                <span className={statusClassName(selectedDevice.status)}>{selectedDevice.status}</span>
              </div>
              <div className="device-detail-row">
                <span className="device-detail-label">Last Sync</span>
                <span className="device-detail-value">{formatTimestamp(selectedDevice.lastSync)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedDevice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
