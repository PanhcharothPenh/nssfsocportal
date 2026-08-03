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

export default function DirectPdfAutoFiller({ currentUser, usersList = [] }) {
  // Staff Selection
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [printMode, setPrintMode] = useState('clean'); // 'clean' (High-Fidelity Official Template - 0 Overlap) or 'overlay' (Calibrated PDF Overlay)

  // Form Fields matching original PDF
  const [applicantName, setApplicantName] = useState(currentUser?.full_name || currentUser?.username || '');
  const [gender, setGender] = useState('ប្រុស');
  const [position, setPosition] = useState(currentUser?.position || 'មន្ត្រី');
  const [office, setOffice] = useState(currentUser?.office || 'ការិយាល័យសុវត្ថិភាពប្រព័ន្ធ IT');
  const [department, setDepartment] = useState(currentUser?.department || 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន');
  const [phone, setPhone] = useState(currentUser?.phone || '012 345 678');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Section 2 Details & Purpose
  const [details, setDetails] = useState('ស្នើសុំធ្វើការកែប្រែ និងកំណត់រចនាសម្ព័ន្ធ Firewalls / Route Policy និងការបើកសិទ្ធិចរាចរណ៍ IP Public សម្រាប់ប្រព័ន្ធ SOC Web Portal ។');
  
  // Checkboxes
  const [changeTypeData, setChangeTypeData] = useState(false);
  const [changeTypeConfig, setChangeTypeConfig] = useState(true);
  const [changeTypeFeature, setChangeTypeFeature] = useState(false);
  const [changeTypeOther, setChangeTypeOther] = useState(false);

  const [impactLow, setImpactLow] = useState(false);
  const [impactMedium, setImpactMedium] = useState(true);
  const [impactHigh, setImpactHigh] = useState(false);

  const [reason, setReason] = useState('ដើម្បីធានាការតភ្ជាប់ប្រព័ន្ធ និងបង្កើនសុវត្ថិភាពទិន្នន័យក្នុងការប្រតិបត្តិការរបស់អង្គភាព ប.ស.ស. ។');

  // Dates
  const now = new Date();
  const [day, setDay] = useState(toKhmerNum(String(now.getDate()).padStart(2, '0')));
  const [month, setMonth] = useState(KHMER_MONTHS[now.getMonth()]);
  const [year, setYear] = useState(toKhmerNum(now.getFullYear()));
  const [buddhistYear, setBuddhistYear] = useState(toKhmerNum(now.getFullYear() + 543));

  // Signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureImage, setSignatureImage] = useState(currentUser?.signature_url || '');

  // Auto-Fill Handler
  const handleAutoFill = () => {
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

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
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
    setSignatureImage('');
  };

  // Print PDF Handler (Crisp Official A4 Document with 0 Text Collision)
  const handlePrintCleanPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) { alert('សូមអនុញ្ញាត Popup blockers!'); return; }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>ទម្រង់ស្នើសុំកែប្រែប្រព័ន្ធ (NSSF System Change Request Form)</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Moul&family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Battambang', 'Kantumruy Pro', sans-serif; font-size: 13px; line-height: 1.6; color: #000; background: #fff; margin: 0; padding: 0; }
          .moul { font-family: 'Moul', serif; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
          .logo { width: 72px; height: auto; }
          .country-title { font-size: 14.5px; font-family: 'Moul', serif; margin-bottom: 2px; text-align: center; }
          .motto { font-size: 12.5px; font-family: 'Moul', serif; text-align: center; }
          .divider { text-align: center; letter-spacing: 3px; font-size: 9px; margin-top: 2px; }
          .form-title { text-align: center; font-family: 'Moul', serif; font-size: 17.5px; margin: 14px 0 12px 0; }
          .section-header { font-weight: bold; font-size: 14px; margin-top: 10px; margin-bottom: 5px; }
          .dotted { border-bottom: 1px dotted #222; display: inline-block; padding: 0 4px; min-height: 16px; }
          .box { display: inline-block; width: 13px; height: 13px; border: 1.2px solid #000; text-align: center; line-height: 11px; font-size: 10px; font-weight: bold; margin-right: 2px; }
          .disclaimer { font-size: 11.5px; font-style: italic; margin-top: 10px; margin-bottom: 6px; text-align: justify; line-height: 1.5; }
          .table-approvals { width: 100%; border-collapse: collapse; margin-top: 10px; clear: both; }
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
              <div style="font-size: 12.5px; font-weight: bold; line-height: 1.45; margin-top: 2px;">
                បេឡាជាតិសន្តិសុខសង្គម<br/>
                នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន<br/>
                <span style="font-weight: normal;">ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន</span>
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
          គោត្តនាម និងនាម ៖ <span class="dotted" style="width: 210px; font-weight: bold; color: #1e3a8a;">${applicantName || ''}</span>
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
          ${(details || '').split('\n').map(line => `<div style="font-weight: 600; color: #1e3a8a;">${line}</div>`).join('')}
          ${!details ? '<div>...........................................................................................................................................................</div><div>...........................................................................................................................................................</div>' : ''}
        </div>

        <div style="margin: 6px 0;">
          ប្រភេទការកែប្រែ ៖ 
          &nbsp;<span class="box">${changeTypeData ? '✓' : ''}</span> កែទិន្នន័យ
          &nbsp;&nbsp;<span class="box">${changeTypeConfig ? '✓' : ''}</span> កែប្រព័ន្ធ (Configuration)
          &nbsp;&nbsp;<span class="box">${changeTypeFeature ? '✓' : ''}</span> បន្ថែមមុខងារ (Feature)
          &nbsp;&nbsp;<span class="box">${changeTypeOther ? '✓' : ''}</span> ផ្សេងៗ
        </div>

        <div style="margin: 6px 0;">
          កម្រិតនៃផលប៉ះពាល់ ៖ 
          &nbsp;<span class="box">${impactLow ? '✓' : ''}</span> ទាប
          &nbsp;&nbsp;<span class="box">${impactMedium ? '✓' : ''}</span> មធ្យម
          &nbsp;&nbsp;<span class="box">${impactHigh ? '✓' : ''}</span> ខ្ពស់
          &nbsp;&nbsp;<span class="box">${impactOther ? '✓' : ''}</span> ផ្សេងៗ
        </div>

        <div style="margin-top: 6px;">
          មូលហេតុនៃការស្នើសុំ ៖ <span class="dotted" style="width: 80%; font-weight: 600; color: #1e3a8a;">${reason || ''}</span>
        </div>

        <div class="disclaimer">
          <b>ចំណាំ ៖</b><br/>
          ខ្ញុំបាទ/នាងខ្ញុំសូមធានាថា រាល់ការកែប្រែព័ត៌មានដែលបានស្នើសុំខាងលើ គឺស្របតាមលំហូរនៃប្រព័ន្ធ (System Flow) និងផ្អែកលើខ្លឹមសារនៃការស្នើសុំជាផ្លូវការ។ ខ្ញុំបាទ/នាងខ្ញុំ សូមសន្យាថាក្នុងករណីមានការប្រែប្រួលខុសពីការស្នើសុំដើម ឬមានផលប៉ះពាល់ដល់លំហូរការងាររបស់ប្រព័ន្ធ ដែលបណ្តាលមកពីការស្នើសុំមិនច្បាស់លាស់ ខ្ញុំបាទ/នាងខ្ញុំ ជាអ្នកស្នើសុំ សុខចិត្តទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
        </div>

        <!-- Signature Block -->
        <div style="float: right; text-align: center; margin-top: 4px; width: 310px;">
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
              <th style="width: 20%;">ព្រធាននាយកដ្ឋាន</th>
              <th style="width: 20%;">អនុ.នាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
              <th style="width: 20%;">ព្រធានការិយាល័យ<br/>ស.ប.ត</th>
              <th style="width: 20%;">អនុ.ព្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
              <th style="width: 20%;">ព្រធានការិយាល័យ<br/>សាម៉ី</th>
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
        
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="tab-container fade-in" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
      
      {/* Header Bar */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📄</span> Auto Fill ទម្រង់ដើម NSSF System Change Request Form
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            បំពេញទិន្នន័យ ស្អាតឥតខ្ចោះ (0 Text Collision, រក្សាទម្រង់ដើម NSSF_Form Request_Change_System_SOC.pdf 100%)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAutoFill}
            style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: '800', fontSize: '13px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
          >
            ⚡ Auto-Fill ទិន្នន័យ
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintCleanPdf}
            style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '800', fontSize: '13.5px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🖨️ បោះពុម្ព / នាំចេញ PDF ជាផ្លូវការ
          </button>
        </div>
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

      {/* Form Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section 1 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>១. ព័ត៌មានអ្នកស្នើសុំ (Applicant Information)</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>គោត្តនាម និងនាម (Full Name) *</label>
              <input type="text" className="form-input" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} style={{ padding: '8px', fontSize: '12.5px', fontWeight: '700' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ភេទ</label>
                <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }}>
                  <option value="ប្រុស">ប្រុស</option>
                  <option value="ស្រី">ស្រី</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>មុខតំណែង</label>
                <input type="text" className="form-input" value={position} onChange={(e) => setPosition(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ការិយាល័យ</label>
                <input type="text" className="form-input" value={office} onChange={(e) => setOffice(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>នាយកដ្ឋាន/អង្គភាព</label>
                <input type="text" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ទូរស័ព្ទ</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>អ៊ីមែល</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>២. ព័ត៌មានលម្អិត និងគោលបំណង</h4>

            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ព័ត៌មានលម្អិតនៃសំណើ</label>
              <textarea className="form-input" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} style={{ padding: '8px', fontSize: '12px', width: '100%' }} />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', display: 'block', marginBottom: '4px' }}>ប្រភេទការកែប្រែ ៖</label>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px' }}>
                <label><input type="checkbox" checked={changeTypeData} onChange={(e) => setChangeTypeData(e.target.checked)} /> កែទិន្នន័យ</label>
                <label><input type="checkbox" checked={changeTypeConfig} onChange={(e) => setChangeTypeConfig(e.target.checked)} /> កែប្រព័ន្ធ</label>
                <label><input type="checkbox" checked={changeTypeFeature} onChange={(e) => setChangeTypeFeature(e.target.checked)} /> បន្ថែមមុខងារ</label>
                <label><input type="checkbox" checked={changeTypeOther} onChange={(e) => setChangeTypeOther(e.target.checked)} /> ផ្សេងៗ</label>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', display: 'block', marginBottom: '4px' }}>កម្រិតនៃផលប៉ះពាល់ ៖</label>
              <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                <label><input type="radio" name="imp_orig" checked={impactLow} onChange={() => { setImpactLow(true); setImpactMedium(false); setImpactHigh(false); }} /> ទាប</label>
                <label><input type="radio" name="imp_orig" checked={impactMedium} onChange={() => { setImpactLow(false); setImpactMedium(true); setImpactHigh(false); }} /> មធ្យម</label>
                <label><input type="radio" name="imp_orig" checked={impactHigh} onChange={() => { setImpactLow(false); setImpactMedium(false); setImpactHigh(true); }} /> ខ្ពស់</label>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>មូលហេតុនៃការស្នើសុំ</label>
              <textarea className="form-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '8px', fontSize: '12px', width: '100%' }} />
            </div>
          </div>

          {/* Signature */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '14px' }}>✍️ ហត្ថលេខាសាម៉ីខ្លួន</h4>
            <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', backgroundColor: '#fff', position: 'relative', display: 'inline-block' }}>
              <canvas ref={canvasRef} width={300} height={90} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ cursor: 'crosshair', display: 'block' }} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={clearSignature} style={{ marginTop: '6px', fontSize: '11px' }}>
              🧹 សម្អាត
            </button>
          </div>

        </div>

        {/* Right Preview Card */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            👁️ មើលគំរូទម្រង់ផ្លូវការ (Live Clean Document Preview)
          </h4>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.6', flex: '1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>បេឡាជាតិសន្តិសុខសង្គម - នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', margin: '10px 0' }}>ទម្រង់ស្នើសុំ</div>
            
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
              <b>១. ព័ត៌មានអ្នកស្នើសុំ ៖</b><br/>
              - ឈ្មោះ ៖ <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{applicantName}</span> ({gender})<br/>
              - មុខតំណែង ៖ {position}<br/>
              - ការិយាល័យ ៖ {office}<br/>
              - នាយកដ្ឋាន ៖ {department}<br/>
              - ទូរស័ព្ទ ៖ {phone} | អ៊ីមែល ៖ {email}
            </div>

            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
              <b>២. ព័ត៌មានលម្អិត និងគោលបំណង ៖</b><br/>
              <div style={{ color: '#1e3a8a', fontWeight: '500', margin: '4px 0' }}>{details}</div>
              - ប្រភេទ ៖ {changeTypeConfig ? '✓ កែប្រព័ន្ធ' : ''} {changeTypeData ? '✓ កែទិន្នន័យ' : ''} {changeTypeFeature ? '✓ បន្ថែមមុខងារ' : ''}<br/>
              - ផលប៉ះពាល់ ៖ {impactMedium ? '✓ មធ្យម' : impactHigh ? '✓ ខ្ពស់' : '✓ ទាប'}<br/>
              - មូលហេតុ ៖ <span style={{ color: '#1e3a8a' }}>{reason}</span>
            </div>

            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px', textAlignment: 'right' }}>
              <b>៣. តារាងយោបល់ថ្នាក់ដឹកនាំ (៥ជួរ) ៖</b> មានស្រាប់ ១០០%
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginTop: '20px' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrintCleanPdf}
          style={{ borderRadius: '10px', padding: '12px 28px', fontWeight: '800', fontSize: '14px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🖨️ បោះពុម្ព / នាំចេញ PDF ជាផ្លូវការ (ឥតមានអក្សរជាន់គ្នា 0 Overlap)
        </button>
      </div>

    </div>
  );
}
