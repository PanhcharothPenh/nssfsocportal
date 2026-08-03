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

  // Form Fields matching original PDF lines
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

  // Print PDF directly Overlaying values on original PDF
  const handlePrintOriginalPdf = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) { alert('សូមអនុញ្ញាត Popup blockers!'); return; }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="UTF-8">
        <title>Auto-Fill PDF Form Original (NSSF_Form Request_Change_System_SOC.pdf)</title>
        <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; font-family: 'Battambang', sans-serif; font-size: 13px; }
          .pdf-container {
            position: relative;
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background-image: url('/NSSF_Form_Request_Change_System_SOC.pdf');
            background-size: cover;
          }
          .pdf-bg-img {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
          }
          .field {
            position: absolute;
            z-index: 10;
            font-size: 13px;
            font-weight: bold;
            color: #000;
            white-space: nowrap;
          }
          .check-mark {
            position: absolute;
            z-index: 10;
            font-size: 14px;
            font-weight: bold;
            color: #000;
          }
          @media print {
            body { margin: 0; }
            .pdf-container { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <!-- Render original PDF as image/background canvas -->
          <iframe src="/NSSF_Form_Request_Change_System_SOC.pdf#toolbar=0&navpanes=0&scrollbar=0" style="width:100%; height:100%; border:none; position:absolute; top:0; left:0; z-index:1;"></iframe>

          <!-- Overlay filled text fields on original PDF coordinates -->
          <div class="field" style="top: 268px; left: 190px;">${applicantName}</div>
          <div class="field" style="top: 268px; left: 410px;">${gender}</div>
          <div class="field" style="top: 268px; left: 520px;">${position}</div>

          <div class="field" style="top: 292px; left: 160px;">${office}</div>
          <div class="field" style="top: 292px; left: 470px;">${department}</div>

          <div class="field" style="top: 316px; left: 210px;">${phone}</div>
          <div class="field" style="top: 316px; left: 490px;">${email}</div>

          <!-- Section 2 Details -->
          <div class="field" style="top: 366px; left: 100px; width: 620px; white-space: normal; line-height: 1.8;">${details}</div>

          <!-- Checkboxes Section 2 -->
          ${changeTypeData ? `<div class="check-mark" style="top: 443px; left: 213px;">✓</div>` : ''}
          ${changeTypeConfig ? `<div class="check-mark" style="top: 443px; left: 295px;">✓</div>` : ''}
          ${changeTypeFeature ? `<div class="check-mark" style="top: 443px; left: 470px;">✓</div>` : ''}
          ${changeTypeOther ? `<div class="check-mark" style="top: 443px; left: 602px;">✓</div>` : ''}

          <!-- Impact Checkboxes -->
          ${impactLow ? `<div class="check-mark" style="top: 468px; left: 236px;">✓</div>` : ''}
          ${impactMedium ? `<div class="check-mark" style="top: 468px; left: 295px;">✓</div>` : ''}
          ${impactHigh ? `<div class="check-mark" style="top: 468px; left: 365px;">✓</div>` : ''}

          <!-- Reason -->
          <div class="field" style="top: 492px; left: 210px; width: 500px; white-space: normal;">${reason}</div>

          <!-- Date & Signature Block -->
          <div class="field" style="top: 615px; left: 480px;">${day}</div>
          <div class="field" style="top: 615px; left: 560px;">${month}</div>
          <div class="field" style="top: 615px; left: 670px;">${year.length > 3 ? year.substring(3) : year}</div>

          ${signatureImage ? `<img src="${signatureImage}" style="position:absolute; top: 645px; left: 520px; max-height: 55px; z-index: 20;" />` : `<div class="field" style="top: 665px; left: 540px;">${applicantName}</div>`}

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
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
      
      {/* Header */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📄</span> Auto Fill លើ PDF ដើម (NSSF_Form Request_Change_System_SOC.pdf)
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            បំពេញទិន្នន័យផ្ទាល់លើឯកសារ PDF ដើម ១០០% ដោយមិនកែប្រែទម្រង់ដើមឡើយ
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
            onClick={handlePrintOriginalPdf}
            style={{ borderRadius: '10px', padding: '8px 20px', fontWeight: '800', fontSize: '13px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ បំពេញ និងបោះពុម្ពលើ PDF ដើម
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

      {/* Layout Split: Form Inputs Left, PDF Document Viewer Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Side: Auto-Fill Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section 1 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e3a8a', fontSize: '14px' }}>១. ព័ត៌មានអ្នកស្នើសុំ (Applicant Info)</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>គោត្តនាម និងនាម (Full Name)</label>
              <input type="text" className="form-input" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} style={{ padding: '8px', fontSize: '12.5px' }} />
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

        {/* Right Side: Live Original PDF File Viewer Overlay */}
        <div style={{ backgroundColor: '#334155', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', height: '780px' }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📄 ឯកសារ PDF ដើម (Original PDF File View)</span>
            <span style={{ fontSize: '11px', backgroundColor: '#1e293b', padding: '3px 8px', borderRadius: '6px' }}>NSSF_Form Request_Change_System_SOC.pdf</span>
          </div>

          <div style={{ flex: '1', width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#fff' }}>
            <iframe
              src="/NSSF_Form_Request_Change_System_SOC.pdf#toolbar=0&navpanes=0"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Original NSSF PDF File"
            />
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginTop: '20px' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrintOriginalPdf}
          style={{ borderRadius: '10px', padding: '12px 28px', fontWeight: '800', fontSize: '14px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🖨️ Auto Fill និងបោះពុម្ពលើ PDF ដើម
        </button>
      </div>

    </div>
  );
}
