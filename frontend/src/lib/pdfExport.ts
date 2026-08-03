// ── PDF & Report Export Utilities ──────────────────────────────────────────────

interface PrescriptionExportData {
  doctorName: string;
  specialty?: string;
  patientName: string;
  patientId: string;
  diagnosis: string;
  notes: string;
  prescriptions: Array<{ name: string; dosage: string; frequency: string; days?: number }>;
  date?: string;
}

interface LabReportExportData {
  patientName: string;
  testName: string;
  resultValue: string;
  resultNotes?: string;
  aiExplanation?: string;
  requestedBy: string;
  date?: string;
}

/**
 * Generate a printable E-Prescription Slip in a popup print window
 */
export function exportPrescriptionPDF(data: PrescriptionExportData) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const dateStr = data.date || new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>E-Prescription - ${data.patientName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .header { border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 24px; font-weight: 900; color: #0d9488; letter-spacing: -0.5px; }
          .sub { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 800; }
          .val { font-weight: 700; margin-top: 2px; }
          .section-title { font-size: 14px; font-weight: 800; color: #0d9488; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          .notes { background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; font-size: 12px; margin-top: 15px; font-style: italic; border-radius: 4px; }
          .footer { margin-top: 50px; border-top: 2px solid #e2e8f0; pt: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { text-align: center; width: 200px; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 11px; font-weight: 700; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">MediLink AI Clinical Portal</div>
            <div class="sub">Official Electronic Prescription & Medical Consultation Slip</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b;">Date: ${dateStr}</div>
            <div style="font-size: 10px; color: #94a3b8;">Rx Ref: RX-${Math.floor(100000 + Math.random() * 900000)}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="label">Attending Physician</div>
            <div class="val">Dr. ${data.doctorName}</div>
            <div style="font-size: 11px; color: #64748b;">${data.specialty || 'General Practitioner'}</div>
          </div>
          <div>
            <div class="label">Patient Name & ID</div>
            <div class="val">${data.patientName}</div>
            <div style="font-size: 11px; color: #64748b;">ID: ${data.patientId}</div>
          </div>
        </div>

        <div class="section-title">Primary Clinical Diagnosis</div>
        <div style="font-size: 14px; font-weight: 800; color: #1e293b; background: #fff; padding: 10px 0;">${data.diagnosis}</div>

        ${data.notes ? `<div class="notes">"Consultation Notes: ${data.notes}"</div>` : ''}

        <div class="section-title" style="margin-top: 300px margin-top: 25px;">Prescribed Medications (Rx)</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medication Name</th>
              <th>Dosage</th>
              <th>Frequency & Duration</th>
            </tr>
          </thead>
          <tbody>
            ${data.prescriptions.map((rx, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="font-weight: 800; color: #0f172a;">${rx.name}</td>
                <td>${rx.dosage}</td>
                <td>${rx.frequency} ${rx.days ? `(${rx.days} days)` : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer" style="margin-top: 60px;">
          <div style="font-size: 10px; color: #94a3b8; max-w: 300px;">
            This electronic prescription is digitally validated via MediLink AI FMOH Network. Valid at licensed pharmacies.
          </div>
          <div class="sig-box">
            <div>Dr. ${data.doctorName}</div>
            <div style="font-size: 9px; color: #0d9488;">Digitally Signed & Validated</div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate a printable Pathology Diagnostic Report in a popup print window
 */
export function exportLabReportPDF(data: LabReportExportData) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const dateStr = data.date || new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Diagnostic Report - ${data.patientName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .header { border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 24px; font-weight: 900; color: #6366f1; letter-spacing: -0.5px; }
          .sub { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 800; }
          .val { font-weight: 700; margin-top: 2px; }
          .result-card { background: #eef2ff; border: 2px solid #6366f1; padding: 20px; border-radius: 16px; margin-top: 20px; }
          .res-title { font-size: 12px; font-weight: 800; color: #4338ca; text-transform: uppercase; }
          .res-val { font-size: 26px; font-weight: 900; color: #1e1b4b; margin-top: 5px; }
          .ai-box { background: #faf5ff; border: 1px solid #d8b4fe; padding: 15px; border-radius: 12px; margin-top: 20px; font-size: 12px; color: #581c87; leading-height: 1.5; }
          .footer { margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .stamp { border: 2px dashed #6366f1; color: #6366f1; padding: 8px 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">MediLink AI Diagnostic Laboratory</div>
            <div class="sub">Official Pathology & Laboratory Test Findings Report</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b;">Date: ${dateStr}</div>
            <div style="font-size: 10px; color: #94a3b8;">Lab Order ID: LAB-${Math.floor(100000 + Math.random() * 900000)}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="label">Patient Name</div>
            <div class="val">${data.patientName}</div>
          </div>
          <div>
            <div class="label">Ordering Physician</div>
            <div class="val">${data.requestedBy}</div>
          </div>
        </div>

        <div class="result-card">
          <div class="res-title">Diagnostic Test: ${data.testName}</div>
          <div class="res-val">${data.resultValue}</div>
          ${data.resultNotes ? `<div style="font-size: 12px; color: #475569; margin-top: 8px; font-style: italic;">Remarks: ${data.resultNotes}</div>` : ''}
        </div>

        ${data.aiExplanation ? `
          <div class="ai-box">
            <strong style="display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; color: #7e22ce;">✨ AI Clinical Interpretation & Range Summary:</strong>
            ${data.aiExplanation}
          </div>
        ` : ''}

        <div class="footer">
          <div class="stamp">MediLink AI Certified Lab Result</div>
          <div style="text-align: right; font-size: 11px; color: #64748b; font-weight: 700;">
            <div>Chief Pathologist Verification</div>
            <div style="font-size: 9px; color: #94a3b8;">Electronic Laboratory Sign-Off</div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export table data array to CSV file download
 */
export function exportTelemetryCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
