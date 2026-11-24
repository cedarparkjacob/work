(() => {
  const $ = window.jQuery;
  const grid = document.querySelector("#GradebookGrid");
  const GB = window.SunGard?.Tac?.Gradebook;

  if (!$ || !grid || !GB) {
    console.error("Gradebook or its native functions are unavailable.");
    return;
  }

  document.getElementById("gradeCsvImporter")?.remove();

  const inputs = [...grid.querySelectorAll('input.input-cell[celltype="score"]')];
  const students = $("#GradebookGrid").jqGrid("getGridParam", "data") || [];

  if (!inputs.length || !students.length) {
    console.error("Could not find Gradebook students or score inputs.");
    return;
  }

  if (!window.__gradeCsvImportState) window.__gradeCsvImportState = { managedCells: new Set() };
  const importState = window.__gradeCsvImportState;
  const studentMap = new Map(students.map(student => [String(student.StudentId), student]));
  const inputMap = new Map();
  const assignmentMap = new Map();

  for (const input of inputs) {
    const studentId = input.getAttribute("studentid");
    const assessment = input.getAttribute("asmtnumber");
    if (!studentId || !assessment) continue;
    inputMap.set(\`\${studentId}|\${assessment}\`, input);
    if (!assignmentMap.has(assessment)) assignmentMap.set(assessment, {
      number: assessment,
      group: input.getAttribute("asmtgroupnumber"),
      dueDate: input.getAttribute("asmtduedate")
    });
  }

  function normalize(value) {
    const text = String(value ?? "").trim();
    if (text === "") return "";
    if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return String(Number(text));
    return text.toUpperCase();
  }
  function sameGrade(a, b) { return normalize(a) === normalize(b); }

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = []; let row = []; let value = ""; let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') { value += '"'; i++; }
          else quoted = false;
        } else value += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(value); value = ""; }
      else if (char === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
      else if (char !== "\r") value += char;
    }
    row.push(value);
    if (row.some(v => v !== "")) rows.push(row);
    return rows;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function getGridCellData(input) {
    const td = input.closest("td");
    const describedBy = td?.getAttribute("aria-describedby") || "";
    const columnName = describedBy.replace(/^GradebookGrid_/, "");
    const studentId = input.getAttribute("studentid");
    const rowData = students.find(student => String(student.StudentId) === String(studentId));
    return { td, tr: input.closest("tr"), columnName, rowData, cellData: rowData?.[columnName] };
  }

  function downloadSpreadsheet() {
    const assignments = [...assignmentMap.values()].sort((a, b) => Number(a.number) - Number(b.number));
    const headers = ["StudentId", "StudentName", ...assignments.map(a => \`A\${a.number}\${a.dueDate ? \`_\${a.dueDate}\` : ""}\`)];
    const csvEscape = value => {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? \`"\${text.replace(/"/g, '""')}"\` : text;
    };
    const csvRows = [headers];
    for (const student of students) {
      const studentId = student.StudentId;
      if (studentId == null) continue;
      const values = [studentId, student.StudentName || ""];
      for (const assignment of assignments) {
        const input = inputMap.get(\`\${studentId}|\${assignment.number}\`);
        values.push(input ? input.value : "");
      }
      csvRows.push(values);
    }
    const csv = "\uFEFF" + csvRows.map(row => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "eSchoolPLUS_Gradebook_Template.csv";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    console.log("Gradebook template downloaded.", {
      students: csvRows.length - 1, assignments: assignments.length,
      assignmentNumbers: assignments.map(a => a.number),
      note: "This export did not modify or save any grades."
    });
  }

  const panel = document.createElement("div");
  panel.id = "gradeCsvImporter";
  panel.innerHTML = \`
    <style>
      #gradeCsvImporter{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;font:14px Arial,sans-serif;color:#e8eaf0}
      #gradeCsvImporter *{box-sizing:border-box}
      #gradeCsvImporter .window{width:min(1100px,95vw);max-height:90vh;display:flex;flex-direction:column;background:#151a27;border:1px solid #39445b;border-radius:12px;overflow:hidden;box-shadow:0 20px 70px #0009}
      #gradeCsvImporter .top,#gradeCsvImporter .bottom{padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #30394b}
      #gradeCsvImporter .bottom{border-top:1px solid #30394b;border-bottom:0}
      #gradeCsvImporter h2{font-size:19px;margin:0}
      #gradeCsvImporter .body{padding:20px 22px;overflow:auto}
      #gradeCsvImporter button{cursor:pointer;border:1px solid #4b5871;color:white;background:#29344a;padding:9px 15px;border-radius:6px}
      #gradeCsvImporter button.primary{background:#6654c7;border-color:#8170e4}
      #gradeCsvImporter button:disabled{opacity:.4;cursor:not-allowed}
      #gradeCsvImporter .upload{padding:18px;border:1px dashed #596780;border-radius:8px;background:#1b2232}
      #gradeCsvImporter .muted{color:#9daac0;font-size:12px}
      #gradeCsvImporter .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
      #gradeCsvImporter .stat{padding:12px;background:#20293a;border-radius:7px}
      #gradeCsvImporter .stat strong{display:block;font-size:22px;margin-bottom:4px}
      #gradeCsvImporter .status{padding:12px;border-radius:7px;margin:12px 0;background:#263449}
      #gradeCsvImporter .status.error{background:#512b35}
      #gradeCsvImporter .status.success{background:#203f36}
      #gradeCsvImporter .table-wrap{max-height:350px;overflow:auto;border:1px solid #39445b;border-radius:7px}
      #gradeCsvImporter table{width:100%;border-collapse:collapse;font-size:12px}
      #gradeCsvImporter th,#gradeCsvImporter td{padding:8px 10px;text-align:left;border-bottom:1px solid #30394b;white-space:nowrap}
      #gradeCsvImporter th{position:sticky;top:0;background:#252e40}
      #gradeCsvImporter .actions{display:flex;gap:8px}
      #gradeCsvImporter .top-actions{display:flex;align-items:center;gap:8px}
      #gradeCsvImporter .download{background:#203f36;border-color:#39735f}
      #gradeCsvImporter .download:hover{background:#285344}
      @media(max-width:650px){#gradeCsvImporter .summary{grid-template-columns:repeat(2,1fr)}#gradeCsvImporter .top{flex-wrap:wrap}#gradeCsvImporter .top-actions{margin-left:auto}}
    </style>
    <div class="window">
      <div class="top"><h2>Gradebook CSV Importer</h2><div class="top-actions">
        <button id="gciDownload" class="download">↓ Download spreadsheet</button><button id="gciClose">✕</button>
      </div></div>
      <div class="body">
        <div class="upload"><strong>Select your completed Gradebook CSV</strong>
          <div style="margin-top:10px"><input type="file" id="gciFile" accept=".csv,text/csv"></div>
          <div class="muted" style="margin-top:9px">Blank cells are ignored. Student IDs and assessment numbers are used for matching.</div>
        </div>
        <div id="gciResults" style="margin-top:16px"><div class="muted">Select a CSV file to begin.</div></div>
      </div>
      <div class="bottom"><div class="muted" id="gciFooter">Nothing has been changed or saved.</div>
        <div class="actions"><button id="gciCancel">Close</button><button id="gciApply" class="primary" disabled>Apply grades</button></div>
      </div>
    </div>\`;
  document.body.appendChild(panel);

  const results = panel.querySelector("#gciResults");
  const applyButton = panel.querySelector("#gciApply");
  const footer = panel.querySelector("#gciFooter");
  let pendingChanges = [];
  let previewValid = false;
  function close() { panel.remove(); }
  panel.querySelector("#gciClose").onclick = close;
  panel.querySelector("#gciCancel").onclick = close;
  panel.querySelector("#gciDownload").onclick = downloadSpreadsheet;

  function showError(errors) {
    results.innerHTML = \`<div class="status error"><strong>Import validation failed.</strong><div style="margin-top:8px">\${errors.slice(0,50).map(error => \`<div>• \${escapeHTML(error)}</div>\`).join("")}</div>\${errors.length > 50 ? \`<div>And \${errors.length - 50} more errors.</div>\` : ""}</div><div class="muted">No new grades were applied.</div>\`;
    pendingChanges = []; previewValid = false; applyButton.disabled = true;
  }

  panel.querySelector("#gciFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    applyButton.disabled = true; pendingChanges = []; previewValid = false;
    let parsed;
    try { parsed = parseCSV(await file.text()); }
    catch (error) { showError(["Could not read CSV: " + error.message]); return; }
    if (parsed.length < 2) { showError(["The CSV contains no student rows."]); return; }

    const headers = parsed[0].map(h => String(h).trim());
    const idIndex = headers.indexOf("StudentId");
    const nameIndex = headers.indexOf("StudentName");
    if (idIndex === -1) { showError(['Required column "StudentId" was not found.']); return; }

    const errors = [];
    const assignmentColumns = [];
    const seenAssignments = new Set();
    headers.forEach((header, index) => {
      const match = header.match(/^A(\d+)(?:_|$)/i);
      if (!match) return;
      const assessment = match[1];
      if (seenAssignments.has(assessment)) { errors.push(\`Duplicate assignment column: \${header}\`); return; }
      seenAssignments.add(assessment);
      if (!assignmentMap.has(assessment)) { errors.push(\`Assessment \${assessment} is not in this Gradebook.\`); return; }
      assignmentColumns.push({ index, assessment, header });
    });
    if (!assignmentColumns.length) errors.push("No recognized assignment columns were found.");

    const seenStudents = new Set();
    const changes = [];
    let blankCount = 0, unchangedCount = 0, populatedCount = 0;

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];
      if (!row.some(v => String(v ?? "").trim() !== "")) continue;
      const studentId = String(row[idIndex] ?? "").trim();
      const studentName = nameIndex >= 0 ? String(row[nameIndex] ?? "").trim() : "";
      if (!studentId) { errors.push(\`CSV row \${r + 1}: missing StudentId.\`); continue; }
      if (seenStudents.has(studentId)) { errors.push(\`CSV row \${r + 1}: duplicate StudentId \${studentId}.\`); continue; }
      seenStudents.add(studentId);
      if (!studentMap.has(studentId)) { errors.push(\`CSV row \${r + 1}: unknown StudentId \${studentId}.\`); continue; }

      for (const column of assignmentColumns) {
        const value = String(row[column.index] ?? "").trim();
        if (value === "") { blankCount++; continue; }
        populatedCount++;
        if (value.length > 6) { errors.push(\`\${studentId}, \${column.header}: value exceeds 6 characters.\`); continue; }
        if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
          if (!Number.isFinite(Number(value)) || Number(value) > 999.99) {
            errors.push(\`\${studentId}, \${column.header}: invalid numeric score "\${value}".\`); continue;
          }
        } else if (!/^[A-Za-z0-9._+-]+$/.test(value)) {
          errors.push(\`\${studentId}, \${column.header}: unsupported value "\${value}".\`); continue;
        }
        const key = \`\${studentId}|\${column.assessment}\`;
        const input = inputMap.get(key);
        if (!input) { errors.push(\`No input found for student \${studentId}, assessment \${column.assessment}.\`); continue; }
        const oldValue = String(input.value ?? "").trim();
        if (sameGrade(oldValue, value)) { unchangedCount++; continue; }
        changes.push({
          key, studentId,
          studentName: studentMap.get(studentId)?.StudentName || studentName,
          assessment: column.assessment, header: column.header, oldValue, newValue: value, input
        });
      }
    }

    const unrelatedModified = inputs.filter(input => {
      if (input.getAttribute("modified") !== "Y") return false;
      const key = \`\${input.getAttribute("studentid")}|\${input.getAttribute("asmtnumber")}\`;
      return !importState.managedCells.has(key);
    });
    if (unrelatedModified.length) errors.push(\`\${unrelatedModified.length} cells have unsaved changes not made by this importer. Save or reload before importing.\`);
    if (errors.length) { showError(errors); return; }

    pendingChanges = changes; previewValid = true;
    results.innerHTML = \`
      <div class="status \${changes.length ? "" : "success"}">
        <strong>\${changes.length ? "CSV validated. Review the proposed changes." : "CSV validated. No changes are needed."}</strong>
        <div class="muted" style="margin-top:5px">No new grades have been applied yet.</div>
      </div>
      <div class="summary">
        <div class="stat"><strong>\${seenStudents.size}</strong><span class="muted">Students matched</span></div>
        <div class="stat"><strong>\${assignmentColumns.length}</strong><span class="muted">Assignments matched</span></div>
        <div class="stat"><strong>\${changes.length}</strong><span class="muted">Actual changes</span></div>
        <div class="stat"><strong>\${unchangedCount}</strong><span class="muted">Already correct</span></div>
      </div>
      <div class="muted" style="margin-bottom:12px">\${blankCount} blank cells ignored. \${populatedCount} nonblank cells examined.</div>
      <strong>Proposed changes</strong>
      <div class="table-wrap" style="margin-top:8px"><table>
        <thead><tr><th>Student</th><th>Student ID</th><th>Assignment</th><th>Current</th><th>New</th></tr></thead>
        <tbody>\${changes.slice(0,300).map(change => \`
          <tr><td>\${escapeHTML(change.studentName)}</td><td>\${escapeHTML(change.studentId)}</td><td>\${escapeHTML(change.header)}</td><td>\${escapeHTML(change.oldValue)}</td><td><strong>\${escapeHTML(change.newValue)}</strong></td></tr>
        \`).join("")}</tbody>
      </table></div>
      \${changes.length > 300 ? \`<div class="muted">Showing 300 of \${changes.length} changes.</div>\` : ""}
    \`;
    applyButton.disabled = changes.length === 0;
    footer.textContent = "Review the preview before applying.";
  });

  applyButton.addEventListener("click", () => {
    if (!previewValid || !pendingChanges.length) return;
    if (!confirm(\`Apply \${pendingChanges.length} changes to the Gradebook page?\\n\\nThis does NOT save them to eSchoolPLUS.\`)) return;
    for (const change of pendingChanges) {
      if (!sameGrade(change.input.value, change.oldValue)) {
        showError([\`The grade for \${change.studentId}, assessment \${change.assessment}, changed after preview. Reload the CSV and preview again.\`]);
        return;
      }
    }

    let appliedCount = 0;
    const failures = [];
    for (const change of pendingChanges) {
      const input = change.input;
      const before = change.oldValue;
      try {
        GB.addScoreInputEvents($(input));
        input.value = change.newValue;
        $(input).trigger("change");
        const state = getGridCellData(input);
        const dataValue = state.cellData?.currentValue;
        const inputValue = input.value;
        const inputMatches = sameGrade(inputValue, change.newValue);
        const dataMatches = sameGrade(dataValue, change.newValue);
        if (!inputMatches || !dataMatches) {
          input.value = before; $(input).trigger("change");
          failures.push({ change, reason: \`Verification failed. Input="\${inputValue}", grid data="\${dataValue ?? "missing"}".\` });
          continue;
        }
        importState.managedCells.add(change.key);
        appliedCount++;
      } catch (error) {
        try { input.value = before; $(input).trigger("change"); } catch (_) {}
        failures.push({ change, reason: error.message });
      }
    }

    previewValid = false; pendingChanges = []; applyButton.disabled = true;
    footer.textContent = \`\${appliedCount} verified changes applied. Not saved.\`;
    results.insertAdjacentHTML("afterbegin", \`
      <div class="status \${failures.length ? "error" : "success"}">
        <strong>\${appliedCount} of \${appliedCount + failures.length} changes verified.</strong>
        <div style="margin-top:7px">\${failures.length ? \`\${failures.length} changes failed verification and were restored where possible.\` : "Both the score input and Gradebook internal data were updated."}</div>
        <div style="margin-top:7px;font-weight:bold">Nothing has been saved to the server.</div>
        \${failures.length ? \`<div style="margin-top:8px">\${failures.slice(0,30).map(f => \`<div>\${escapeHTML(f.change.studentId)} / A\${escapeHTML(f.change.assessment)}: \${escapeHTML(f.reason)}</div>\`).join("")}</div>\` : ""}
      </div>
    \`);
    console.log("Gradebook import verification:", {
      applied: appliedCount, failed: failures.length, savedToServer: false,
      managedUnsavedCells: importState.managedCells.size
    });
  });

  console.log("Gradebook CSV importer ready.", {
    students: students.length, assignments: assignmentMap.size, scoreInputs: inputs.length,
    autosaveEnabled: GB.GetAutoSaveEnabled?.()
  });
})();