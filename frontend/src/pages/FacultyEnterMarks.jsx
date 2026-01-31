import React, { useEffect, useState, useRef } from "react";
import API from "../api/api";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";

export default function FacultyEnterMarks(){
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState("");
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [marksHistory, setMarksHistory] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [editingWeek, setEditingWeek] = useState(null);
  const [editMarks, setEditMarks] = useState({});
  const [showMarksOverview, setShowMarksOverview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(37);

 
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    // Prefer new API to avoid warning: pass contentRef instead of content()
    contentRef: printRef,
    documentTitle: `Lab_Marks_Overview_${selected}_${dayjs().format('YYYY-MM-DD')}`,
    onBeforeGetContent: async () => {
      if (!showMarksOverview) {
        setShowMarksOverview(true);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    },
    onAfterPrint: () => {
      setShowMarksOverview(false);
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      setMsg({ type: "error", text: "Failed to initialize print dialog. Check console for details." });
      setShowMarksOverview(false);
    },
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selected) {
      fetchStudents();
      fetchMarksHistory();
    }
  }, [selected]);

  useEffect(() => {
    
    if (selected && date) {
      loadMarksForDate(date);
    }
  }, [date, selected]);

  const fetchBatches = async () => {
    try {
      const res = await API.get("/faculty/batches");
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setMsg({ type: "error", text: "Failed to load assigned batches" });
    }
  };

  const fetchStudents = async () => {
    if (!selected) return;
    try {
      const res = await API.get(`/faculty/batches/${selected}/students`);
      const list = res.data.students || [];
      setStudents(list);
      const initialMarks = {};
      list.forEach((s) => {
        initialMarks[s._id] = { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
      });
      setMarksMap(initialMarks);
      const labWeekDates = getLabWeekDates();
      if (labWeekDates.length > 0) setDate(labWeekDates[0].date);
      else setDate(dayjs().format("YYYY-MM-DD"));
    } catch (err) {
      console.error("Error fetching students:", err);
      setMsg({ type: "error", text: "Failed to load students" });
    }
  };

  const loadMarksForDate = (selectedDate) => {
    if (!marksHistory.length || !students.length) return;
    
    const marksForDate = {};
    students.forEach((s) => {
      marksForDate[s._id] = { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
    });

    marksHistory.forEach((mark) => {
      const markDate = dayjs(mark.date).format("YYYY-MM-DD");
      if (markDate === selectedDate) {
        const sid = String(mark.studentId?._id ?? mark.studentId ?? "");
        if (marksForDate[sid]) {
          marksForDate[sid] = {
            Pr: mark.Pr != null ? mark.Pr : "",
            PE: mark.PE != null ? mark.PE : "",
            P: mark.P != null ? mark.P : "",
            R: mark.R != null ? mark.R : "",
            C: mark.C != null ? mark.C : "",
            T: mark.T != null ? mark.T : (mark.marks ?? "")
          };
        }
      }
    });

    setMarksMap(marksForDate);
  };

  const fetchMarksHistory = async () => {
    if (!selected) return;
    try {
      const res = await API.get(`/faculty/batches/${selected}/marks`);
      setMarksHistory(res.data.marks || []);
    } catch (err) {
      console.error("Error fetching marks history:", err);
    }
  };

  const calculateTotal = (pr, pe, p, r, c) => {
    const prVal = Number(pr) || 0;
    const peVal = Number(pe) || 0;
    const pVal = Number(p) || 0;
    const rVal = Number(r) || 0;
    const cVal = Number(c) || 0;
    return prVal + peVal + pVal + rVal + cVal;
  };

  const handleChange = (sid, field, value) => {
    setMarksMap(prev => {
      const current = prev[sid] || { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
      const updated = { ...current, [field]: value };
      
     
      if (['Pr', 'PE', 'P', 'R', 'C'].includes(field)) {
        updated.T = calculateTotal(updated.Pr, updated.PE, updated.P, updated.R, updated.C);
      }
      
      return { ...prev, [sid]: updated };
    });
  };

  const submit = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const payload = {
        labBatchId: selected,
        date,
        marks: Object.entries(marksMap).map(([studentId, markData]) => ({
          studentId,
          Pr: markData.Pr ? Number(markData.Pr) : null,
          PE: markData.PE ? Number(markData.PE) : null,
          P: markData.P ? Number(markData.P) : null,
          R: markData.R ? Number(markData.R) : null,
          C: markData.C ? Number(markData.C) : null,
          T: markData.T ? Number(markData.T) : null
        }))
      };
      await API.post("/faculty/batches/enter-marks", payload);
      setMsg({ type: "success", text: "Marks submitted successfully!" });
      
      // Reset marks
      const resetMarks = {};
      students.forEach(s => {
        resetMarks[s._id] = {
          Pr: "",
          PE: "",
          P: "",
          R: "",
          C: "",
          T: ""
        };
      });
      setMarksMap(resetMarks);
      
      // Refresh history to show updated marks in overview
      fetchMarksHistory();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to submit marks" });
    } finally {
      setLoading(false);
    }
  };

  const getLabWeekDates = () => {
    if (!selected) return [];
    const batch = batches.find((b) => b._id === selected);
    if (!batch?.generatedDates?.length) return [];
    return batch.generatedDates.map((d, i) => ({
      weekNumber: i + 1,
      date: dayjs(d).format("YYYY-MM-DD"),
      displayDate: dayjs(d).format("MMM DD, YYYY")
    }));
  };

  const getMarksByWeek = () => {
    const weeks = {};
    getLabWeekDates().forEach((week) => {
      weeks[week.date] = { weekNumber: week.weekNumber, date: week.date, displayDate: week.displayDate, students: {} };
    });
    marksHistory.forEach((mark) => {
      const weekDate = dayjs(mark.date).format("YYYY-MM-DD");
      const sid = String(mark.studentId?._id ?? mark.studentId ?? "");
      if (weeks[weekDate] && sid) {
        weeks[weekDate].students[sid] = {
          Pr: mark.Pr != null ? mark.Pr : null,
          PE: mark.PE != null ? mark.PE : null,
          P: mark.P != null ? mark.P : null,
          R: mark.R != null ? mark.R : null,
          C: mark.C != null ? mark.C : null,
          T: mark.T != null ? mark.T : (mark.marks ?? null)
        };
      }
    });
    return weeks;
  };

  const marksByWeek = getMarksByWeek();
  const weekDates = Object.keys(marksByWeek).sort();

  // Edit functions
  const handleEditWeek = (weekDate) => {
    setSelectedWeek(weekDate);
    setEditingWeek(true);
    const weekData = marksByWeek[weekDate];
    const initialEditMarks = {};
    students.forEach((student) => {
      const sid = String(student._id);
      const existingMarks = weekData.students[sid];
      initialEditMarks[student._id] = existingMarks || {
        Pr: "",
        PE: "",
        P: "",
        R: "",
        C: "",
        T: ""
      };
    });
    setEditMarks(initialEditMarks);
  };

  const handleEditChange = (studentId, field, value) => {
    setEditMarks(prev => {
      const current = prev[studentId] || { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
      const updated = { ...current, [field]: value };
      
      // Auto-calculate total if any of Pr, PE, P, R, C changes
      if (['Pr', 'PE', 'P', 'R', 'C'].includes(field)) {
        updated.T = calculateTotal(updated.Pr, updated.PE, updated.P, updated.R, updated.C);
      }
      
      return { ...prev, [studentId]: updated };
    });
  };

  const saveEditMarks = async () => {
    if (!selectedWeek) return;
    try {
      setLoading(true);
      const payload = {
        labBatchId: selected,
        date: selectedWeek,
        marks: Object.entries(editMarks).map(([studentId, markData]) => ({
          studentId,
          Pr: markData.Pr ? Number(markData.Pr) : null,
          PE: markData.PE ? Number(markData.PE) : null,
          P: markData.P ? Number(markData.P) : null,
          R: markData.R ? Number(markData.R) : null,
          C: markData.C ? Number(markData.C) : null,
          T: markData.T ? Number(markData.T) : null
        }))
      };
      await API.post("/faculty/batches/enter-marks", payload);
      setMsg({ type: "success", text: `Week ${marksByWeek[selectedWeek].weekNumber} marks updated successfully!` });
      setEditingWeek(false);
      setSelectedWeek(null);
      fetchMarksHistory();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update marks" });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingWeek(false);
    setSelectedWeek(null);
    setEditMarks({});
  };

  const deleteMarks = async (weekDate) => {
    if (!window.confirm(`Delete marks for ${marksByWeek[weekDate]?.displayDate}? This cannot be undone.`)) return;
    try {
      setLoading(true);
      const payload = {
        labBatchId: selected,
        date: weekDate,
        marks: students.map((s) => ({
          studentId: s._id,
          Pr: null,
          PE: null,
          P: null,
          R: null,
          C: null,
          T: null
        }))
      };
      await API.post("/faculty/batches/enter-marks", payload);
      setMsg({ type: "success", text: `Week ${marksByWeek[weekDate]?.weekNumber} marks deleted successfully!` });
      fetchMarksHistory();
      loadMarksForDate(date);
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to delete marks" });
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentAverage = (studentId) => {
    const submittedMarks = [];
    weekDates.forEach((weekDate) => {
      const weekData = marksByWeek[weekDate];
      const studentMarks = weekData.students[String(studentId)];
      if (studentMarks?.T != null && studentMarks.T !== '') {
        submittedMarks.push(Number(studentMarks.T));
      }
    });
    if (submittedMarks.length === 0) return '-';
    const avg = (submittedMarks.reduce((a, b) => a + b, 0) / submittedMarks.length).toFixed(2);
    return avg;
  };

  const getCurrentBatch = () => batches.find((b) => b._id === selected);

  const getPaginatedStudents = () => {
    const start = (currentPage - 1) * studentsPerPage;
    return students.slice(start, start + studentsPerPage);
  };
  const totalPages = Math.max(1, Math.ceil(students.length / studentsPerPage));
  const paginatedStudents = getPaginatedStudents();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 py-1">
      <div className="space-y-1.5">

        {/* Lab Selection and Date - Minimized */}
        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 items-end">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Assigned Batch</label>
              <select
                value={selected || ""}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select batch --</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.labName} ({b.cohortYears}) - Sem {b.semester} - {b.section} - {b.batchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Session Date</label>
              <select 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select session --</option>
                {getLabWeekDates().map(week => (
                  <option key={week.date} value={week.date}>
                    Week {week.weekNumber} - {week.displayDate}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1.5 items-end">
              <button 
                onClick={submit} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !selected || students.length === 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Submitting...</span>
                  </div>
                ) : (
                  "Submit Marks"
                )}
              </button>
            </div>

            {/* Static legend beside submit button */}
            <div className="hidden sm:block text-[10px] leading-tight text-gray-900">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><span className="font-semibold">Pr</span>: Preparation(5M)</div>
                <div><span className="font-semibold">PE</span>: Program Execution(10M)</div>
                <div><span className="font-semibold">P</span>: Post Viva(5M)</div>
                <div><span className="font-semibold">R</span>: Record(5M)</div>
                <div><span className="font-semibold">C</span>: Conduct(5M)</div>
              </div>
            </div>
          </div>

          {msg && (
            <div className={`mt-1 p-1.5 rounded text-[10px] ${
              msg.type === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Current Session Marks Entry - Ultra-compact for single screen fit */}
        {students.length > 0 && (
          <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-0.5">
              <h2 className="text-[9px] font-semibold text-gray-900">
                Enter Marks for {getLabWeekDates().find(w => w.date === date)?.displayDate || date}
              </h2>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-1.5 py-0.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                  >
                    Prev
                  </button>
                  <span className="text-gray-600">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-1.5 py-0.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            
            {/* Ultra-compact two-column layout - improves visibility */}
            <div className="overflow-x-auto">
              <div className="flex gap-3">
                {(() => {
                  const midPoint = Math.ceil(paginatedStudents.length / 2);
                  const columns = [
                    paginatedStudents.slice(0, midPoint),
                    paginatedStudents.slice(midPoint)
                  ];

                  return columns.map((columnStudents, colIdx) => (
                    <div key={colIdx} className="flex-1 min-w-0">
                      <table className="w-full text-[10px] border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-gray-400">
                            <th className="text-left py-0.5 px-0.5 font-semibold text-gray-700 w-[32px] sticky left-0 bg-white z-20">Roll</th>
                            <th className="text-left py-0.5 px-0.5 font-semibold text-gray-700 w-[85px] sticky left-[32px] bg-white z-20">Name</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[22px]" title="Preparation (5 marks)">Pr</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[22px]" title="Program Execution (5 marks)">PE</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[22px]" title="Viva/Questions (10 marks)">P</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[22px]" title="Record/Notes (5 marks)">R</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[22px]" title="Regularity/Copy (5 marks)">C</th>
                            <th className="text-center py-0.5 px-0 font-semibold text-gray-700 w-[24px] bg-blue-100" title="Total (30 marks)">T</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columnStudents.map(student => {
                            const studentMarks = marksMap[student._id] || { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
                            return (
                              <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-0 px-0.5 text-[12px] font-medium text-gray-900 sticky left-0 bg-white z-10">{student.username}</td>
                                <td className="py-0 px-0.5 text-[12px] text-gray-900 truncate sticky left-[32px] bg-white z-10 max-w-[85px]" title={student.name}>{student.name}</td>
                                <td className="py-0 px-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={studentMarks.Pr || ""} 
                                    onChange={e => handleChange(student._id, "Pr", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-gray-300 rounded text-center text-[7px] h-[16px] leading-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-0 px-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={studentMarks.PE || ""} 
                                    onChange={e => handleChange(student._id, "PE", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-gray-300 rounded text-center text-[7px] h-[16px] leading-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-0 px-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={studentMarks.P || ""} 
                                    onChange={e => handleChange(student._id, "P", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-gray-300 rounded text-center text-[7px] h-[16px] leading-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-0 px-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={studentMarks.R || ""} 
                                    onChange={e => handleChange(student._id, "R", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-gray-300 rounded text-center text-[7px] h-[16px] leading-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-0 px-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={studentMarks.C || ""} 
                                    onChange={e => handleChange(student._id, "C", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-gray-300 rounded text-center text-[7px] h-[16px] leading-none"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-0 px-0 bg-blue-50">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={studentMarks.T || ""} 
                                    onChange={e => handleChange(student._id, "T", e.target.value)}
                                    className="w-full px-0.5 py-0 border border-blue-300 rounded text-center text-[7px] font-semibold h-[16px] leading-none"
                                    placeholder="0"
                                    readOnly
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* --- MARKS OVERVIEW SECTION --- */}
        {/* FIX: Only check for 'selected' to MOUNT the container, ensuring printRef is always set if a lab is loaded. */}
        {selected && (
          <div className="bg-white p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lab Marks Overview</h2>
                <p className="text-gray-600 mt-1">View all weeks marks for students</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMarksOverview(!showMarksOverview)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMarksOverview ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                  <span>{showMarksOverview ? "Hide Details" : "Show Details"}</span>
                </button>
                {showMarksOverview && weekDates.length > 0 && students.length > 0 && (
                  <button
                    onClick={handlePrint}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Overview</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Always render print content container (if selected is true), but control its visibility/size for non-print view */}
            <div 
              className="print-container"
              style={{ 
                visibility: showMarksOverview ? 'visible' : 'hidden',
                position: showMarksOverview ? 'relative' : 'absolute',
                height: showMarksOverview ? 'auto' : '1px',
                width: showMarksOverview ? 'auto' : '1px',
                overflow: showMarksOverview ? 'visible' : 'hidden'
              }}
            >
              {/* This is the REF target - it is now always in the DOM when a lab is selected */}
              <div className="overflow-x-auto" ref={printRef}>
                
                {/* Conditionally render the table CONTENT based on data availability */}
                {weekDates.length > 0 && students.length > 0 ? (
                  <>
                    {/* Print-specific styles and layout */}
                    <style>
                      {`
                        @media print {
                          @page { size: landscape; margin: 8mm; }
                          body { font-family: Calibri, Arial, sans-serif; font-size: 9pt; }
                          .print-compact-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                          .print-compact-table th, .print-compact-table td { border: 1px solid #d1d5db; padding: 4px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
                          .print-compact-table thead { display: table-header-group; }
                          .print-compact-table tfoot { display: table-footer-group; }
                          .print-compact-table tbody tr:nth-child(even) { background: #f9fafb; }
                          .print-compact-table th { font-size: 8.5pt; }
                          .print-compact-table td { font-size: 8.5pt; }
                          .print-title { font-weight: 700; text-align: center; margin-bottom: 4px; }
                          .print-subtitle { text-align: center; margin-bottom: 2px; }
                          .print-legend { text-align: center; margin: 6px 0 10px; font-size: 8.5pt; }
                          .screen-only { display: none !important; }
                          .page-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9pt; }
                          .page-footer .page-numbers:after { content: counter(page) ' of ' counter(pages); }
                        }
                      `}
                    </style>

                    {/* Screen table (unchanged) */}
                    <div className="screen-only">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Roll</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700 min-w-32">Name</th>
                            {weekDates.map(weekDate => {
                              const weekData = marksByWeek[weekDate];
                              return (
                                <th key={weekDate} className="text-center py-2 px-1 font-semibold text-gray-700 w-16">
                                  <div>
                                    <div className="font-medium text-xs">W{weekData.weekNumber}</div>
                                    <div className="text-gray-500 text-[10px]">{weekData.displayDate}</div>
                                    {/* Edit and Delete actions for this week (visible on screen only) */}
                                    {students.length > 0 && (
                                      <div className="mt-1 flex gap-1 justify-center">
                                        <button
                                          onClick={() => handleEditWeek(weekDate)}
                                          className="text-xs text-blue-600 hover:underline"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => deleteMarks(weekDate)}
                                          className="text-xs text-red-600 hover:underline"
                                          title="Delete all marks for this week"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="text-center py-2 px-2 font-semibold text-gray-700 w-14 bg-yellow-50">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => (
                            <tr key={student._id} className="border-b border-gray-200">
                              <td className="py-2 px-2 font-medium text-gray-900">{student.username}</td>
                              <td className="py-2 px-2 text-gray-900">{student.name}</td>
                              {weekDates.map((weekDate) => {
                                const weekData = marksByWeek[weekDate];
                                const studentMarks = weekData.students[String(student._id)];
                                const total = studentMarks?.T != null ? studentMarks.T : null;
                                return (
                                  <td key={weekDate} className="text-center py-2 px-1">
                                    <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-semibold ${
                                      total !== null && total !== undefined && total !== '' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {total !== null && total !== undefined && total !== '' ? total : '-'}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="text-center py-2 px-2 bg-yellow-50">
                                <span className="inline-flex items-center justify-center w-10 h-6 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  {calculateStudentAverage(student._id)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Print header */}
                    <div className="hidden print:block">
                      <div className="print-title text-xl">Lab – {getCurrentBatch()?.section} {getCurrentBatch()?.batchName ? `( ${getCurrentBatch().batchName} )` : ''}</div>
                      <div className="print-subtitle font-bold">Lab Marks Overview (Compact View – Without Names)</div>
                      <div className="print-legend">
                        <strong>Legend:</strong> 1 = Preparation (5M) | 2 = Program Execution (10M) | 3 = Post Viva (5M) | 4 = Record (5M) | 5 = Conduct (5M) | 6 = Total (30M)
                      </div>
                    </div>

                    {/* Print table - Compact numeric mapping */}
                    <table className="hidden print:table print-compact-table">
                      <thead>
                        <tr>
                          <th className="font-bold">Roll</th>
                          {(() => {
                            const filteredWeekDates = weekDates.filter(date => {
                              const weekData = marksByWeek[date];
                              return students.some(student => {
                                const sm = weekData.students[String(student._id)];
                                return sm && (sm.Pr != null || sm.PE != null || sm.P != null || sm.R != null || sm.C != null || sm.T != null);
                              });
                            });
                            return filteredWeekDates.map(weekDate => {
                              const weekData = marksByWeek[weekDate];
                              return (
                                <th key={weekDate} className="font-bold">W{weekData.weekNumber}</th>
                              );
                            });
                          })()}
                          <th className="font-bold">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, rowIdx) => (
                          <tr key={student._id} className={rowIdx % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="font-semibold text-center">{student.username}</td>
                            {(() => {
                              const filteredWeekDates = weekDates.filter(date => {
                                const weekData = marksByWeek[date];
                                return students.some(student => {
                                  const sm = weekData.students[String(student._id)];
                                  return sm && (sm.Pr != null || sm.PE != null || sm.P != null || sm.R != null || sm.C != null || sm.T != null);
                                });
                              });
                              return filteredWeekDates.map((weekDate) => {
                                const weekData = marksByWeek[weekDate];
                                const sm = weekData.students[String(student._id)] || {};
                                const v = (x) => (x !== null && x !== undefined && x !== '' ? x : '-');
                                const cell = `1=${v(sm.Pr)} | 2=${v(sm.PE)} | 3=${v(sm.P)} | 4=${v(sm.R)} | 5=${v(sm.C)} | 6=${v(sm.T)}`;
                                return (
                                  <td key={weekDate} className="text-center">{cell}</td>
                                );
                              });
                            })()}
                            <td className="text-center font-semibold">{calculateStudentAverage(student._id)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={(() => {
                            const filteredWeekDates = weekDates.filter(date => {
                              const weekData = marksByWeek[date];
                              return students.some(student => {
                                const sm = weekData.students[String(student._id)];
                                return sm && (sm.Pr != null || sm.PE != null || sm.P != null || sm.R != null || sm.C != null || sm.T != null);
                              });
                            });
                            return 2 + filteredWeekDates.length;
                          })()}>
                            <div className="page-footer">
                              Generated on {dayjs().format('MMMM DD, YYYY')} | Page <span className="page-numbers"></span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                ) : (
                  // Display a message if no data is available, only visible outside of print mode
                  <div className="py-10 text-center text-gray-500 print:hidden">
                    <p className="text-sm">Select a lab and ensure students/marks are loaded to view the overview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Marks Modal */}
        {editingWeek && selectedWeek && (
          <div className="fixed inset-0 bg-white z-50 overflow-auto">
            <div className="p-6 w-full h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Edit Marks - Week {marksByWeek[selectedWeek]?.weekNumber} ({marksByWeek[selectedWeek]?.displayDate})
                </h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 p-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Editing marks for **Week {marksByWeek[selectedWeek]?.weekNumber}**. 
                  Update the marks below and click Save Changes.
                </p>
              </div>

              <div className="overflow-x-auto h-[calc(100vh-220px)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Roll</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 min-w-32">Name</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14" title="Preparation (5 marks)">Pr(5)</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14" title="Program Execution (5 marks)">PE(5)</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14" title="Viva/Questions (10 marks)">P(10)</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14" title="Record/Notes (5 marks)">R(5)</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14" title="Regularity/Copy (5 marks)">C(5)</th>
                      <th className="text-center py-2 px-1 font-semibold text-gray-700 w-14 bg-blue-50" title="Total (30 marks)">T(30)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const studentMarks = editMarks[student._id] || { Pr: "", PE: "", P: "", R: "", C: "", T: "" };
                      const originalMarks = marksByWeek[selectedWeek]?.students[student._id];
                      
                      return (
                        <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-1.5 px-2 font-medium text-gray-900">{student.username}</td>
                          <td className="py-1.5 px-2 text-gray-900">{student.name}</td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={studentMarks.Pr || ''}
                              onChange={e => handleEditChange(student._id, "Pr", e.target.value)}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={studentMarks.PE || ''}
                              onChange={e => handleEditChange(student._id, "PE", e.target.value)}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={studentMarks.P || ''}
                              onChange={e => handleEditChange(student._id, "P", e.target.value)}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={studentMarks.R || ''}
                              onChange={e => handleEditChange(student._id, "R", e.target.value)}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={studentMarks.C || ''}
                              onChange={e => handleEditChange(student._id, "C", e.target.value)}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-1.5 px-1 bg-blue-50">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={studentMarks.T || ''}
                              onChange={e => handleEditChange(student._id, "T", e.target.value)}
                              className="w-full px-1 py-1 border border-blue-300 rounded text-center text-xs font-semibold"
                              placeholder="0"
                              readOnly
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditMarks}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data States */}
        {batches.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Batches Assigned</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't been assigned to any batches yet.</p>
            </div>
          </div>
        )}

        {selected && students.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Students Found</h3>
              <p className="mt-1 text-sm text-gray-500">No students are enrolled in this lab section.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}