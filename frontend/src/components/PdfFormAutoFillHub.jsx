import React, { useState, useEffect, useRef } from 'react';

// Khmer Number & Month Helpers
const toKhmerNum = (num) => {
  if (num === undefined || num === null) return '';
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(char => khmerDigits[char] || char).join('');
};

const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export default function PdfFormAutoFillHub({ currentUser, usersList = [] }) {
  // Category Selection
  const [activeCategory, setActiveCategory] = useState('system_change');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Section 1: Universal Applicant Info
  const [applicantName, setApplicantName] = useState(currentUser?.full_name || currentUser?.username || '');
  const [gender, setGender] = useState('ប្រុស');
  const [position, setPosition] = useState(currentUser?.position || 'មន្ត្រី');
  const [office, setOffice] = useState(currentUser?.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធ IT');
  const [department, setDepartment] = useState(currentUser?.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
  const [phone, setPhone] = useState(currentUser?.phone || '012 345 678');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Section 2: Details & Purpose
  const [details, setDetails] = useState('');
  const [changeTypes, setChangeTypes] = useState({ dataEdit: false, configuration: true, feature: false, other: false });
  const [changeTypeOtherText, setChangeTypeOtherText] = useState('');
  const [impactLevel, setImpactLevel] = useState('medium'); // low, medium, high, other
  const [impactOtherText, setImpactOtherText] = useState('');
  const [reason, setReason] = useState('');

  // Leave Form Specific Fields (សុំច្បាប់)
  const [leaveType, setLeaveType] = useState('ច្បាប់ឈប់សម្រាក'); 
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('មានធុរៈផ្ទាល់ខ្លួនប្រញាប់');

  // Dates
  const now = new Date();
  const [day, setDay] = useState(toKhmerNum(String(now.getDate()).padStart(2, '0')));
  const [month, setMonth] = useState(KHMER_MONTHS[now.getMonth()]);
  const [year, setYear] = useState(toKhmerNum(now.getFullYear()));
  const [buddhistYear, setBuddhistYear] = useState(toKhmerNum(now.getFullYear() + 543));
  const [lunarDate, setLunarDate] = useState('......................................');

  // Signature State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);
  const [signatureImage, setSignatureImage] = useState(currentUser?.signature_url || '');

  // Attached files ("another file too")
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Auto-Fill Handler
  const handleAutoFillUser = () => {
    if (currentUser) {
      setApplicantName(currentUser.full_name || currentUser.username || 'អ៊ុក សុធារ៉ារិទ្ធ');
      setGender(currentUser.gender || 'ប្រុស');
      setPosition(currentUser.position || 'ប្រធានការិយាល័យ');
      setOffice(currentUser.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន');
      setDepartment(currentUser.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន (IT Department)');
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

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, [activeCategory]);

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
    setHasDrawnSig(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
    setSignatureImage('');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      rawFile: file
    }));
    setAttachedFiles(prev => [...prev, ...fileObjects]);
  };

  // Generate Exact PDF HTML matching NSSF_Form Request_Change_System_SOC.pdf
  const generateFormHTML = () => {
    if (activeCategory === 'system_change') {
      return `
        <!DOCTYPE html>
        <html lang="km">
        <head>
          <meta charset="UTF-8">
          <title>ទម្រង់ស្នើសុំកែប្រែប្រព័ន្ធ SOC (NSSF System Change Request Form)</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Moul&family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
            * { box-sizing: border-box; }
            @import url('https://fonts.googleapis.com/css2?family=Moul&family=Kantumruy+Pro:wght@400;600;700&family=Battambang:wght@400;700&display=swap');
            body { font-family: 'Kantumruy Pro', 'Battambang', sans-serif; font-size: 13px; line-height: 1.55; color: #000; background: #fff; margin: 0; padding: 0; }
            .moul { font-family: 'Moul', serif; font-weight: normal; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
            .logo { width: 72px; height: auto; }
            .country-title { font-size: 14.5px; font-family: 'Moul', serif; margin-bottom: 2px; text-align: center; }
            .motto { font-size: 12.5px; font-family: 'Moul', serif; text-align: center; }
            .divider { text-align: center; letter-spacing: 3px; font-size: 9px; margin-top: 2px; }
            .form-title { text-align: center; font-family: 'Moul', serif; font-size: 18px; margin: 14px 0 12px 0; }
            .section-header { font-family: 'Moul', serif; font-size: 12.5px; margin-top: 10px; margin-bottom: 5px; font-weight: normal; }
            .dotted { border-bottom: 1px dotted #222; display: inline-block; padding: 0 4px; min-height: 16px; }
            .box { display: inline-block; width: 13px; height: 13px; border: 1.2px solid #000; text-align: center; line-height: 11px; font-size: 10px; font-weight: bold; margin-right: 2px; }
            .disclaimer { font-size: 11.5px; font-style: italic; margin-top: 10px; margin-bottom: 6px; text-align: justify; line-height: 1.5; }
            .table-approvals { width: 100%; border-collapse: collapse; margin-top: 10px; clear: both; font-family: 'Kantumruy Pro', sans-serif; }
            .table-approvals th, .table-approvals td { border: 1px solid #000; padding: 6px 3px; text-align: center; font-size: 11.5px; vertical-align: top; }
            .table-approvals th { font-weight: bold; background-color: #f8fafc; height: 42px; }
            .table-approvals td { height: 95px; }
          </style>
        </head>
        <body>
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td style="width: 48%; vertical-align: top;">
                <img src="/nssf_logo.png" class="logo" alt="NSSF Logo" onerror="this.onerror=null; this.src='/Nssf_Resize_Logo.png';" /><br/>
                <div style="margin-top: 2px;">
                  <div class="moul" style="font-size: 13px; color: #1e3a8a; line-height: 1.6;">បេឡាជាតិសន្តិសុខសង្គម</div>
                  <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; line-height: 1.4;">នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
                  <div style="font-size: 11px; color: #334155;">ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន</div>
                </div>
              </td>
              <td style="width: 52%; text-align: center; vertical-align: top;">
                <div class="country-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div class="divider">─── ❖ ───</div>
              </td>
            </tr>
          </table>

          <div class="form-title">ទម្រង់ស្នើសុំ</div>

          <!-- Section 1 -->
          <div class="section-header">១. ព័ត៌មានអ្នកស្នើសុំ ៖</div>
          <div style="margin-bottom: 5px;">
            គោត្តនាម និងនាម ៖ <span class="dotted" style="width: 210px; font-weight: bold;">${applicantName || ''}</span>
            &nbsp;&nbsp;ភេទ ៖ <span class="dotted" style="width: 55px; text-align: center;">${gender || ''}</span>
            &nbsp;&nbsp;មុខតំណែង ៖ <span class="dotted" style="width: 210px;">${position || ''}</span>
          </div>
          <div style="margin-bottom: 5px;">
            ការិយាល័យ ៖ <span class="dotted" style="width: 230px;">${office || ''}</span>
            &nbsp;&nbsp;នាយកដ្ឋាន/អង្គភាព/សាខា ៖ <span class="dotted" style="width: 250px;">${department || ''}</span>
          </div>
          <div style="margin-bottom: 5px;">
            លេខទូរស័ព្ទទំនាក់ទំនង ៖ <span class="dotted" style="width: 200px;">${phone || ''}</span>
            &nbsp;&nbsp;អ៊ីមែល ៖ <span class="dotted" style="width: 280px;">${email || ''}</span>
          </div>

          <!-- Section 2 -->
          <div class="section-header">២. ព័ត៌មានលម្អិត និងគោលបំណង ៖</div>
          <div style="min-height: 48px; line-height: 1.8;">
            ${(details || '').split('\n').map(line => `<div>${line}</div>`).join('')}
            ${!details ? '<div>...........................................................................................................................................................</div><div>...........................................................................................................................................................</div>' : ''}
          </div>

          <div style="margin: 6px 0;">
            ប្រភេទការកែប្រែ ៖ 
            &nbsp;<span class="box">${changeTypes.dataEdit ? '✓' : ''}</span> កែទិន្នន័យ
            &nbsp;&nbsp;<span class="box">${changeTypes.configuration ? '✓' : ''}</span> កែប្រព័ន្ធ (Configuration)
            &nbsp;&nbsp;<span class="box">${changeTypes.feature ? '✓' : ''}</span> បន្ថែមមុខងារ (Feature)
            &nbsp;&nbsp;<span class="box">${changeTypes.other ? '✓' : ''}</span> ផ្សេងៗ${changeTypeOtherText ? ` (${changeTypeOtherText})` : ''}
          </div>

          <div style="margin: 6px 0;">
            កម្រិតនៃផលប៉ះពាល់ ៖ 
            &nbsp;<span class="box">${impactLevel === 'low' ? '✓' : ''}</span> ទាប
            &nbsp;&nbsp;<span class="box">${impactLevel === 'medium' ? '✓' : ''}</span> មធ្យម
            &nbsp;&nbsp;<span class="box">${impactLevel === 'high' ? '✓' : ''}</span> ខ្ពស់
            &nbsp;&nbsp;<span class="box">${impactLevel === 'other' ? '✓' : ''}</span> ផ្សេងៗ${impactOtherText ? ` (${impactOtherText})` : ''}
          </div>

          <div style="margin-top: 6px;">
            មូលហេតុនៃការស្នើសុំ ៖ <span class="dotted" style="width: 80%;">${reason || '............................................................................................................................................'}</span>
          </div>

          <div class="disclaimer">
            <b>ចំណាំ ៖</b><br/>
            ខ្ញុំបាទ/នាងខ្ញុំសូមធានាថា រាល់ការកែប្រែព័ត៌មានដែលបានស្នើសុំខាងលើ គឺស្របតាមលំហូរនៃប្រព័ន្ធ (System Flow) និងផ្អែកលើខ្លឹមសារនៃការស្នើសុំជាផ្លូវការ។ ខ្ញុំបាទ/នាងខ្ញុំ សូមសន្យាថាក្នុងករណីមានការប្រែប្រួលខុសពីការស្នើសុំដើម ឬមានផលប៉ះពាល់ដល់លំហូរការងាររបស់ប្រព័ន្ធ ដែលបណ្តាលមកពីការស្នើសុំមិនច្បាស់លាស់ ខ្ញុំបាទ/នាងខ្ញុំ ជាអ្នកស្នើសុំ សុខចិត្តទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
          </div>

          <!-- Signature Block -->
          <div style="float: right; text-align: center; margin-top: 4px; width: 310px;">
            <div>ថ្ងៃ ${lunarDate || '.................................'} ខែ ............... ឆ្នាំ .................... ព.ស. ២៥៦${buddhistYear || '.....'}</div>
            <div>ថ្ងៃទី <span style="font-weight: bold;">${day}</span> ខែ <span style="font-weight: bold;">${month}</span> ឆ្នាំ២០២<span style="font-weight: bold;">${year.length > 3 ? year.substring(3) : year}</span></div>
            <div style="margin-top: 4px; font-weight: bold;">ហត្ថលេខាសាម៉ីខ្លួន</div>
            <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-top: 4px;">
              ${signatureImage ? `<img src="${signatureImage}" style="max-height: 55px; max-width: 170px;" />` : `<div style="font-weight: bold; color: #1e3a8a;">${applicantName}</div>`}
            </div>
          </div>

          <!-- Section 3 -->
          <div class="section-header" style="clear: both; padding-top: 4px;">៣. យោបល់របស់ថ្នាក់ដឹកនាំមានសមត្ថកិច្ច ៖</div>
          <table class="table-approvals">
            <thead>
              <tr>
                <th style="width: 20%;">ប្រធាននាយកដ្ឋាន</th>
                <th style="width: 20%;">អនុប្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
                <th style="width: 20%;">ប្រធានការិយាល័យ<br/>ស.ប.ត</th>
                <th style="width: 20%;">អនុប្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
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
            <div style="margin-top: 10px; font-size: 11.5px; border-top: 1px dashed #666; padding-top: 6px;">
              <b>📎 ឯកសារភ្ជាប់បន្ថែម (${attachedFiles.length}) ៖</b>
              <ul>
                ${attachedFiles.map(f => `<li>${f.name} (${f.size})</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
        </html>
      `;
    } else {
      // General Forms HTML Template
      return `
        <!DOCTYPE html>
        <html lang="km">
        <head>
          <meta charset="UTF-8">
          <title>លិខិតស្នើសុំ / ទម្រង់ផ្សេងៗ</title>
          <link href="https://fonts.googleapis.com/css2?family=Moul&family=Battambang:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Battambang', sans-serif; font-size: 13.5px; line-height: 1.6; color: #000; background: #fff; margin: 0; }
            .moul { font-family: 'Moul', serif; }
            .header-table { width: 100%; margin-bottom: 12px; }
            .logo { width: 72px; }
            .form-title { text-align: center; font-family: 'Moul', serif; font-size: 18px; margin: 20px 0; }
            .dotted { border-bottom: 1px dotted #333; display: inline-block; padding: 0 4px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 48%;">
                <img src="/nssf_logo.png" class="logo" onerror="this.onerror=null; this.src='/Nssf_Resize_Logo.png';" /><br/>
                <b>បេឡាជាតិសន្តិសុខសង្គម (NSSF)</b><br/>
                <b>${department}</b>
              </td>
              <td style="width: 52%; text-align: center; vertical-align: top;">
                <div class="moul" style="font-size: 14.5px;">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="moul" style="font-size: 12.5px;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div>─── ❖ ───</div>
              </td>
            </tr>
          </table>

          <div class="form-title">
            ${activeCategory === 'leave' ? 'លិខិតសុំច្បាប់ និងអនុញ្ញាតឈប់សម្រាក' : activeCategory === 'access' ? 'លិខិតស្នើសុំសិទ្ធិប្រើប្រព័ន្ធ' : 'លិខិតស្នើសុំផ្លូវការ'}
          </div>

          <div style="margin-bottom: 12px;">
            ខ្ញុំបាទ/នាងខ្ញុំឈ្មោះ ៖ <span class="dotted" style="width: 250px; font-weight: bold;">${applicantName}</span> ភេទ ៖ <span class="dotted" style="width: 60px;">${gender}</span><br/>
            មុខតំណែង ៖ <span class="dotted" style="width: 220px;">${position}</span> ការិយាល័យ ៖ <span class="dotted" style="width: 220px;">${office}</span><br/>
            អង្គភាព/នាយកដ្ឋាន ៖ <span class="dotted" style="width: 300px;">${department}</span>
          </div>

          <div style="margin-top: 15px;">
            <b>កម្មវត្ថុ ៖</b> ${activeCategory === 'leave' ? `ស្នើសុំអនុញ្ញាតច្បាប់ (${leaveType}) ចំនួន ${leaveDays} ថ្ងៃ` : reason || 'ស្នើសុំដោះស្រាយការងារជាផ្លូវការ'}<br/>
            <b>មូលហេតុ ៖</b> ${leaveReason || details || 'មានធុរៈចាំបាច់ក្នុងការបំពេញភារកិច្ច'}
          </div>

          <div style="float: right; text-align: center; margin-top: 30px; width: 280px;">
            <div>ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ២០២${year.length > 3 ? year.substring(3) : year}</div>
            <div style="margin-top: 4px; font-weight: bold;">ហត្ថលេខាសាម៉ីខ្លួន</div>
            <div style="height: 60px; margin-top: 4px;">
              ${signatureImage ? `<img src="${signatureImage}" style="max-height: 55px;" />` : `<b>${applicantName}</b>`}
            </div>
          </div>
        </body>
        </html>
      `;
    }
  };

  const handlePrintPDF = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) { alert('សូមអនុញ្ញាត Popup blockers!'); return; }
    printWin.document.write(generateFormHTML() + `<script>window.onload=function(){ setTimeout(function(){ window.print(); }, 500); };</script>`);
    printWin.document.close();
  };

  return (
    <div className="tab-container fade-in" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
      
      {/* Top Banner Header */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📄</span> ទម្រង់ឯកសារស្នើសុំ PDF (PDF Form Hub)
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            រក្សាទម្រង់ដើម ១០០% នៃឯកសារ NSSF_Form Request_Change_System_SOC.pdf (Auto-Fill, ហត្ថលេខាឌីជីថល និងបោះពុម្ព A4)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAutoFillUser}
            style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: '800', fontSize: '13px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
          >
            ⚡ Auto-Fill ទិន្នន័យ
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintPDF}
            style={{ borderRadius: '10px', padding: '8px 20px', fontWeight: '800', fontSize: '13px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ បោះពុម្ព / នាំចេញ PDF (រក្សាទម្រង់ដើម)
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          className={`btn ${activeCategory === 'system_change' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('system_change')}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', backgroundColor: activeCategory === 'system_change' ? '#2563eb' : '#f8fafc' }}
        >
          🔴 ១. ទម្រង់ស្នើសុំកែប្រែប្រព័ន្ធ SOC (NSSF Form ដើម)
        </button>
        <button
          type="button"
          className={`btn ${activeCategory === 'leave' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('leave')}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', backgroundColor: activeCategory === 'leave' ? '#10b981' : '#f8fafc' }}
        >
          🟢 ២. សុំច្បាប់ / ឈប់សម្រាក (Leave Request)
        </button>
        <button
          type="button"
          className={`btn ${activeCategory === 'access' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('access')}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', backgroundColor: activeCategory === 'access' ? '#0284c7' : '#f8fafc' }}
        >
          🔵 ៣. ស្នើសុំសិទ្ធិប្រើប្រព័ន្ធ (System Access)
        </button>
        <button
          type="button"
          className={`btn ${activeCategory === 'vpn' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('vpn')}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', backgroundColor: activeCategory === 'vpn' ? '#7c3aed' : '#f8fafc' }}
        >
          🟣 ៤. ស្នើសុំគណនី VPN Remote Access
        </button>
      </div>

      {/* Staff Selection Dropdown */}
      <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>👤 ជ្រើសរើសបុគ្គលិកដើម្បី Auto-Fill ៖</label>
        <select
          className="form-input"
          value={selectedStaffId}
          onChange={handleStaffSelect}
          style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', maxWidth: '350px' }}
        >
          <option value="">-- ជ្រើសរើសបុគ្គលិកពីទិន្នន័យ ប.ស.ស. --</option>
          {usersList.map((u) => (
            <option key={u.id || u.username} value={u.id || u.username}>
              {u.full_name || u.username} ({u.position || 'មន្ត្រី'} - {u.department || 'IT'})
            </option>
          ))}
        </select>
      </div>

      {/* Applicant Section */}
      <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 14px 0', color: '#1e3a8a', fontSize: '15px' }}>១. ព័ត៌មានអ្នកស្នើសុំ (Applicant Information)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '14px', marginBottom: '12px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>គោត្តនាម និងនាម *</label>
            <input type="text" className="form-input" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required style={{ padding: '9px', fontSize: '13px' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ភេទ</label>
            <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ padding: '9px', fontSize: '13px' }}>
              <option value="ប្រុស">ប្រុស</option>
              <option value="ស្រី">ស្រី</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>មុខតំណែង</label>
            <input type="text" className="form-input" value={position} onChange={(e) => setPosition(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ការិយាល័យ</label>
            <input type="text" className="form-input" value={office} onChange={(e) => setOffice(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>នាយកដ្ឋាន / អង្គភាព / សាខា</label>
            <input type="text" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>លេខទូរស័ព្ទទំនាក់ទំនង</label>
            <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>អ៊ីមែល</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
          </div>
        </div>
      </div>

      {/* Dynamic Form Content by Category */}
      {activeCategory === 'system_change' && (
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 14px 0', color: '#1e3a8a', fontSize: '15px' }}>២. ព័ត៌មានលម្អិត និងគោលបំណង (NSSF_Form Request_Change_System_SOC.pdf)</h4>
          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ព័ត៌មានលម្អិតនៃសំណើ</label>
            <textarea className="form-input" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} style={{ padding: '10px', fontSize: '13px', width: '100%' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', marginBottom: '6px', display: 'block' }}>ប្រភេទការកែប្រែ ៖</label>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={changeTypes.dataEdit} onChange={(e) => setChangeTypes({ ...changeTypes, dataEdit: e.target.checked })} /> កែទិន្នន័យ
              </label>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={changeTypes.configuration} onChange={(e) => setChangeTypes({ ...changeTypes, configuration: e.target.checked })} /> កែប្រព័ន្ធ (Configuration)
              </label>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={changeTypes.feature} onChange={(e) => setChangeTypes({ ...changeTypes, feature: e.target.checked })} /> បន្ថែមមុខងារ (Feature)
              </label>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={changeTypes.other} onChange={(e) => setChangeTypes({ ...changeTypes, other: e.target.checked })} /> ផ្សេងៗ
              </label>
            </div>
            {changeTypes.other && (
              <input type="text" className="form-input" placeholder="បញ្ជាក់ផ្សេងៗ..." value={changeTypeOtherText} onChange={(e) => setChangeTypeOtherText(e.target.value)} style={{ marginTop: '6px', padding: '6px', fontSize: '12px', width: '200px' }} />
            )}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', marginBottom: '6px', display: 'block' }}>កម្រិតនៃផលប៉ះពាល់ ៖</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="imp" value="low" checked={impactLevel === 'low'} onChange={() => setImpactLevel('low')} /> 🟢 ទាប
              </label>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="imp" value="medium" checked={impactLevel === 'medium'} onChange={() => setImpactLevel('medium')} /> 🟡 មធ្យម
              </label>
              <label style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="imp" value="high" checked={impactLevel === 'high'} onChange={() => setImpactLevel('high')} /> 🔴 ខ្ពស់
              </label>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>មូលហេតុនៃការស្នើសុំ</label>
            <textarea className="form-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '10px', fontSize: '13px', width: '100%' }} />
          </div>
        </div>
      )}

      {activeCategory === 'leave' && (
        <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 14px 0', color: '#10b981', fontSize: '15px' }}>២. ព័ត៌មានសុំច្បាប់ និងអនុញ្ញាតឈប់សម្រាក (Leave Request Form)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ប្រភេទច្បាប់</label>
              <select className="form-input" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ padding: '9px', fontSize: '13px' }}>
                <option value="ច្បាប់ឈប់សម្រាក">ច្បាប់ឈប់សម្រាក (Personal Leave)</option>
                <option value="ចេញក្រៅផ្លូវការ">ចេញក្រៅផ្លូវការ (Out of Office)</option>
                <option value="ច្បាប់ជំងឺ">ច្បាប់ជំងឺ (Sick Leave)</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>ចំនួន (ថ្ងៃ/ម៉ោង)</label>
              <input type="text" className="form-input" value={leaveDays} onChange={(e) => setLeaveDays(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '12px' }}>មូលហេតុ</label>
              <input type="text" className="form-input" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ padding: '9px', fontSize: '13px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature Pad */}
      <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '15px' }}>✍️ ហត្ថលេខាឌីជីថល (Digital Signature Pad)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ border: '2px dashed #94a3b8', borderRadius: '10px', backgroundColor: '#fafafa', position: 'relative', display: 'inline-block' }}>
              <canvas ref={canvasRef} width={340} height={110} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ cursor: 'crosshair', display: 'block' }} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={clearSignature} style={{ marginTop: '6px', fontSize: '11px' }}>
              🧹 សម្អាតហត្ថលេខា
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>ឬ ផ្ទុកឡើងរូបភាពហត្ថលេខា ៖</label>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => setSignatureImage(evt.target.result);
                reader.readAsDataURL(file);
              }
            }} style={{ fontSize: '12px' }} />
          </div>
        </div>
      </div>

      {/* File Attachments */}
      <div style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '15px' }}>📎 ឯកសារភ្ជាប់បន្ថែម ("another file too")</h4>
        <input type="file" multiple onChange={handleFileUpload} style={{ fontSize: '12px' }} />
        {attachedFiles.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            {attachedFiles.map((f, i) => <div key={i}>📄 {f.name} ({f.size})</div>)}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button type="button" className="btn btn-primary" onClick={handlePrintPDF} style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '800', backgroundColor: '#10b981', borderColor: '#10b981' }}>
          🖨️ បោះពុម្ព / នាំចេញ PDF (ទម្រង់ដើម ១០០%)
        </button>
      </div>

    </div>
  );
}
