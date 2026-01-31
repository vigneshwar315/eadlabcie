##Lab CIE Portal – Import & Setup Guide

## Step-by-step: Import labs and students, then configure

### Prerequisites

- Backend running (`cd backend && npm start`), MongoDB connected.
- Frontend running (`cd frontend && npm run dev`).
- Logged in as **admin** (create one with `node scripts/seedAdmin.js` if needed).

---

## 1. Import labs (`labnames.csv`)

1. Log in to the app as **admin**.
2. Open **Lab Management** (first tab).
3. **Option A – Bulk import**
   - Click **Bulk Import Labs**.
   - Choose `backend/labnames.csv` (or any CSV with columns: `labCode`, `labName`, `semester`, `department`).
   - Check the preview, then click **Import**.
4. **Option B – Add one by one**
   - Fill **Add single lab**: lab code, name, semester, department → **Add Lab**.
5. Confirm labs in the **Current labs** table.

**CSV format:** `labCode,labName,semester,department`  
Example: `22ITC09,Enterprise Application Development Lab,5,IT`

---

## 2. Import users – students and faculty

1. Go to **User Management**.
2. Click **Bulk Upload**.
3. Use **Students:** `backend/studentnames.csv`  
   **Faculty (optional):** `backend/facultynames.csv`
4. Select the file → check preview → **Import**.

**Student CSV:** `name,username,password,role,department,semester,section,admissionYear,graduationYear` (extra columns like `email` are ignored).  
**Faculty CSV:** `name,username,password,role,department` (no semester/section; defaults used).

---

## 3. What to do next

1. **Lab assignments**
   - Go to **Lab Assignments**.
   - **Step 1:** Create assignment: choose **Semester**, **Lab**, **Section**, **Start/End date**, **Day of week** → **Create Assignment**.
   - **Step 2:** Generate batches: choose **2 or 3** batches, assign **Faculty** per batch (B1, B2, B3) → **Generate Batches**.

2. **Faculty**
   - Faculty log in and see **Assigned Batch** (e.g. *Lab – Section – B1*).  
   - They pick **Session date**, enter marks, then **Submit Marks**.

3. **Students**
   - Students log in, open **My Lab Marks**, pick a lab, and view sessions.  
   - They can **Update password** and **Download report**.

4. **Increment semester (admin)**
   - In **Lab Assignments**, click **Increment Semester** when moving to the next academic period.  
   - All students’ semester is increased by 1 (max 8).

---

## 4. File reference

| File                | Use                          | Location              |
|---------------------|------------------------------|------------------------|
| `labnames.csv`      | Bulk import labs             | `backend/labnames.csv` |
| `studentnames.csv`  | Bulk import students         | `backend/studentnames.csv` |
| `facultynames.csv`  | Bulk import faculty (optional) | `backend/facultynames.csv` |

---

## 5. Quick order of operations

1. **Seed admin** → `node backend/scripts/seedAdmin.js`  
2. **Log in** as admin  
3. **Lab Management** → Bulk import `labnames.csv` (or add labs manually)  
4. **User Management** → Bulk upload `studentnames.csv` (and optionally `facultynames.csv`)  
5. **Lab Assignments** → Create assignment → Generate batches (assign faculty)  
6. **Faculty** → Enter marks; **Students** → View marks  
