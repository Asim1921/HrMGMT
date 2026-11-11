import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const TITLE_COLOR = [15, 23, 42];
const HEADER_BG = [30, 41, 59];
const HEADER_TEXT = [226, 232, 240];
const ROW_ALT = [241, 245, 249];
const ACCENT = [106, 124, 66];

function addHeader(doc, title, dateRange) {
  doc.setFontSize(18);
  doc.setTextColor(...TITLE_COLOR);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const subtitle = dateRange
    ? `${dateRange.start} to ${dateRange.end}`
    : new Date().toLocaleDateString();
  doc.text(subtitle, 14, 28);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function exportAttendancePDF(data, dateRange) {
  const doc = new jsPDF();
  addHeader(doc, '101 Cyber Div - Attendance Report', dateRange);

  const rows = data.map((r) => [
    r.user?.fullName || '—',
    r.user?.unit || '—',
    formatDate(r.date),
    formatTime(r.markedAt),
    (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1),
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Name', 'Unit', 'Date', 'Time', 'Status']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`attendance-report-${dateRange?.start || 'all'}-to-${dateRange?.end || 'all'}.pdf`);
}

export function exportLeavesPDF(data, dateRange) {
  const doc = new jsPDF();
  addHeader(doc, '101 Cyber Div - Leave Report', dateRange);

  const typeLabel = { casual: 'Casual', medical: 'Medical', emergency: 'Emergency', unpaid: 'Unpaid' };

  const rows = data.map((r) => [
    r.user?.fullName || '—',
    r.user?.unit || '—',
    typeLabel[r.leaveType] || r.leaveType,
    formatDate(r.startDate),
    formatDate(r.endDate),
    r.totalDays ?? '—',
    (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1),
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Name', 'Unit', 'Type', 'Start', 'End', 'Days', 'Status']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`leave-report-${dateRange?.start || 'all'}-to-${dateRange?.end || 'all'}.pdf`);
}
