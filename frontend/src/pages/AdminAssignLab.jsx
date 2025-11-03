import React, { useEffect, useState } from "react";
import API from "../api/api";
import dayjs from "dayjs";

export default function AdminAssignLab(){
  const [activeTab, setActiveTab] = useState("assignments");
  const [semester, setSemester] = useState(3);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [section, setSection] = useState("IT-1");
  const [batch, setBatch] = useState("All");
  const [facultyId, setFacultyId] = useState("");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().add(6, "month").format("YYYY-MM-DD"));
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
    department: "IT",
    semester: 3,
    section: "IT-1"
  });

  // User Management Filter States
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  
  // *** NEW FILTER STATES ADDED HERE ***
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  // **********************************

  useEffect(() => {
    fetchLabs();
    fetchFaculty();
    fetchAssignments();
    fetchUsers();
  }, [semester]);

  const fetchLabs = async () => {
    try {
      const res = await API.get(`/admin/labs?semester=${semester}`);
      setLabs(res.data.labs || []);
    } catch (err) {
      console.error("Error fetching labs:", err);
      setMsg({ type: "error", text: "Failed to load labs" });
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await API.get("/admin/users");
      setFacultyList((res.data.users || []).filter(u => u.role === "faculty"));
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setMsg({ type: "error", text: "Failed to load faculty" });
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/admin/assignments");
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    
    try {
      const payload = {
        labId: selectedLab,
        facultyId,
        section,
        batch,
        academicYear: `${startDate.slice(0,4)}-${endDate.slice(0,4)}`,
        semesterType: semester % 2 === 1 ? "Odd" : "Even",
        startDate,
        endDate,
        dayOfWeek
      };
      
      await API.post("/admin/assignLab", payload);
      setMsg({ type: "success", text: "Lab assigned successfully!" });
      
      // Reset form
      setSelectedLab("");
      setFacultyId("");
      setBatch("All");
      setStartDate(dayjs().format("YYYY-MM-DD"));
      setEndDate(dayjs().add(6, "month").format("YYYY-MM-DD"));
      setDayOfWeek("Monday");
      
      // Refresh assignments
      fetchAssignments();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to assign lab" });
    } finally {
      setLoading(false);
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    
    try {
      await API.post("/admin/addUser", newUser);
      setMsg({ type: "success", text: "User added successfully!" });
      setShowAddUser(false);
      setNewUser({
        name: "",
        username: "",
        password: "",
        role: "student",
        department: "IT",
        semester: 3,
        section: "IT-1"
      });
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to add user" });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await API.delete(`/admin/users/${userId}`);
      setMsg({ type: "success", text: "User deleted successfully!" });
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to delete user" });
    }
  };

  const handleUserChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function for user filtering logic
  const filteredUsers = users.filter(user => {
    if (filterRole !== "all" && user.role !== filterRole) return false;
    if (filterDepartment !== "all" && user.department !== filterDepartment) return false;

    // *** NEW SEMESTER FILTER LOGIC ***
    if (filterSemester !== "all" && user.role === 'student') {
        // Ensure both filter and user semester are treated as numbers for comparison
        if (Number(user.semester) !== Number(filterSemester)) return false;
    }

    // *** NEW SECTION FILTER LOGIC ***
    if (filterSection !== "all" && user.role === 'student' && user.section !== filterSection) return false;

    // Search filter
    if (filterSearch && !user.name.toLowerCase().includes(filterSearch.toLowerCase()) && 
        !user.username.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage lab assignments and user accounts</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "assignments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Lab Assignments
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              User Management
            </button>
          </nav>
        </div>

        {/* Messages */}
        {msg && (
          <div className={`rounded-lg p-4 ${
            msg.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`} fill="currentColor" viewBox="0 0 20 20">
                {msg.type === "success" ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {msg.text}
            </div>
          </div>
        )}

        {/* Lab Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="space-y-8">
            {/* Assignment Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Assign New Lab</h2>
              
              <form onSubmit={submitAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select 
                      value={semester} 
                      onChange={e => setSemester(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
                    <select 
                      required 
                      value={selectedLab} 
                      onChange={e => setSelectedLab(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select lab --</option>
                      {labs.map(l => (
                        <option key={l._id} value={l._id}>
                          {l.labName} ({l.labCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                    <select 
                      value={section} 
                      onChange={e => setSection(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {["IT-1","IT-2","IT-3"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                    <select 
                      value={batch} 
                      onChange={e => setBatch(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Batches</option>
                      <option value="Batch-1">Batch-1</option>
                      <option value="Batch-2">Batch-2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                    <select 
                      value={facultyId} 
                      onChange={e => setFacultyId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select faculty --</option>
                      {facultyList.map(f => (
                        <option key={f._id} value={f._id}>
                          {f.name} ({f.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select 
                      value={dayOfWeek} 
                      onChange={e => setDayOfWeek(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Assigning...
                        </div>
                      ) : (
                        "Assign Lab"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Current Assignments */}
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Current Lab Assignments</h2>
              
              {assignments.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  No lab assignments found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Lab</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Faculty</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Section</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Batch</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Schedule</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Academic Year</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(assignment => (
                        <tr key={assignment._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2">
                            <div>
                              <div className="font-medium text-gray-900 text-xs">{assignment.labId?.labName}</div>
                              <div className="text-[10px] text-gray-500">{assignment.labId?.labCode}</div>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div>
                              <div className="font-medium text-gray-900 text-xs">{assignment.facultyId?.name}</div>
                              <div className="text-[10px] text-gray-500">{assignment.facultyId?.username}</div>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-xs text-gray-900">{assignment.section}</td>
                          <td className="py-2 px-2 text-xs text-gray-900">{assignment.batch || "All"}</td>
                          <td className="py-2 px-2">
                            <div>
                              <div className="text-xs font-medium text-gray-900">{assignment.dayOfWeek}</div>
                              <div className="text-[10px] text-gray-500">
                                {dayjs(assignment.startDate).format('MMM DD')} - {dayjs(assignment.endDate).format('MMM DD, YYYY')}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-xs text-gray-900">{assignment.academicYear}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              assignment.semesterType === 'Odd' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {assignment.semesterType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="space-y-8">
            {/* Add User Button and Filters */}
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-900">User Management</h2>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs rounded-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add User</span>
                </button>
              </div>

              {/* Filters */}
              {/* --- UPDATED FILTER LAYOUT TO INCLUDE SEMESTER AND SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="faculty">Faculty</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Dept.</label>
                  <select
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>

                {/* --- NEW SEMESTER FILTER --- */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Sem.</label>
                  <select
                    value={filterSemester}
                    onChange={e => setFilterSemester(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* --- NEW SECTION FILTER --- */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Section</label>
                  <select
                    value={filterSection}
                    onChange={e => setFilterSection(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Sections</option>
                    {["IT-1","IT-2","IT-3"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* ----------------------------- */}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name/username..."
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                      <button
                        onClick={() => setShowAddUser(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={submitUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newUser.name}
                          onChange={e => handleUserChange("name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          required
                          value={newUser.username}
                          onChange={e => handleUserChange("username", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          required
                          value={newUser.password}
                          onChange={e => handleUserChange("password", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={newUser.role}
                            onChange={e => handleUserChange("role", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <select
                            value={newUser.department}
                            onChange={e => handleUserChange("department", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="IT">IT</option>
                            <option value="CSE">CSE</option>
                            <option value="ECE">ECE</option>
                          </select>
                        </div>
                      </div>

                      {newUser.role === "student" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select
                              value={newUser.semester}
                              onChange={e => handleUserChange("semester", Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {[1,2,3,4,5,6,7,8].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select
                              value={newUser.section}
                              onChange={e => handleUserChange("section", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {["IT-1","IT-2","IT-3"].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddUser(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          {loading ? "Adding..." : "Add User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Name</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Username</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Role</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Department</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Details</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers // Using the new filteredUsers variable
                      .map(user => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <div className="font-medium text-gray-900 text-xs">{user.name}</div>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-900">{user.username}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'faculty'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-900">{user.department}</td>
                        <td className="py-2 px-2 text-[10px] text-gray-500">
                          {user.role === 'student' ? `Sem ${user.semester} - ${user.section}${user.batch ? ` (${user.batch})` : ''}` : 'Faculty Member'}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500">
                  No users found matching your filters.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}