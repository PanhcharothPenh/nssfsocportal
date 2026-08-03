import React, { useState, useEffect, useRef } from 'react';

// Convert numbers to Khmer digits
const toKhmerNum = (num) => {
  if (num === undefined || num === null) return '';
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(char => khmerDigits[char] || char).join('');
};

const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export default function NssfFormGenerator({ currentUser, usersList = [], onSubmitAsTicket, onClose, isFullPage = false }) {
  const [formTemplate, setFormTemplate] = useState('system_change');
  
  // Selected Staff for Auto-Fill
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Section 1: Applicant Info
  const [applicantName, setApplicantName] = useState(currentUser?.full_name || currentUser?.username || '');
  const [gender, setGender] = useState('ប្រុស');
  const [position, setPosition] = useState(currentUser?.position || 'មន្ត្រី');
  const [office, setOffice] = useState(currentUser?.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធ IT');
  const [department, setDepartment] = useState(currentUser?.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
  const [phone, setPhone] = useState(currentUser?.phone || '012 345 678');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Section 2: Details & Purpose
  const [details, setDetails] = useState('');
  const [changeTypes, setChangeTypes] = useState({
    dataEdit: false,
    configuration: true,
    feature: false,
    other: false,
  });
  const [changeTypeOther, setChangeTypeOther] = useState('');

  const [impactLevel, setImpactLevel] = useState('medium'); // low, medium, high, other
  const [impactOther, setImpactOther] = useState('');
  const [reason, setReason] = useState('');

  // Dates
  const now = new Date();
  const currentDayStr = toKhmerNum(String(now.getDate()).padStart(2, '0'));
  const currentMonthStr = KHMER_MONTHS[now.getMonth()];
  const currentYearStr = toKhmerNum(now.getFullYear());
  const buddhistYearStr = toKhmerNum(now.getFullYear() + 543);

  const [day, setDay] = useState(currentDayStr);
  const [month, setMonth] = useState(currentMonthStr);
  const [year, setYear] = useState(currentYearStr);
  const [buddhistYear, setBuddhistYear] = useState(buddhistYearStr);
  const [lunarDateText, setLunarDateText] = useState('......................................');

  // Attached files ("another file too")
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Digital Signature Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signatureImage, setSignatureImage] = useState(currentUser?.signature_url || '');

  // Auto-Fill Handler from Current User
  const handleAutoFillCurrentUser = () => {
    if (currentUser) {
      setApplicantName(currentUser.full_name || currentUser.username || 'អ៊ុក សុធារ៉ារិទ្ធ');
      setGender(currentUser.gender || 'ប្រុស');
      setPosition(currentUser.position || 'ប្រធានការិយាល័យ');
      setOffice(currentUser.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន');
      setDepartment(currentUser.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
      setPhone(currentUser.phone || '012 888 999');
      setEmail(currentUser.email || 'soc.admin@nssf.gov.kh');
    } else {
      setApplicantName('ហ៊ាង ចាន់ថន');
      setGender('ប្រុស');
      setPosition('មន្ត្រីបច្ចេកវិទ្យាព័ត៌មាន');
      setOffice('ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន');
      setDepartment('នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
      setPhone('012 999 888');
      setEmail('heang.chanthorn@nssf.gov.kh');
    }

    if (!details) {
      setDetails('ស្នើសុំធ្វើការកែប្រែ និងកំណត់រចនាសម្ព័ន្ធ Firewalls / Route Policy និងការបើកសិទ្ធិចរាចរណ៍ IP Public សម្រាប់ប្រព័ន្ធ SOC Web Portal ។');
    }
    if (!reason) {
      setReason('ដើម្បីធានាការតភ្ជាប់ប្រព័ន្ធ និងបង្កើនសុវត្ថិភាពទិន្នន័យក្នុងការប្រតិបត្តិការរបស់អង្គភាព ប.ស.ស. ។');
    }
  };

  // Staff Dropdown Auto-Fill Handler
  const handleStaffSelect = (e) => {
    const staffId = e.target.value;
    setSelectedStaffId(staffId);
    if (!staffId) return;

    const staff = usersList.find(u => String(u.id) === String(staffId) || u.username === staffId);
    if (staff) {
      setApplicantName(staff.full_name || staff.username || '');
      setPosition(staff.position || 'មន្ត្រី');
      setOffice(staff.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធ IT');
      setDepartment(staff.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
      setPhone(staff.phone || '012 xxx xxx');
      setEmail(staff.email || '');
      setGender(staff.gender || 'ប្រុស');
    }
  };

  // Signature Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
    setSignatureImage('');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSignatureImage(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // File Upload Handler for Attached Documents ("another file too")
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      rawFile: file
    }));
    setAttachedFiles(prev => [...prev, ...fileObjects]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // High-Fidelity Printable PDF Handler
  const generateHTMLDocument = () => {
    const formTitleMap = {
      system_change: 'ទម្រង់ស្នើសុំកែប្រែប្រព័ន្ធ',
      system_access: 'លិខិតស្នើសុំបើកប្រព័ន្ធ និងបង្កើតគណនី',
      vpn_access: 'លិខិតស្នើសុំភ្ជាប់ VPN Remote Access',
      equipment: 'លិខិតស្នើសុំឧបករណ៍ និងគ្រឿងបន្លាស់ IT'
    };

    return `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>${formTitleMap[formTemplate] || 'ទម្រង់ស្នើសុំ'} (NSSF Form Request)</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Moul&family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Battambang', 'Kantumruy Pro', sans-serif;
            font-size: 13.5px;
            line-height: 1.6;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .moul {
            font-family: 'Moul', cursive, serif;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          .header-left {
            text-align: left;
            vertical-align: top;
            width: 45%;
          }
          .header-right {
            text-align: center;
            vertical-align: top;
            width: 55%;
          }
          .logo {
            width: 75px;
            height: auto;
            margin-bottom: 4px;
          }
          .dept-title {
            font-size: 13px;
            font-weight: bold;
            line-height: 1.5;
          }
          .country-title {
            font-size: 15px;
            font-family: 'Moul', serif;
            margin-bottom: 2px;
          }
          .motto {
            font-size: 13px;
            font-family: 'Moul', serif;
          }
          .header-divider {
            text-align: center;
            letter-spacing: 3px;
            font-size: 10px;
            margin-top: 2px;
          }
          .form-title {
            text-align: center;
            font-family: 'Moul', serif;
            font-size: 18px;
            margin: 18px 0 15px 0;
          }
          .section-header {
            font-weight: bold;
            font-size: 14.5px;
            margin-top: 12px;
            margin-bottom: 6px;
          }
          .dotted-line {
            border-bottom: 1px dotted #333;
            display: inline-block;
            padding: 0 4px;
            min-height: 18px;
          }
          .info-row {
            margin-bottom: 7px;
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
          }
          .checkbox-group {
            display: flex;
            gap: 14px;
            align-items: center;
            margin: 6px 0;
            flex-wrap: wrap;
          }
          .checkbox-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          .box {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1.5px solid #000;
            text-align: center;
            line-height: 12px;
            font-size: 11px;
            font-weight: bold;
          }
          .disclaimer {
            font-size: 12px;
            font-style: italic;
            margin: 12px 0 8px 0;
            text-align: justify;
            line-height: 1.5;
          }
          .disclaimer-title {
            font-weight: bold;
            font-style: normal;
            font-size: 12.5px;
          }
          .date-sig-block {
            float: right;
            text-align: center;
            margin-top: 5px;
            width: 320px;
          }
          .table-approvals {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            clear: both;
          }
          .table-approvals th, .table-approvals td {
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            font-size: 12px;
            vertical-align: top;
          }
          .table-approvals th {
            font-weight: bold;
            background-color: #f8fafc;
            height: 45px;
          }
          .table-approvals td {
            height: 100px;
          }
          .attached-files-list {
            margin-top: 15px;
            font-size: 12px;
            border-top: 1px dashed #666;
            padding-top: 8px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td class="header-left">
                <img src="/nssf_logo.png" class="logo" alt="NSSF Logo" onerror="this.onerror=null; this.src='/Nssf_Resize_Logo.png';" /><br/>
                <div class="dept-title">
                  <b>បេឡាជាតិសន្តិសុខសង្គម</b><br/>
                  <b>នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</b><br/>
                  ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន
                </div>
              </td>
              <td class="header-right">
                <div class="country-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div class="header-divider">─── ❖ ───</div>
              </td>
            </tr>
          </table>

          <div class="form-title">${formTitleMap[formTemplate] || 'ទម្រង់ស្នើសុំ'}</div>

          <!-- Section 1 -->
          <div class="section-header">១. ព័ត៌មានអ្នកស្នើសុំ ៖</div>
          <div class="info-row">
            គោត្តនាម និងនាម ៖ <span class="dotted-line" style="flex: 2; font-weight: bold;">${applicantName || ''}</span>
            &nbsp;&nbsp;ភេទ ៖ <span class="dotted-line" style="width: 70px; text-align: center;">${gender || ''}</span>
            &nbsp;&nbsp;មុខតំណែង ៖ <span class="dotted-line" style="flex: 2;">${position || ''}</span>
          </div>
          <div class="info-row">
            ការិយាល័យ ៖ <span class="dotted-line" style="flex: 1;">${office || ''}</span>
            &nbsp;&nbsp;នាយកដ្ឋាន/អង្គភាព/សាខា ៖ <span class="dotted-line" style="flex: 1.5;">${department || ''}</span>
          </div>
          <div class="info-row">
            លេខទូរស័ព្ទទំនាក់ទំនង ៖ <span class="dotted-line" style="flex: 1;">${phone || ''}</span>
            &nbsp;&nbsp;អ៊ីមែល ៖ <span class="dotted-line" style="flex: 1.5;">${email || ''}</span>
          </div>

          <!-- Section 2 -->
          <div class="section-header">២. ព័ត៌មានលម្អិត និងគោលបំណង ៖</div>
          <div style="min-height: 50px; line-height: 1.8; margin-bottom: 6px;" class="dotted-line-block">
            ${(details || '').split('\n').map(line => `<div>${line}</div>`).join('')}
            ${!details ? '<div>............................................................................................................................................................</div><div>............................................................................................................................................................</div>' : ''}
          </div>

          <div class="checkbox-group">
            <span>ប្រភេទការកែប្រែ ៖</span>
            <span class="checkbox-item"><span class="box">${changeTypes.dataEdit ? '✓' : ''}</span> កែទិន្នន័យ</span>
            <span class="checkbox-item"><span class="box">${changeTypes.configuration ? '✓' : ''}</span> កែប្រព័ន្ធ (Configuration)</span>
            <span class="checkbox-item"><span class="box">${changeTypes.feature ? '✓' : ''}</span> បន្ថែមមុខងារ (Feature)</span>
            <span class="checkbox-item"><span class="box">${changeTypes.other ? '✓' : ''}</span> ផ្សេងៗ${changeTypeOther ? ` (${changeTypeOther})` : ''}</span>
          </div>

          <div class="checkbox-group">
            <span>កម្រិតនៃផលប៉ះពាល់ ៖</span>
            <span class="checkbox-item"><span class="box">${impactLevel === 'low' ? '✓' : ''}</span> ទាប</span>
            <span class="checkbox-item"><span class="box">${impactLevel === 'medium' ? '✓' : ''}</span> មធ្យម</span>
            <span class="checkbox-item"><span class="box">${impactLevel === 'high' ? '✓' : ''}</span> ខ្ពស់</span>
            <span class="checkbox-item"><span class="box">${impactLevel === 'other' ? '✓' : ''}</span> ផ្សេងៗ${impactOther ? ` (${impactOther})` : ''}</span>
          </div>

          <div style="margin-top: 6px;">
            មូលហេតុនៃការស្នើសុំ ៖ <span class="dotted-line" style="width: 80%;">${reason || ''}</span>
          </div>

          <div class="disclaimer">
            <span class="disclaimer-title">ចំណាំ ៖</span><br/>
            ខ្ញុំបាទ/នាងខ្ញុំ សូមធានាថា រាល់ការកែប្រែព័ត៌មានដែលបានស្នើសុំខាងលើ គឺស្របតាមលំហូរនៃប្រព័ន្ធ (System Flow) និងផ្អែកលើខ្លឹមសារនៃការស្នើសុំជាផ្លូវការ។ ខ្ញុំបាទ/នាងខ្ញុំ សូមសន្យាថាក្នុងករណីមានការប្រែប្រួលខុសពីការស្នើសុំដើម ឬមានផលប៉ះពាល់ដល់លំហូរការងាររបស់ប្រព័ន្ធ ដែលបណ្តាលមកពីការស្នើសុំមិនច្បាស់លាស់ ខ្ញុំបាទ/នាងខ្ញុំ ជាអ្នកស្នើសុំ សុខចិត្តទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
          </div>

          <!-- Signature Block -->
          <div style="overflow: hidden; margin-top: 10px;">
            <div class="date-sig-block">
              <div>ថ្ងៃ ${lunarDateText || '.................................'} ខែ ............... ឆ្នាំ .................... ព.ស. ២៥៦${buddhistYear || '.....'}</div>
              <div>ថ្ងៃទី <span style="font-weight: bold;">${day}</span> ខែ <span style="font-weight: bold;">${month}</span> ឆ្នាំ២០២<span style="font-weight: bold;">${year.length > 3 ? year.substring(3) : year}</span></div>
              <div style="margin-top: 6px; font-weight: bold;">ហត្ថលេខាសាម៉ីខ្លួន</div>
              <div style="height: 65px; display: flex; align-items: center; justify-content: center; margin-top: 4px;">
                ${signatureImage ? `<img src="${signatureImage}" style="max-height: 60px; max-width: 180px;" />` : `<div style="font-weight: bold; color: #1e3a8a; font-size: 15px;">${applicantName}</div>`}
              </div>
            </div>
          </div>

          <!-- Section 3 Approval Table -->
          <div class="section-header">៣. យោបល់របស់ថ្នាក់ដឹកនាំមានសមត្ថកិច្ច ៖</div>
          <table class="table-approvals">
            <thead>
              <tr>
                <th style="width: 20%;">ប្រធាននាយកដ្ឋាន</th>
                <th style="width: 20%;">អនុ.នាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
                <th style="width: 20%;">ប្រធានការិយាល័យ<br/>ស.ប.ត</th>
                <th style="width: 20%;">អនុ.ប្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
                <th style="width: 20%;">ប្រធានការិយាល័យ<br/>សាម៉ី</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          ${attachedFiles.length > 0 ? `
            <div class="attached-files-list">
              <b>📎 ឯកសារភ្ជាប់បន្ថែម (${attachedFiles.length}) ៖</b>
              <ul>
                ${attachedFiles.map(f => `<li>${f.name} (${f.size})</li>`).join('')}
              </ul>
            </div>
          ` : ''}

        </div>
      </body>
      </html>
    `;
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('សូមអនុញ្ញាត Popup blocker ដើម្បីបើកផ្ទាំងបោះពុម្ព!');
      return;
    }
    const htmlContent = generateHTMLDocument() + `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('សូមអនុញ្ញាត Popup blocker!');
      return;
    }
    const htmlContent = generateHTMLDocument() + `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Submit form as an Electronic Ticket to backend/app state
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះអ្នកស្នើសុំ!');
      return;
    }
    
    if (onSubmitAsTicket) {
      onSubmitAsTicket({
        title: `ស្នើសុំកែប្រែប្រព័ន្ធ (${applicantName})`,
        category: 'សំណើសុំកែប្រែប្រព័ន្ធ (System Change)',
        priority: impactLevel === 'high' ? 'High' : impactLevel === 'medium' ? 'Medium' : 'Low',
        description: `ព័ត៌មានអ្នកស្នើសុំ៖ ${applicantName} (${position} - ${office})\nប្រភេទ៖ ${Object.keys(changeTypes).filter(k => changeTypes[k]).join(', ')}\n\nព័ត៌មានលម្អិត៖\n${details}\n\nមូលហេតុ៖\n${reason}`,
        requester_name: applicantName,
        department: department,
        attachedFiles: attachedFiles
      });
    }
  };

  const mainFormJSX = (
    <form onSubmit={handleSubmitTicket}>
      {/* Staff Auto-Fill & Template Selector Header */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        
        {/* Staff Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px' }}>
          <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap' }}>👤 Auto-Fill តាមបុគ្គលិក ៖</label>
          <select
            className="form-input"
            value={selectedStaffId}
            onChange={handleStaffSelect}
            style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}
          >
            <option value="">-- ជ្រើសរើសបុគ្គលិកពីប្រព័ន្ធ --</option>
            {usersList.map((u) => (
              <option key={u.id || u.username} value={u.id || u.username}>
                {u.full_name || u.username} ({u.position || 'មន្ត្រី'} - {u.department || 'IT'})
              </option>
            ))}
          </select>
        </div>

        {/* Template Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px' }}>
          <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap' }}>📄 គំរូទម្រង់ ៖</label>
          <select
            className="form-input"
            value={formTemplate}
            onChange={(e) => setFormTemplate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }}
          >
            <option value="system_change">ទម្រង់ស្នើសុំកែប្រែប្រព័ន្ធ SOC (NSSF System Change)</option>
            <option value="system_access">លិខិតស្នើសុំបើកប្រព័ន្ធ / គណនី (Access Request)</option>
            <option value="vpn_access">លិខិតស្នើសុំភ្ជាប់ VPN Remote Access</option>
            <option value="equipment">លិខិតស្នើសុំឧបករណ៍ និងគ្រឿងបន្លាស់ IT</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleAutoFillCurrentUser}
          style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: '800', fontSize: '12.5px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ⚡ Fill គណនីផ្ទាល់ខ្លួន
        </button>
      </div>

      {/* Section 1: Applicant Info */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>១.</span> ព័ត៌មានអ្នកស្នើសុំ (Applicant Information)
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '14px', marginBottom: '12px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>គោត្តនាម និងនាម (Full Name) *</label>
            <input
              type="text"
              className="form-input"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="ឧ. ហ៊ាង ចាន់ថន"
              required
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ភេទ (Gender)</label>
            <select
              className="form-input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ប្រុស">ប្រុស (Male)</option>
              <option value="ស្រី">ស្រី (Female)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>មុខតំណែង (Position)</label>
            <input
              type="text"
              className="form-input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="ឧ. ប្រធានការិយាល័យ"
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ការិយាល័យ (Office)</label>
            <input
              type="text"
              className="form-input"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="ឧ. ការិយាល័យសុវត្ថិភាពប្រព័ន្ធ IT"
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>នាយកដ្ឋាន / អង្គភាព / សាខា (Department)</label>
            <input
              type="text"
              className="form-input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="ឧ. នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន"
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>លេខទូរស័ព្ទ (Phone Number)</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="012 xxx xxx"
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>អ៊ីមែល (Email Address)</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@nssf.gov.kh"
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Details & Purpose */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>២.</span> ព័ត៌មានលម្អិត និងគោលបំណង (Details & Purpose)
        </h4>

        <div style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ព័ត៌មានលម្អិតនៃសំណើ (Request Details)</label>
          <textarea
            className="form-input"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="រៀបរាប់ព័ត៌មានលម្អិតអំពីការកែប្រែប្រព័ន្ធ..."
            style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%' }}
          />
        </div>

        {/* Change Types checkboxes */}
        <div style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
            ប្រភេទការកែប្រែ (Change Type) ៖
          </label>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={changeTypes.dataEdit}
                onChange={(e) => setChangeTypes({ ...changeTypes, dataEdit: e.target.checked })}
              />
              កែទិន្នន័យ (Data Edit)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={changeTypes.configuration}
                onChange={(e) => setChangeTypes({ ...changeTypes, configuration: e.target.checked })}
              />
              កែប្រព័ន្ធ (Configuration)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={changeTypes.feature}
                onChange={(e) => setChangeTypes({ ...changeTypes, feature: e.target.checked })}
              />
              បន្ថែមមុខងារ (Feature)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={changeTypes.other}
                onChange={(e) => setChangeTypes({ ...changeTypes, other: e.target.checked })}
              />
              ផ្សេងៗ (Other)
            </label>
          </div>
          {changeTypes.other && (
            <input
              type="text"
              className="form-input"
              placeholder="បញ្ជាក់ប្រភេទផ្សេងៗ..."
              value={changeTypeOther}
              onChange={(e) => setChangeTypeOther(e.target.value)}
              style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', width: '250px' }}
            />
          )}
        </div>

        {/* Impact Level radios */}
        <div style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
            កម្រិតនៃផលប៉ះពាល់ (Impact Level) ៖
          </label>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="impactLevel"
                value="low"
                checked={impactLevel === 'low'}
                onChange={() => setImpactLevel('low')}
              />
              🟢 ទាប (Low)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="impactLevel"
                value="medium"
                checked={impactLevel === 'medium'}
                onChange={() => setImpactLevel('medium')}
              />
              🟡 មធ្យម (Medium)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="impactLevel"
                value="high"
                checked={impactLevel === 'high'}
                onChange={() => setImpactLevel('high')}
              />
              🔴 ខ្ពស់ (High)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="impactLevel"
                value="other"
                checked={impactLevel === 'other'}
                onChange={() => setImpactLevel('other')}
              />
              ⚪ ផ្សេងៗ (Other)
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>មូលហេតុនៃការស្នើសុំ (Reason for Request)</label>
          <textarea
            className="form-input"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="រៀបរាប់ពីមូលហេតុនៃការស្នើសុំ..."
            style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%' }}
          />
        </div>

        {/* Date Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '11px' }}>ថ្ងៃទី (Khmer Day)</label>
            <input
              type="text"
              className="form-input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '11px' }}>ខែ (Khmer Month)</label>
            <input
              type="text"
              className="form-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '11px' }}>ឆ្នាំ (Khmer Year)</label>
            <input
              type="text"
              className="form-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '11px' }}>ព.ស. (Buddhist Year)</label>
            <input
              type="text"
              className="form-input"
              value={buddhistYear}
              onChange={(e) => setBuddhistYear(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Digital Signature Pad */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✍️</span> ហត្ថលេខាឌីជីថល (Digital Signature Pad)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
              គូសហត្ថលេខាដោយដៃលើស្គ្រីន (Draw Signature) ៖
            </label>
            <div style={{ border: '2px dashed #94a3b8', borderRadius: '10px', backgroundColor: '#fafafa', position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={canvasRef}
                width={360}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ cursor: 'crosshair', display: 'block', borderRadius: '8px' }}
              />
              {!hasDrawnSignature && !signatureImage && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}>
                  គូសហត្ថលេខានៅទីនេះ...
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearCanvasSignature}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}
              >
                🧹 សម្អាត (Clear)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
              ឬ ផ្ទុកឡើងរូបភាពហត្ថលេខា (Upload Signature File) ៖
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              style={{ fontSize: '12px' }}
            />

            {signatureImage && (
              <div style={{ marginTop: '10px', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ហត្ថលេខាដែលបានជ្រើសរើស ៖</div>
                <img src={signatureImage} alt="Signature Preview" style={{ maxHeight: '55px', maxWidth: '180px' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attached Files Section ("another file too") */}
      <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📎</span> ឯកសារភ្ជាប់បន្ថែម / Supporting Documents ("another file too")
        </h4>

        <div style={{ border: '2px dashed #cbd5e1', padding: '16px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#fafafa', marginBottom: '12px' }}>
          <input
            type="file"
            id="file-attach-input"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-attach-input" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2e8f0', color: '#1e293b', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}>
            📁 ជ្រើសរើសឯកសារភ្ជាប់ (Attach Files)
          </label>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            គាំទ្រ PDF, Word, Excel, ឬ រូបភាព (Supports PDF, DOCX, XLSX, PNG, JPG)
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {attachedFiles.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span>📄</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{file.name}</span>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>({file.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  🗑️ លុប
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
        {onClose ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: '700' }}
          >
            បិទ (Close)
          </button>
        ) : <div />}

        <div style={{ display: 'flex', gap: '12px' }}>
          {onSubmitAsTicket && (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: '800', backgroundColor: '#2563eb' }}
            >
              📥 រក្សាទុកក្នុងប្រព័ន្ធសំណើ (Save Ticket)
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadPDF}
            style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: '800', backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 ទាញយកជា PDF (Download PDF)
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintPDF}
            style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '800', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🖨️ បោះពុម្ព / នាំចេញ PDF
          </button>
        </div>
      </div>
    </form>
  );

  if (isFullPage) {
    return (
      <div className="tab-container fade-in" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📄</span> ទម្រង់ឯកសារស្នើសុំផ្សេងៗ (NSSF Forms & PDF Generator Center)
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            ប្រព័ន្ធបង្កើត និងបោះពុម្ពទម្រង់ឯកសារស្នើសុំផ្លូវការ (Auto-Fill, ហត្ថលេខាឌីជីថល, ភ្ជាប់ឯកសារ និងទាញយក PDF)
          </div>
        </div>
        {mainFormJSX}
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '950px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📄</span> ទម្រង់ឯកសារស្នើសុំផ្សេងៗ (NSSF Form Generator)
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
            >
              ×
            </button>
          )}
        </div>
        {mainFormJSX}
      </div>
    </div>
  );
}
