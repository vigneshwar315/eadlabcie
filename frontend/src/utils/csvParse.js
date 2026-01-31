/**
 * Simple CSV parser for bulk user import.
 * Expects header: name,username,password,role,department,semester,section,admissionYear,graduationYear,email
 * semester,section,admissionYear,graduationYear,email optional for faculty.
 */
export function parseUsersCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { users: [], error: "CSV must have header and at least one row." };

  const raw = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = raw.findIndex((h) => h === "name");
  const usernameIdx = raw.findIndex((h) => h === "username");
  const passwordIdx = raw.findIndex((h) => h === "password");
  const roleIdx = raw.findIndex((h) => h === "role");
  const deptIdx = raw.findIndex((h) => h === "department");
  const semIdx = raw.findIndex((h) => h === "semester");
  const sectionIdx = raw.findIndex((h) => h === "section");
  const admissionYearIdx = raw.findIndex((h) => h === "admissionyear");
  const graduationYearIdx = raw.findIndex((h) => h === "graduationyear");
  const emailIdx = raw.findIndex((h) => h === "email");

  if (nameIdx < 0 || usernameIdx < 0 || passwordIdx < 0 || roleIdx < 0 || deptIdx < 0) {
    return {
      users: [],
      error: "CSV must include columns: name, username, password, role, department. Optional: semester, section, admissionYear, graduationYear, email.",
    };
  }

  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const name = (cells[nameIdx] || "").trim();
    const username = (cells[usernameIdx] || "").trim();
    const password = (cells[passwordIdx] || "").trim();
    const role = ((cells[roleIdx] || "").trim().toLowerCase()) || "student";
    const department = (cells[deptIdx] || "").trim() || "IT";
    let semester = semIdx >= 0 ? parseInt(cells[semIdx], 10) : 1;
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) semester = 1;
    const section = (sectionIdx >= 0 && cells[sectionIdx]) ? (cells[sectionIdx] || "").trim() : "IT-1";
    const admissionYear = admissionYearIdx >= 0 && cells[admissionYearIdx] ? parseInt(cells[admissionYearIdx], 10) : null;
    const graduationYear = graduationYearIdx >= 0 && cells[graduationYearIdx] ? parseInt(cells[graduationYearIdx], 10) : null;
    const email = (emailIdx >= 0 && cells[emailIdx]) ? (cells[emailIdx] || "").trim() : null;

    if (!name || !username || !password) continue;
    users.push({
      name,
      username,
      password,
      role: ["admin", "faculty", "student"].includes(role) ? role : "student",
      department,
      semester,
      section,
      admissionYear,
      graduationYear,
      email,
    });
  }

  return { users, error: null };
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export const CSV_TEMPLATE = `name,username,password,role,department,semester,section,admissionYear,graduationYear,email
John Doe,john1,pass123,student,IT,3,IT-1,2022,2026,john1@college.edu
Jane Smith,jane1,pass123,student,IT,3,IT-1,2022,2026,jane1@college.edu`;

/**
 * CSV parser for bulk lab import.
 * Expects header: labCode,labName,semester,department
 */
export function parseLabsCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { labs: [], error: "CSV must have header and at least one row." };

  const raw = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const labCodeIdx = raw.findIndex((h) => h === "labcode");
  const labNameIdx = raw.findIndex((h) => h === "labname");
  const semIdx = raw.findIndex((h) => h === "semester");
  const deptIdx = raw.findIndex((h) => h === "department");

  if (labCodeIdx < 0 || labNameIdx < 0 || semIdx < 0 || deptIdx < 0) {
    return {
      labs: [],
      error: "CSV must include columns: labCode, labName, semester, department.",
    };
  }

  const labs = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const labCode = (cells[labCodeIdx] || "").trim();
    const labName = (cells[labNameIdx] || "").trim();
    let semester = parseInt(cells[semIdx], 10);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) semester = 1;
    const department = (cells[deptIdx] || "").trim() || "IT";

    if (!labCode || !labName) continue;
    labs.push({ labCode, labName, semester, department });
  }

  return { labs, error: null };
}

export const LABS_CSV_TEMPLATE = `labCode,labName,semester,department
22CSC31,Data Structures Lab,3,IT
22ITC09,Enterprise Application Development Lab,5,IT`;
