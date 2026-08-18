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
                <label><input type="radio" name="imp_orig" checked={impactLow} onChange={() => { setImpactLow(true); setImpactMedium(false); setImpactHigh(false); setImpactOther(false); }} /> ទាប</label>
                <label><input type="radio" name="imp_orig" checked={impactMedium} onChange={() => { setImpactLow(false); setImpactMedium(true); setImpactHigh(false); setImpactOther(false); }} /> មធ្យម</label>
                <label><input type="radio" name="imp_orig" checked={impactHigh} onChange={() => { setImpactLow(false); setImpactMedium(false); setImpactHigh(true); setImpactOther(false); }} /> ខ្ពស់</label>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>មូលហេតុនៃការស្នើសុំ</label>
              <textarea className="form-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '8px', fontSize: '12px', width: '100%' }} />
            </div>
          </div>

          {/* Signature */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '14px' }}>✍️ ហត្ថលេខាសាម៉ីខ្លួន</h4>
            <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', backgroundColor: '#fafafa', position: 'relative', display: 'inline-block' }}>
              <canvas ref={canvasRef} width={300} height={90} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ cursor: 'crosshair', display: 'block' }} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={clearSignature} style={{ marginTop: '6px', fontSize: '11px' }}>
              🧹 សម្អាត
            </button>
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
            fontSize: '13px',
            lineHeight: '1.55',
            color: '#000'
          }}>
            
            {/* Document Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '48%', verticalAlign: 'top', textAlign: 'left' }}>
                    <img src="/nssf_logo.png" alt="NSSF Logo" style={{ width: '72px', height: 'auto' }} onerror={(e) => { e.target.src='/Nssf_Resize_Logo.png'; }} /><br/>
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6', fontWeight: 'normal' }}>បេឡាជាតិសន្តិសុខសង្គម</div>
                      <div style={{ fontFamily: "'Khmer OS Siemreap', 'Siemreap', sans-serif", fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: '1.4' }}>នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
                      <div style={{ fontFamily: "'Khmer OS Siemreap', 'Siemreap', sans-serif", fontSize: '11px', color: '#334155' }}>ការិយាល័យសុវត្ថិភាពប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មាន</div>
                    </div>
                  </td>
                  <td style={{ width: '52%', textAlignment: 'center', verticalAlign: 'top', textAlign: 'center' }}>
                    <div style={{ fontSize: '14.5px', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", marginBottom: '2px', color: '#000' }}>ព្រះរាជាណាចក្រកម្ពុជា</div>
                    <div style={{ fontSize: '12.5px', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", color: '#000' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                    <div style={{ letterSpacing: '3px', fontSize: '9px', marginTop: '2px' }}>─── ❖ ───</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Document Title */}
            <div style={{ textAlign: 'center', fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '18px', margin: '14px 0 12px 0', color: '#000' }}>
              ទម្រង់ស្នើសុំ
            </div>

            {/* Section 1 */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '12.5px', marginTop: '10px', marginBottom: '5px', color: '#000', fontWeight: 'normal' }}>
              ១. ព័ត៌មានអ្នកស្នើសុំ ៖
            </div>
            <div style={{ marginBottom: '6px' }}>
              <b>គោត្តនាម និងនាម ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '210px', fontWeight: 'bold', color: '#1e3a8a', padding: '0 4px' }}>{applicantName}</span>
              &nbsp;&nbsp;<b>ភេទ ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '55px', textAlign: 'center', padding: '0 4px' }}>{gender}</span>
              &nbsp;&nbsp;<b>មុខតំណែង ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '200px', padding: '0 4px' }}>{position}</span>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <b>ការិយាល័យ ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '230px', padding: '0 4px' }}>{office}</span>
              &nbsp;&nbsp;<b>នាយកដ្ឋាន/អង្គភាព/សាខា ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '240px', padding: '0 4px' }}>{department}</span>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <b>លេខទូរស័ព្ទទំនាក់ទំនង ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '200px', padding: '0 4px' }}>{phone}</span>
              &nbsp;&nbsp;<b>អ៊ីមែល ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', minWidth: '270px', padding: '0 4px' }}>{email}</span>
            </div>

            {/* Section 2 */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '12.5px', marginTop: '12px', marginBottom: '5px', color: '#000', fontWeight: 'normal' }}>
              ២. ព័ត៌មានលម្អិត និងគោលបំណង ៖
            </div>
            <div style={{ minHeight: '48px', lineHeight: '1.8', marginBottom: '6px' }}>
              {(details || '').split('\n').map((line, i) => (
                <div key={i} style={{ fontWeight: '600', color: '#1e3a8a' }}>{line}</div>
              ))}
              {!details && (
                <div>...........................................................................................................................................................</div>
              )}
            </div>

            <div style={{ margin: '6px 0' }}>
              <b>ប្រភេទការកែប្រែ ៖</b> 
              &nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeData ? '✓' : ''}</span> កែទិន្នន័យ
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeConfig ? '✓' : ''}</span> កែប្រព័ន្ធ (Configuration)
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeFeature ? '✓' : ''}</span> បន្ថែមមុខងារ (Feature)
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{changeTypeOther ? '✓' : ''}</span> ផ្សេងៗ{changeTypeOtherText ? ` (${changeTypeOtherText})` : ''}
            </div>

            <div style={{ margin: '6px 0' }}>
              <b>កម្រិតនៃផលប៉ះពាល់ ៖</b> 
              &nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactLow ? '✓' : ''}</span> ទាប
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactMedium ? '✓' : ''}</span> មធ្យម
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactHigh ? '✓' : ''}</span> ខ្ពស់
              &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '13px', height: '13px', border: '1.2px solid #000', textAlign: 'center', lineHeight: '11px', fontSize: '10px', fontWeight: 'bold', marginRight: '2px' }}>{impactOther ? '✓' : ''}</span> ផ្សេងៗ{impactOtherText ? ` (${impactOtherText})` : ''}
            </div>

            <div style={{ marginTop: '6px' }}>
              <b>មូលហេតុនៃការស្នើសុំ ៖</b> <span style={{ borderBottom: '1px dotted #222', display: 'inline-block', width: '78%', fontWeight: '600', color: '#1e3a8a', padding: '0 4px' }}>{reason}</span>
            </div>

            {/* Official Legal Disclaimer Text */}
            <div style={{ fontSize: '11.5px', fontStyle: 'italic', marginTop: '10px', marginBottom: '6px', textAlign: 'justify', lineHeight: '1.5' }}>
              <b>ចំណាំ ៖</b><br/>
              ខ្ញុំបាទ/នាងខ្ញុំសូមធានាថា រាល់ការកែប្រែព័ត៌មានដែលបានស្នើសុំខាងលើ គឺស្របតាមលំហូរនៃប្រព័ន្ធ (System Flow) និងផ្អែកលើខ្លឹមសារនៃការស្នើសុំជាផ្លូវការ។ ខ្ញុំបាទ/នាងខ្ញុំ សូមសន្យាថាក្នុងករណីមានការប្រែប្រួលខុសពីការស្នើសុំដើម ឬមានផលប៉ះពាល់ដល់លំហូរការងាររបស់ប្រព័ន្ធ ដែលបណ្តាលមកពីការស្នើសុំមិនច្បាស់លាស់ ខ្ញុំបាទ/នាងខ្ញុំ ជាអ្នកស្នើសុំ សុខចិត្តទទួលខុសត្រូវចំពោះមុខច្បាប់ជាធរមាន។
            </div>

            {/* Date and Signature Block */}
            <div style={{ float: 'right', textAlign: 'center', marginTop: '4px', width: '310px' }}>
              <div>ថ្ងៃទី <span style={{ fontWeight: 'bold' }}>{day}</span> ខែ <span style={{ fontWeight: 'bold' }}>{month}</span> ឆ្នាំ២០២<span style={{ fontWeight: 'bold' }}>{year.length > 3 ? year.substring(3) : year}</span></div>
              <div style={{ marginTop: '4px', fontWeight: 'bold' }}>ហត្ថលេខាសាម៉ីខ្លួន</div>
              <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                {signatureImage ? (
                  <img src={signatureImage} alt="Signature" style={{ maxHeight: '55px', maxWidth: '170px' }} />
                ) : (
                  <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{applicantName}</div>
                )}
              </div>
            </div>

            {/* Section 3 Approval Table */}
            <div style={{ fontFamily: "'Khmer OS Muol Light', 'Khmer OS Moul Light', 'Khmer OS Muol', 'Moul', serif", fontSize: '12.5px', marginTop: '10px', marginBottom: '5px', clear: 'both', color: '#000', fontWeight: 'normal' }}>
              ៣. យោបល់របស់ថ្នាក់ដឹកនាំមានសមត្ថកិច្ច ៖
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#f8fafc', height: '42px', width: '20%' }}>ប្រធាននាយកដ្ឋាន</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%' }}>អនុប្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%' }}>ប្រធានការិយាល័យ<br/>ស.ប.ត</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%' }}>អនុប្រធាននាយកដ្ឋាន<br/>ទទួលបន្ទុក</th>
                  <th style={{ border: '1px solid #000', padding: '6px 3px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '20%' }}>ប្រធានការិយាល័យ<br/>សាម៉ី</th>
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
