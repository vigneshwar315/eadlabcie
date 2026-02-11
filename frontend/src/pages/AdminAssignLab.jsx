import React, { useEffect, useState } from "react";
import API from "../api/api";
import dayjs from "dayjs";
import { parseUsersCsv, CSV_TEMPLATE, parseLabsCsv, LABS_CSV_TEMPLATE } from "../utils/csvParse";

export default function AdminAssignLab() {
  const [activeTab, setActiveTab] = useState("assignments");
  const [semester, setSemester] = useState(3);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [section, setSection] = useState("IT-1");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().add(6, "month").format("YYYY-MM-DD"));
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  // Step 2: Generate batches
  const [selectedAssignmentForBatches, setSelectedAssignmentForBatches] = useState(null);
  const [numberOfBatches, setNumberOfBatches] = useState(2);
  const [batchFaculty, setBatchFaculty] = useState({ B1: "", B2: "", B3: "" });
  const [batchDates, setBatchDates] = useState({
    B1: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
    B2: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
    B3: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
  });

  // Assign students manually
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [currentAssignmentIdForStudents, setCurrentAssignmentIdForStudents] = useState(null);
  const [currentBatches, setCurrentBatches] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [batchAssignments, setBatchAssignments] = useState({ B1: [], B2: [], B3: [] });
  const [assignLoading, setAssignLoading] = useState(false);

  // Increment semester
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [incrementLoading, setIncrementLoading] = useState(false);

  // User Management
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
    department: "IT",
    semester: 3,
    section: "IT-1",
    admissionYear: "",
    graduationYear: "",
  });
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterSection, setFilterSection] = useState("all");

  // Bulk upload
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // Lab Management
  const [allLabs, setAllLabs] = useState([]);
  const [editingLab, setEditingLab] = useState(null);
  const [newLab, setNewLab] = useState({ labCode: "", labName: "", semester: 3, department: "IT" });
  const [showBulkLabs, setShowBulkLabs] = useState(false);
  const [bulkLabsFile, setBulkLabsFile] = useState(null);
  const [bulkLabsPreview, setBulkLabsPreview] = useState([]);
  const [bulkLabsLoading, setBulkLabsLoading] = useState(false);
  const [bulkLabsError, setBulkLabsError] = useState(null);

  useEffect(() => {
    fetchLabs();
    fetchFaculty();
    fetchAssignments();
    fetchUsers();
  }, [semester]);

  useEffect(() => {
    if (activeTab === "labs") fetchAllLabs();
  }, [activeTab]);

  const fetchLabs = async () => {
    try {
      const res = await API.get(`/admin/labs?semester=${semester}`);
      setLabs(res.data.labs || []);
    } catch (err) {
      console.error("Error fetching labs:", err);
      setMsg({ type: "error", text: "Failed to load labs" });
    }
  };

  const fetchAllLabs = async () => {
    try {
      const res = await API.get("/admin/labs");
      setAllLabs(res.data.labs || []);
    } catch (err) {
      console.error("Error fetching labs:", err);
      setMsg({ type: "error", text: "Failed to load labs" });
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await API.get("/admin/users");
      setFacultyList((res.data.users || []).filter((u) => u.role === "faculty"));
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

  const submitCreateAssignment = async (e) => {
    e.preventDefault();
    setMsg(null);
    
    // Validate form inputs
    if (!selectedLab) {
      setMsg({ type: "error", text: "Please select a lab first. If no labs appear, create them in the Lab Management tab." });
      return;
    }
    
    if (labs.length === 0) {
      setMsg({ type: "error", text: "No labs available for Semester " + semester + ". Please add labs in the Lab Management tab." });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        labId: selectedLab,
        semester: Number(semester),
        section,
        academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
        semesterType: semester % 2 === 1 ? "Odd" : "Even",
      };
      const res = await API.post("/admin/assignLab", payload);
      setMsg({ type: "success", text: "Assignment created. Now generate batches." });
      setSelectedAssignmentForBatches(res.data.assignment);
      setSelectedLab("");
      fetchAssignments();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to create assignment" });
    } finally {
      setLoading(false);
    }
  };

  const submitGenerateBatches = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentForBatches) return;
    setMsg(null);
    setLoading(true);
    try {
      const batchNames = numberOfBatches === 2 ? ["B1", "B2"] : ["B1", "B2", "B3"];
      const batches = batchNames.map((b) => ({
        batchName: b,
        facultyId: batchFaculty[b] || null,
        startDate: batchDates[b].startDate,
        endDate: batchDates[b].endDate,
        dayOfWeek: batchDates[b].dayOfWeek,
      }));
      if (batches.some((b) => !b.facultyId)) {
        setMsg({ type: "error", text: "Select faculty for each batch." });
        setLoading(false);
        return;
      }
      const res = await API.post("/admin/generateBatches", {
        labAssignmentId: selectedAssignmentForBatches._id,
        numberOfBatches,
        batches,
      });
      console.log("Batches generated response:", res.data);
      
      setMsg({ type: "success", text: "Batches generated successfully! Now assign students." });
      setCurrentAssignmentIdForStudents(selectedAssignmentForBatches._id);
      setCurrentBatches(res.data.batches || []);
      setSelectedAssignmentForBatches(null);
      setNumberOfBatches(2);
      setBatchFaculty({ B1: "", B2: "", B3: "" });
      setBatchDates({
        B1: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
        B2: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
        B3: { startDate: dayjs().format("YYYY-MM-DD"), endDate: dayjs().add(6, "month").format("YYYY-MM-DD"), dayOfWeek: "Monday" },
      });
      // Show assign students modal with data from response
      const studentsData = res.data.students || [];
      console.log("Students to display:", studentsData);
      setAvailableStudents(studentsData);
      setBatchAssignments({ B1: [], B2: [], B3: [] });
      setShowAssignStudentsModal(true);
      fetchAssignments();
    } catch (err) {
      console.error("Generate batches error:", err);
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to generate batches" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudents = async () => {
    setAssignLoading(true);
    setMsg(null);
    try {
      if (!currentBatches || currentBatches.length === 0) {
        console.error("No currentBatches available:", currentBatches);
        setMsg({ type: "error", text: "No batches found. Please generate batches again." });
        setAssignLoading(false);
        return;
      }

      console.log("Starting to assign students to batches:", { currentBatches, batchAssignments });

      // Update each batch with assigned students using the stored batch IDs
      for (const batch of currentBatches) {
        const batchKey = batch.batchName; // B1, B2, B3
        const studentIds = batchAssignments[batchKey] || [];
        console.log(`Assigning students to batch ${batchKey}:`, { batchId: batch._id, studentIds, count: studentIds.length });
        
        const response = await API.put(`/admin/batches/${batch._id}/students`, { studentIds });
        console.log(`Successfully assigned students to batch ${batchKey}:`, response.data);
      }

      setMsg({ type: "success", text: "Students assigned to batches successfully!" });
      setShowAssignStudentsModal(false);
      setCurrentAssignmentIdForStudents(null);
      setCurrentBatches([]);
      setAvailableStudents([]);
      setBatchAssignments({ B1: [], B2: [], B3: [] });
      fetchAssignments();
    } catch (err) {
      console.error("Assign students error:", err);
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to assign students" });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleIncrementSemester = async () => {
    setIncrementLoading(true);
    setMsg(null);
    try {
      const res = await API.post("/admin/incrementSemester");
      setMsg({ type: "success", text: res.data?.message || "Semester incremented." });
      setShowIncrementModal(false);
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to increment semester" });
    } finally {
      setIncrementLoading(false);
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await API.put(`/admin/users/${editingUser._id}`, newUser);
        setMsg({ type: "success", text: "User updated successfully!" });
        setEditingUser(null);
      } else {
        // Add new user
        await API.post("/admin/addUser", newUser);
        setMsg({ type: "success", text: "User added successfully!" });
      }
      setShowAddUser(false);
      setNewUser({
        name: "",
        username: "",
        password: "",
        role: "student",
        department: "IT",
        semester: 3,
        section: "IT-1",
        admissionYear: "",
        graduationYear: "",
      });
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to save user" });
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      department: user.department,
      semester: user.semester || 3,
      section: user.section || "IT-1",
      admissionYear: user.admissionYear || "",
      graduationYear: user.graduationYear || "",
    });
    setShowAddUser(true);
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
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const filteredUsers = users.filter((user) => {
    if (filterRole !== "all" && user.role !== filterRole) return false;
    if (filterDepartment !== "all" && user.department !== filterDepartment) return false;
    if (filterSemester !== "all" && user.role === "student" && Number(user.semester) !== Number(filterSemester))
      return false;
    if (filterSection !== "all" && user.role === "student" && user.section !== filterSection) return false;
    if (
      filterSearch &&
      !user.name.toLowerCase().includes(filterSearch.toLowerCase()) &&
      !user.username.toLowerCase().includes(filterSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const handleBulkFileChange = (e) => {
    const f = e.target.files?.[0];
    setBulkFile(f);
    setBulkPreview([]);
    setBulkError(null);
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const { users: u, error } = parseUsersCsv(r.result || "");
      if (error) {
        setBulkError(error);
        return;
      }
      setBulkPreview(u.slice(0, 10));
    };
    r.readAsText(f);
  };

  const submitBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkError(null);
    try {
      const text = await bulkFile.text();
      const { users: u, error } = parseUsersCsv(text);
      if (error || !u.length) {
        setBulkError(error || "No valid rows to import.");
        setBulkLoading(false);
        return;
      }
      await API.post("/admin/bulk-import-users", { users: u });
      setMsg({ type: "success", text: `${u.length} users imported successfully!` });
      setShowBulkUpload(false);
      setBulkFile(null);
      setBulkPreview([]);
      fetchUsers();
    } catch (err) {
      setBulkError(err?.response?.data?.message || "Bulk import failed.");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const submitAddLab = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (editingLab) {
        // Update existing lab
        await API.put(`/admin/labs/${editingLab._id}`, newLab);
        setMsg({ type: "success", text: "Lab updated successfully!" });
        setEditingLab(null);
      } else {
        // Add new lab
        await API.post("/admin/addLab", newLab);
        setMsg({ type: "success", text: "Lab added successfully!" });
      }
      setNewLab({ labCode: "", labName: "", semester: 3, department: "IT" });
      fetchAllLabs();
      fetchLabs();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to save lab" });
    } finally {
      setLoading(false);
    }
  };

  const startEditLab = (lab) => {
    setEditingLab(lab);
    setNewLab({
      labCode: lab.labCode,
      labName: lab.labName,
      semester: lab.semester,
      department: lab.department,
    });
  };

  const handleBulkLabsFileChange = (e) => {
    const f = e.target.files?.[0];
    setBulkLabsFile(f);
    setBulkLabsPreview([]);
    setBulkLabsError(null);
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const { labs: L, error } = parseLabsCsv(r.result || "");
      if (error) {
        setBulkLabsError(error);
        return;
      }
      setBulkLabsPreview(L.slice(0, 10));
    };
    r.readAsText(f);
  };

  const submitBulkLabs = async () => {
    if (!bulkLabsFile) return;
    setBulkLabsLoading(true);
    setBulkLabsError(null);
    try {
      const text = await bulkLabsFile.text();
      const { labs: L, error } = parseLabsCsv(text);
      if (error || !L.length) {
        setBulkLabsError(error || "No valid rows to import.");
        setBulkLabsLoading(false);
        return;
      }
      await API.post("/admin/bulk-import-labs", { labs: L });
      setMsg({ type: "success", text: `${L.length} labs imported successfully!` });
      setShowBulkLabs(false);
      setBulkLabsFile(null);
      setBulkLabsPreview([]);
      fetchAllLabs();
      fetchLabs();
    } catch (err) {
      setBulkLabsError(err?.response?.data?.message || "Bulk import failed.");
    } finally {
      setBulkLabsLoading(false);
    }
  };

  const downloadLabsTemplate = () => {
    const blob = new Blob([LABS_CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "labs_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const deleteLab = async (labId) => {
    if (!window.confirm("Are you sure you want to delete this lab?")) return;
    try {
      await API.delete(`/admin/labs/${labId}`);
      setMsg({ type: "success", text: "Lab deleted successfully!" });
      fetchAllLabs();
      fetchLabs();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to delete lab" });
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this lab assignment? All associated batches will also be deleted.")) return;
    try {
      await API.delete(`/admin/assignments/${assignmentId}`);
      setMsg({ type: "success", text: "Lab assignment deleted successfully!" });
      fetchAssignments();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to delete assignment" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
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
            <button
              onClick={() => setActiveTab("labs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "labs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Lab Management
            </button>
          </nav>
        </div>

        {msg && (
          <div
            className={`rounded-lg p-4 ${
              msg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              <svg
                className={`w-5 h-5 mr-2 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {msg.type === "success" ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {msg.text}
            </div>
          </div>
        )}

        {activeTab === "labs" && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold text-gray-900">
    Lab Management
  </h2>

  <button
    onClick={() => setShowBulkLabs(true)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-xs rounded-sm font-medium"
  >
    Bulk Import Labs
  </button>
</div>
              <form onSubmit={submitAddLab} className="space-y-3 max-w-xl">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lab code</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingLab}
                      value={newLab.labCode}
                      onChange={(e) => setNewLab((p) => ({ ...p, labCode: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="e.g. 22ITC09"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lab name</label>
                    <input
                      type="text"
                      required
                      value={newLab.labName}
                      onChange={(e) => setNewLab((p) => ({ ...p, labName: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Enterprise Application Development Lab"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      value={newLab.semester}
                      onChange={(e) => setNewLab((p) => ({ ...p, semester: Number(e.target.value) }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={newLab.department}
                      onChange={(e) => setNewLab((p) => ({ ...p, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="IT">IT</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? (editingLab ? "Updating..." : "Adding...") : (editingLab ? "Update Lab" : "Add Lab")}
                  </button>
                  {editingLab && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLab(null);
                        setNewLab({ labCode: "", labName: "", semester: 3, department: "IT" });
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Current labs ({allLabs.length})</h3>
              {allLabs.length === 0 ? (
                <p className="text-sm text-gray-500">No labs yet. Add or bulk import above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Code</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Name</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Sem</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Dept</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLabs.map((l) => (
                        <tr key={l._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 font-medium">{l.labCode}</td>
                          <td className="py-2 px-2">{l.labName}</td>
                          <td className="py-2 px-2">{l.semester}</td>
                          <td className="py-2 px-2">{l.department}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditLab(l)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Edit Lab"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteLab(l._id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Delete Lab"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {showBulkLabs && (
              <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bulk Import Labs</h3>
                      <button
                        onClick={() => {
                          setShowBulkLabs(false);
                          setBulkLabsFile(null);
                          setBulkLabsPreview([]);
                          setBulkLabsError(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Upload a CSV with: labCode, labName, semester, department.</p>
                    <button type="button" onClick={downloadLabsTemplate} className="text-blue-600 hover:underline text-sm mb-4">
                      Download template
                    </button>
                    <div className="mb-4">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleBulkLabsFileChange}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                      />
                    </div>
                    {bulkLabsError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                        {bulkLabsError}
                      </div>
                    )}
                    {bulkLabsPreview.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-1">Preview (first 10):</p>
                        <div className="overflow-x-auto max-h-40 overflow-y-auto border rounded text-xs">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-1 text-left">labCode</th>
                                <th className="px-2 py-1 text-left">labName</th>
                                <th className="px-2 py-1 text-left">semester</th>
                                <th className="px-2 py-1 text-left">department</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkLabsPreview.map((lab, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-2 py-1">{lab.labCode}</td>
                                  <td className="px-2 py-1">{lab.labName}</td>
                                  <td className="px-2 py-1">{lab.semester}</td>
                                  <td className="px-2 py-1">{lab.department}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBulkLabs(false);
                          setBulkLabsFile(null);
                          setBulkLabsPreview([]);
                          setBulkLabsError(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitBulkLabs}
                        disabled={!bulkLabsFile || bulkLabsLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {bulkLabsLoading ? "Importing..." : "Import"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Create Lab Assignment</h1>
              {labs.length === 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  ⚠️ No labs found for Semester {semester}. Please go to the <strong>Lab Management</strong> tab to add labs first.
                </div>
              )}
              <form onSubmit={submitCreateAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
                    <select
                      required
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select lab --</option>
                      {labs.map((l) => (
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
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {["IT-1", "IT-2", "IT-3"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Assignment"}
                  </button>
                </div>
              </form>
            </div>

            {(selectedAssignmentForBatches || assignments.some((a) => !(a.batches?.length))) && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 2: Generate Batches</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedAssignmentForBatches
                    ? `${selectedAssignmentForBatches.labId?.labName} – Sem ${selectedAssignmentForBatches.semester} – ${selectedAssignmentForBatches.section}`
                    : "Select an assignment below that has no batches, or use the one just created."}
                </p>
                {!selectedAssignmentForBatches && assignments.filter((a) => !(a.batches?.length)).length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment (no batches)</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const id = e.target.value;
                        const a = assignments.find((x) => x._id === id);
                        if (a) setSelectedAssignmentForBatches(a);
                      }}
                      className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select assignment --</option>
                      {assignments.filter((a) => !(a.batches?.length)).map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.labId?.labName} – Sem {a.semester} – {a.section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <form onSubmit={submitGenerateBatches} className="space-y-6">
                  <input type="hidden" value={selectedAssignmentForBatches?._id || ""} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of batches</label>
                      <select
                        value={numberOfBatches}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setNumberOfBatches(n);
                          if (n === 2) setBatchFaculty((p) => ({ ...p, B3: "" }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={2}>2 (B1, B2)</option>
                        <option value={3}>3 (B1, B2, B3)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(["B1", "B2", "B3"].slice(0, numberOfBatches)).map((b) => (
                      <div key={b}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Faculty for {b}</label>
                        <select
                          required
                          value={batchFaculty[b]}
                          onChange={(e) => setBatchFaculty((p) => ({ ...p, [b]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select faculty --</option>
                          {facultyList.map((f) => (
                            <option key={f._id} value={f._id}>
                              {f.name} ({f.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {(["B1", "B2", "B3"].slice(0, numberOfBatches)).map((b) => (
                      <div key={b} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Batch {b} Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              required
                              value={batchDates[b].startDate}
                              onChange={(e) => setBatchDates((p) => ({ ...p, [b]: { ...p[b], startDate: e.target.value } }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="date"
                              required
                              value={batchDates[b].endDate}
                              onChange={(e) => setBatchDates((p) => ({ ...p, [b]: { ...p[b], endDate: e.target.value } }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Day of Week</label>
                            <select
                              required
                              value={batchDates[b].dayOfWeek}
                              onChange={(e) => setBatchDates((p) => ({ ...p, [b]: { ...p[b], dayOfWeek: e.target.value } }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={loading || !selectedAssignmentForBatches}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Generating..." : "Generate Batches"}
                    </button>
                    {selectedAssignmentForBatches && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignmentForBatches(null);
                          setBatchFaculty({ B1: "", B2: "", B3: "" });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Current Lab Assignments</h2>
              {assignments.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">No lab assignments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Lab</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Batches</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Schedules</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2">
                            <div className="font-medium text-gray-900 text-xs">
                              {a.labId?.labName} ({a.cohortYears}) - Sem {a.semester} - {a.section}
                            </div>
                            <div className="text-[10px] text-gray-500">{a.labId?.labCode}</div>
                          </td>
                          <td className="py-2 px-2">
                            {a.batches?.length ? (
                              <div className="space-y-0.5">
                                {a.batches.map((b) => (
                                  <div key={b._id} className="text-[10px]">
                                    {b.batchName}: {b.facultyId?.name || "—"} ({b.studentCount ?? 0} students)
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">No batches</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {a.batches?.length ? (
                              <div className="space-y-0.5">
                                {a.batches.map((b) => (
                                  <div key={b._id} className="text-[10px]">
                                    {b.batchName}: {b.dayOfWeek} ({dayjs(b.startDate).format("MMM DD")} – {dayjs(b.endDate).format("MMM DD")})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">No schedule</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex gap-2">
                              {!a.batches?.length && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAssignmentForBatches(a)}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  Generate Batches
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteAssignment(a._id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                title="Delete Assignment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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

        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-900">User Management</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowIncrementModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs rounded-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>Increment Semester</span>
                  </button>
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 text-xs rounded-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>Bulk Upload</span>
                  </button>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
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
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Sem.</label>
                  <select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Section</label>
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Sections</option>
                    {["IT-1", "IT-2", "IT-3"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name/username..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {showAddUser && (
              <div className="fixed inset-0 bg-white z-50 overflow-auto">
                <div className="w-full h-full">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">{editingUser ? "Edit User" : "Add New User"}</h3>
                      <button
                        onClick={() => {
                          setShowAddUser(false);
                          setEditingUser(null);
                          setNewUser({
                            name: "",
                            username: "",
                            password: "",
                            role: "student",
                            department: "IT",
                            semester: 3,
                            section: "IT-1",
                            admissionYear: "",
                            graduationYear: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 p-4"
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
                          onChange={(e) => handleUserChange("name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username {editingUser && "(read-only)"}</label>
                        <input
                          type="text"
                          required
                          value={newUser.username}
                          onChange={(e) => !editingUser && handleUserChange("username", e.target.value)}
                          disabled={!!editingUser}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser && "(leave blank to keep current)"}</label>
                        <input
                          type="password"
                          required={!editingUser}
                          value={newUser.password}
                          onChange={(e) => handleUserChange("password", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => handleUserChange("role", e.target.value)}
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
                            onChange={(e) => handleUserChange("department", e.target.value)}
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
                              onChange={(e) => handleUserChange("semester", Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select
                              value={newUser.section}
                              onChange={(e) => handleUserChange("section", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {["IT-1", "IT-2", "IT-3"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      {newUser.role === "student" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Year</label>
                            <input
                              type="number"
                              value={newUser.admissionYear}
                              onChange={(e) => handleUserChange("admissionYear", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 2022"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                            <input
                              type="number"
                              value={newUser.graduationYear}
                              onChange={(e) => handleUserChange("graduationYear", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 2026"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddUser(false);
                            setEditingUser(null);
                            setNewUser({
                              name: "",
                              username: "",
                              password: "",
                              role: "student",
                              department: "IT",
                              semester: 3,
                              section: "IT-1",
                              admissionYear: "",
                              graduationYear: "",
                            });
                          }}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          {loading ? (editingUser ? "Updating..." : "Adding...") : (editingUser ? "Update User" : "Add User")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {showBulkUpload && (
              <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Users</h3>
                      <button
                        onClick={() => {
                          setShowBulkUpload(false);
                          setBulkFile(null);
                          setBulkPreview([]);
                          setBulkError(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a CSV with columns: name, username, password, role, department, semester, section, admissionYear, graduationYear,email(optional).
                    </p>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-blue-600 hover:underline text-sm mb-4"
                    >
                      Download template
                    </button>
                    <div className="mb-4">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleBulkFileChange}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                      />
                    </div>
                    {bulkError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                        {bulkError}
                      </div>
                    )}
                    {bulkPreview.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-1">Preview (first 10 rows):</p>
                        <div className="overflow-x-auto max-h-40 overflow-y-auto border rounded text-xs">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-1 text-left">name</th>
                                <th className="px-2 py-1 text-left">username</th>
                                <th className="px-2 py-1 text-left">role</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkPreview.map((u, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-2 py-1">{u.name}</td>
                                  <td className="px-2 py-1">{u.username}</td>
                                  <td className="px-2 py-1">{u.role}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBulkUpload(false);
                          setBulkFile(null);
                          setBulkPreview([]);
                          setBulkError(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitBulkUpload}
                        disabled={!bulkFile || bulkLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {bulkLoading ? "Importing..." : "Import"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className={`border-b border-gray-100 hover:bg-gray-50 ${user.status === "passedout" ? "bg-gray-100 opacity-70" : ""}`}>
                        <td className="py-2 px-2 font-medium text-gray-900 text-xs">{user.name}</td>
                        <td className="py-2 px-2 text-xs text-gray-900">{user.username}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "faculty"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-900">{user.department}</td>
                        <td className="py-2 px-2 text-[10px] text-gray-500">
                          {user.role === "student"
                            ? `Sem ${user.semester} – ${user.section}${
                              user.admissionYear && user.graduationYear
                                ? ` (${user.admissionYear}-${user.graduationYear})`
                                : ""
                            }${user.status === "passedout" ? " [PASSED OUT]" : ""}`
                            : "—"}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditUser(user)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Edit User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              disabled={user.status === "passedout"}
                              className={`p-1 rounded ${user.status === "passedout" ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:text-red-800 hover:bg-red-50"}`}
                              title={user.status === "passedout" ? "Cannot delete passed-out students" : "Delete User"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500">No users found matching your filters.</div>
              )}
            </div>
          </div>
        )}

        {/* Assign Students Modal */}
        {showAssignStudentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full h-[95vh] max-h-[95vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Assign Students to Batches</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select students for each batch. Students can be assigned to multiple batches.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {currentBatches.map((batch) => (
                  <div key={batch._id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Batch {batch.batchName}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Faculty: {batch.facultyId?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {batch.startDate ? dayjs(batch.startDate).format("YYYY-MM-DD") : "N/A"} to {batch.endDate ? dayjs(batch.endDate).format("YYYY-MM-DD") : "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Assigned: {batchAssignments[batch.batchName]?.length || 0} students
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Available Students ({availableStudents?.length || 0})</h3>
                {availableStudents && availableStudents.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {availableStudents.map((student) => (
                      <div key={student._id} className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-200 last:border-b-0">
                        <span className="flex-1 text-sm font-medium">{student.name}</span>
                        <span className="text-xs text-gray-500">({student.username})</span>
                        {currentBatches && currentBatches.map((batch) => (
                          <label key={batch._id} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={batchAssignments[batch.batchName]?.includes(student._id) || false}
                              onChange={(e) => {
                                setBatchAssignments((prev) => ({
                                  ...prev,
                                  [batch.batchName]: e.target.checked
                                    ? [...(prev[batch.batchName] || []), student._id]
                                    : (prev[batch.batchName] || []).filter((id) => id !== student._id),
                                }));
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs">{batch.batchName}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 border rounded-lg bg-gray-50">
                    No students available for this section
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAssignStudentsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStudents}
                  disabled={assignLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {assignLoading ? "Assigning..." : "Assign Students"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showIncrementModal && (
          <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Increment Semester</h3>
              <p className="text-sm text-gray-600 mb-4">
                All students’ semester will be incremented by 1 (max 8). This cannot be undone. Continue?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowIncrementModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIncrementSemester}
                  disabled={incrementLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {incrementLoading ? "Incrementing..." : "Increment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
