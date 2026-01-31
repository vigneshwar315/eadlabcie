import React, { useEffect, useRef, useState } from "react";
import API from "../api/api";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";

export default function StudentDashboard(){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const printRef = useRef();
  const handlePrint = useReactToPrint({ 
    contentRef: printRef, 
    documentTitle: `Lab_Marks_Report_${dayjs().format('YYYY-MM-DD')}`,
    onAfterPrint: () => {
      // Optional: Handle after print
    }
  });

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/student/me/marks");
      const payload = res.data || {};
      const labs = Array.isArray(payload.labs) ? payload.labs : [];
      setData({ labs });
      if (!selectedLabId && labs.length > 0) {
        const firstLabId = labs[0]?.labId || "";
        if (firstLabId) setSelectedLabId(firstLabId);
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
      setError("Failed to load marks");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="loading">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading your marks...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="error">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  const labs = data?.labs || [];
  const selectedLab = labs.find(l => (l.labId || "") === selectedLabId);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      await API.put("/student/me/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
      }, 1500);
    } catch (err) {
      setPasswordMsg({ type: "error", text: err?.response?.data?.message || "Failed to update password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title and Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Lab Marks</h1>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Update Password
        </button>
      </div>

      {/* No labs */}
      {labs.length === 0 && (
        <div className="text-center text-gray-600">No lab assignments found.</div>
      )}

      {/* Lab Filter */}
      {labs.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Lab</label>
          <select
            value={selectedLabId}
            onChange={(e) => setSelectedLabId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Choose a lab --</option>
            {labs.map((l, idx) => (
              <option key={l.labId || idx} value={l.labId || ""}>
                {l.labName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Lab Report */}
      {selectedLab && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          {/* Actions */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xl font-semibold text-gray-900">{selectedLab.labName}</div>
              <div className="text-sm text-gray-600">Faculty: {selectedLab.faculty || "TBD"}</div>
            </div>
            <button
              onClick={handlePrint}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
            >
              Download Report
            </button>
          </div>

          {/* Printable content */}
          <div ref={printRef}>
            {/* Print header */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold text-center">Lab Marks Report</h2>
              <p className="text-center text-sm">{selectedLab.labName} • Faculty: {selectedLab.faculty || "TBD"}</p>
            </div>

            {/* Marks Table - With Rubrics */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-700">Week</th>
                    <th className="text-left py-3 font-medium text-gray-700">Date</th>
                    <th className="text-center py-3 font-medium text-gray-700">Pr</th>
                    <th className="text-center py-3 font-medium text-gray-700">PE</th>
                    <th className="text-center py-3 font-medium text-gray-700">P</th>
                    <th className="text-center py-3 font-medium text-gray-700">R</th>
                    <th className="text-center py-3 font-medium text-gray-700">C</th>
                    <th className="text-center py-3 font-medium text-gray-700">T</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLab.sessions?.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">Week {i + 1}</td>
                      <td className="py-3 text-gray-900">{dayjs(s.date).format("DD MMM YYYY")}</td>
                      <td className="py-3 text-center text-gray-900">{s.Pr ?? '-'}</td>
                      <td className="py-3 text-center text-gray-900">{s.PE ?? '-'}</td>
                      <td className="py-3 text-center text-gray-900">{s.P ?? '-'}</td>
                      <td className="py-3 text-center text-gray-900">{s.R ?? '-'}</td>
                      <td className="py-3 text-center text-gray-900">{s.C ?? '-'}</td>
                      <td className="py-3 text-center text-gray-900">{(s.T ?? s.marks) ?? '-'}</td>
                    </tr>
                  ))}
                  {/* Average Row */}
                  {selectedLab.sessions && selectedLab.sessions.length > 0 && (
                    <tr className="border-t-2 border-gray-300 bg-blue-50 font-semibold">
                      <td colSpan="2" className="py-3 px-2 text-gray-900">Average Marks</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.Pr}</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.PE}</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.P}</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.R}</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.C}</td>
                      <td className="py-3 text-center text-gray-900 bg-blue-100">{selectedLab.averageMarks?.T}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Update Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordMsg(null);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {passwordMsg && (
                <div className={`mb-4 p-3 rounded-md ${
                  passwordMsg.type === "success" 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordMsg(null);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
