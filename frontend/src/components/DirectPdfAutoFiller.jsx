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

const getKhmerMonthName = (m) => {
  if (!m) return '';
  const num = parseInt(m, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return KHMER_MONTHS[num - 1];
  }
  return toKhmerNum(m);
};

export default function DirectPdfAutoFiller({ currentUser, usersList = [] }) {
  // Staff Selection
  const [selectedStaffId, setSelectedStaffId] = useState('');

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
  const [changeTypeOtherText, setChangeTypeOtherText] = useState('');

  const [impactLow, setImpactLow] = useState(false);
  const [impactMedium, setImpactMedium] = useState(true);
  const [impactHigh, setImpactHigh] = useState(false);
  const [impactOther, setImpactOther] = useState(false);
  const [impactOtherText, setImpactOtherText] = useState('');

  const [reason, setReason] = useState('ដើម្បីធានាការតភ្ជាប់ប្រព័ន្ធ និងបង្កើនសុវត្ថិភាពទិន្នន័យក្នុងការប្រតិបត្តិការរបស់អង្គភាព ប.ស.ស. ។');

  // Dates
  const now = new Date();
  const [lunarDateText, setLunarDateText] = useState('ថ្ងៃអង្គារ ៥កើត ខែមាឃ ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០');
  const [locationPrefix, setLocationPrefix] = useState('រាជធានីភ្នំពេញ');
  const [day, setDay] = useState(toKhmerNum(String(now.getDate()).padStart(2, '0')));
  const [month, setMonth] = useState(KHMER_MONTHS[now.getMonth()]);
  const [year, setYear] = useState(toKhmerNum(now.getFullYear()));
  const [buddhistYear, setBuddhistYear] = useState(toKhmerNum(now.getFullYear() + 543));

  // Custom Document Title & Approval Headers
  const [docTitle, setDocTitle] = useState('ទម្រង់ស្នើសុំ');
  const [approvalHeader1, setApprovalHeader1] = useState('ប្រធាននាយកដ្ឋាន');
  const [approvalHeader2, setApprovalHeader2] = useState('អនុប្រធាននាយកដ្ឋាន\nទទួលបន្ទុក');
  const [approvalHeader3, setApprovalHeader3] = useState('ប្រធានការិយាល័យ\nស.ប.ត');
  const [approvalHeader4, setApprovalHeader4] = useState('អនុប្រធាននាយកដ្ឋាន\nទទួលបន្ទុក');
  const [approvalHeader5, setApprovalHeader5] = useState('ប្រធានការិយាល័យ\nសាម៉ី');

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

  // Direct In-Page Print Handler (Bypasses Popup Blockers 100%)
  const handleDirectPrint = () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.print());
    } else {
      window.print();
    }
  };

  return (
    <div className="tab-container fade-in" style={{ padding: '24px', backgroundColor: '#f1f5f9', borderRadius: '16px' }}>
      
      {/* Hide controls during printing */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&display=swap');
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-a4-document, .printable-a4-document * {
            visibility: visible;
          }
          .printable-a4-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
            font-family: 'Khmer OS Siemreap', 'Siemreap', sans-serif !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="no-print" style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '18px 24px', borderRadius: '14px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📄</span> Auto Fill ទម្រង់ NSSF_Form Request_Change_System_SOC.pdf
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            បំពេញទិន្នន័យលើទម្រង់ដើម ១០០% (0 Text Overlap, មិនបាច់ប្រើ Popup)
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
            onClick={handleDirectPrint}
            style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '800', fontSize: '14px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            🖨️ បោះពុម្ព / នាំចេញ PDF ជាផ្លូវការ
          </button>
        </div>
      </div>

      {/* Staff Selection Dropdown */}
      <div className="no-print" style={{ backgroundColor: '#fff', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '12px' }}>
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

      {/* Main Grid: Left Controls Form, Right Live A4 Paper Document */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '24px' }}>
        
        {/* Left Input Form (No Print) */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section 1 */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>១. ព័ត៌មានអ្នកស្នើសុំ (Applicant Info)</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>គោត្តនាម និងនាម (Full Name)</label>
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
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>២. ព័ត៌មានលម្អិត និងគោលបំណង</h4>

            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ព័ត៌មានលម្អិតនៃសំណើ</label>
              <textarea className="form-input" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} style={{ padding: '8px', fontSize: '12px', width: '100%' }} />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>មូលហេតុនៃការស្នើសុំ</label>
              <textarea className="form-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '8px', fontSize: '12px', width: '100%' }} />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>កាលបរិច្ឆេទចន្ទគតិ (Khmer Lunar Date Header)</label>
                <input type="text" className="form-input" value={lunarDateText} onChange={(e) => setLunarDateText(e.target.value)} style={{ padding: '8px', fontSize: '11.5px', width: '100%' }} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ទីតាំងរាជធានី/ខេត្ត (Location Prefix)</label>
                <input type="text" className="form-input" value={locationPrefix} onChange={(e) => setLocationPrefix(e.target.value)} style={{ padding: '8px', fontSize: '11.5px', width: '100%' }} placeholder="ឧទាហរណ៍៖ រាជធានីភ្នំពេញ" />
              </div>
            </div>
          </div>

          {/* Custom Titles & Approvals Customization Box */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>⚙️ កែប្រែចំណងជើងលិខិត & តារាងអនុម័ត</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>ចំណងជើងលិខិត (Document Title)</label>
              <input type="text" className="form-input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }} />
            </div>

            <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', margin: '10px 0 6px 0' }}>ក្បាលតារាងអនុម័ត ៥ ចំរុះ (Approval Table Headers) :</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>ក្បាលតារាង ១ :</label>
                <input type="text" className="form-input" value={approvalHeader1} onChange={(e) => setApprovalHeader1(e.target.value)} style={{ padding: '6px', fontSize: '11.5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>ក្បាលតារាង ២ :</label>
                <input type="text" className="form-input" value={approvalHeader2} onChange={(e) => setApprovalHeader2(e.target.value)} style={{ padding: '6px', fontSize: '11.5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>ក្បាលតារាង ៣ :</label>
                <input type="text" className="form-input" value={approvalHeader3} onChange={(e) => setApprovalHeader3(e.target.value)} style={{ padding: '6px', fontSize: '11.5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>ក្បាលតារាង ៤ :</label>
                <input type="text" className="form-input" value={approvalHeader4} onChange={(e) => setApprovalHeader4(e.target.value)} style={{ padding: '6px', fontSize: '11.5px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>ក្បាលតារាង ៥ :</label>
                <input type="text" className="form-input" value={approvalHeader5} onChange={(e) => setApprovalHeader5(e.target.value)} style={{ padding: '6px', fontSize: '11.5px' }} />
              </div>
            </div>
          </div>

          {/* Signature */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '14px' }}>✍️ ហត្ថលេខាសាម៉ីខ្លួន (Signature Options)</h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', display: 'block', marginBottom: '4px' }}>📷 ផ្ទុកឡើងរូបភាពហត្ថលេខា (Upload Signature Photo)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setSignatureImage(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }} 
                style={{ fontSize: '11.5px', width: '100%' }} 
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', display: 'block', marginBottom: '4px' }}>🖌️ ឬគូរហត្ថលេខាលើកញ្ចក់ (Or Draw Signature)</label>
              <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', backgroundColor: '#fafafa', position: 'relative', display: 'inline-block' }}>
                <canvas ref={canvasRef} width={300} height={90} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ cursor: 'crosshair', display: 'block' }} />
              </div>
              <div style={{ marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={clearSignature} style={{ fontSize: '11px', padding: '4px 10px' }}>
                  🧹 សម្អាតហត្ថលេខា
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Live Pixel-Perfect Official A4 Document Paper */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="printable-a4-document" style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm',
            padding: '12mm 15mm',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            fontFamily: "'Khmer OS Siemreap', 'Siemreap', sans-serif",
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#000'
          }}>
            
            {/* Document Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '48%', verticalAlign: 'top', textAlign: 'left' }}>
                    <img src="/nssf_logo.png" alt="NSSF Logo" style={{ width: '82px', height: 'auto', display: 'block', marginBottom: '4px' }} onerror={(e) => { e.target.src='/Nssf_Resize_Logo.png'; }} />
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '13.5px', color: '#1e3a8a', lineHeight: '1.6', fontWeight: 'normal' }}>បេឡាជាតិសន្តិសុខសង្គម</div>
                      <div style={{ fontFamily: "'Khmer OS Siemreap', 'Siemreap', sans-serif", fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: '1.4' }}>នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
                      <div style={{ fontFamily: "'Khmer OS Siemreap', 'Siemreap', sans-serif", fontSize: '11px', color: '#334155' }}>ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន</div>
                    </div>
                  </td>
                  <td style={{ width: '52%', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", marginBottom: '2px', color: '#000' }}>ព្រះរាជាណាចក្រកម្ពុជា</div>
                      <div style={{ fontSize: '13px', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", color: '#000' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                      <div style={{ letterSpacing: '3px', fontSize: '9px', marginTop: '2px' }}>─── ❖ ───</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Document Title */}
            <div style={{ textAlign: 'center', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '17px', margin: '14px 0 12px 0', color: '#000' }}>
              {docTitle || 'ទម្រង់ស្នើសុំ'}
            </div>

            {/* Section 1 */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '14px', marginTop: '10px', marginBottom: '6px', color: '#000', fontWeight: 'normal' }}>
              ១. ព័ត៌មានអ្នកស្នើសុំ ៖
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '6px', fontSize: '12px', whiteSpace: 'nowrap', width: '100%' }}>
              <span style={{ flexShrink: 0 }}><b>គោត្តនាម និងនាម ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1 1 auto', minWidth: '100px', fontWeight: 'bold', color: '#1e3a8a', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{applicantName}</span>
              <span style={{ flexShrink: 0, marginLeft: '10px' }}><b>ភេទ ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', width: '45px', flexShrink: 0, textAlign: 'center', padding: '0 4px', fontSize: '12px' }}>{gender}</span>
              <span style={{ flexShrink: 0, marginLeft: '10px' }}><b>មុខតំណែង ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1 1 auto', minWidth: '100px', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{position}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '6px', fontSize: '12px', whiteSpace: 'nowrap', width: '100%' }}>
              <span style={{ flexShrink: 0 }}><b>ការិយាល័យ ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1 1 auto', minWidth: '120px', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{office}</span>
              <span style={{ flexShrink: 0, marginLeft: '10px' }}><b>នាយកដ្ឋាន/អង្គភាព/សាខា ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1.2 1 auto', minWidth: '130px', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{department}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '6px', fontSize: '12px', whiteSpace: 'nowrap', width: '100%' }}>
              <span style={{ flexShrink: 0 }}><b>លេខទូរស័ព្ទទំនាក់ទំនង ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1 1 auto', minWidth: '100px', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phone}</span>
              <span style={{ flexShrink: 0, marginLeft: '10px' }}><b>អ៊ីមែល ៖</b></span>
              <span style={{ borderBottom: '1px dotted #222', flex: '1.5 1 auto', minWidth: '130px', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
            </div>

            {/* Section 2 */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '14px', marginTop: '12px', marginBottom: '6px', color: '#000', fontWeight: 'normal' }}>
              ២. ព័ត៌មានលម្អិត និងគោលបំណង ៖
            </div>
            <div style={{ marginTop: '4px', marginBottom: '8px', fontSize: '12px' }}>
              {(() => {
                const rawLines = (details || '').split('\n').filter(l => l.trim() !== '');
                const displayLines = rawLines.length > 0 ? rawLines : ['', ''];
                while (displayLines.length < 2) displayLines.push('');
                return displayLines.map((line, i) => (
                  <div key={i} style={{ borderBottom: '1px dotted #222', minHeight: '22px', lineHeight: '22px', fontWeight: '600', color: '#1e3a8a', padding: '0 4px', fontSize: '12px', width: '100%' }}>
                    {line || '\u00A0'}
                  </div>
                ));
              })()}
            </div>

            <div style={{ margin: '6px 0', fontSize: '12px' }}>
              <b>ប្រភេទការកែប្រែ ៖</b> 
              &nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeData ? '✓' : ''}</span> កែទិន្នន័យ
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeConfig ? '✓' : ''}</span> កែប្រព័ន្ធ (Configuration)
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeFeature ? '✓' : ''}</span> បន្ថែមមុខងារ (Feature)
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeOther ? '✓' : ''}</span> ផ្សេងៗ{changeTypeOtherText ? ` (${changeTypeOtherText})` : ''}
            </div>

            <div style={{ margin: '6px 0', fontSize: '12px' }}>
              <b>កម្រិតនៃផលប៉ះពាល់ ៖</b> 
              &nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactLow ? '✓' : ''}</span> ទាប
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactMedium ? '✓' : ''}</span> មធ្យម
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactHigh ? '✓' : ''}</span> ខ្ពស់
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactOther ? '✓' : ''}</span> ផ្សេងៗ{impactOtherText ? ` (${impactOtherText})` : ''}
            </div>

            <div style={{ marginTop: '6px', fontSize: '12px', width: '100%' }}>
              {(() => {
                let line1 = reason || '';
                let line2 = '';
                if (reason) {
                  if (reason.includes('\n')) {
                    const parts = reason.split('\n');
                    line1 = parts[0] || '';
                    line2 = parts[1] || '';
                  } else if (reason.length > 145) {
                    let spaceIdx = reason.lastIndexOf(' ', 145);
                    if (spaceIdx < 90) spaceIdx = 145;
                    line1 = reason.substring(0, spaceIdx).trim();
                    line2 = reason.substring(spaceIdx).trim();
                  }
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap', width: '100%' }}>
                      <span style={{ flexShrink: 0, marginRight: '6px' }}><b>មូលហេតុនៃការស្នើសុំ ៖</b></span>
                      <span style={{ borderBottom: '1px dotted #222', flex: '1 1 auto', fontWeight: '600', color: '#1e3a8a', padding: '0 4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {line1 || '\u00A0'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap', width: '100%' }}>
                      <span style={{ borderBottom: '1px dotted #222', width: '100%', fontWeight: '600', color: '#1e3a8a', padding: '0 4px', fontSize: '12px', display: 'block', minHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {line2 || '\u00A0'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Official Legal Disclaimer Text */}
            <div style={{ fontSize: '11.5px', fontStyle: 'italic', marginTop: '10px', marginBottom: '6px', textAlign: 'justify', lineHeight: '1.5' }}>
              <b>ចំណាំ ៖</b><br/>
              ខ្ញុំបាទ/នាងខ្ញុំសូមធានាថា រាល់ការកែប្រែព័ត៌មានដែលបានស្នើសុំខាងលើ គឺស្របតាមលំហូរនៃប្រព័ន្ធ (System Flow) និងផ្អែកលើខ្លឹមសារនៃការស្នើសុំជាផ្លូវការ។ ខ្ញុំបាទ/នាងខ្ញុំ សូមសន្យាថាក្នុងករណីមានការប្រែប្រួលខុសពីការស្នើសុំដើម ឬមានផលប៉ះពាល់ដល់លំហូរការងាររបស់ប្រព័ន្ធ ដែលបណ្តាលមកពីការស្នើសុំមិនច្បាស់លាស់ ខ្ញុំបាទ/នាងខ្ញុំ ជាអ្នកស្នើសុំ សុខចិត្តទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
            </div>

            {/* Date and Signature Block */}
            <div style={{ float: 'right', marginTop: '4px', fontSize: '11.5px', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', marginBottom: '2px', textAlign: 'center' }}>{lunarDateText || 'ថ្ងៃអង្គារ ៥កើត ខែមាឃ ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០'}</div>
              <div style={{ textAlign: 'center' }}>{locationPrefix ? `${locationPrefix} ` : ''}ថ្ងៃទី <span style={{ fontWeight: 'bold' }}>{toKhmerNum(day)}</span> ខែ <span style={{ fontWeight: 'bold' }}>{getKhmerMonthName(month)}</span> ឆ្នាំ <span style={{ fontWeight: 'bold' }}>{toKhmerNum(year)}</span></div>
              <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>ហត្ថលេខាសាម៉ីខ្លួន</div>
              <div style={{ minHeight: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                {signatureImage && (
                  <img src={signatureImage} alt="Signature" style={{ maxHeight: '55px', maxWidth: '170px', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ fontWeight: 'normal', color: '#000', fontSize: '13px', textAlign: 'center', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", marginTop: '2px' }}>
                {applicantName || 'ពេញ បញ្ញារតន៍'}
              </div>
            </div>

            {/* Section 3 Approval Table */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '14px', marginTop: '10px', marginBottom: '6px', clear: 'both', color: '#000', fontWeight: 'normal' }}>
              ៣. យោបល់របស់ថ្នាក់ដឹកនាំមានសមត្ថកិច្ច ៖
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', height: '42px', width: '20%', whiteSpace: 'pre-line' }}>{approvalHeader1}</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%', whiteSpace: 'pre-line' }}>{approvalHeader2}</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%', whiteSpace: 'pre-line' }}>{approvalHeader3}</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%', whiteSpace: 'pre-line' }}>{approvalHeader4}</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%', whiteSpace: 'pre-line' }}>{approvalHeader5}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', height: '95px' }}></td>
                  <td style={{ border: '1px solid #000' }}></td>
                  <td style={{ border: '1px solid #000' }}></td>
                  <td style={{ border: '1px solid #000' }}></td>
                  <td style={{ border: '1px solid #000' }}></td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>

      </div>

    </div>
  );
}
