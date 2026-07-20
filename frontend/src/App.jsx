import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

const NSSF_BRANCHES_LIST = [
  { name_kh: "ខណ្ឌដង្កោ", name_en: "Dangkor" },
  { name_kh: "ខណ្ឌឬស្សីកែវ", name_en: "Russey Keo" },
  { name_kh: "ខណ្ឌមានជ័យ", name_en: "Meanchey" },
  { name_kh: "ខណ្ឌពោធិ៍សែនជ័យ", name_en: "Pou Senchey" },
  { name_kh: "កណ្តាល", name_en: "Kandal" },
  { name_kh: "ខ្សាច់កណ្តាល", name_en: "Ksach Kandal" },
  { name_kh: "កំពង់ស្ពឺ", name_en: "Kampong Speu" },
  { name_kh: "ស្រុកអង្គស្នួល", name_en: "Angk Snuol" },
  { name_kh: "កំពង់ឆ្នាំង", name_en: "Kampong Chhnang" },
  { name_kh: "កំពង់ត្រឡាច", name_en: "Kampong Tralach" },
  { name_kh: "តាកែវ", name_en: "Takeo" },
  { name_kh: "ត្រាំខ្នា", name_en: "Tram Khnar" },
  { name_kh: "កំពត", name_en: "Kampot" },
  { name_kh: "កែប", name_en: "Kep" },
  { name_kh: "ព្រះសីហនុ", name_en: "Sihanoukville" },
  { name_kh: "កោះកុង", name_en: "Koh Kong" },
  { name_kh: "ក្រចេះ", name_en: "Kratie" },
  { name_kh: "ព្រៃវែង", name_en: "Prey Veng" },
  { name_kh: "ស្វាយរៀង", name_en: "Svay Rieng" },
  { name_kh: "បាវិត", name_en: "Bavet" },
  { name_kh: "ពោធិ៍សាត់", name_en: "Pursat" },
  { name_kh: "សៀមរាប", name_en: "Siem Reap" },
  { name_kh: "ព្រះវិហារ", name_en: "Preah Vihear" },
  { name_kh: "កំពង់ធំ", name_en: "Kampong Thom" },
  { name_kh: "កំពង់ចាម", name_en: "Kampong Cham" },
  { name_kh: "ជើងព្រៃ", name_en: "Cheung Prey" },
  { name_kh: "ត្បូងឃ្មុំ", name_en: "Tboung Khmum" },
  { name_kh: "ប៉ោយប៉ែត", name_en: "Poipet" },
  { name_kh: "បន្ទាយមានជ័យ", name_en: "Banteay Meanchey" },
  { name_kh: "បាត់ដំបង", name_en: "Battambang" },
  { name_kh: "ប៉ៃលិន", name_en: "Pailin" },
  { name_kh: "ឧត្ដរមានជ័យ", name_en: "Oddar Meanchey" },
  { name_kh: "ស្ទឹងត្រែង", name_en: "Stung Treng" },
  { name_kh: "មណ្ឌលគីរី", name_en: "Mondulkiri" },
  { name_kh: "រតនគីរី", name_en: "Ratanakiri" },
  { name_kh: "មន្ទីរពេទ្យព្រះអង្គឌួង", name_en: "Preah Ang Duong Hospital" },
  { name_kh: "មន្ទីរពេទ្យកាល់ម៉ែត", name_en: "Calmette Hospital" },
  { name_kh: "មជ្ឈមណ្ឌលជាតិគាំពារមាតា", name_en: "National Maternal and Child Health Center" },
  { name_kh: "មន្ទីរពេទ្យព្រះកុសមៈ", name_en: "Preah Kossamak Hospital" },
  { name_kh: "មន្ទីរពេទ្យកុមារជាតិ", name_en: "National Pediatric Hospital" },
];

const NSSF_HQ_DEPTS_LIST = [
  { name: "រដ្ឋបាលនិងគ្រប់គ្រងធនធានមនុស្ស", code: "ADMIN_DPT", vlan: "201", subnet: "172.19.1.0", mask: "255.255.255.0", gateway: "172.19.1.1", device: "Core SW" },
  { name: "គ្រប់គ្រងថវិកា ហិរញ្ញវត្ថុ និងគណនេយ្យ", code: "ACC_DPT", vlan: "202", subnet: "172.19.2.0", mask: "255.255.255.0", gateway: "172.19.2.1", device: "Core SW" },
  { name: "សេវាអតិថិជន និងទំនាក់ទំនងសាធារណៈ", code: "REL_DPT", vlan: "203", subnet: "172.19.3.0", mask: "255.255.255.0", gateway: "172.19.3.1", device: "Core SW" },
  { name: "សេវាអតិថិជន និងទំនាក់ទំនងសាធារណៈ", code: "HOT_DPT", vlan: "204", subnet: "172.19.4.0", mask: "255.255.255.0", gateway: "172.19.4.1", device: "Core SW" },
  { name: "តាវកាលិកសន្ដិសុខសង្គម", code: "BENEFIT_01", vlan: "205", subnet: "172.19.5.0", mask: "255.255.255.0", gateway: "172.19.5.1", device: "Core SW" },
  { name: "តាវកាលិកសន្ដិសុខសង្គម", code: "BENEFIT_02", vlan: "206", subnet: "172.19.6.0", mask: "255.255.255.0", gateway: "172.19.6.2", device: "Core SW" },
  { name: "គោលនយោបាយសន្ដិសុខសង្គម", code: "POLICY_DPT", vlan: "207", subnet: "172.19.7.0", mask: "255.255.255.0", gateway: "172.19.7.1", device: "Core SW" },
  { name: "បញ្ជិកា និងភាគទាន", code: "REGSTRATION_DPT_01", vlan: "208", subnet: "172.19.8.0", mask: "255.255.255.0", gateway: "172.19.8.1", device: "Core SW" },
  { name: "បញ្ជិកា និងភាគទាន", code: "REGSTRATION_DPT_02", vlan: "209", subnet: "172.19.9.0", mask: "255.255.255.0", gateway: "172.19.9.1", device: "Core SW" },
  { name: "សេវាមូលដ្ឋានសុខាភិបាល", code: "HC01_DPT", vlan: "210", subnet: "172.19.10.0", mask: "255.255.255.0", gateway: "172.19.10.1", device: "Core SW" },
  { name: "សេវាមូលដ្ឋានសុខាភិបាល", code: "HC02_DPT", vlan: "211", subnet: "172.19.11.0", mask: "255.255.255.0", gateway: "172.19.11.1", device: "Core SW" },
  { name: "គ្រប់គ្រងការវិនិយោគមូលនិធិសន្ដិសុខសង្គម", code: "INVESTMENT_DPT", vlan: "212", subnet: "172.19.12.0", mask: "255.255.255.0", gateway: "172.19.12.1", device: "Core SW" },
  { name: "អធិការកិច្ចសន្ដិសុខសង្គម", code: "INSPECTION_DPT", vlan: "213", subnet: "172.19.13.0", mask: "255.255.255.0", gateway: "172.19.13.1", device: "Core SW" },
  { name: "ស្ដារនីតិសម្បទា", code: "REHAB_DPT", vlan: "214", subnet: "172.19.14.0", mask: "255.255.255.0", gateway: "172.19.14.1", device: "Core SW" },
  { name: "សវនកម្មផ្ទៃក្នុង", code: "AUDIT_DPT", vlan: "215", subnet: "172.19.15.0", mask: "255.255.255.0", gateway: "172.19.15.1", device: "Core SW" },
  { name: "ថ្នាក់ដឹកនាំ", code: "MANAGEMENT", vlan: "216", subnet: "172.19.16.0", mask: "255.255.255.0", gateway: "172.19.16.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-DEV", vlan: "217", subnet: "172.19.17.0", mask: "255.255.255.0", gateway: "172.19.17.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-DEV-TEST", vlan: "218", subnet: "172.19.18.0", mask: "255.255.255.0", gateway: "172.19.18.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-MAIN", vlan: "219", subnet: "172.19.19.0", mask: "255.255.255.0", gateway: "172.19.19.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-MAIN-TEST", vlan: "220", subnet: "172.19.20.0", mask: "255.255.255.0", gateway: "172.19.20.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-SEC", vlan: "221", subnet: "172.19.21.0", mask: "255.255.255.0", gateway: "172.19.21.1", device: "Core SW" },
  { name: "បច្ចេកវិទ្យាព័ត៌មាន", code: "IT-SEC-TEST", vlan: "222", subnet: "172.19.22.0", mask: "255.255.255.0", gateway: "172.19.22.1", device: "Core SW" },
  { name: "អត្តសញ្ញាណកម្ម", code: "IDENTIFICATION", vlan: "223", subnet: "172.19.23.0", mask: "255.255.255.0", gateway: "172.19.23.1", device: "Core SW" },
  { name: "បន្ទប់ប្រជុំ", code: "Meeting-Room", vlan: "535", subnet: "172.17.21.0", mask: "255.255.255.0", gateway: "172.17.21.0", device: "Core SW" },
  { name: "បណ្ណាល័យ", code: "Library", vlan: "", subnet: "172.19.27.0", mask: "255.255.255.0", gateway: "", device: "Core SW" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Dashboard & global stats
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Tab data states
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchData, setSelectedBranchData] = useState([]); // includes 254 IPs
  
  const [hqDepts, setHqDepts] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDeptData, setSelectedDeptData] = useState([]); // includes 254 IPs
  
  const [vpnUsers, setVpnUsers] = useState([]);
  const [hospitalVpns, setHospitalVpns] = useState([]);
  const [publicIPs, setPublicIPs] = useState([]);
  const [switches, setSwitches] = useState([]);
  
  // Google Drive state variables
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveFolderId, setDriveFolderId] = useState('');
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveConfigMissing, setDriveConfigMissing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { name, url, mimeType }
  
  // Subnet inner filters
  const [subnetSearch, setSubnetSearch] = useState('');
  const [subnetViewMode, setSubnetViewMode] = useState('allocated'); // 'allocated' (list view) | 'grid' (all 254)
  const [ipamCategory, setIpamCategory] = useState('branches'); // 'branches' | 'hq'
  const [ipamViewMode, setIpamViewMode] = useState('grid'); // 'grid' | 'table'
  const [ipamStatusFilter, setIpamStatusFilter] = useState('all'); // 'all' | 'online' | 'warning' | 'offline'
  const [ipamUtilFilter, setIpamUtilFilter] = useState('all'); // 'all' | 'high' | 'normal' | 'unused'
  const [ipamSearchQuery, setIpamSearchQuery] = useState('');
  const [ipamSortOrder, setIpamSortOrder] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'pct-desc'
  const [ipamShowFilters, setIpamShowFilters] = useState(false);
  const [ipamSubnetFilter, setIpamSubnetFilter] = useState('');
  const [ipamGatewayFilter, setIpamGatewayFilter] = useState('');
  const [hospitalViewMode, setHospitalViewMode] = useState('grid'); // 'grid' | 'table'
  
  // Hospital VPN filtering
  const [hospitalFilter, setHospitalFilter] = useState('all'); // 'all' | 'open' | 'closed'
  
  // VPN Remote Access filtering & visibility states
  const [vpnCategory, setVpnCategory] = useState('all'); // 'all' | 'leader' | 'department' | 'hospital'
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [vpnSearch, setVpnSearch] = useState('');
  const [showVpnFilter, setShowVpnFilter] = useState(false);
  
  // Signature & PDF print states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [signerName, setSignerName] = useState('មាន ណារិមន្ត');
  const [signerTitle, setSignerTitle] = useState('ប្រធាននាយកដ្ឋានសេវាមូលដ្ឋានសុខាភិបាល');
  const [signatureImage, setSignatureImage] = useState('');
  const [currentLoginUser, setCurrentLoginUser] = useState(() => {
    const saved = localStorage.getItem('currentLoginUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Login interface states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeLoginTab, setActiveLoginTab] = useState('credentials');

  // User management states (Admin only)
  const [usersList, setUsersList] = useState([]);
  const [userForm, setUserForm] = useState({ username: '', password: '', confirmPassword: '', role: 'viewer', full_name: '', email: '', telegram_username: '', permissions: {} });
  const [editingUser, setEditingUser] = useState(null); // { id, username, role, full_name }
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userFormError, setUserFormError] = useState(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [profileActiveTab, setProfileActiveTab] = useState('info');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    language: 'English',
    timezone: '(GMT+07:00) Bangkok',
    date_format: 'dd/mm/yyyy',
    theme: 'Light',
    telegram_username: '',
    telegram_chat_id: ''
  });
  const [profileModalError, setProfileModalError] = useState(null);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalSuccess, setProfileModalSuccess] = useState(false);
  const [profileOldPassword, setProfileOldPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [telegramTemplatesForm, setTelegramTemplatesForm] = useState({
    telegram_leave_template: '',
    telegram_alert_template: ''
  });
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [dbSettings, setDbSettings] = useState({
    telegram_leave_template: 'សូមគោរព: {recipients}\n\nតាងនាមខ្ញុំបាទ/នាងខ្ញុំ៖ {name}\n\nកម្មវត្ថុ: {subject}\n\nមូលហេតុ: {reason}\n\n{closing}\n\nសូមអរគុណ។',
    telegram_alert_template: '🔔 <b>[NSSF SOC ALERT]</b>\n\n<b>Type:</b> {alert_type}\n<b>Host:</b> {host}\n<b>IP:</b> {ip}\n<b>Status:</b> {status}\n<b>Time:</b> {time}'
  });

  // Leave & Out of Office Request states
  const [leaveType, setLeaveType] = useState('out'); // 'out' | 'leave'
  const [leaveStaffName, setLeaveStaffName] = useState('');
  const [leaveStaffPosition, setLeaveStaffPosition] = useState('');
  const [leaveOutHours, setLeaveOutHours] = useState('២ ម៉ោង');
  const [leaveOutTime, setLeaveOutTime] = useState('ប្រហែល ១០ ព្រឹក');
  const [leaveDate, setLeaveDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const monthsKh = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    return `${d} ${monthsKh[today.getMonth()]} ឆ្នាំ${y}`;
  });
  const [leaveDuration, setLeaveDuration] = useState('០១ព្រឹក');
  const [leaveReason, setLeaveReason] = useState('មានធុរៈផ្ទាល់ខ្លួន');
  const [leaveRecipients, setLeaveRecipients] = useState({
    director: true,
    deputyDirector: true,
    chiefBureau: true,
    deputyChiefBureau: true,
  });
  const [telegramStatus, setTelegramStatus] = useState({ loading: false, error: null, success: false });

  const getFormattedLeaveMessage = () => {
    const recipientList = [];
    if (leaveRecipients.director) recipientList.push('លោកប្រធាន');
    if (leaveRecipients.deputyDirector) recipientList.push('លោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន');
    if (leaveRecipients.chiefBureau) recipientList.push('លោកប្រធានការិយាល័យ');
    if (leaveRecipients.deputyChiefBureau) recipientList.push('លោកអនុប្រធានការិយាល័យ');

    const salutation = `សូមគោរព ${recipientList.join(' ')}`;
    let subject = '';
    let closing = '';

    if (leaveType === 'out') {
      subject = `សុំអនុញ្ញាតចេញក្រៅ ${leaveOutHours ? `ប្រហែល ${leaveOutHours}` : ''}${leaveOutTime ? ` (${leaveOutTime})` : ''}`;
      closing = `អាស្រ័យដូចជម្រាបជូនខាងលើ សូម ${recipientList.join(' ')} មេត្តាអនុញ្ញាតដោយសេចក្ដីអនុគ្រោះ។`;
    } else {
      subject = `សុំអនុញ្ញាតឈប់សម្រាក ចំនួន ${leaveDuration} នៅថ្ងៃទី ${leaveDate}`;
      closing = `អាស្រ័យដូចជម្រាបជូនខាងលើ សូម ${recipientList.join(' ')} មេត្តាអនុញ្ញាតឱ្យខ្ញុំបានឈប់សម្រាកដោយសេចក្ដីអនុគ្រោះ។`;
    }

    const nameLine = leaveStaffName 
      ? `<b>${leaveStaffName}</b>` 
      : '';

    let template = dbSettings.telegram_leave_template || 
      'សូមគោរព: {recipients}\n\nតាងនាមខ្ញុំបាទ/នាងខ្ញុំ៖ {name}\n\nកម្មវត្ថុ: {subject}\n\nមូលហេតុ: {reason}\n\n{closing}\n\nសូមអរគុណ។';

    return template
      .replace(/{recipients}/g, salutation)
      .replace(/{name}/g, nameLine)
      .replace(/{position}/g, leaveStaffPosition || '')
      .replace(/{subject}/g, subject)
      .replace(/{reason}/g, leaveReason)
      .replace(/{closing}/g, closing);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setSignatureImage(base64);
        
        // Render signature image onto canvas for visual preview and export mapping
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = base64;
        }
        
        if (currentLoginUser) {
          localStorage.setItem('sig_' + currentLoginUser.username, base64);
        } else {
          localStorage.setItem('sig_default', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLoginUser(data.user);
        localStorage.setItem('currentLoginUser', JSON.stringify(data.user));
        // Retrieve and restore user's signature if it exists
        const savedSig = localStorage.getItem('sig_' + data.user.username);
        if (savedSig) {
          setSignatureImage(savedSig);
        } else {
          setSignatureImage('');
        }
        setLoginUsername('');
        setLoginPassword('');
      } else {
        const err = await res.json();
        setLoginError(err.detail || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!');
      }
    } catch (err) {
      setLoginError('មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Server Connection Error)');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentLoginUser(null);
    localStorage.removeItem('currentLoginUser');
    setActiveTab('dashboard');
  };

  const [telegramUsernameInput, setTelegramUsernameInput] = useState('');
  const [showTelegramLoginModal, setShowTelegramLoginModal] = useState(false);
  const [telegramLoginError, setTelegramLoginError] = useState(null);
  const [telegramLoginLoading, setTelegramLoginLoading] = useState(false);
  const [isTelegramNotifyLoading, setIsTelegramNotifyLoading] = useState(false);

  const [telegramSessionToken, setTelegramSessionToken] = useState(null);
  const [telegramPollingActive, setTelegramPollingActive] = useState(false);
  const [telegramPollingStatus, setTelegramPollingStatus] = useState('');
  
  const telegramLoginPollInterval = useRef(null);

  const startTelegramBotLogin = async () => {
    setTelegramLoginError(null);
    setTelegramPollingActive(true);
    setTelegramPollingStatus('pending');
    try {
      const res = await fetch(`${API_BASE}/auth/telegram_session/create`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.token;
        setTelegramSessionToken(token);
        
        window.open(`https://telegram.me/nssfsocportal_bot?start=${token}`, '_blank');
        
        if (telegramLoginPollInterval.current) clearInterval(telegramLoginPollInterval.current);
        telegramLoginPollInterval.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_BASE}/auth/telegram_session/status/${token}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === 'authorized') {
                clearInterval(telegramLoginPollInterval.current);
                telegramLoginPollInterval.current = null;
                setTelegramPollingActive(false);
                
                setCurrentLoginUser(statusData.user);
                localStorage.setItem('currentLoginUser', JSON.stringify(statusData.user));
                
                const savedSig = localStorage.getItem('sig_' + statusData.user.username);
                if (savedSig) {
                  setSignatureImage(savedSig);
                } else {
                  setSignatureImage('');
                }
              } else if (statusData.status === 'rejected') {
                clearInterval(telegramLoginPollInterval.current);
                telegramLoginPollInterval.current = null;
                setTelegramPollingActive(false);
                setTelegramLoginError('គណនី Telegram របស់អ្នកមិនត្រូវបានអនុញ្ញាតឱ្យចូលប្រើប្រាស់ប្រព័ន្ធឡើយ។ សូមទាក់ទងអ្នកគ្រប់គ្រងដើម្បីភ្ជាប់គណនីជាមុនសិន!');
              }
            }
          } catch (err) {
            console.error('Error polling session status:', err);
          }
        }, 2000);
      } else {
        setTelegramLoginError('មិនអាចបង្កើត Login Session បានឡើយ!');
        setTelegramPollingActive(false);
      }
    } catch (err) {
      setTelegramLoginError('Server connection error');
      setTelegramPollingActive(false);
    }
  };

  const cancelTelegramBotLogin = async () => {
    if (telegramLoginPollInterval.current) {
      clearInterval(telegramLoginPollInterval.current);
      telegramLoginPollInterval.current = null;
    }
    setTelegramPollingActive(false);
    if (telegramSessionToken) {
      try {
        await fetch(`${API_BASE}/auth/telegram_session/cancel/${telegramSessionToken}`, {
          method: 'POST'
        });
      } catch (err) {
        console.error('Error cancelling session:', err);
      }
      setTelegramSessionToken(null);
    }
  };

  useEffect(() => {
    return () => {
      if (telegramLoginPollInterval.current) {
        clearInterval(telegramLoginPollInterval.current);
      }
    };
  }, []);

  const handleTelegramLogin = async (e) => {
    e.preventDefault();
    if (!telegramUsernameInput.trim()) {
      setTelegramLoginError('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ Telegram ឬ Chat ID');
      return;
    }
    setTelegramLoginError(null);
    setTelegramLoginLoading(true);
    try {
      const payload = {};
      if (/^\d+$/.test(telegramUsernameInput.trim())) {
        payload.telegram_chat_id = telegramUsernameInput.trim();
      } else {
        payload.telegram_username = telegramUsernameInput.trim().replace(/^@/, '');
      }

      const res = await fetch(`${API_BASE}/auth/telegram_login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentLoginUser(data.user);
        localStorage.setItem('currentLoginUser', JSON.stringify(data.user));
        
        const savedSig = localStorage.getItem('sig_' + data.user.username);
        if (savedSig) {
          setSignatureImage(savedSig);
        } else {
          setSignatureImage('');
        }
        
        setTelegramUsernameInput('');
        setShowTelegramLoginModal(false);
      } else {
        const err = await res.json();
        setTelegramLoginError(err.detail || 'រកមិនឃើញគណនីតេឡេក្រាមដែលបានភ្ជាប់ទេ!');
      }
    } catch (err) {
      setTelegramLoginError('Server connection error');
    } finally {
      setTelegramLoginLoading(false);
    }
  };

  const handleSendTelegramTestNotification = async () => {
    if (!currentLoginUser) return;
    setIsTelegramNotifyLoading(true);
    setProfileModalError(null);
    setProfileModalSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/users/telegram_notify/${currentLoginUser.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        setProfileModalSuccess(true);
        setTimeout(() => setProfileModalSuccess(false), 3000);
      } else {
        const err = await res.json();
        setProfileModalError(err.detail || 'ផ្ញើសារមិនបានសម្រេច (Failed to send test notify)');
      }
    } catch (err) {
      setProfileModalError('Connection error');
    } finally {
      setIsTelegramNotifyLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormError(null);
    if (userForm.password !== userForm.confirmPassword) {
      setUserFormError('លេខសម្ងាត់មិនត្រូវគ្នាទេ (Passwords do not match)');
      return;
    }
    setUserFormLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username,
          password: userForm.password,
          role: userForm.role,
          full_name: userForm.full_name,
          email: userForm.email,
          telegram_username: userForm.telegram_username,
          permissions: userForm.permissions
        }),
      });
      if (res.ok) {
        fetchUsersList();
        setUserForm({ username: '', password: '', confirmPassword: '', role: 'viewer', full_name: '', email: '', telegram_username: '', permissions: {} });
        setUserModalOpen(false);
      } else {
        const err = await res.json();
        setUserFormError(err.detail || 'បញ្ចូលគណនីមិនបានសម្រេច');
      }
    } catch (err) {
      setUserFormError('Connection error');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserFormError(null);
    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      setUserFormError('លេខសម្ងាត់មិនត្រូវគ្នាទេ (Passwords do not match)');
      return;
    }
    setUserFormLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username,
          password: userForm.password || undefined,
          role: userForm.role,
          full_name: userForm.full_name,
          email: userForm.email,
          telegram_username: userForm.telegram_username,
          permissions: userForm.permissions
        }),
      });
      if (res.ok) {
        fetchUsersList();
        setEditingUser(null);
        setUserForm({ username: '', password: '', confirmPassword: '', role: 'viewer', full_name: '', email: '', telegram_username: '', permissions: {} });
        setUserModalOpen(false);
      } else {
        const err = await res.json();
        setUserFormError(err.detail || 'ធ្វើបច្ចុប្បន្នភាពមិនបានសម្រេច');
      }
    } catch (err) {
      setUserFormError('Connection error');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentLoginUser) return;
    setProfileModalError(null);
    setProfileModalSuccess(false);
    setProfileModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/profile/${currentLoginUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const updatedUser = {
            ...currentLoginUser,
            ...data.user
          };
          setCurrentLoginUser(updatedUser);
          localStorage.setItem('currentLoginUser', JSON.stringify(updatedUser));
          setProfileModalSuccess(true);
          setTimeout(() => setProfileModalSuccess(false), 3000);
        } else {
          setProfileModalError('រក្សាទុកមិនបានសម្រេច');
        }
      } else {
        const err = await res.json();
        setProfileModalError(err.detail || 'រក្សាទុកមិនបានសម្រេច');
      }
    } catch (err) {
      setProfileModalError('Connection error');
    } finally {
      setProfileModalLoading(false);
    }
  };

  useEffect(() => {
    if (currentLoginUser) {
      setProfileForm({
        full_name: currentLoginUser.full_name || '',
        email: currentLoginUser.email || '',
        phone: currentLoginUser.phone || '',
        department: currentLoginUser.department || '',
        language: currentLoginUser.language || 'English',
        timezone: currentLoginUser.timezone || '(GMT+07:00) Bangkok',
        date_format: currentLoginUser.date_format || 'dd/mm/yyyy',
        theme: currentLoginUser.theme || 'Light',
        telegram_username: currentLoginUser.telegram_username || '',
        telegram_chat_id: currentLoginUser.telegram_chat_id || ''
      });
    }
  }, [currentLoginUser, showProfileModal]);

  const fetchTelegramTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setTelegramTemplatesForm({
            telegram_leave_template: data.settings.telegram_leave_template || '',
            telegram_alert_template: data.settings.telegram_alert_template || ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  const handleSaveTemplates = async (e) => {
    e.preventDefault();
    setProfileModalError(null);
    setProfileModalSuccess(false);
    setProfileModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: telegramTemplatesForm
        })
      });
      if (res.ok) {
        setProfileModalSuccess(true);
        setTimeout(() => setProfileModalSuccess(false), 3000);
      } else {
        const err = await res.json();
        setProfileModalError(err.detail || 'រក្សាទុកមិនបានសម្រេច');
      }
    } catch (err) {
      setProfileModalError('Connection error');
    } finally {
      setProfileModalLoading(false);
    }
  };

  useEffect(() => {
    if (profileActiveTab === 'templates') {
      fetchTelegramTemplates();
    }
  }, [profileActiveTab]);

  const fetchDbSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setDbSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Error fetching global settings:', err);
    }
  };

  useEffect(() => {
    fetchDbSettings();
  }, []);

  const handleUpdateProfilePassword = async (e) => {
    e.preventDefault();
    if (!currentLoginUser) return;
    setProfileModalError(null);
    setProfileModalSuccess(false);
    
    if (!profileNewPassword) {
      setProfileModalError('សូមបញ្ចូលលេខសម្ងាត់ថ្មី (Please enter a new password)');
      return;
    }
    if (profileNewPassword !== profileConfirmPassword) {
      setProfileModalError('លេខសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ (Passwords do not match)');
      return;
    }
    
    setProfileModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${currentLoginUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentLoginUser.username,
          password: profileNewPassword,
          role: currentLoginUser.role,
          full_name: currentLoginUser.full_name,
          permissions: currentLoginUser.permissions
        })
      });
      
      if (res.ok) {
        setProfileModalSuccess(true);
        setProfileOldPassword('');
        setProfileNewPassword('');
        setProfileConfirmPassword('');
        setTimeout(() => setProfileModalSuccess(false), 3000);
      } else {
        const err = await res.json();
        setProfileModalError(err.detail || 'ធ្វើបច្ចុប្បន្នភាពលេខសម្ងាត់មិនបានសម្រេច');
      }
    } catch (err) {
      setProfileModalError('Connection error');
    } finally {
      setProfileModalLoading(false);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.profile-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('តើលោកអ្នកពិតជាចង់លុបគណនីអ្នកប្រើប្រាស់នេះមែនទេ?')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsersList();
      } else {
        const err = await res.json();
        alert('លុបមិនបានសម្រេច៖ ' + (err.detail || ''));
      }
    } catch (err) {
      alert('លុបមិនបានសម្រេច៖ Connection error');
    }
  };

  const isUserAdmin = currentLoginUser && (
    (currentLoginUser.role || '').toLowerCase() === 'admin' ||
    currentLoginUser.username === 'admin'
  );

  const isViewer = currentLoginUser && (currentLoginUser.role || '').toLowerCase() === 'viewer';

  const hasPermission = (moduleName, level = 'read') => {
    if (!currentLoginUser) return false;
    if (currentLoginUser.username === 'admin' || (currentLoginUser.role || '').toLowerCase() === 'admin') {
      return true;
    }
    const perms = currentLoginUser.permissions || {};
    const userVal = perms[moduleName] || 'none';
    if (level === 'read') {
      return userVal === 'read' || userVal === 'readwrite';
    }
    if (level === 'write') {
      return userVal === 'readwrite';
    }
    return false;
  };

  useEffect(() => {
    if (showPrintModal && signatureImage) {
      // Draw signature onto canvas after short delay to ensure canvas element is mounted
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = signatureImage;
        }
      }, 150);
    }
  }, [showPrintModal, signatureImage]);

  // Canvas drawing reference and state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#003bb3'; // matching royal blue signature
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage('');
  };

  const getFilteredVpnUsers = () => {
    // Filter out summary/header rows (TOTAL Inactive, TOTAL Active, Inactive, active)
    return vpnUsers.filter(user => {
      const name = (user.name || '').trim().toLowerCase();
      return !name.startsWith('total') && name !== 'active' && name !== 'inactive';
    }).filter(user => {
      if (!vpnSearch) return true;
      const q = vpnSearch.toLowerCase().trim();
      const name = (user.name || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const pos = (user.position || '').toLowerCase();
      const vpnType = (user.vpn_type || '').toLowerCase();
      const purpose = (user.purpose || '').toLowerCase();
      const other = (user.other || '').toLowerCase();
      return name.includes(q) || username.includes(q) || pos.includes(q) || vpnType.includes(q) || purpose.includes(q) || other.includes(q);
    });
  };
  
  // Modals & Editing state
  const [editingModal, setEditingModal] = useState(null); // 'branch_ip' | 'hq_ip' | 'vpn_user' | 's2s_vpn'
  const [editingData, setEditingData] = useState(null);
  const [showPskMap, setShowPskMap] = useState({}); // stores S2S VPN ID -> boolean
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('16 May 2025 10:45 AM');

  useEffect(() => {
    setModalError(null);
  }, [editingModal]);
  // Google Sheets Sync Status
  const [syncStatus, setSyncStatus] = useState({ use_google_sheets: false, has_credentials_file: false, branch_configured: false, hq_configured: false });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/sync/status`);
      const data = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  const handlePullSync = async () => {
    if (!window.confirm('តើអ្នកពិតជាចង់ទាញយកទិន្នន័យពី Google Sheets និងធ្វើបច្ចុប្បន្នភាព Database ទាំងមូលមែនទេ?')) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync/pull`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'បានទាញយកទិន្នន័យពី Google Sheets ដោយជោគជ័យ!');
        triggerRefresh();
      } else {
        alert(data.detail || 'បរាជ័យក្នុងការទាញយកទិន្នន័យពី Google Sheets។');
      }
    } catch (err) {
      console.error('Error triggering pull sync:', err);
      alert('មានកំហុសក្នុងការតភ្ជាប់ទៅ Google Sheets។');
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerRefresh = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setLastUpdated(`${day} ${month} ${year} ${time}`);
    fetchDashboardStats();
    fetchSyncStatus();
    if (activeTab === 'ipam') {
      fetchBranches();
      fetchHqDepts();
    }
    else if (activeTab === 'vpn') fetchVpnUsers();
    else if (activeTab === 's2s' || activeTab === 'banks') {
      fetchHospitalVpns();
      fetchDriveFiles();
    }
    else if (activeTab === 'public') fetchPublicIPs();
    else if (activeTab === 'switches') fetchSwitches();
    else if (activeTab === 'storage') fetchDriveFiles();
    else if (activeTab === 'users' && hasPermission('user_management', 'read')) fetchUsersList();
  };

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboardStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  useEffect(() => {
    triggerRefresh();
    fetchDriveFiles();
  }, []);

  // Fetch Tab Specific Data
  useEffect(() => {
    if (activeTab === 'ipam') {
      fetchBranches();
      fetchHqDepts();
    } else if (activeTab === 'vpn') {
      fetchVpnUsers();
    } else if (activeTab === 's2s' || activeTab === 'banks') {
      fetchHospitalVpns();
      fetchDriveFiles();
    } else if (activeTab === 'public') {
      fetchPublicIPs();
    } else if (activeTab === 'switches') {
      fetchSwitches();
    } else if (activeTab === 'storage') {
      fetchDriveFiles();
    } else if (activeTab === 'users' && hasPermission('user_management', 'read')) {
      fetchUsersList();
    }
    // reset inner filters
    setSubnetSearch('');
  }, [activeTab]);

  const fetchDriveFiles = async () => {
    setIsDriveLoading(true);
    setDriveConfigMissing(false);
    try {
      const res = await fetch(`${API_BASE}/drive/files`);
      const data = await res.json();
      if (data.status === 'config_missing') {
        setDriveConfigMissing(true);
        setDriveFiles([]);
      } else if (data.status === 'success') {
        setDriveFiles(data.files || []);
        if (data.folder_id) setDriveFolderId(data.folder_id);
      } else {
        console.error('Error fetching drive files:', data.detail);
      }
    } catch (err) {
      console.error('Error fetching drive files:', err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const uploadDriveFile = async (fileObj) => {
    if (!fileObj) return;
    setIsDriveUploading(true);
    const formData = new FormData();
    formData.append('file', fileObj);
    try {
      const res = await fetch(`${API_BASE}/drive/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('✔️ ឯកសារត្រូវបានបញ្ចូលទៅកាន់ Google Drive ដោយជោគជ័យ!');
        fetchDriveFiles();
      } else {
        alert(`❌ មិនអាចបញ្ចូលឯកសារបានទេ: ${data.detail || 'កំហុសបច្ចេកទេស'}`);
      }
    } catch (err) {
      alert(`❌ មិនអាចបញ្ចូលឯកសារបានទេ: ${err.message}`);
    } finally {
      setIsDriveUploading(false);
    }
  };

  const deleteDriveFile = async (fileId) => {
    if (!window.confirm('⚠️ តើលោកអ្នកពិតជាចង់លុបឯកសារនេះចេញពី Google Drive មែនទេ?')) return;
    try {
      const res = await fetch(`${API_BASE}/drive/files/${fileId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('✔️ ឯកសារត្រូវបានលុបដោយជោគជ័យ!');
        fetchDriveFiles();
      } else {
        alert(`❌ មិនអាចលុបឯកសារបានទេ: ${data.detail || 'កំហុសបច្ចេកទេស'}`);
      }
    } catch (err) {
      alert(`❌ មិនអាចលុបឯកសារបានទេ: ${err.message}`);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/branches`);
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranchDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/branches/${id}`);
      const data = await res.json();
      setSelectedBranch(data.branch);
      setSelectedBranchData(data.ips || []);
      setSubnetSearch('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHqDepts = async () => {
    try {
      const res = await fetch(`${API_BASE}/hq`);
      const data = await res.json();
      setHqDepts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeptDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/hq/${id}`);
      const data = await res.json();
      setSelectedDept(data.department);
      setSelectedDeptData(data.ips || []);
      setSubnetSearch('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVpnUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/vpn`);
      const data = await res.json();
      setVpnUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHospitalVpns = async () => {
    try {
      const res = await fetch(`${API_BASE}/hospital_vpns`);
      const data = await res.json();
      setHospitalVpns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPublicIPs = async () => {
    try {
      const res = await fetch(`${API_BASE}/public_ips`);
      const data = await res.json();
      setPublicIPs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSwitches = async () => {
    try {
      const res = await fetch(`${API_BASE}/switches`);
      const data = await res.json();
      setSwitches(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Global Search Handler
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    if (result.type === 'branch_ip') {
      setActiveTab('ipam');
      setIpamCategory('branches');
      fetchBranchDetails(result.link_id);
    } else if (result.type === 'hq_ip') {
      setActiveTab('ipam');
      setIpamCategory('hq');
      fetchDeptDetails(result.link_id);
    } else if (result.type === 'vpn') {
      setActiveTab('vpn');
    } else if (result.type === 's2s_vpn') {
      setActiveTab('s2s');
    } else if (result.type === 'switch') {
      setActiveTab('switches');
    }
  };

  // CSV export handler for VPN users
  const handleExportCSV = (usersToExport) => {
    const headers = ["No.", "VPN Username", "Employee/Unit Name", "VPN Password", "VPN Type", "Status", "Purpose", "Other"];
    const csvRows = [headers.join(",")];
    
    usersToExport.forEach((user, index) => {
      const row = [
        index + 1,
        `"${(user.username || '').replace(/"/g, '""')}"`,
        `"${(user.name || '').replace(/"/g, '""')}"`,
        `"${(user.password || '').replace(/"/g, '""')}"`,
        `"${(user.vpn_type || '').replace(/"/g, '""')}"`,
        `"${(user.status || '').replace(/"/g, '""')}"`,
        `"${(user.purpose || '').replace(/"/g, '""')}"`,
        `"${(user.other || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });
    
    const csvContent = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VPN_Remote_Access_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF report export handler with official letterhead header and signature
  const handlePrintPDF = (usersToPrint, signatureImgOverride) => {
    // Generate dates
    const daysKhmer = ['ថ្ងៃអាទិត្យ', 'ថ្ងៃចន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'];
    const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const digitsKhmer = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    
    const toKhmerDigits = (num) => {
      return String(num).split('').map(d => digitsKhmer[d] || d).join('');
    };
    
    const now = new Date();
    const dayOfWeek = daysKhmer[now.getDay()];
    const day = now.getDate();
    const month = monthsKhmer[now.getMonth()];
    const year = now.getFullYear();
    
    const solarDate = `រាជធានីភ្នំពេញ ថ្ងៃទី${toKhmerDigits(day)} ខែ${month} ឆ្នាំ${toKhmerDigits(year)}`;
    
    // Khmer Lunar Date Reference (July 16, 2026 -> ថ្ងៃព្រហស្បតិ៍ ២កើត ខែអាសាឍ ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០)
    const refDate = new Date('2026-07-16');
    const diffTime = now - refDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const synodicMonth = 29.53059;
    const lunarAge = (1.5 + diffDays) % synodicMonth;
    const lunarAgeNormalized = lunarAge < 0 ? lunarAge + synodicMonth : lunarAge;
    
    const lunarDay = Math.floor(lunarAgeNormalized) + 1;
    let lunarPhase = '';
    let lunarDayNum = 1;
    if (lunarDay <= 15) {
      lunarPhase = 'កើត';
      lunarDayNum = lunarDay;
    } else {
      lunarPhase = 'រោច';
      lunarDayNum = lunarDay - 15;
    }
    
    const lunarMonths = ['បុស្ស', 'មាឃ', 'ផល្គុន', 'ចេត្រ', 'ពិសាខ', 'ជេស្ឋ', 'អាសាឍ', 'ស្រាពណ៍', 'ភទ្របទ', 'អស្សុជ', 'កត្តិក', 'មិគសិរ'];
    const currentLunarMonth = lunarMonths[(now.getMonth() + 6) % 12];
    const zodiacs = ['ជូត', 'ឆ្លូវ', 'ខាល', 'ថោះ', 'រោង', 'ម្សាញ់', 'មមី', 'មមែ', 'វក', 'រកា', 'ច​ថ', 'កុរ'];
    const currentZodiac = zodiacs[(year - 4) % 12];
    const budEra = year + 544;
    
    const lunarDate = `${dayOfWeek} ${toKhmerDigits(lunarDayNum)}${lunarPhase} ខែ${currentLunarMonth} ឆ្នាំ${currentZodiac} អដ្ឋស័ក ព.ស.${toKhmerDigits(budEra)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }
    
    const rowsHtml = usersToPrint.map((user, index) => {
      // 1. Username with user icon SVG
      const userIconSvg = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003bb3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
      const usernameHtml = `<span style="display: inline-flex; align-items: center; font-weight: 700; color: #1e293b;">${userIconSvg}${user.username || '-'}</span>`;

      // 2. Name
      const nameHtml = `<span style="font-weight: 800; color: #003bb3; font-size: 11px;">${user.name || '-'}</span>`;

      // 3. Password
      const passwordHtml = user.password && user.password !== '-' 
        ? `<span style="font-family: monospace; font-size: 11px; font-weight: 600; color: #334155;">${user.password}</span>` 
        : '<span style="color: #64748b;">-</span>';

      // 4. VPN Type with shield / globe icon SVG
      const isForti = (user.vpn_type || '').toLowerCase().includes('forti');
      const isGlobal = (user.vpn_type || '').toLowerCase().includes('global') || (user.vpn_type || '').toLowerCase().includes('gp');
      
      let vpnIconSvg = '';
      if (isForti) {
        vpnIconSvg = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003bb3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 11 11 13 15 9"></polyline>
          </svg>
        `;
      } else if (isGlobal) {
        vpnIconSvg = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003bb3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        `;
      } else {
        vpnIconSvg = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003bb3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        `;
      }
      
      const vpnTypeHtml = `<span style="display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; color: #1e293b;">${vpnIconSvg}${user.vpn_type || '-'}</span>`;

      // 5. Status Badge
      const isStatusActive = (user.status || '').toLowerCase() === 'active' || (user.status || '').toLowerCase() === 'កំពុងប្រើប្រាស់';
      const statusHtml = isStatusActive
        ? `<span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-align: center;">កំពុងប្រើប្រាស់</span>`
        : `<span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; background-color: #f8fafc; color: #475569; border: 1px solid #cbd5e1; text-align: center; letter-spacing: 0.2px;">INACTIVE</span>`;

      // 6. Purpose with building icon if NSSF related
      const purposeText = user.purpose || '-';
      const isNssfPurpose = purposeText.includes('ប.ស.ស') || purposeText.toLowerCase().includes('nssf') || purposeText.includes('ប្រព័ន្ធ');
      
      let purposeIconSvg = '';
      if (isNssfPurpose) {
        purposeIconSvg = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003bb3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="16"></line>
            <line x1="15" y1="22" x2="15" y2="16"></line>
            <line x1="9" y1="16" x2="15" y2="16"></line>
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"></path>
          </svg>
        `;
      }
      const purposeHtml = `<span style="display: inline-flex; align-items: center; font-size: 10px; color: #334155; line-height: 1.4;">${purposeIconSvg}${purposeText}</span>`;

      // 7. Index Badge
      const indexBadgeHtml = `<div style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background-color: #0b45b5; color: white; border-radius: 6px; font-weight: 800; font-size: 11px; margin: 0 auto;">${index + 1}</div>`;

      return `
        <tr>
          <td style="text-align: center; vertical-align: middle;">${indexBadgeHtml}</td>
          <td>${usernameHtml}</td>
          <td>${nameHtml}</td>
          <td>${passwordHtml}</td>
          <td>${vpnTypeHtml}</td>
          <td style="text-align: center; vertical-align: middle;">${statusHtml}</td>
          <td>${purposeHtml}</td>
          <td style="color: #64748b;">${user.other || '-'}</td>
        </tr>
      `;
    }).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>NSSF SOC VPN Remote Access Accounts</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
            
            @font-face {
              font-family: 'MiSans Khmer';
              src: local('MiSans Khmer'), local('MiSansKhmer-Regular');
            }
            
            body {
              font-family: 'MiSans Khmer', 'Outfit', sans-serif;
              margin: 40px;
              color: #1e293b;
              background-color: #fff;
              font-size: 11px;
            }
            
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              width: 100%;
            }
            
            .header-left {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            
            .header-left-text-primary {
              font-size: 13px;
              font-weight: 800;
              color: #0b45b5;
              margin-top: 6px;
            }
            
            .header-left-text-secondary {
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              margin-top: 2px;
            }
            
            .header-right {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            
            .header-right-title {
              font-size: 13px;
              font-weight: 800;
              color: #1e293b;
            }
            
            .header-right-subtitle {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 4px;
            }
            
            .document-title {
              text-align: center;
              font-size: 15px;
              font-weight: 800;
              color: #0b45b5;
              margin: 25px 0 15px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            
            th {
              background-color: #0b45b5;
              border: 1px solid #cbd5e1;
              padding: 10px 8px;
              font-weight: 800;
              font-size: 11px;
              text-align: left;
              color: white;
            }
            
            td {
              border: 1px solid #cbd5e1;
              padding: 12px 10px;
              font-size: 11px;
              color: #1e293b;
              vertical-align: middle;
            }
            
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            
            @media print {
              body {
                margin: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-left">
              <img src="${window.location.origin}/Nssf_Resize_Logo.png" style="width: 75px; height: 75px; object-fit: contain; margin-bottom: 2px;" alt="NSSF Logo" />
              <div class="header-left-text-primary">បេឡាជាតិសន្តិសុខសង្គម</div>
              <div class="header-left-text-secondary">នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
            </div>
            
            <div class="header-right">
              <div class="header-right-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
              <div class="header-right-subtitle">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <div style="display: flex; align-items: center; justify-content: center; margin-top: 8px;">
                <svg width="100" height="12" viewBox="0 0 100 12" fill="none" stroke="#0b45b5" stroke-width="1.5">
                  <line x1="0" y1="6" x2="35" y2="6" stroke="#0b45b5" />
                  <circle cx="50" cy="6" r="2.5" fill="#0b45b5" />
                  <circle cx="43" cy="6" r="1.2" fill="#0b45b5" />
                  <circle cx="57" cy="6" r="1.2" fill="#0b45b5" />
                  <line x1="65" y1="6" x2="100" y2="6" stroke="#0b45b5" stroke-linecap="round" />
                </svg>
              </div>
            </div>
          </div>
          
          <div class="document-title">របាយការណ៍គណនី VPN Remote Access</div>
          
          <div style="width: 100%; height: 3px; background-color: #0b45b5; margin-bottom: 15px; margin-top: 10px;"></div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center; font-weight: 800;">No.</th>
                <th style="font-weight: 800;">VPN Username</th>
                <th style="font-weight: 800;">ឈ្មោះប្រើប្រាស់ /<br/>អង្គភាព</th>
                <th style="font-weight: 800;">VPN Password</th>
                <th style="font-weight: 800;">VPN Type</th>
                <th style="text-align: center; font-weight: 800;">ស្ថានភាព</th>
                <th style="font-weight: 800;">គោលបំណង</th>
                <th style="font-weight: 800;">ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Sign and Dates Container -->
          <div style="margin-top: 40px; display: flex; justify-content: flex-end; width: 100%; page-break-inside: avoid;">
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 300px;">
              <div style="font-size: 11px; color: #334155; margin-bottom: 2px;">${lunarDate}</div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">${solarDate}</div>
              <div style="font-size: 11px; font-weight: 800; color: #0b45b5; margin-bottom: 2px;">${signerTitle}</div>
              
              <!-- Signature container -->
              <div style="height: 55px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
                ${(signatureImgOverride !== undefined ? signatureImgOverride : signatureImage) ? `<img src="${signatureImgOverride !== undefined ? signatureImgOverride : signatureImage}" style="height: 50px; object-fit: contain; margin: 0;" alt="Signature" />` : '<div style="height: 50px; width: 150px; border-bottom: 1px dashed #cbd5e1; margin-top: 5px;"></div>'}
              </div>
              
              <div style="font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 2px;">${signerName}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save / Edit Handlers
  const handleIPEditClick = (ipNode, type) => {
    if (!hasPermission('ipam', 'write')) return;
    setEditingModal(type);
    setEditingData({ ...ipNode });
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingModal === 'branch_ip') {
        const res = await fetch(`${API_BASE}/branches/${editingData.branch_id}/ips?ip=${editingData.ip}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: editingData.user_name,
            position: editingData.position,
            mac_address: editingData.mac_address,
            device_type: editingData.device_type,
            status: editingData.status,
            internet_permission: editingData.internet_permission,
            other: editingData.other
          })
        });
        if (res.ok) {
          fetchBranchDetails(editingData.branch_id);
          fetchDashboardStats();
          setEditingModal(null);
        }
      } else if (editingModal === 'hq_ip') {
        const res = await fetch(`${API_BASE}/hq/${editingData.dept_id}/ips?ip=${editingData.ip}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name_kh: editingData.user_name_kh,
            user_name_en: editingData.user_name_en,
            position: editingData.position,
            old_ip: editingData.old_ip,
            subnet_mask: editingData.subnet_mask,
            gateway: editingData.gateway,
            status: editingData.status,
            internet_permission: editingData.internet_permission,
            group_system: editingData.group_system,
            verify_update: editingData.verify_update,
            other: editingData.other
          })
        });
        if (res.ok) {
          fetchDeptDetails(editingData.dept_id);
          fetchDashboardStats();
          setEditingModal(null);
        }
      } else if (editingModal === 'vpn_user') {
        const res = await fetch(`${API_BASE}/vpn/${editingData.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingData)
        });
        if (res.ok) {
          fetchVpnUsers();
          fetchDashboardStats();
          setEditingModal(null);
        }
      } else if (editingModal === 'vpn_user_add') {
        const res = await fetch(`${API_BASE}/vpn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingData)
        });
        if (res.ok) {
          fetchVpnUsers();
          fetchDashboardStats();
          setEditingModal(null);
        }
      } else if (editingModal === 's2s_vpn') {
        const res = await fetch(`${API_BASE}/hospital_vpns/${editingData.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingData)
        });
        if (res.ok) {
          fetchHospitalVpns();
          fetchDashboardStats();
          setEditingModal(null);
        }
      } else if (editingModal === 'branch_add') {
        const res = await fetch(`${API_BASE}/branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name_kh: editingData.name_kh,
            name_en: editingData.name_en,
            subnet: editingData.subnet,
            mask: editingData.mask,
            gateway: editingData.gateway,
            no_computer: parseInt(editingData.no_computer) || 0,
            user_name: editingData.user_name,
            position: editingData.position
          })
        });
        if (res.ok) {
          fetchBranches();
          fetchDashboardStats();
          setEditingModal(null);
        } else {
          const err = await res.json();
          setModalError(err.detail || 'Error adding branch');
        }
      } else if (editingModal === 'hq_add') {
        const res = await fetch(`${API_BASE}/hq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name_en: editingData.name_en,
            vlan_id: editingData.vlan_id,
            subnet: editingData.subnet,
            mask: editingData.mask,
            gateway: editingData.gateway,
            gw_device: editingData.gw_device,
            no_computer: parseInt(editingData.no_computer) || 0,
            user_name_kh: editingData.user_name_kh,
            user_name_en: editingData.user_name_en,
            position: editingData.position
          })
        });
        if (res.ok) {
          fetchHqDepts();
          fetchDashboardStats();
          setEditingModal(null);
        } else {
          const err = await res.json();
          setModalError(err.detail || 'Error adding HQ department');
        }
      }
    } catch (err) {
      console.error('Error saving data:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hospital status categorization logic
  // Open = S2S hospital tunnels (excluding banks)
  // Closed = Close hospital tunnels where reopen_requested is not 1
  // Reopen Requested = where reopen_requested is 1
  const openHospitals = hospitalVpns.filter(v => v.vpn_type === 'S2S');
  const closedHospitals = hospitalVpns.filter(v => v.vpn_type === 'Close' && v.reopen_requested !== 1);
  const reopenHospitals = hospitalVpns.filter(v => v.reopen_requested === 1 && v.vpn_type === 'Close');
  const bankVpns = hospitalVpns.filter(v => v.vpn_type === 'Bank');
  
  const getFilteredHospitals = () => {
    const hospitalsOnly = hospitalVpns.filter(v => v.vpn_type === 'S2S' || v.vpn_type === 'Close');
    if (hospitalFilter === 'open') return openHospitals;
    if (hospitalFilter === 'closed') return closedHospitals;
    if (hospitalFilter === 'reopen') return reopenHospitals;
    return hospitalsOnly;
  };

  // Subnet inner search filter helper
  const filterIPNodes = (nodes) => {
    if (!nodes) return [];
    return nodes.filter(node => {
      const q = subnetSearch.toLowerCase();
      if (!q) return true;
      
      const ip = (node.ip || '').toLowerCase();
      const user = (node.user_name || node.user_name_en || node.user_name_kh || '').toLowerCase();
      const mac = (node.mac_address || '').toLowerCase();
      const pos = (node.position || '').toLowerCase();
      const dev = (node.device_type || '').toLowerCase();
      const other = (node.other || '').toLowerCase();
      
      return ip.includes(q) || user.includes(q) || mac.includes(q) || pos.includes(q) || dev.includes(q) || other.includes(q);
    });
  };

  const handleCopyLeaveMessage = () => {
    // Strip HTML tags for simple text copying
    const plainText = getFormattedLeaveMessage().replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(plainText);
    alert('សារត្រូវបានចម្លងទៅកាន់ Clipboard រួចរាល់!');
  };

  const handleSendTelegramMessage = async () => {
    setTelegramStatus({ loading: true, error: null, success: false });
    try {
      const plainText = getFormattedLeaveMessage().replace(/<[^>]*>/g, '');
      const res = await fetch(`${API_BASE}/telegram/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: plainText }),
      });
      if (res.ok) {
        setTelegramStatus({ loading: false, error: null, success: true });
        setTimeout(() => setTelegramStatus(prev => ({ ...prev, success: false })), 4000);
      } else {
        const err = await res.json();
        setTelegramStatus({ loading: false, error: err.detail || 'Failed to send message', success: false });
      }
    } catch (e) {
      setTelegramStatus({ loading: false, error: e.message || 'Connection error', success: false });
    }
  };

  const handleOpenTelegramShare = () => {
    const plainText = getFormattedLeaveMessage().replace(/<[^>]*>/g, '');
    const encoded = encodeURIComponent(plainText);
    window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
  };

  const renderLeaveTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Form Panel */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', margin: 0 }}>
            📝 បង្កើតលិខិតសុំច្បាប់ / ចេញក្រៅ (Request Form)
          </h3>
          
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>ប្រភេទលិខិតសុំច្បាប់ (Request Type)</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="leaveType" checked={leaveType === 'out'} onChange={() => setLeaveType('out')} />
                សុំអនុញ្ញាតចេញក្រៅ (Out of Office)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="leaveType" checked={leaveType === 'leave'} onChange={() => setLeaveType('leave')} />
                សុំច្បាប់ឈប់សម្រាក (Request Leave)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>គោរពជូន (Salutation Recipient Titles)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={leaveRecipients.director} onChange={(e) => setLeaveRecipients({...leaveRecipients, director: e.target.checked})} />
                លោកប្រធាន
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={leaveRecipients.deputyDirector} onChange={(e) => setLeaveRecipients({...leaveRecipients, deputyDirector: e.target.checked})} />
                លោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={leaveRecipients.chiefBureau} onChange={(e) => setLeaveRecipients({...leaveRecipients, chiefBureau: e.target.checked})} />
                លោកប្រធានការិយាល័យ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={leaveRecipients.deputyChiefBureau} onChange={(e) => setLeaveRecipients({...leaveRecipients, deputyChiefBureau: e.target.checked})} />
                លោកអនុប្រធានការិយាល័យ
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>ឈ្មោះបុគ្គលិក (Staff Name)</label>
              <input type="text" className="form-control" value={leaveStaffName} onChange={(e) => setLeaveStaffName(e.target.value)} placeholder="ឧ. កៅ សាម៉ាច" />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>តួនាទី (Position - Optional)</label>
              <input type="text" className="form-control" value={leaveStaffPosition} onChange={(e) => setLeaveStaffPosition(e.target.value)} placeholder="ឧ. មន្ត្រីការិយាល័យ" />
            </div>
          </div>

          {leaveType === 'out' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>រយៈពេល (Duration)</label>
                <input type="text" className="form-control" value={leaveOutHours} onChange={(e) => setLeaveOutHours(e.target.value)} placeholder="ឧ. ២ ម៉ោង" />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>ម៉ោងចេញ (Time)</label>
                <input type="text" className="form-control" value={leaveOutTime} onChange={(e) => setLeaveOutTime(e.target.value)} placeholder="ឧ. ប្រហែល ១០ ព្រឹក" />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>រយៈពេលឈប់ (Duration)</label>
                <input type="text" className="form-control" value={leaveDuration} onChange={(e) => setLeaveDuration(e.target.value)} placeholder="ឧ. ០១ព្រឹក, ០១ថ្ងៃ" />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>កាលបរិច្ឆេទ (Date)</label>
                <input type="text" className="form-control" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} placeholder="ឧ. ១៦ កក្កដា ឆ្នាំ២០២៦" />
              </div>
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>មូលហេតុ (Reason)</label>
            <input type="text" className="form-control" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="ឧ. មានធុរៈគ្រួសារ, មានធុរៈផ្ទាល់ខ្លួន" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleSendTelegramMessage} disabled={telegramStatus.loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                {telegramStatus.loading ? '⏳ កំពុងបញ្ជូន...' : '✈️ ផ្ញើទៅ Telegram (Auto)'}
              </button>
              <button className="btn btn-secondary" onClick={handleOpenTelegramShare} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                🔗 បើក Telegram Share
              </button>
            </div>
            <button className="btn btn-secondary" onClick={handleCopyLeaveMessage} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
              📋 ចម្លងអត្ថបទ (Copy Text)
            </button>
          </div>

          {telegramStatus.error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              ⚠️ បញ្ជូនមិនបានជោគជ័យ៖ {telegramStatus.error} <br/>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>គន្លឹះ៖ លោកអ្នកនៅតែអាចប្រើប្រាស់ប៊ូតុង "ចម្លងអត្ថបទ" ឬ "បើក Telegram Share" ដើម្បីផ្ញើសារដោយដៃបានយ៉ាងងាយស្រួល!</span>
            </div>
          )}
          {telegramStatus.success && (
            <div style={{ color: 'var(--color-success)', fontSize: '13px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              ✅ បានផ្ញើទៅកាន់ Telegram Group ជោគជ័យ!
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', margin: 0 }}>
            📱 លទ្ធផលបង្ហាញជាមុន (Live Telegram Preview)
          </h3>
          
          {/* Telegram Chat mockup */}
          <div style={{
            backgroundColor: '#0e1621',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minHeight: '320px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            backgroundImage: 'radial-gradient(#182533 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2b5278',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {leaveStaffName ? leaveStaffName.charAt(0).toUpperCase() : 'B'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', color: '#5288c1', fontWeight: 'bold' }}>
                  {leaveStaffName || 'Staff Name'}
                </div>
                <div style={{
                  backgroundColor: '#182533',
                  color: '#f5f5f5',
                  padding: '12px 16px',
                  borderRadius: '0 12px 12px 12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #233140',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} dangerouslySetInnerHTML={{ __html: getFormattedLeaveMessage() }} />
                <div style={{ fontSize: '10px', color: '#7f91a4', alignSelf: 'flex-end', marginTop: '2px' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    // List of modules for fine-grained permissions mapping
    const modulesList = [
      { key: 'dashboard', name: 'Dashboard', desc: 'ផ្ទាំងគ្រប់គ្រងទិន្នន័យទូទៅ', icon: '📊' },
      { key: 'ipam', name: 'IPAM / IP Address', desc: 'គ្រប់គ្រង subnet និងទីតាំងឧបករណ៍', icon: '🏢' },
      { key: 'vpn_remote', name: 'VPN Remote Access', desc: 'គណនីបុគ្គលិកភ្ជាប់ VPN ពីក្រៅ', icon: '🔑' },
      { key: 'hospital_vpn', name: 'Hospital VPNs', desc: 'ការភ្ជាប់ VPN មន្ទីរពេទ្យ / ឯកសារយោង', icon: '🏥' },
      { key: 'bank_vpn', name: 'Bank VPNs', desc: 'ការភ្ជាប់ VPN ធនាគារដៃគូ', icon: '🏦' },
      { key: 'public_ip', name: 'Public IP & DNS', desc: 'ទិន្នន័យ IP សាធារណៈ និង DNS', icon: '🌐' },
      { key: 'switches', name: 'Switches List', desc: 'បញ្ជីរាយនាមឧបករណ៍ Switch', icon: '🔌' },
      { key: 'storage', name: 'File Storage', desc: 'ការរក្សាទុក និងបើកមើលឯកសារ Drive', icon: '📂' },
      { key: 'leave', name: 'សុំច្បាប់ / ចេញក្រៅ', desc: 'បង្កើតលិខិតសុំច្បាប់ និងផ្ញើទៅ Telegram', icon: '📝' },
      { key: 'user_management', name: 'User Management', desc: 'គ្រប់គ្រងអ្នកប្រើប្រាស់ និងសិទ្ធិប្រព័ន្ធ', icon: '👥' },
    ];

    const getRolePresetPermissions = (roleName) => {
      if (roleName === 'admin') {
        return {
          dashboard: "readwrite", ipam: "readwrite", vpn_remote: "readwrite", hospital_vpn: "readwrite",
          bank_vpn: "readwrite", public_ip: "readwrite", switches: "readwrite", storage: "readwrite",
          leave: "readwrite", user_management: "readwrite"
        };
      } else if (roleName === 'staff') {
        return {
          dashboard: "readwrite", ipam: "readwrite", vpn_remote: "readwrite", hospital_vpn: "readwrite",
          bank_vpn: "readwrite", public_ip: "readwrite", switches: "readwrite", storage: "readwrite",
          leave: "readwrite", user_management: "none"
        };
      } else { // viewer
        return {
          dashboard: "read", ipam: "read", vpn_remote: "read", hospital_vpn: "read",
          bank_vpn: "read", public_ip: "read", switches: "read", storage: "read",
          leave: "read", user_management: "none"
        };
      }
    };

    const handleRoleChangeInForm = (selectedRole) => {
      const presetPerms = getRolePresetPermissions(selectedRole);
      setUserForm({
        ...userForm,
        role: selectedRole,
        permissions: presetPerms
      });
    };

    const handlePermissionChange = (moduleKey, level) => {
      const currentPerms = userForm.permissions || getRolePresetPermissions(userForm.role);
      const updatedPerms = { ...currentPerms, [moduleKey]: level };
      
      // Determine if it matches any standard preset
      let matchedRole = 'custom';
      
      const adminPreset = getRolePresetPermissions('admin');
      const staffPreset = getRolePresetPermissions('staff');
      const viewerPreset = getRolePresetPermissions('viewer');

      const isMatch = (preset) => Object.keys(preset).every(k => updatedPerms[k] === preset[k]);
      if (isMatch(adminPreset)) matchedRole = 'admin';
      else if (isMatch(staffPreset)) matchedRole = 'staff';
      else if (isMatch(viewerPreset)) matchedRole = 'viewer';

      setUserForm({
        ...userForm,
        role: matchedRole,
        permissions: updatedPerms
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Main Panel Content Card */}
        <div className="panel" style={{ padding: '28px', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                👥
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  គណនីអ្នកប្រើប្រាស់ និងសិទ្ធិប្រព័ន្ធ (User Accounts & System Privileges)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  កំណត់សិទ្ធិលម្អិតតាមផ្នែកនីមួយៗ ស្រដៀងទៅនឹងការកំណត់សិទ្ធិរបស់ឧបករណ៍ FortiGate
                </span>
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={() => {
              setEditingUser(null);
              setUserForm({
                username: '',
                password: '',
                confirmPassword: '',
                role: 'viewer',
                full_name: '',
                email: '',
                telegram_username: '',
                permissions: getRolePresetPermissions('viewer')
              });
              setUserFormError(null);
              setUserModalOpen(true);
            }} style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
              <span>➕ បង្កើតគណនីថ្មី (Create Account)</span>
            </button>
          </div>

          <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ width: '60px', padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}># No</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}>ឈ្មោះគណនី (Username)</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}>ឈ្មោះពេញ (Full Name)</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}>គណនី Telegram (Telegram Username)</th>
                  <th style={{ width: '150px', padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}>តួនាទី (Role)</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800' }}>ទិដ្ឋភាពទូទៅនៃសិទ្ធិ (Permissions Summary)</th>
                  <th style={{ width: '140px', padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', textAlign: 'center' }}>សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user, idx) => {
                  const perms = user.permissions || {};
                  
                  // Helper to count active modules
                  const activeCount = Object.values(perms).filter(v => v === 'readwrite' || v === 'read').length;
                  const rwCount = Object.values(perms).filter(v => v === 'readwrite').length;

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--color-primary)' }}>
                            {user.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{user.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.full_name || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        {user.telegram_username ? (
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0088cc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✈️ @{user.telegram_username}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          border: user.role === 'admin' ? '1px solid rgba(37, 99, 235, 0.3)' : user.role === 'staff' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                          backgroundColor: user.role === 'admin' ? 'rgba(37, 99, 235, 0.05)' : user.role === 'staff' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(100, 116, 139, 0.05)',
                          color: user.role === 'admin' ? 'var(--color-primary)' : user.role === 'staff' ? 'var(--color-success)' : 'var(--text-muted)'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '6px' }}>
                            {activeCount} active modules ({rwCount} Read/Write)
                          </span>
                          {/* Render tiny indicators for key modules */}
                          {modulesList.slice(0, 5).map(m => {
                            const level = perms[m.key] || 'none';
                            return (
                              <span key={m.key} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '700',
                                backgroundColor: level === 'readwrite' ? 'rgba(16, 185, 129, 0.1)' : level === 'read' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(100, 116, 139, 0.05)',
                                color: level === 'readwrite' ? '#059669' : level === 'read' ? '#2563eb' : '#94a3b8',
                                border: level === 'readwrite' ? '1px solid rgba(16, 185, 129, 0.15)' : level === 'read' ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid transparent'
                              }} title={`${m.name}: ${level}`}>
                                {m.icon} {m.key === 'vpn_remote' ? 'VPN' : m.name.split(' ')[0]}
                              </span>
                            );
                          })}
                          {modulesList.length > 5 && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>+ {modulesList.length - 5} more</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button className="btn-edit" type="button" onClick={() => {
                            setEditingUser(user);
                            setUserForm({
                              username: user.username,
                              password: '',
                              confirmPassword: '',
                              role: user.role,
                              full_name: user.full_name || '',
                              email: user.email || '',
                              telegram_username: user.telegram_username || '',
                              permissions: perms
                            });
                            setUserFormError(null);
                            setUserModalOpen(true);
                          }} style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }} title="Edit User">
                            ✏️ Edit
                          </button>
                          {user.username !== 'admin' && (
                            <button className="btn-delete" type="button" onClick={() => handleDeleteUser(user.id)} style={{ padding: '6px 10px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }} title="Delete User">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Modal - Redesigned to Dual Column FortiGate Permission Matrix */}
        {userModalOpen && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <form className="modal-content" onSubmit={editingUser ? handleUpdateUser : handleCreateUser} style={{ width: '92%', maxWidth: '880px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', padding: 0 }}>
              
              {/* Modal Header */}
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '20px 28px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {editingUser ? (
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      ) : (
                        <>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="20" y1="8" x2="20" y2="14"></line>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </>
                      )}
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingUser ? 'កែប្រែគណនី និងការកំណត់សិទ្ធិប្រើប្រាស់ (Modify Account Profile)' : 'បង្កើតគណនី និងការកំណត់សិទ្ធិប្រើប្រាស់ (Create Account Profile)'}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      {editingUser ? 'កែប្រែព័ត៌មានគណនី និងសិទ្ធិប្រើប្រាស់សម្រាប់គណនីកម្រងព័ត៌មានប្រព័ន្ធ' : 'បង្កើតគណនីថ្មី និងកំណត់សិទ្ធិប្រើប្រាស់សម្រាប់គណនីកម្រងព័ត៌មានប្រព័ន្ធ'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setUserModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '700',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', height: '520px', backgroundColor: '#fff' }}>
                
                {/* Left Side: Credentials Panel */}
                <div style={{ padding: '24px 28px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#2563eb' }}>
                      👤
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', margin: 0, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.5px' }}>
                      ព័ត៌មានគណនី (Credentials)
                    </h4>
                  </div>

                  {userFormError && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)', fontWeight: '600', lineHeight: '1.4' }}>
                      ⚠️ {userFormError}
                    </div>
                  )}

                  {/* Username Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      ឈ្មោះគណនី (Username)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>👤</span>
                      <input
                        type="text"
                        required
                        disabled={editingUser?.username === 'admin'}
                        className="form-control"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        style={{ padding: '10px 14px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder="e.g. miller"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      {editingUser ? 'លេខសម្ងាត់ថ្មី (New Password)' : 'លេខសម្ងាត់ (Password)'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>🔒</span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        required={!editingUser}
                        className="form-control"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        style={{ padding: '10px 38px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder={editingUser ? '•••••••• (ទុកទទេបើមិនចង់ផ្លាស់ប្ដូរ)' : 'បញ្ចូលលេខសម្ងាត់'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}
                      >
                        {showPass ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm Password)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>🔒</span>
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required={!editingUser || !!userForm.password}
                        className="form-control"
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                        style={{ padding: '10px 38px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder="បញ្ជាក់លេខសម្ងាត់ម្ដងទៀត"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}
                      >
                        {showConfirmPass ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  {/* Full Name Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      ឈ្មោះពេញ (Full Name)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>📛</span>
                      <input
                        type="text"
                        className="form-control"
                        value={userForm.full_name}
                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                        style={{ padding: '10px 14px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder="e.g. Millersnap"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      អុីម៉ែល (Email Address)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>📧</span>
                      <input
                        type="email"
                        className="form-control"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        style={{ padding: '10px 14px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder="e.g. miller@nssf.gov.kh"
                      />
                    </div>
                  </div>

                  {/* Telegram Username Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      គណនី Telegram (Telegram Username)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>✈️</span>
                      <input
                        type="text"
                        className="form-control"
                        value={userForm.telegram_username || ''}
                        onChange={(e) => setUserForm({ ...userForm, telegram_username: e.target.value.replace(/^@/, '') })}
                        style={{ padding: '10px 14px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none' }}
                        placeholder="e.g. miller_dev (without @)"
                      />
                    </div>
                  </div>

                  {/* Role / Profile Preset */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', marginBottom: '6px', color: '#475569', textAlign: 'left' }}>
                      តួនាទី / គំរូសិទ្ធិ (Role / Profile Preset)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>⚙️</span>
                      <select
                        disabled={editingUser?.username === 'admin'}
                        className="form-control"
                        value={userForm.role}
                        onChange={(e) => handleRoleChangeInForm(e.target.value)}
                        style={{ padding: '10px 14px 10px 38px', borderRadius: '10px', fontSize: '13.5px', border: '1px solid #cbd5e1', width: '100%', height: '42px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', appearance: 'none', fontWeight: '700', color: '#1e293b' }}
                      >
                        <option value="viewer">Viewer Profile (មើលទិន្នន័យ)</option>
                        <option value="staff">Staff Profile (កែសម្រួលទិន្នន័យ)</option>
                        <option value="admin">Admin Profile (គ្រប់គ្រងប្រព័ន្ធ)</option>
                        <option value="custom">Custom Profile (កំណត់សិទ្ធិដោយខ្លួនឯង)</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>▼</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Access Permissions Matrix */}
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#10b981' }}>
                      🛡️
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', margin: 0, textTransform: 'uppercase', color: '#1e293b', letterSpacing: '0.5px' }}>
                      កំណត់សិទ្ធិផ្ដល់ប្រើ (Access Permissions Matrix)
                    </h4>
                  </div>

                  {/* Matrix Table */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>មុខងារ (Module)</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: '10.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', width: '240px' }}>សិទ្ធិប្រើប្រាស់ (Permissions)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulesList.map((m) => {
                          const currentPerms = userForm.permissions || getRolePresetPermissions(userForm.role);
                          const level = currentPerms[m.key] || 'none';

                          return (
                            <tr key={m.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                                  <span style={{ fontSize: '16px' }}>{m.icon}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>{m.name}</span>
                                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.desc}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', height: '30px', backgroundColor: '#fff' }}>
                                  
                                  {/* 🚫 None Button */}
                                  <button
                                    type="button"
                                    onClick={() => handlePermissionChange(m.key, 'none')}
                                    disabled={editingUser?.username === 'admin'}
                                    style={{
                                      border: 'none',
                                      cursor: editingUser?.username === 'admin' ? 'default' : 'pointer',
                                      padding: '0 12px',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.15s ease',
                                      backgroundColor: level === 'none' ? '#64748b' : '#fff',
                                      color: level === 'none' ? '#fff' : '#64748b',
                                      borderRight: '1px solid #d1d5db'
                                    }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                    </svg>
                                    None
                                  </button>

                                  {/* 👁️ Read Button */}
                                  <button
                                    type="button"
                                    onClick={() => handlePermissionChange(m.key, 'read')}
                                    disabled={editingUser?.username === 'admin' || m.key === 'user_management'}
                                    style={{
                                      border: 'none',
                                      cursor: (editingUser?.username === 'admin' || m.key === 'user_management') ? 'default' : 'pointer',
                                      padding: '0 12px',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.15s ease',
                                      backgroundColor: level === 'read' ? '#2563eb' : '#fff',
                                      color: level === 'read' ? '#fff' : '#2563eb',
                                      borderRight: '1px solid #d1d5db',
                                      opacity: m.key === 'user_management' ? 0.35 : 1
                                    }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Read
                                  </button>

                                  {/* 📝 Write Button */}
                                  <button
                                    type="button"
                                    onClick={() => handlePermissionChange(m.key, 'readwrite')}
                                    disabled={editingUser?.username === 'admin'}
                                    style={{
                                      border: 'none',
                                      cursor: editingUser?.username === 'admin' ? 'default' : 'pointer',
                                      padding: '0 12px',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'all 0.15s ease',
                                      backgroundColor: level === 'readwrite' ? '#10b981' : '#fff',
                                      color: level === 'readwrite' ? '#fff' : '#10b981'
                                    }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                    Write
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Warning Info Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    color: '#1e40af',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    lineHeight: '1.4',
                    textAlign: 'left'
                  }}>
                    <span style={{ fontSize: '14px' }}>ℹ️</span>
                    <span>សិទ្ធិ "Write" នឹងរួមបញ្ចូលសិទ្ធិ "Read" ដោយស្វ័យប្រវត្តិ</span>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 28px', display: 'flex', gap: '12px', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUserModalOpen(false)}
                  style={{
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  ✕ បដិសេធ (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={userFormLoading}
                  style={{
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {userFormLoading ? '⏳ រក្សាទុក...' : (editingUser ? '✔️ រក្សាទុកការផ្លាស់ប្ដូរ' : '✔️ រក្សាទុកព័ត៌មាន')}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    );
  };

  const renderStorageTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Upload Panel */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              📤 បញ្ជូនឯកសារថ្មី (Upload Document)
            </h3>
            {driveFolderId && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>
                📍 ប្រភេទផ្ទុក៖ {driveFolderId}
              </span>
            )}
          </div>

          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadDriveFile(e.target.files[0]);
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              disabled={isDriveUploading}
            />
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
            <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {isDriveUploading ? 'កំពុងបញ្ចូលឯកសារ...' : 'ចុចទីនេះ ឬអូសទម្លាក់ឯកសារដើម្បី Upload'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>គាំទ្ររាល់គ្រប់ប្រភេទឯកសារទាំងអស់ (PDF, Excel, Images, Word...)</p>
          </div>
        </div>

        {/* Files List Panel */}
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="panel-title">📂 បញ្ជីឯកសារដែលបានរក្សាទុក (Stored Documents)</span>
            <button className="btn btn-secondary" onClick={fetchDriveFiles} disabled={isDriveLoading} style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔄 {isDriveLoading ? 'កំពុងទាញយក...' : 'ធ្វើបច្ចុប្បន្នភាព'}
            </button>
          </div>

          {isDriveLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              កំពុងទាញយកបញ្ជីឯកសារពី Google Drive...
            </div>
          ) : driveFiles.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              មិនទាន់មានឯកសារណាមួយត្រូវបានរក្សាទុកឡើយ។
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ឈ្មោះឯកសារ</th>
                    <th>ប្រភេទឯកសារ</th>
                    <th>ទំហំ</th>
                    <th>ថ្ងៃរក្សាទុក</th>
                    <th style={{ textAlign: 'right' }}>សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {driveFiles.map((file) => {
                    const handleViewFile = () => {
                      const isPDF = file.mimeType === 'application/pdf';
                      const isImage = file.mimeType.startsWith('image/');
                      
                      if (isPDF || isImage) {
                        setPreviewFile({
                          name: file.name,
                          url: file.webViewLink,
                          mimeType: file.mimeType
                        });
                      } else {
                        window.open(file.webViewLink, '_blank');
                      }
                    };

                    return (
                      <tr key={file.id}>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          <span onClick={handleViewFile} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📄 {file.name}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{file.mimeType.split('/').pop().toUpperCase()}</td>
                        <td>{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{new Date(file.createdTime).toLocaleString('kh-KH')}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={handleViewFile} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>
                              👁️ មើល
                            </button>
                            <button onClick={() => deleteDriveFile(file.id)} className="btn" style={{ padding: '4px 10px', fontSize: '11px', color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', cursor: 'pointer' }}>
                              🗑️ លុប
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!currentLoginUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' 
          : 'linear-gradient(135deg, #f4f6f9 0%, #eef2f6 50%, #e0e7ff 100%)',
        fontFamily: "'Outfit', 'MiSans Khmer', sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.15)', filter: 'blur(80px)', top: '-50px', left: '-50px' }} />
        <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', bottom: '-80px', right: '-80px' }} />

        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(99, 102, 241, 0.08)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: isDarkMode 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
            : '0 20px 50px rgba(99, 102, 241, 0.1)',
          textAlign: 'center',
          zIndex: 10
        }}>
          {/* Logo */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: '#fff',
            border: '1.5px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <img src="/Nssf_Resize_Logo.png" alt="NSSF Logo" style={{ width: '46px', height: '46px', objectFit: 'contain' }} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', color: isDarkMode ? '#f8fafc' : '#0f172a', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>មជ្ឈមណ្ឌលប្រតិបត្តិការសន្តិសុខ (SOC)</h2>
          <p style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#475569', margin: '0 0 24px 0', fontWeight: '600' }}>
            Security Operations Center (SOC)
          </p>

          {/* Login Tabs */}
          <div style={{
            display: 'flex',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveLoginTab('credentials'); setLoginError(null); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeLoginTab === 'credentials' ? (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff') : 'transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: activeLoginTab === 'credentials' ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#94a3b8' : '#64748b'),
                cursor: 'pointer',
                boxShadow: activeLoginTab === 'credentials' ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              👤 ចូលគណនី (Login)
            </button>
            <button
              type="button"
              onClick={() => { setActiveLoginTab('telegram'); setTelegramLoginError(null); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeLoginTab === 'telegram' ? (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff') : 'transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: activeLoginTab === 'telegram' ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#94a3b8' : '#64748b'),
                cursor: 'pointer',
                boxShadow: activeLoginTab === 'telegram' ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              ✈️ Telegram Login
            </button>
          </div>

          {activeLoginTab === 'credentials' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px', marginBottom: '8px' }}>
                  ឈ្មោះអ្នកប្រើប្រាស់ (Username)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>👤</span>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 38px',
                      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px', marginBottom: '8px' }}>
                  លេខសម្ងាត់ (Password)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔒</span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 38px',
                      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <div style={{
                  color: '#f87171',
                  fontSize: '12.5px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  fontWeight: '600',
                  lineHeight: '1.4'
                }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                  marginTop: '10px',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.target.style.transform = 'none'}
              >
                {loginLoading ? '⏳ កំពុងចូល...' : 'ចូលប្រព័ន្ធ (Sign In)'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '12.5px', color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                ប្រព័ន្ធនឹងនាំលោកអ្នកទៅកាន់កម្មវិធី Telegram Bot ផ្ទាល់ដើម្បីដំណើរការចូលគណនី ដោយមិនបាច់វាយលេខសម្ងាត់ ឬព័ត៌មានគណនីឡើយ។
              </p>

              {!telegramPollingActive ? (
                <button
                  type="button"
                  onClick={startTelegramBotLogin}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#0088cc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, transform 0.1s',
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 136, 204, 0.2)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077b5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088cc'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2L2 11.5l6.5 3L18.5 6l-8.5 10.5 8.5 3L21.5 2z"></path>
                  </svg>
                  ចូលតាមកម្មវិធី Telegram (Login with Telegram)
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  background: isDarkMode ? 'rgba(0, 136, 204, 0.05)' : 'rgba(0, 136, 204, 0.03)',
                  border: isDarkMode ? '1px solid rgba(0, 136, 204, 0.15)' : '1px solid rgba(0, 136, 204, 0.1)',
                  padding: '18px',
                  borderRadius: '12px',
                  marginTop: '5px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0088cc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #0088cc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                    កំពុងរង់ចាំការចុច "START" ក្នុង Bot...
                  </div>
                  <span style={{ fontSize: '11.5px', color: isDarkMode ? '#94a3b8' : '#64748b', textAlign: 'center', lineHeight: '1.5', fontWeight: '500' }}>
                    សូមចុចប៊ូតុងខាងលើដើម្បីបើក Bot រួចចុច Start ក្នុង Telegram។ បន្ទាប់មកទំព័រនេះនឹងចូលគណនីដោយស្វ័យប្រវត្ត។
                  </span>
                  <button
                    type="button"
                    onClick={cancelTelegramBotLogin}
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isDarkMode ? '#cbd5e1' : '#475569',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
                  >
                    បោះបង់ (Cancel)
                  </button>
                </div>
              )}

              {telegramLoginError && (
                <div style={{
                  color: '#f87171',
                  fontSize: '12.5px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  fontWeight: '600',
                  lineHeight: '1.4',
                  marginTop: '10px'
                }}>
                  ⚠️ {telegramLoginError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '28px' }}>
          <img src="/Nssf_Resize_Logo.png" alt="NSSF Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          <div className="logo-text" style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.1px', lineHeight: '1.25', textAlign: 'left' }}>មជ្ឈមណ្ឌលប្រតិបត្តិការសន្តិសុខ (SOC)</div>
        </div>
        
        <ul className="sidebar-menu">
          {hasPermission('dashboard', 'read') && (
            <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>📊</span> Dashboard
            </li>
          )}
          {hasPermission('ipam', 'read') && (
            <li className={`menu-item ${activeTab === 'ipam' ? 'active' : ''}`} onClick={() => { setActiveTab('ipam'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>🏢</span> IPAM / IP Address
            </li>
          )}
          {hasPermission('vpn_remote', 'read') && (
            <li className={`menu-item ${activeTab === 'vpn' ? 'active' : ''}`} onClick={() => { setActiveTab('vpn'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              VPN Remote Access
            </li>
          )}
          {hasPermission('hospital_vpn', 'read') && (
            <li className={`menu-item ${activeTab === 's2s' ? 'active' : ''}`} onClick={() => { setActiveTab('s2s'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>🏥</span> Hospital VPNs
            </li>
          )}
          {hasPermission('bank_vpn', 'read') && (
            <li className={`menu-item ${activeTab === 'banks' ? 'active' : ''}`} onClick={() => { setActiveTab('banks'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>🏦</span> Bank VPNs
            </li>
          )}
          {hasPermission('public_ip', 'read') && (
            <li className={`menu-item ${activeTab === 'public' ? 'active' : ''}`} onClick={() => { setActiveTab('public'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>🌐</span> Public IP & DNS
            </li>
          )}
          {hasPermission('switches', 'read') && (
            <li className={`menu-item ${activeTab === 'switches' ? 'active' : ''}`} onClick={() => { setActiveTab('switches'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>🔌</span> Switches List
            </li>
          )}
          {hasPermission('storage', 'read') && (
            <li className={`menu-item ${activeTab === 'storage' ? 'active' : ''}`} onClick={() => { setActiveTab('storage'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>📂</span> File Storage
            </li>
          )}
          {hasPermission('leave', 'read') && (
            <li className={`menu-item ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => { setActiveTab('leave'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>📝</span> សុំច្បាប់ / ចេញក្រៅ
            </li>
          )}
          {hasPermission('user_management', 'read') && (
            <li className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setSelectedBranch(null); setSelectedDept(null); }}>
              <span className="menu-icon" style={{ fontSize: '15px' }}>👥</span> គ្រប់គ្រងអ្នកប្រើប្រាស់
            </li>
          )}
        </ul>
        
        <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="last-updated-box" style={{ padding: '8px 12px' }}>
            <div className="last-updated-info">
              <span className="last-updated-label" style={{ fontSize: '9px' }}>Last Updated</span>
              <span className="last-updated-time" style={{ fontSize: '10px' }}>{lastUpdated}</span>
            </div>
            <button className="btn-refresh" onClick={triggerRefresh} title="Sync/Refresh data" style={{ padding: '4px' }}>
              🔄
            </button>
          </div>
          
          <div className="help-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-primary)' }}>Need help?</span>
                <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)' }}>Contact IT Support</span>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: '800' }}>❯</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="navbar">
          <div className="page-title">
            <h1>
              {activeTab === 'dashboard' && 'មជ្ឈមណ្ឌលប្រតិបត្តិការសន្តិសុខ (SOC)'}
              {activeTab === 'ipam' && 'ការគ្រប់គ្រងអាសយដ្ឋាន IP & VLAN (IPAM)'}
              {activeTab === 'vpn' && 'គណនី VPN Remote Access'}
              {activeTab === 's2s' && 'ស្ថានភាព VPN មន្ទីរពេទ្យឯកជន S2S (Hospital S2S Tunnels)'}
              {activeTab === 'banks' && 'ស្ថានភាព VPN ធនាគារដៃគូ (Bank S2S Links)'}
              {activeTab === 'public' && 'តារាង IP Public & DNS Host Mapping'}
              {activeTab === 'switches' && 'បញ្ជីឧបករណ៍ Switch តាមសាខា'}
              {activeTab === 'storage' && 'ប្រព័ន្ធផ្ទុកឯកសាររួម Google Drive'}
              {activeTab === 'leave' && 'ទម្រង់សុំច្បាប់ និងអនុញ្ញាតចេញក្រៅ (Leave & Out of Office Requests)'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Security Operations Center (SOC)'}
              {activeTab === 'ipam' && (
                ipamCategory === 'branches'
                  ? (selectedBranch ? `Subnet IP Range details for ${selectedBranch.name_kh} (${selectedBranch.name_en})` : 'Utilization and host mappings for NSSF branch subnets')
                  : (selectedDept ? `VLAN allocation details for ${selectedDept.name_en}${selectedDept.sheet_name ? ` (${selectedDept.sheet_name})` : ''} (VLAN ${selectedDept.vlan_id})` : 'Utilization and hosts for HQ departments')
              )}
              {activeTab === 'vpn' && 'Credential list, statuses, and permissions for VPN remote users'}
              {activeTab === 's2s' && 'Monitor and filter active S2S hospital VPN connections versus completed/closed ones'}
              {activeTab === 'banks' && 'Monitor and manage dedicated private VPN parameters for partner financial institutions'}
              {activeTab === 'public' && 'NAT configuration history and DNS records mapped internally'}
              {activeTab === 'switches' && 'Management IP addresses and switch models deployed across NSSF branches'}
              {activeTab === 'storage' && 'Upload, view, and organize files in the shared Google Drive folder'}
              {activeTab === 'leave' && 'Generate formatted Khmer requests and post them automatically to the Telegram group'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search bar */}
            <div className="search-container">
              <span className="search-icon-left">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search user, IP, MAC, branch..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchDropdown(searchResults.length > 0)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />
              {showSearchDropdown && (
                <div className="search-dropdown">
                  {searchResults.map((r, i) => (
                    <div key={i} className="search-result-item" onClick={() => handleSearchResultClick(r)}>
                      <div className="search-result-title">{r.title}</div>
                      <div className="search-result-subtitle">{r.subtitle}</div>
                      <span className={`search-badge ${r.status === 'Using' || r.status === 'active' || r.status === 'UP' ? 'badge-active' : 'badge-inactive'}`}>
                        {r.status || 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Sheets Sync Status & Trigger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: syncStatus.use_google_sheets && syncStatus.has_credentials_file ? '#e6f4ea' : '#f1f5f9',
                color: syncStatus.use_google_sheets && syncStatus.has_credentials_file ? '#137333' : '#475569',
                border: '1px solid',
                borderColor: syncStatus.use_google_sheets && syncStatus.has_credentials_file ? '#a3cfbb' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: syncStatus.use_google_sheets && syncStatus.has_credentials_file ? '#10b981' : '#94a3b8'
                }}></span>
                {syncStatus.use_google_sheets && syncStatus.has_credentials_file ? 'Google Sheets សកម្ម' : 'Local Excel Mode'}
              </div>
              {syncStatus.use_google_sheets && syncStatus.has_credentials_file && !isViewer && (
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '32px'
                  }}
                  onClick={handlePullSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'កំពុងទាញយក...' : '🔄 Sync ពី Google Sheets'}
                </button>
              )}
            </div>
            
            {/* Notification Bell with Badge */}
            <button className="bell-icon-btn" style={{ position: 'relative', width: '38px', height: '38px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#475569' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '800', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </button>

            {/* Profile Avatar Card */}
            <div className="profile-container" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                borderLeft: '1px solid var(--border-color)', 
                paddingLeft: '16px', 
                marginLeft: '4px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '1.5px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--color-primary)' }}>
                {currentLoginUser ? currentLoginUser.username.substring(0, 2).toUpperCase() : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {currentLoginUser ? (currentLoginUser.full_name || currentLoginUser.username) : 'Guest User'}
                </span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentLoginUser ? currentLoginUser.role : 'viewer'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '2px' }}>▼</span>

              {showProfileDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '280px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    textAlign: 'left'
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '2px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: 'var(--color-primary)' }}>
                      {currentLoginUser ? currentLoginUser.username.substring(0, 2).toUpperCase() : '👤'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                        {currentLoginUser ? (currentLoginUser.full_name || currentLoginUser.username) : 'Guest User'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                        {currentLoginUser ? currentLoginUser.role : 'viewer'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>
                        {currentLoginUser?.email || `${currentLoginUser?.username || 'admin'}@nssf.gov.kh`}
                      </span>
                    </div>
                  </div>

                  {/* Actions list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div 
                      onClick={() => { setShowProfileModal(true); setProfileActiveTab('info'); setShowProfileDropdown(false); }} 
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#475569', fontWeight: '700', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: '15px' }}>👤</span> My Profile
                    </div>
                    <div 
                      onClick={() => { setShowProfileModal(true); setProfileActiveTab('info'); setShowProfileDropdown(false); }} 
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#475569', fontWeight: '700', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: '15px' }}>✏️</span> Edit Profile
                    </div>
                    <div 
                      onClick={() => { setShowProfileModal(true); setProfileActiveTab('password'); setShowProfileDropdown(false); }} 
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#475569', fontWeight: '700', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: '15px' }}>🔒</span> Change Password
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px' }}>🌐</span> Language
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>English ›</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px' }}>🌙</span> Dark Mode
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isDarkMode} 
                          onChange={(e) => setIsDarkMode(e.target.checked)} 
                          style={{ opacity: 0, width: 0, height: 0 }} 
                        />
                        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDarkMode ? '#10b981' : '#cbd5e1', transition: '.2s', borderRadius: '20px' }}></span>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: isDarkMode ? '18px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.2s', borderRadius: '50%' }}></span>
                      </label>
                    </div>
                  </div>

                  {/* Session Information */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>Session Information</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                      <span>Login IP</span>
                      <span style={{ color: '#1e293b' }}>{currentLoginUser?.client_ip || '10.10.10.21'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                      <span>Last Login</span>
                      <span style={{ color: '#1e293b' }}>{currentLoginUser?.last_login || 'Today 08:12'}</span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button 
                    onClick={() => { setShowLogoutConfirm(true); setShowProfileDropdown(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      backgroundColor: 'rgba(239, 68, 68, 0.04)',
                      color: '#ef4444',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.04)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    ចាកចេញ
                  </button>

                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && dashboardStats && (
          <>
            {/* Top Stats Cards (glowing design matches the screenshot) */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
              
              {/* Card 1: Total Branches */}
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                onClick={() => { setActiveTab('ipam'); setIpamCategory('branches'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#2563eb' }}>
                    🏢
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e3a8a' }}>{dashboardStats.counts.branches}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Branches</span>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                  View all branches →
                </div>
              </div>

              {/* Card 2: HQ Departments */}
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                onClick={() => { setActiveTab('ipam'); setIpamCategory('hq'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#7c3aed' }}>
                    🏢
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#5b21b6' }}>{dashboardStats.counts.hq_departments}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HQ Departments</span>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                  View all departments →
                </div>
              </div>

              {/* Card 3: Active VPN Users */}
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                onClick={() => { setActiveTab('vpn'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#10b981' }}>
                    🔑
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#065f46' }}>{dashboardStats.allocations.active_vpn_users} / {dashboardStats.counts.vpn_users}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active VPN Users</span>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                  View all users →
                </div>
              </div>

              {/* Card 4: Active S2S VPNs */}
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                onClick={() => { setActiveTab('s2s'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#f59e0b' }}>
                    🛡️
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#92400e' }}>{dashboardStats.allocations.active_s2s_tunnels} / {dashboardStats.counts.s2s_vpns}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active S2S VPNs</span>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                  View all VPNs →
                </div>
              </div>

            </div>

            {/* Bottom Row Grid */}
            <div className="dashboard-details-row" style={{ display: 'grid', gridTemplateColumns: '1.40fr 1fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Branch Subnets Preview */}
              <div className="panel" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'none', padding: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🏢</span>
                    <span className="panel-title" style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Branch Subnets Preview</span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => { setActiveTab('ipam'); setIpamCategory('branches'); }} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: '700', cursor: 'pointer' }}>View All</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {dashboardStats.branch_list.map((b) => {
                    const pct = Math.round((b.used_ips / b.total_ips) * 100);
                    return (
                      <div key={b.id} className="subnet-row" onClick={() => { setActiveTab('ipam'); setIpamCategory('branches'); fetchBranchDetails(b.id); }} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div className="subnet-info-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                            {b.name_kh} ({b.name_en})
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>{b.used_ips} / {b.total_ips} IPs</span>
                            <span style={{ fontSize: '11.5px', fontWeight: '800', color: pct > 80 ? '#ef4444' : '#10b981' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="subnet-address-bar" style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '10px' }}>
                          {b.subnet} &nbsp;᛫&nbsp; GW: {b.gateway}
                        </div>
                        <div className="utilization-bar-container" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div className="utilization-bar" style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981', borderRadius: '10px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Quick Access & System Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Quick Access Panel */}
                <div className="panel" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Quick Access</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    
                    {/* Tile 1: IPAM / IP Address */}
                    <div onClick={() => { setActiveTab('ipam'); setSelectedBranch(null); setSelectedDept(null); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#2563eb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#2563eb' }}>🏢</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>IPAM / IP Address</span>
                    </div>

                    {/* Tile 2: VPN Remote */}
                    <div onClick={() => setActiveTab('vpn')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#f59e0b' }}>🔑</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>VPN Remote Access</span>
                    </div>

                    {/* Tile 3: Hospital VPNs */}
                    <div onClick={() => setActiveTab('s2s')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#ef4444' }}>🏥</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>Hospital VPNs</span>
                    </div>

                    {/* Tile 4: Bank VPNs */}
                    <div onClick={() => setActiveTab('banks')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#1e3a8a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#1e3a8a' }}>🏦</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>Bank VPNs</span>
                    </div>

                    {/* Tile 5: Public IP & DNS */}
                    <div onClick={() => setActiveTab('public')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#3b82f6' }}>🌐</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>Public IP & DNS</span>
                    </div>

                    {/* Tile 6: Switches List */}
                    <div onClick={() => setActiveTab('switches')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#475569'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#475569' }}>🔌</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>Switches List</span>
                    </div>

                    {/* Tile 7: File Storage */}
                    <div onClick={() => setActiveTab('storage')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#eab308'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#eab308' }}>📂</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>File Storage</span>
                    </div>

                    {/* Tile 8: Leave Request */}
                    <div onClick={() => setActiveTab('leave')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 6px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#06b6d4'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <span style={{ fontSize: '20px', marginBottom: '8px', color: '#06b6d4' }}>📝</span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: '1.25' }}>សុំច្បាប់ / Telegram</span>
                    </div>

                  </div>
                </div>

                {/* 2. System Status Panel */}
                <div className="panel" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>⚙️</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>System Status</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '800', cursor: 'pointer' }}>View Details</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    
                    {/* Item 1: VPN Tunnels */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>⚡ VPN Tunnels</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        Healthy
                      </span>
                    </div>

                    {/* Item 2: Firewall */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>🛡️ Firewall</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        Secure
                      </span>
                    </div>

                    {/* Item 3: Storage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>💾 Storage</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        Normal
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </>
        )}

        {/* Consolidated IPAM Tab (Branches & HQ) */}
        {activeTab === 'ipam' && (() => {
          // 1. Calculate dynamic statistics
          const list = ipamCategory === 'branches' ? branches : hqDepts;
          const totalSubnets = list.length;
          const totalUsedIps = list.reduce((sum, item) => sum + (item.used_ips || 0), 0);
          const totalMaxIps = list.reduce((sum, item) => sum + (item.total_ips || 0), 0);
          const totalAvailableIps = totalMaxIps - totalUsedIps;
          const avgUtilization = totalMaxIps > 0 ? ((totalUsedIps / totalMaxIps) * 100).toFixed(1) : '0';

          // 2. Filter and Sort the subnets
          const getFilteredSubnets = () => {
            return list.filter(item => {
              // Search Filter
              if (ipamSearchQuery) {
                const q = ipamSearchQuery.toLowerCase().trim();
                const nameKh = (item.name_kh || '').toLowerCase();
                const nameEn = (item.name_en || '').toLowerCase();
                const subnet = (item.subnet || '').toLowerCase();
                const gw = (item.gateway || '').toLowerCase();
                if (!nameKh.includes(q) && !nameEn.includes(q) && !subnet.includes(q) && !gw.includes(q)) {
                  return false;
                }
              }

              // Subnet Filter
              if (ipamSubnetFilter) {
                const subQ = ipamSubnetFilter.toLowerCase().trim();
                const subnet = (item.subnet || '').toLowerCase();
                if (!subnet.includes(subQ)) {
                  return false;
                }
              }

              // Gateway Filter
              if (ipamGatewayFilter) {
                const gwQ = ipamGatewayFilter.toLowerCase().trim();
                const gw = (item.gateway || '').toLowerCase();
                if (!gw.includes(gwQ)) {
                  return false;
                }
              }

              // Status Filter
              const pct = Math.round((item.used_ips / item.total_ips) * 100);
              let statusText = 'online';
              if (item.used_ips === 0) statusText = 'offline';
              else if (pct >= 99) statusText = 'warning';

              if (ipamStatusFilter !== 'all' && statusText !== ipamStatusFilter) {
                return false;
              }

              // Utilization Filter
              if (ipamUtilFilter !== 'all') {
                if (ipamUtilFilter === 'high' && pct < 90) return false;
                if (ipamUtilFilter === 'normal' && (pct >= 90 || pct === 0)) return false;
                if (ipamUtilFilter === 'unused' && pct > 0) return false;
              }

              return true;
            }).sort((a, b) => {
              if (ipamSortOrder === 'name-asc') {
                const nameA = (a.name_en || a.name_kh || '').toLowerCase();
                const nameB = (b.name_en || b.name_kh || '').toLowerCase();
                return nameA.localeCompare(nameB);
              }
              if (ipamSortOrder === 'name-desc') {
                const nameA = (a.name_en || a.name_kh || '').toLowerCase();
                const nameB = (b.name_en || b.name_kh || '').toLowerCase();
                return nameB.localeCompare(nameA);
              }
              if (ipamSortOrder === 'pct-desc') {
                const pctA = a.used_ips / a.total_ips;
                const pctB = b.used_ips / b.total_ips;
                return pctB - pctA;
              }
              return 0;
            });
          };

          const filteredSubnets = getFilteredSubnets();

          return (
            <>
              {/* Segmented sub-tab controls at the top */}
              <div className="tab-segmented-control-container" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="tab-segmented-control" style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <button
                    className={`tab-btn ${ipamCategory === 'branches' ? 'active' : ''}`}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      backgroundColor: ipamCategory === 'branches' ? '#2563eb' : 'transparent',
                      color: ipamCategory === 'branches' ? '#fff' : '#64748b',
                      boxShadow: ipamCategory === 'branches' ? '0 4px 10px rgba(37, 99, 235, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setIpamCategory('branches');
                      setSelectedBranch(null);
                      setSelectedDept(null);
                    }}
                  >
                    🏢 សាខា (NSSF Branches)
                  </button>
                  <button
                    className={`tab-btn ${ipamCategory === 'hq' ? 'active' : ''}`}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      backgroundColor: ipamCategory === 'hq' ? '#2563eb' : 'transparent',
                      color: ipamCategory === 'hq' ? '#fff' : '#64748b',
                      boxShadow: ipamCategory === 'hq' ? '0 4px 10px rgba(37, 99, 235, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setIpamCategory('hq');
                      setSelectedBranch(null);
                      setSelectedDept(null);
                    }}
                  >
                    🏢 ស្នាក់ការកណ្តាល (HQ Departments)
                  </button>
                </div>
              </div>

              {/* Detail view checks */}
              {ipamCategory === 'branches' && selectedBranch ? (
                /* Branches Detail Mappings Panel */
                <div className="fade-in">
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <span style={{ cursor: 'pointer', color: 'var(--color-accent)' }} onClick={() => setSelectedBranch(null)}>🏢 Branches</span> / {selectedBranch.name_kh} Subnet
                  </span>
                  <button className="btn btn-secondary" onClick={() => setSelectedBranch(null)}>Back to List</button>
                </div>
                 <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div><strong>Subnet:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedBranch.subnet}</code></div>
                  <div><strong>Subnet Mask:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedBranch.mask}</code></div>
                  <div><strong>Gateway:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedBranch.gateway}</code></div>
                  <div><strong>ប្រើអស់:</strong> <span style={{ color: '#ef4444', fontWeight: '800' }}>{selectedBranchData.filter(x => (x.user_name && x.user_name.trim() !== '' && x.user_name !== 'None') || (x.position && x.position.trim() !== '' && x.position !== 'None')).length} IPs</span></div>
                  <div><strong>នៅសល់:</strong> <span style={{ color: '#10b981', fontWeight: '800' }}>{selectedBranchData.length - selectedBranchData.filter(x => (x.user_name && x.user_name.trim() !== '' && x.user_name !== 'None') || (x.position && x.position.trim() !== '' && x.position !== 'None')).length} IPs</span></div>
                </div>

                {/* Subnet Toolbar (Toggle List/Grid & Search Filter) */}
                <div className="subnet-actions-bar">
                  <div className="panel-actions">
                    <button 
                      className={`btn-toggle ${subnetViewMode === 'allocated' ? 'active' : ''}`}
                      onClick={() => setSubnetViewMode('allocated')}
                    >
                      📋 Occupied IPs Only (Table / បញ្ជីប្រើប្រាស់)
                    </button>
                    <button 
                      className={`btn-toggle ${subnetViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setSubnetViewMode('grid')}
                    >
                      🔳 Full Grid (254 IPs / ប្លង់សរុប)
                    </button>
                    {hasPermission('ipam', 'write') && (
                      <button 
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                          marginLeft: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => {
                          const firstAvail = selectedBranchData.find(node => node.status === 'Available' && node.device_type !== 'Gateway');
                          setEditingData({
                            branch_id: selectedBranch.id,
                            ip: firstAvail ? firstAvail.ip : '',
                            user_name: '',
                            position: '',
                            mac_address: '',
                            device_type: '',
                            status: 'Using',
                            internet_permission: '',
                            other: '',
                            isNew: true
                          });
                          setEditingModal('branch_ip');
                        }}
                      >
                        <span>➕</span> បន្ថែមអ្នកប្រើប្រាស់ (Add User)
                      </button>
                    )}
                  </div>
                  
                  <div className="subnet-inner-search">
                    <span className="subnet-inner-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Filter IP, User name, MAC..."
                      value={subnetSearch}
                      onChange={(e) => setSubnetSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Display Grid vs Table */}
                {subnetViewMode === 'grid' ? (
                  <div className="branch-grid-container">
                    {filterIPNodes(selectedBranchData).map((node, i) => {
                      const isAllocated = node.status !== 'Available' && node.user_name !== null;
                      const isGateway = node.device_type === 'Gateway';
                      
                      let cardClass = 'ip-node-card status-available';
                      if (isGateway) {
                        cardClass = 'ip-node-card status-gateway';
                      } else if (isAllocated) {
                        cardClass = 'ip-node-card status-using';
                      }

                      return (
                        <div key={i} className={cardClass} onClick={() => !isGateway && handleIPEditClick(node, 'branch_ip')}>
                          <div className="ip-node-ip">{node.ip}</div>
                          <div className="ip-node-user" title={node.user_name || 'Available'}>
                            {node.user_name || 'Available'}
                          </div>
                          <div className="ip-node-status">
                            {node.device_type ? `${node.device_type}` : node.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>IP Address</th>
                          <th>ឈ្មោះអ្នកប្រើប្រាស់ (User Name)</th>
                          <th>ឋានៈ (Position)</th>
                          <th>MAC Address</th>
                          <th>Device Type</th>
                          <th>ស្ថានភាព (Status)</th>
                          <th>Internet Permission</th>
                          <th>ផ្សេងៗ</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterIPNodes(selectedBranchData)
                          .filter(node => node.status !== 'Available' || node.user_name !== null)
                          .map((node, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{node.ip}</td>
                              <td style={{ fontWeight: '500' }}>{node.user_name || 'N/A'}</td>
                              <td>{node.position || 'N/A'}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{node.mac_address || 'N/A'}</td>
                              <td>{node.device_type || 'N/A'}</td>
                              <td>
                                <span className={`status-badge ${node.status === 'Using' ? 'badge-using' : 'badge-active'}`}>
                                  {node.status}
                                </span>
                              </td>
                              <td>{node.internet_permission || 'N/A'}</td>
                              <td>{node.other || 'N/A'}</td>
                              <td>
                                {node.device_type !== 'Gateway' && (
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleIPEditClick(node, 'branch_ip')}>Edit</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        {filterIPNodes(selectedBranchData).filter(node => node.status !== 'Available' || node.user_name !== null).length === 0 && (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                              No occupied IP mappings found or matches search filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : ipamCategory === 'hq' && selectedDept ? (
                /* HQ Detail Mappings Panel */
                <div className="fade-in">
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <span style={{ cursor: 'pointer', color: 'var(--color-accent)' }} onClick={() => setSelectedDept(null)}>🏢 HQ Departments</span> / {selectedDept.name_en}{selectedDept.sheet_name ? ` (${selectedDept.sheet_name})` : ''} Subnet
                  </span>
                  <button className="btn btn-secondary" onClick={() => setSelectedDept(null)}>Back to List</button>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div><strong>Subnet:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedDept.subnet}</code></div>
                  <div><strong>Gateway:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedDept.gateway}</code></div>
                  <div><strong>VLAN ID:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedDept.vlan_id}</code></div>
                  <div><strong>ប្រើអស់:</strong> <span style={{ color: '#ef4444', fontWeight: '800' }}>{selectedDeptData.filter(x => (x.user_name_kh && x.user_name_kh.trim() !== '') || (x.user_name_en && x.user_name_en.trim() !== '') || (x.position && x.position.trim() !== '')).length} IPs</span></div>
                  <div><strong>នៅសល់:</strong> <span style={{ color: '#10b981', fontWeight: '800' }}>{selectedDeptData.length - selectedDeptData.filter(x => (x.user_name_kh && x.user_name_kh.trim() !== '') || (x.user_name_en && x.user_name_en.trim() !== '') || (x.position && x.position.trim() !== '')).length} IPs</span></div>
                </div>

                {/* Subnet Toolbar */}
                <div className="subnet-actions-bar">
                  <div className="panel-actions">
                    <button 
                      className={`btn-toggle ${subnetViewMode === 'allocated' ? 'active' : ''}`}
                      onClick={() => setSubnetViewMode('allocated')}
                    >
                      📋 Occupied IPs Only (Table / បញ្ជីប្រើប្រាស់)
                    </button>
                    <button 
                      className={`btn-toggle ${subnetViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setSubnetViewMode('grid')}
                    >
                      🔳 Full Grid (254 IPs / ប្លង់សរុប)
                    </button>
                    {hasPermission('ipam', 'write') && (
                      <button 
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                          marginLeft: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => {
                          const firstAvail = selectedDeptData.find(node => node.status === 'Available' && node.status !== 'AVAILABLE' && node.position !== 'Gateway Router');
                          setEditingData({
                            dept_id: selectedDept.id,
                            ip: firstAvail ? firstAvail.ip : '',
                            user_name_kh: '',
                            user_name_en: '',
                            position: '',
                            old_ip: '',
                            status: 'USING',
                            internet_permission: '',
                            group_system: '',
                            other: '',
                            isNew: true
                          });
                          setEditingModal('hq_ip');
                        }}
                      >
                        <span>➕</span> បន្ថែមអ្នកប្រើប្រាស់ (Add User)
                      </button>
                    )}
                  </div>
                  
                  <div className="subnet-inner-search">
                    <span className="subnet-inner-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Filter IP, User name, Position..."
                      value={subnetSearch}
                      onChange={(e) => setSubnetSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grid vs Table view */}
                {subnetViewMode === 'grid' ? (
                  <div className="branch-grid-container">
                    {filterIPNodes(selectedDeptData).map((node, i) => {
                      const isAllocated = node.status !== 'Available' && node.status !== 'AVAILABLE' && (node.user_name_en !== null || node.user_name_kh !== null);
                      const isGateway = node.position === 'Gateway Router';
                      
                      let cardClass = 'ip-node-card status-available';
                      if (isGateway) {
                        cardClass = 'ip-node-card status-gateway';
                      } else if (isAllocated) {
                        cardClass = 'ip-node-card status-using';
                      }

                      return (
                        <div key={i} className={cardClass} onClick={() => !isGateway && handleIPEditClick(node, 'hq_ip')}>
                          <div className="ip-node-ip">{node.ip}</div>
                          <div className="ip-node-user" title={node.user_name_en || node.user_name_kh || 'Available'}>
                            {node.user_name_en || node.user_name_kh || 'Available'}
                          </div>
                          <div className="ip-node-status">
                            {node.position ? `${node.position}` : node.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>IP Address</th>
                          <th>ឈ្មោះឡាតាំង (Latin Name)</th>
                          <th>ឈ្មោះខ្មែរ (Khmer Name)</th>
                          <th>ឋានៈ (Position)</th>
                          <th>Old IP</th>
                          <th>Status</th>
                          <th>Group System</th>
                          <th>Internet Permission</th>
                          <th>ផ្សេងៗ</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterIPNodes(selectedDeptData)
                          .filter(node => (node.status !== 'Available' && node.status !== 'AVAILABLE') || node.user_name_en !== null)
                          .map((node, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{node.ip}</td>
                              <td style={{ fontWeight: '500' }}>{node.user_name_en || 'N/A'}</td>
                              <td style={{ fontWeight: '500' }}>{node.user_name_kh || 'N/A'}</td>
                              <td>{node.position || 'N/A'}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{node.old_ip || 'N/A'}</td>
                              <td>
                                <span className={`status-badge ${node.status === 'USING' ? 'badge-using' : 'badge-active'}`}>
                                  {node.status}
                                </span>
                              </td>
                              <td>{node.group_system || 'N/A'}</td>
                              <td>{node.internet_permission || 'N/A'}</td>
                              <td>{node.other || 'N/A'}</td>
                              <td>
                                {node.position !== 'Gateway Router' && (
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleIPEditClick(node, 'hq_ip')}>Edit</button>
                                )}
                              </td>
                            </tr>
                          ))}
                      {filterIPNodes(selectedDeptData).filter(node => (node.status !== 'Available' && node.status !== 'AVAILABLE') || node.user_name_en !== null).length === 0 && (
                        <tr>
                            <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                              No occupied IP mappings found or matches search filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
                /* Subnets Overview Panel (redesigned grid/list) */
                <>
                  {/* Dynamic Stats Cards (4 cards) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {/* Card 1 */}
                    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', margin: 0, borderRadius: '14px', borderBottom: '4px solid #2563eb', transition: 'transform 0.15s ease', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', backgroundColor: '#eff6ff', borderRadius: '12px', color: '#2563eb', fontSize: '20px', flexShrink: 0 }}>
                        🏢
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800', letterSpacing: '0.3px' }}>
                          {ipamCategory === 'branches' ? 'សរុបសាខា' : 'សរុបស្នាក់ការកណ្តាល'}
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '3px 0' }}>
                          {totalSubnets}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>
                          {ipamCategory === 'branches' ? 'Total Branches' : 'Total HQ Departments'}
                        </span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', margin: 0, borderRadius: '14px', borderBottom: '4px solid #10b981', transition: 'transform 0.15s ease', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', backgroundColor: '#e6f4ea', borderRadius: '12px', color: '#10b981', fontSize: '20px', flexShrink: 0 }}>
                        🖥️
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800', letterSpacing: '0.3px' }}>ប្រើប្រាស់ IP</span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '3px 0' }}>
                          {totalUsedIps.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>Used IP Addresses</span>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', margin: 0, borderRadius: '14px', borderBottom: '4px solid #f59e0b', transition: 'transform 0.15s ease', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', backgroundColor: '#fff7ed', borderRadius: '12px', color: '#f59e0b', fontSize: '20px', flexShrink: 0 }}>
                        📋
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800', letterSpacing: '0.3px' }}>នៅសល់ IP</span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '3px 0' }}>
                          {totalAvailableIps.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>Available IP Addresses</span>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', margin: 0, borderRadius: '14px', borderBottom: '4px solid #8b5cf6', transition: 'transform 0.15s ease', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', backgroundColor: '#faf5ff', borderRadius: '12px', color: '#8b5cf6', fontSize: '20px', flexShrink: 0 }}>
                        📊
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800', letterSpacing: '0.3px' }}>ការប្រើប្រាស់សរុប</span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '3px 0' }}>
                          {avgUtilization}%
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>IP Utilization</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar (Search, Status dropdown, Utilization dropdown, More filters button, Refresh, Add button) */}
                  <div className="panel" style={{ padding: '14px 20px', marginBottom: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1 }}>
                      {/* Search */}
                      <div className="search-container" style={{ flexGrow: 1, maxWidth: '280px', margin: 0 }}>
                        <span className="search-icon-left">🔍</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search branch, network, IP..."
                          value={ipamSearchQuery}
                          onChange={(e) => setIpamSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Status Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>Status:</span>
                        <select
                          className="form-input"
                          style={{ width: '100px', padding: '6px 10px', height: '36px', fontSize: '12px', fontWeight: '800', border: '1.5px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', margin: 0 }}
                          value={ipamStatusFilter}
                          onChange={(e) => setIpamStatusFilter(e.target.value)}
                        >
                          <option value="all">ទាំងអស់</option>
                          <option value="online">សកម្ម</option>
                          <option value="warning">ជិតពេញ</option>
                          <option value="offline">មិនទាន់ប្រើ</option>
                        </select>
                      </div>

                      {/* Utilization Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>Utilization:</span>
                        <select
                          className="form-input"
                          style={{ width: '110px', padding: '6px 10px', height: '36px', fontSize: '12px', fontWeight: '800', border: '1.5px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', margin: 0 }}
                          value={ipamUtilFilter}
                          onChange={(e) => setIpamUtilFilter(e.target.value)}
                        >
                          <option value="all">ទាំងអស់</option>
                          <option value="high">ខ្ពស់ (&gt;90%)</option>
                          <option value="normal">ធម្មតា</option>
                          <option value="unused">មិនទាន់ប្រើ (0%)</option>
                        </select>
                      </div>

                      {/* More Filters */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setIpamShowFilters(!ipamShowFilters)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          padding: '8px 12px',
                          height: '36px',
                          fontWeight: '800',
                          margin: 0,
                          backgroundColor: ipamShowFilters ? '#eff6ff' : '',
                          borderColor: ipamShowFilters ? '#2563eb' : '',
                          color: ipamShowFilters ? '#2563eb' : ''
                        }}
                      >
                        🎛️ More Filters
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <button className="btn btn-secondary" onClick={triggerRefresh} title="Refresh" style={{ padding: '8px 12px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', margin: 0 }}>
                        🔄
                      </button>
                      {hasPermission('ipam', 'write') && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (ipamCategory === 'branches') {
                              setEditingData({ name_kh: '', name_en: '', subnet: '', mask: '255.255.255.0', gateway: '', no_computer: 0, user_name: '', position: '' });
                              setEditingModal('branch_add');
                            } else {
                              setEditingData({ name_en: '', vlan_id: '', subnet: '', mask: '255.255.255.0', gateway: '', gw_device: '', no_computer: 0, user_name_kh: '', user_name_en: '', position: '' });
                              setEditingModal('hq_add');
                            }
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', height: '36px', fontSize: '11px', fontWeight: '800', margin: 0 }}
                        >
                          {ipamCategory === 'branches' ? '➕ Add Branch' : '➕ Add HQ Dept'}
                        </button>
                      )}
                    </div>
                  </div>

                  {ipamShowFilters && (
                    <div className="panel fade-in" style={{ padding: '16px 20px', marginBottom: '24px', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>Subnet Search:</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 192.168.1"
                          style={{ width: '150px', padding: '6px 10px', height: '34px', fontSize: '11px', margin: 0 }}
                          value={ipamSubnetFilter}
                          onChange={(e) => setIpamSubnetFilter(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>Gateway Search:</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 192.168.1.1"
                          style={{ width: '150px', padding: '6px 10px', height: '34px', fontSize: '11px', margin: 0 }}
                          value={ipamGatewayFilter}
                          onChange={(e) => setIpamGatewayFilter(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ height: '34px', fontSize: '11px', padding: '0 12px', margin: 0 }}
                        onClick={() => {
                          setIpamSearchQuery('');
                          setIpamStatusFilter('all');
                          setIpamUtilFilter('all');
                          setIpamSubnetFilter('');
                          setIpamGatewayFilter('');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}

                  {/* Section Title, View Toggles & Sorter */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {ipamCategory === 'branches' ? 'List of NSSF Branches Subnets' : 'List of HQ Departments Subnets'}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* View Mode Toggle Toggles */}
                      <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => setIpamViewMode('grid')}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: ipamViewMode === 'grid' ? '#fff' : 'transparent',
                            color: ipamViewMode === 'grid' ? '#0b45b5' : 'var(--text-secondary)',
                            boxShadow: ipamViewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
                          }}
                        >
                          Grid View
                        </button>
                        <button
                          onClick={() => setIpamViewMode('table')}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: ipamViewMode === 'table' ? '#fff' : 'transparent',
                            color: ipamViewMode === 'table' ? '#0b45b5' : 'var(--text-secondary)',
                            boxShadow: ipamViewMode === 'table' ? 'var(--shadow-sm)' : 'none'
                          }}
                        >
                          Table View
                        </button>
                      </div>

                      {/* Sort Dropdown */}
                      <select
                        className="form-input"
                        style={{ width: '180px', padding: '6px 10px', height: '34px', fontSize: '11px', fontWeight: '800', margin: 0 }}
                        value={ipamSortOrder}
                        onChange={(e) => setIpamSortOrder(e.target.value)}
                      >
                        <option value="name-asc">Sort by: Name (A-Z)</option>
                        <option value="name-desc">Sort by: Name (Z-A)</option>
                        <option value="pct-desc">Sort by: Utilization (High-Low)</option>
                      </select>
                    </div>
                  </div>

                  {/* Main Subnets Rendering */}
                  {ipamViewMode === 'grid' ? (
                    /* Redesigned Grid view (4 columns) */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="fade-in">
                      {filteredSubnets.map((item, idx) => {
                        const pct = Math.round((item.used_ips / item.total_ips) * 100);
                        let statusText = 'សកម្ម';
                        let statusColor = '#10b981'; // green
                        if (item.used_ips === 0) {
                          statusText = 'មិនទាន់ប្រើ';
                          statusColor = '#94a3b8'; // grey
                        } else if (pct >= 99) {
                          statusText = 'ជិតពេញ';
                          statusColor = '#f59e0b'; // orange
                        }

                        return (
                          <div 
                            key={item.id} 
                            style={{
                              backgroundColor: '#fff',
                              border: '1.5px solid var(--border-color)',
                              borderBottom: `4.5px solid ${statusColor}`,
                              borderRadius: '12px',
                              padding: '16px',
                              boxShadow: 'var(--shadow-sm)',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: '140px'
                            }}
                            className="subnet-grid-card"
                            onClick={() => {
                              if (ipamCategory === 'branches') {
                                fetchBranchDetails(item.id);
                              } else {
                                fetchDeptDetails(item.id);
                              }
                            }}
                          >
                            <div>
                              {/* Title line */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#0b45b5', fontSize: '10px', fontWeight: '800' }}>
                                    {item.no || (idx + 1)}
                                  </span>
                                  <span style={{ fontWeight: '800', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                                    {ipamCategory === 'branches' ? `${item.name_kh} (${item.name_en})` : `${item.name_en}${item.sheet_name ? ` (${item.sheet_name})` : ''}`}
                                  </span>
                                </div>
                                <span style={{ 
                                  fontSize: '9px', 
                                  fontWeight: '800', 
                                  padding: '1px 6px', 
                                  borderRadius: '10px', 
                                  backgroundColor: statusText === 'សកម្ម' ? '#e6f4ea' : statusText === 'ជិតពេញ' ? '#fef3c7' : '#f1f5f9',
                                  color: statusText === 'សកម្ម' ? '#137333' : statusText === 'ជិតពេញ' ? '#b06000' : '#475569'
                                }}>
                                  {statusText}
                                </span>
                              </div>

                              {/* IP Subnet / GW details */}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontFamily: 'var(--font-mono)' }}>{item.subnet}/24</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10.5px' }}>
                                  <span>GW: {item.gateway}</span>
                                  <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                                    ប្រើ: {item.used_ips} | សល់: {item.total_ips - item.used_ips}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Progress */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                              <div style={{ flex: 1, height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginRight: '8px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: statusColor, borderRadius: '2px' }}></div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: statusColor }}>{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Table/List View (the original 2-column layout) */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="fade-in">
                      {filteredSubnets.map((b) => {
                        const pct = Math.round((b.used_ips / b.total_ips) * 100);
                        return (
                          <div 
                            key={b.id} 
                            className="subnet-row" 
                            onClick={() => {
                              if (ipamCategory === 'branches') {
                                fetchBranchDetails(b.id);
                              } else {
                                fetchDeptDetails(b.id);
                              }
                            }}
                          >
                            <div className="subnet-info-top">
                              <span>{b.no || b.id}. {ipamCategory === 'branches' ? `${b.name_kh} (${b.name_en})` : `${b.name_en}${b.sheet_name ? ` (${b.sheet_name})` : ''} (VLAN ${b.vlan_id})`}</span>
                              <span style={{ fontWeight: '800' }}>
                                ប្រើអស់: {b.used_ips} | នៅសល់: {b.total_ips - b.used_ips} ({pct}%)
                              </span>
                            </div>
                            <div className="subnet-address-bar">{b.subnet} - GW: {b.gateway}</div>
                            <div className="utilization-bar-container">
                              <div className="utilization-bar" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? 'var(--color-danger)' : pct > 50 ? 'var(--color-using)' : 'var(--color-available)' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredSubnets.length === 0 && (
                    <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '12px' }}>
                      No subnets found matching the selected filters.
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
        {activeTab === 'vpn' && (() => {
          const activeVpnUsers = getFilteredVpnUsers();

          // Helper to categorize each VPN user
          const getVpnUserCategory = (user) => {
            const name = (user.name || '').toLowerCase();
            const username = (user.username || '').toLowerCase();
            const pos = (user.position || '');
            const dept = (user.department || '').toLowerCase();
            
            // 1. Hospital category
            if (name.includes('nssf\\hc-') || name.includes('nssf\\ph-') || name.includes('nssf\\calmet') || 
                username.includes('hc-') || username.includes('ph-') || username.includes('calmet') ||
                pos.includes('មណ្ឌលសុខភាព') || pos.includes('មន្ទីរពេទ្យ')) {
              return 'hospital';
            }
            
            // 2. Leader category
            if (pos.includes('អគ្គនាយក') || pos.includes('អគ្គនាយករង') || pos.includes('ប្រធានសាខា') || pos.includes('ថ្នាក់ដឹកនាំ') || 
                dept.includes('director general') || dept.includes('deputy director general')) {
              return 'leader';
            }
            
            // 3. Department category
            return 'department';
          };

          // Green double-line active badge & gray inactive badge
          const getStatusBadge = (status) => {
            if (!status || status.includes('ផ្អាក') || status.toLowerCase().includes('inactive')) {
              return (
                <span className="status-badge badge-inactive" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase' }}>
                  INACTIVE
                </span>
              );
            }
            return (
              <span className="status-badge" style={{ backgroundColor: '#d1fae5', color: '#065f46', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '3px 8px', borderRadius: '4px', lineHeight: '1.2', fontWeight: '800', fontSize: '9px' }}>
                <span>កំពុង</span>
                <span>ប្រើប្រាស់</span>
              </span>
            );
          };

          // Password visibility toggler helper
          const togglePasswordVisibility = (userId) => {
            setVisiblePasswords(prev => ({
              ...prev,
              [userId]: !prev[userId]
            }));
          };

          // Render individual row
          const renderUserRow = (user, index) => {
            let displayName = user.name || '-';
            let displayUsername = user.username || '-';
            
            // Format hospital names dynamically
            if (user.name && user.name.includes(' - ')) {
              const parts = user.name.split(' - ');
              displayName = parts[0];
              displayUsername = parts[1];
            }

            return (
              <tr key={user.id}>
                <td>{index}</td>
                <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{displayUsername}</td>
                <td style={{ fontWeight: '700', color: '#2563eb' }}>{displayName}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: visiblePasswords[user.id] ? 'normal' : '1px' }}>
                      {visiblePasswords[user.id] ? (user.password || '-') : '••••••••'}
                    </span>
                    {user.password && (
                      <button 
                        onClick={() => togglePasswordVisibility(user.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}
                        title={visiblePasswords[user.id] ? "Hide password" : "Show password"}
                      >
                        {visiblePasswords[user.id] ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td>{user.vpn_type || '-'}</td>
                <td style={{ textAlign: 'center' }}>{getStatusBadge(user.status)}</td>
                <td>{user.purpose || '-'}</td>
                <td>{user.other || '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid rgba(37, 99, 235, 0.1)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }} onClick={() => handleIPEditClick(user, 'vpn_user')}>
                      📝 Edit
                    </button>
                    <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', padding: '0 4px', fontWeight: '800' }}>⋮</span>
                  </div>
                </td>
              </tr>
            );
          };

          // Render segmented groups matching Excel layout
          const renderGroups = () => {
            const rows = [];
            let globalIndex = 1;

            // 1. ថ្នាក់ដឹកនាំ Group
            if (vpnCategory === 'all' || vpnCategory === 'leader') {
              const items = activeVpnUsers.filter(u => getVpnUserCategory(u) === 'leader');
              if (items.length > 0) {
                rows.push(
                  <tr key="sec-leader" style={{ backgroundColor: '#eff6ff' }}>
                    <td colSpan="9" style={{ padding: '10px 16px', fontWeight: '800', fontSize: '11px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe', backgroundColor: '#eff6ff', letterSpacing: '0.3px' }}>
                      📂 ថ្នាក់ដឹកនាំ
                    </td>
                  </tr>
                );
                items.forEach(user => {
                  rows.push(renderUserRow(user, globalIndex++));
                });
              }
            }

            // 2. Department Sections
            if (vpnCategory === 'all' || vpnCategory === 'department') {
              const deptSections = [
                { id: 'bp', title: 'នាយកដ្ឋាន ប.ព', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept.includes('it') || dept.includes('head of it') || dept.includes('it sec') || dept.includes('it dev') || dept.includes('it mtn'));
                  }
                },
                { id: 'bf', title: 'នាយកដ្ឋាន ប.ភ', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'reg');
                  }
                },
                { id: 'tl', title: 'នាយកដ្ឋាន ត.ល', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'ben');
                  }
                },
                { id: 'thk', title: 'នាយកដ្ឋាន ថ.ហ.គ', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'account' || dept === 'finance' || dept === 'act');
                  }
                },
                { id: 'as', title: 'នាយកដ្ឋាន អ.ស', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'insp' || dept === 'audit');
                  }
                },
                { id: 'knb', title: 'នាយកដ្ឋាន គ.ន.ប', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'policy');
                  }
                },
                { id: 'ddg', title: 'ក្រុមជំនាញការអគ្គនាយករង', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'mlvt');
                  }
                },
                { id: 'company', title: 'ក្រុមហ៊ុន', filter: (u) => {
                    const dept = (u.department || '').toLowerCase().trim();
                    return getVpnUserCategory(u) === 'department' && (dept === 'optistech');
                  }
                },
                { id: 'others', title: 'នាយកដ្ឋានផ្សេងៗ', filter: (u) => {
                    if (getVpnUserCategory(u) !== 'department') return false;
                    const dept = (u.department || '').toLowerCase().trim();
                    const matchesKnown = 
                      (dept.includes('it') || dept.includes('head of it') || dept.includes('it sec') || dept.includes('it dev') || dept.includes('it mtn')) ||
                      (dept === 'reg') ||
                      (dept === 'ben') ||
                      (dept === 'account' || dept === 'finance' || dept === 'act') ||
                      (dept === 'insp' || dept === 'audit') ||
                      (dept === 'policy') ||
                      (dept === 'mlvt') ||
                      (dept === 'optistech');
                    return !matchesKnown;
                  }
                }
              ];

              deptSections.forEach(section => {
                const sectionItems = activeVpnUsers.filter(section.filter);
                if (sectionItems.length > 0) {
                  rows.push(
                    <tr key={`sec-${section.id}`} style={{ backgroundColor: '#eff6ff' }}>
                      <td colSpan="9" style={{ padding: '10px 16px', fontWeight: '800', fontSize: '11px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe', backgroundColor: '#eff6ff', letterSpacing: '0.3px' }}>
                        📂 {section.title}
                      </td>
                    </tr>
                  );
                  sectionItems.forEach(user => {
                    rows.push(renderUserRow(user, globalIndex++));
                  });
                }
              });
            }

            // 3. មន្ទីរពេទ្យ Group
            if (vpnCategory === 'all' || vpnCategory === 'hospital') {
              const items = activeVpnUsers.filter(u => getVpnUserCategory(u) === 'hospital');
              if (items.length > 0) {
                rows.push(
                  <tr key="sec-hospital" style={{ backgroundColor: '#eff6ff' }}>
                    <td colSpan="9" style={{ padding: '10px 16px', fontWeight: '800', fontSize: '11px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe', backgroundColor: '#eff6ff', letterSpacing: '0.3px' }}>
                      📂 មន្ទីរពេទ្យ
                    </td>
                  </tr>
                );
                items.forEach(user => {
                  rows.push(renderUserRow(user, globalIndex++));
                });
              }
            }

            return rows;
          };

          return (
            <div className="panel">
              <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0', flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="panel-title" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>NSSF VPN Remote Access Accounts</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasPermission('vpn_remote', 'write') && (
                      <button 
                        className="btn btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        onClick={() => {
                          setEditingModal('vpn_user_add');
                          setEditingData({
                            name: '',
                            position: '',
                            username: '',
                            password: '',
                            department: '',
                            company: '',
                            status: 'active',
                            purpose: '',
                            vpn_type: '',
                            other: ''
                          });
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: '800' }}>➕</span> ចុះឈ្មោះអ្នកប្រើប្រាស់
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#fff', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      onClick={() => handleExportCSV(activeVpnUsers)}
                      title="Export filtered accounts to CSV"
                    >
                      📄 CSV
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#fff', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      onClick={() => setShowPrintModal(true)}
                      title="Export filtered accounts to PDF"
                    >
                      📕 PDF
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        border: '1px solid ' + (showVpnFilter ? '#2563eb' : 'var(--border-color)'), 
                        borderRadius: '6px', 
                        padding: '8px 14px', 
                        backgroundColor: showVpnFilter ? '#eff6ff' : '#fff', 
                        color: showVpnFilter ? '#2563eb' : 'var(--text-secondary)', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        cursor: 'pointer' 
                      }}
                      onClick={() => setShowVpnFilter(!showVpnFilter)}
                    >
                      🔍 Filter
                    </button>
                  </div>
                </div>

                {showVpnFilter && (
                  <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc', alignItems: 'center', borderRadius: '6px', marginTop: '8px' }}>
                    <div className="subnet-inner-search" style={{ margin: 0, flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span className="subnet-inner-search-icon" style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }}>🔍</span>
                      <input
                        type="text"
                        placeholder="Filter by Username, Employee name, VPN Type, Purpose, Status, Position..."
                        value={vpnSearch}
                        onChange={(e) => setVpnSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px 8px 34px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', backgroundColor: '#fff' }}
                      />
                    </div>
                    {vpnSearch && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setVpnSearch('')}
                        style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontWeight: '700' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Categories Tab Selector (បែងចែកមានពេទ្យ នាយកដ្ឋាន និងថ្នាក់ដឹកនាំ) */}
                <div className="status-filters" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <button 
                    className={`filter-btn ${vpnCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setVpnCategory('all')}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: vpnCategory === 'all' ? '#2563eb' : '#fff', color: vpnCategory === 'all' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    បង្ហាញទាំងអស់ (All)
                    <span className="filter-badge" style={{ backgroundColor: vpnCategory === 'all' ? '#fff' : '#f1f5f9', color: vpnCategory === 'all' ? '#2563eb' : 'var(--text-primary)' }}>
                      {activeVpnUsers.length}
                    </span>
                  </button>
                  <button 
                    className={`filter-btn ${vpnCategory === 'leader' ? 'active' : ''}`}
                    onClick={() => setVpnCategory('leader')}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: vpnCategory === 'leader' ? '#2563eb' : '#fff', color: vpnCategory === 'leader' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    👑 ថ្នាក់ដឹកនាំ (Leaders)
                    <span className="filter-badge" style={{ backgroundColor: vpnCategory === 'leader' ? '#fff' : '#f1f5f9', color: vpnCategory === 'leader' ? '#2563eb' : 'var(--text-primary)' }}>
                      {activeVpnUsers.filter(u => getVpnUserCategory(u) === 'leader').length}
                    </span>
                  </button>
                  <button 
                    className={`filter-btn ${vpnCategory === 'department' ? 'active' : ''}`}
                    onClick={() => setVpnCategory('department')}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: vpnCategory === 'department' ? '#2563eb' : '#fff', color: vpnCategory === 'department' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    🏢 នាយកដ្ឋាន (Departments)
                    <span className="filter-badge" style={{ backgroundColor: vpnCategory === 'department' ? '#fff' : '#f1f5f9', color: vpnCategory === 'department' ? '#2563eb' : 'var(--text-primary)' }}>
                      {activeVpnUsers.filter(u => getVpnUserCategory(u) === 'department').length}
                    </span>
                  </button>
                  <button 
                    className={`filter-btn ${vpnCategory === 'hospital' ? 'active' : ''}`}
                    onClick={() => setVpnCategory('hospital')}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: vpnCategory === 'hospital' ? '#2563eb' : '#fff', color: vpnCategory === 'hospital' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    🏥 មន្ទីរពេទ្យ (Hospitals)
                    <span className="filter-badge" style={{ backgroundColor: vpnCategory === 'hospital' ? '#fff' : '#f1f5f9', color: vpnCategory === 'hospital' ? '#2563eb' : 'var(--text-primary)' }}>
                      {activeVpnUsers.filter(u => getVpnUserCategory(u) === 'hospital').length}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="data-table-container" style={{ marginTop: '4px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>No.</th>
                      <th>VPN Username (ឈ្មោះអ្នកប្រើប្រាស់)</th>
                      <th>ឈ្មោះបុគ្គលិក / អង្គភាព</th>
                      <th>VPN Password</th>
                      <th>VPN Type</th>
                      <th style={{ textAlign: 'center' }}>ស្ថានភាព</th>
                      <th>គោលបំណង</th>
                      <th>ផ្សេងៗ</th>
                      <th style={{ width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderGroups()}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Private Hospital VPNs Tab (WITH CLEAR OPEN/CLOSED STATUS FILTERING) */}
        {activeTab === 's2s' && (
          <>
            {/* Quick Metrics & Overview Dashboard for Hospitals */}
            <div className="dashboard-grid" style={{ marginBottom: '8px' }}>
              <div className="stat-card stat-card-green">
                <div className="stat-icon">🛡️</div>
                <div className="stat-info">
                  <span className="stat-value">{openHospitals.length}</span>
                  <span className="stat-label">មន្ទីរពេទ្យដែលបើក (Open VPNs)</span>
                  <span className="stat-sublabel">ACTIVE CONNECTIONS</span>
                </div>
              </div>
              
              <div className="stat-card stat-card-red">
                <div className="stat-icon">🔒</div>
                <div className="stat-info">
                  <span className="stat-value">{closedHospitals.length}</span>
                  <span className="stat-label">មន្ទីរពេទ្យដែលបិទ (Closed VPNs)</span>
                  <span className="stat-sublabel">CLOSED CONNECTIONS</span>
                </div>
              </div>

              <div className="stat-card stat-card-purple">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <span className="stat-value">{reopenHospitals.length}</span>
                  <span className="stat-label">សហមេត្រី (Reopen Requests)</span>
                  <span className="stat-sublabel">PENDING REQUESTS</span>
                </div>
              </div>
              
              <div className="stat-card stat-card-blue">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <span className="stat-value">{openHospitals.length + closedHospitals.length + reopenHospitals.length}</span>
                  <span className="stat-label">មន្ទីរពេទ្យសរុប (Total Hospitals)</span>
                  <span className="stat-sublabel">TOTAL HOSPITALS</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                <span className="panel-title">
                  🛡️ Private Hospital & Partner VPN Tunnel Status
                </span>
                
                <div className="panel-actions">
                  {/* Active/Closed/Reopen Filters */}
                  <div className="status-filters">
                    <button 
                      className={`filter-btn filter-btn-all ${hospitalFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setHospitalFilter('all')}
                    >
                      ទាំងអស់ (All) <span className="filter-badge">{openHospitals.length + closedHospitals.length + reopenHospitals.length}</span>
                    </button>
                    <button 
                      className={`filter-btn filter-btn-open ${hospitalFilter === 'open' ? 'active' : ''}`}
                      onClick={() => setHospitalFilter('open')}
                    >
                      បើក (Open) <span className="filter-badge">{openHospitals.length}</span>
                    </button>
                    <button 
                      className={`filter-btn filter-btn-closed ${hospitalFilter === 'closed' ? 'active' : ''}`}
                      onClick={() => setHospitalFilter('closed')}
                    >
                      បិទ (Closed) <span className="filter-badge">{closedHospitals.length}</span>
                    </button>
                    <button 
                      className={`filter-btn filter-btn-reopen ${hospitalFilter === 'reopen' ? 'active' : ''}`}
                      onClick={() => setHospitalFilter('reopen')}
                    >
                      សុំបើកវិញ (Reopen Requests) <span className="filter-badge">{reopenHospitals.length}</span>
                    </button>
                  </div>

                  <div className="layout-toggle-container">
                    <button
                      className={`layout-toggle-btn ${hospitalViewMode === 'grid' ? 'active' : ''}`}
                      title="Grid View"
                      onClick={() => setHospitalViewMode('grid')}
                    >
                      🔳
                    </button>
                    <button
                      className={`layout-toggle-btn ${hospitalViewMode === 'table' ? 'active' : ''}`}
                      title="List View"
                      onClick={() => setHospitalViewMode('table')}
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              {hospitalViewMode === 'grid' ? (
                <div className="vpn-card-grid">
                  {getFilteredHospitals().map((vpn) => {
                    const isPskVisible = showPskMap[vpn.id] || false;
                    const togglePsk = () => {
                      setShowPskMap({ ...showPskMap, [vpn.id]: !isPskVisible });
                    };

                    const isOpen = vpn.vpn_type === 'S2S' || vpn.vpn_type === 'Bank';
                    const isReopen = vpn.reopen_requested === 1;

                    let borderLeftStyle = '4px solid var(--color-using)';
                    if (isOpen) {
                      borderLeftStyle = '4px solid var(--color-available)';
                    } else if (isReopen) {
                      borderLeftStyle = '4px solid var(--color-vpn)';
                    }

                    return (
                      <div 
                        key={vpn.id} 
                        className="vpn-card" 
                        style={{ 
                          borderLeft: borderLeftStyle
                        }}
                      >
                        <div className="vpn-card-header">
                          <div className="vpn-card-header-left">
                            <div className="vpn-card-header-icon" style={{ backgroundColor: isOpen ? 'var(--color-available-glow)' : isReopen ? 'var(--color-vpn-glow)' : 'var(--color-using-glow)', color: isOpen ? 'var(--color-available)' : isReopen ? 'var(--color-vpn)' : 'var(--color-using)' }}>
                              🏢
                            </div>
                            <div className="vpn-card-title" title={vpn.name}>
                              {vpn.name}
                            </div>
                          </div>
                          {isReopen ? (
                            <span className="status-badge badge-reopen">
                              🔄 ស្នើសុំបើកវិញ
                            </span>
                          ) : (
                            <span className={`status-badge ${isOpen ? 'badge-active' : 'badge-inactive'}`}>
                              {isOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                          )}
                        </div>

                        <div className="vpn-card-body">
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">Category</span>
                            <span className="vpn-param-value" style={{ color: isOpen ? 'var(--color-available)' : isReopen ? 'var(--color-vpn)' : 'var(--color-using)' }}>
                              {vpn.vpn_type === 'S2S' ? 'Hospital S2S' : 'Closed Hospital'}
                            </span>
                          </div>
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">ISP</span>
                            <span className="vpn-param-value">{vpn.isp || 'ONLINE'}</span>
                          </div>
                          
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">Public IP</span>
                            <span className="vpn-param-value vpn-param-value-mono">{vpn.public_ip || 'N/A'}</span>
                          </div>
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">LAN IP Address</span>
                            <span className="vpn-param-value vpn-param-value-mono">{vpn.lan_ip || 'N/A'}</span>
                          </div>
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">Tunnel ID</span>
                            <span className="vpn-param-value">{vpn.tunnel ? `Tunnel_${vpn.tunnel}` : 'N/A'}</span>
                          </div>
                          <div className="vpn-param-block">
                            <span className="vpn-param-label">Year Configured</span>
                            <span className="vpn-param-value">{vpn.year || 'N/A'}</span>
                          </div>
                          
                          {vpn.address && (
                            <div className="vpn-param-block" style={{ gridColumn: 'span 2' }}>
                              <span className="vpn-param-label">Address</span>
                              <span className="vpn-param-value" style={{ fontSize: '10px' }}>{vpn.address}</span>
                            </div>
                          )}

                          {vpn.ikey && (
                            <div className="psk-container">
                              <span className="psk-text">
                                PSK: {isPskVisible ? vpn.ikey : '••••••••••••••••'}
                              </span>
                              <button className="btn-toggle-psk" onClick={togglePsk}>
                                {isPskVisible ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          )}
                          
                          {vpn.reference_doc && (() => {
                            const matchedFile = driveFiles.find(f => f.name === vpn.reference_doc);
                            return (
                              <div 
                                className="ref-doc-box" 
                                style={{ cursor: matchedFile ? 'pointer' : 'default' }} 
                                onClick={matchedFile ? () => setPreviewFile({ name: matchedFile.name, url: matchedFile.webViewLink, mimeType: matchedFile.mimeType }) : undefined}
                              >
                                <span className="ref-doc-label">📂 ឯកសារយោង (Reference Document)</span>
                                <span className="ref-doc-value" style={{ color: matchedFile ? '#2563eb' : 'inherit', textDecoration: matchedFile ? 'underline' : 'none', fontWeight: matchedFile ? '700' : 'normal' }}>
                                  {vpn.reference_doc} {matchedFile && '👁️ (មើល)'}
                                </span>
                              </div>
                            );
                          })()}
                          
                          {vpn.contact && (
                            <div className="contact-row" style={{ gridColumn: 'span 2' }}>
                              Contact: {vpn.contact}
                            </div>
                          )}
                        </div>
                        
                        <button className="btn-edit-parameters" onClick={() => handleIPEditClick(vpn, 's2s_vpn')}>
                          ⚙️ Edit Parameters
                        </button>
                      </div>
                    );
                  })}
                  {getFilteredHospitals().length === 0 && (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                      No Hospital VPN tunnels found matching the filter.
                    </div>
                  )}
                </div>
              ) : (
                <div className="data-table-container" style={{ marginTop: '16px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ល.រ</th>
                        <th>ឈ្មោះមន្ទីរពេទ្យ (Hospital Name)</th>
                        <th>ប្រភេទ (Category)</th>
                        <th>ISP</th>
                        <th>IP Address Public</th>
                        <th>IP Address Private (LAN)</th>
                        <th>Pre-Share Key (IKEY)</th>
                        <th>Tunnel ID</th>
                        <th>Year</th>
                        <th>ឯកសារយោង (Ref)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredHospitals().map((vpn, idx) => {
                        const isPskVisible = showPskMap[vpn.id] || false;
                        const togglePsk = () => {
                          setShowPskMap({ ...showPskMap, [vpn.id]: !isPskVisible });
                        };
                        const isOpen = vpn.vpn_type === 'S2S' || vpn.vpn_type === 'Bank';
                        const isReopen = vpn.reopen_requested === 1;

                        return (
                          <tr key={vpn.id}>
                            <td>{vpn.no || idx + 1}</td>
                            <td style={{ fontWeight: '600' }}>{vpn.name}</td>
                            <td>
                              {isReopen ? (
                                <span className="status-badge badge-reopen" style={{ display: 'inline-block' }}>
                                  🔄 ស្នើសុំបើកវិញ
                                </span>
                              ) : (
                                <span className={`status-badge ${isOpen ? 'badge-active' : 'badge-inactive'}`} style={{ display: 'inline-block' }}>
                                  {isOpen ? 'OPEN' : 'CLOSED'}
                                </span>
                              )}
                            </td>
                            <td>{vpn.isp || 'ONLINE'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{vpn.public_ip || 'N/A'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{vpn.lan_ip || 'N/A'}</td>
                            <td>
                              {vpn.ikey ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)' }}>{isPskVisible ? vpn.ikey : '••••••••••••'}</span>
                                  <button 
                                    onClick={togglePsk}
                                    style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '10px', fontWeight: '800', padding: 0 }}
                                  >
                                    {isPskVisible ? 'Hide' : 'Show'}
                                  </button>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td>{vpn.tunnel ? `Tunnel_${vpn.tunnel}` : 'N/A'}</td>
                            <td>{vpn.year || 'N/A'}</td>
                            <td>
                              {vpn.reference_doc ? (() => {
                                const matchedFile = driveFiles.find(f => f.name === vpn.reference_doc);
                                return matchedFile ? (
                                  <span 
                                    onClick={() => setPreviewFile({ name: matchedFile.name, url: matchedFile.webViewLink, mimeType: matchedFile.mimeType })}
                                    style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title={`បើកមើល៖ ${vpn.reference_doc}`}
                                  >
                                    📄 យោង 👁️
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} title={vpn.reference_doc}>
                                    {vpn.reference_doc.length > 15 ? vpn.reference_doc.substring(0, 15) + '...' : vpn.reference_doc}
                                  </span>
                                );
                              })() : 'N/A'}
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '10px', height: '24px', fontWeight: '800', margin: 0 }}
                                onClick={() => handleIPEditClick(vpn, 's2s_vpn')}
                              >
                                ⚙️ Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {getFilteredHospitals().length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                            No Hospital VPN tunnels found matching the filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Bank VPNs Tab */}
        {activeTab === 'banks' && (
          <div className="panel">
            <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <span className="panel-title">🏦 NSSF Partner Bank S2S VPN Links</span>
              <div className="subnet-inner-search">
                <span className="subnet-inner-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search bank name, IP..."
                  value={subnetSearch}
                  onChange={(e) => setSubnetSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="data-table-container" style={{ marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ល.រ</th>
                    <th>ឈ្មោះធនាគារ (Bank Name)</th>
                    <th>IP Address Public</th>
                    <th>IP Address Private (PRO)</th>
                    <th>Pre-Share Key (IKEY)</th>
                    <th>IKE Version</th>
                    <th>Device</th>
                    <th>ផ្សេងៗ / Date Config</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bankVpns
                    .filter(vpn => {
                      const q = subnetSearch.toLowerCase();
                      if (!q) return true;
                      const name = (vpn.name || '').toLowerCase();
                      const pub = (vpn.public_ip || '').toLowerCase();
                      const lan = (vpn.lan_ip || '').toLowerCase();
                      const dev = (vpn.device || '').toLowerCase();
                      return name.includes(q) || pub.includes(q) || lan.includes(q) || dev.includes(q);
                    })
                    .map((vpn) => {
                      const isPskVisible = showPskMap[vpn.id] || false;
                      const togglePsk = () => {
                        setShowPskMap({ ...showPskMap, [vpn.id]: !isPskVisible });
                      };
                      return (
                        <tr key={vpn.id}>
                          <td>{vpn.no}</td>
                          <td style={{ fontWeight: '600' }}>{vpn.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{vpn.public_ip || 'N/A'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{vpn.lan_ip || 'N/A'}</td>
                          <td>
                            {vpn.ikey ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{isPskVisible ? vpn.ikey : '••••••••••••'}</span>
                                <button className="btn-toggle-psk" onClick={togglePsk}>{isPskVisible ? 'Hide' : 'Show'}</button>
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <span className="status-badge badge-active">{vpn.status || 'IKEv2'}</span>
                          </td>
                          <td>{vpn.device || 'N/A'}</td>
                          <td>{vpn.other || 'N/A'}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleIPEditClick(vpn, 's2s_vpn')}>Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  {bankVpns.filter(vpn => {
                    const q = subnetSearch.toLowerCase();
                    if (!q) return true;
                    const name = (vpn.name || '').toLowerCase();
                    const pub = (vpn.public_ip || '').toLowerCase();
                    const lan = (vpn.lan_ip || '').toLowerCase();
                    return name.includes(q) || pub.includes(q) || lan.includes(q);
                  }).length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No partner bank VPN connections found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Public IP & DNS Tab */}
        {activeTab === 'public' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">🌐 NSSF Public IP Host Mappings (2025-2028)</span>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ល.រ</th>
                      <th>System/Host Name</th>
                      <th>OLD Public IP</th>
                      <th>NEW IP 6.0</th>
                      <th>NEW IP 7.0</th>
                      <th>DNS Name</th>
                      <th>Status</th>
                      <th>Firewall Allowed</th>
                      <th>Public DNS Changed</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicIPs.mappings && publicIPs.mappings.map((m) => (
                      <tr key={m.id}>
                        <td>{m.no}</td>
                        <td style={{ fontWeight: '600' }}>{m.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{m.old_ip}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{m.new_ip_6}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{m.new_ip_7}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{m.dns_name}</td>
                        <td>
                          <span className={`status-badge ${m.status === 'using' || m.status === 'Completed' ? 'badge-active' : 'badge-using'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td>{m.firewall_allowed}</td>
                        <td>{m.public_dns_changed}</td>
                        <td>{m.note} {m.note_other}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">🌐 External Systems Public DNS Mappings</span>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ISP</th>
                      <th>Private IP</th>
                      <th>Old IP Public</th>
                      <th>VLAN</th>
                      <th>IP Address (Public)</th>
                      <th>DNS Name</th>
                      <th>Port</th>
                      <th>Status</th>
                      <th>Note System For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicIPs.external && publicIPs.external.map((e) => (
                      <tr key={e.id}>
                        <td>{e.isp}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{e.ip_private}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{e.old_ip_public}</td>
                        <td>{e.vlan}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{e.ip_address}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{e.dns_name}</td>
                        <td>{e.port}</td>
                        <td>{e.status}</td>
                        <td>{e.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Switches Tab */}
        {activeTab === 'switches' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">🔌 Active Management Switches List</span>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ល.រ</th>
                    <th>ឈ្មោះខេត្ត-ខណ្ឌ / ទីកន្លែង</th>
                    <th>Management IP Address</th>
                    <th>Model Switch</th>
                    <th>Permission</th>
                    <th>ផ្សេងៗ</th>
                  </tr>
                </thead>
                <tbody>
                  {switches.map((sw) => (
                    <tr key={sw.id}>
                      <td>{sw.no}</td>
                      <td style={{ fontWeight: '600' }}>{sw.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{sw.ip_management}</td>
                      <td>{sw.model}</td>
                      <td>{sw.permission}</td>
                      <td>{sw.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Google Drive Storage Tab */}
        {activeTab === 'storage' && renderStorageTab()}

        {/* Leave Requests Tab */}
        {activeTab === 'leave' && renderLeaveTab()}

        {/* User Management Tab */}
        {activeTab === 'users' && hasPermission('user_management', 'read') && renderUsersTab()}
      </main>

      {/* 1. Branch IP Edit Modal */}
      {editingModal === 'branch_ip' && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave} style={{ maxWidth: '560px', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                  {editingData.isNew ? 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី' : 'Edit IP Mapping'} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>({editingData.isNew ? 'Add User to IP' : editingData.ip})</span>
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {editingData.isNew && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>វាយបញ្ចូលអាសយដ្ឋាន IP (Type IP Address Manual)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.ip || ''}
                      onChange={(e) => setEditingData({ ...editingData, ip: e.target.value.trim() })}
                      placeholder={`e.g. ${selectedBranch.subnet.split('.').slice(0,3).join('.')}.247`}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', width: '100%', fontWeight: '700', color: '#2563eb' }}
                    />
                    {(() => {
                      if (!editingData.ip) return null;
                      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
                      if (!ipPattern.test(editingData.ip)) {
                        return <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: '700', marginTop: '2px' }}>⚠️ ទម្រង់ IP មិនត្រឹមត្រូវឡើយ (Invalid IP format)</span>;
                      }
                      const matchedNode = selectedBranchData.find(node => node.ip === editingData.ip);
                      if (!matchedNode) {
                        return <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះមិនស្ថិតនៅក្នុង Subnet របស់សាខានេះទេ (IP outside this subnet)</span>;
                      }
                      if (matchedNode.device_type === 'Gateway') {
                        return <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះជា Gateway IP (Gateway IP)</span>;
                      }
                      if (matchedNode.status !== 'Available') {
                        const occupiedBy = matchedNode.user_name || matchedNode.user_name_kh || matchedNode.user_name_en || 'ឧបករណ៍ផ្សេងទៀត';
                        return <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះកំពុងប្រើប្រាស់ដោយ "{occupiedBy}" រួចហើយ</span>;
                      }
                      return <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>✅ អាសយដ្ឋាន IP នេះទំនេរ អាចប្រើប្រាស់បាន (IP is Available)</span>;
                    })()}
                  </div>
                </div>
              )}
              
              {/* Section 1: User Information */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px' }}>👤</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>ព័ត៌មានអ្នកប្រើប្រាស់ (User Information)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>ឈ្មោះ (Name)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.user_name || ''}
                      onChange={(e) => setEditingData({ ...editingData, user_name: e.target.value })}
                      placeholder="e.g. លោកស្រី សយ សុភា"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>តួនាទី (Position)</label>
                    <input
                      type="text"
                      list="positions-list"
                      className="form-input"
                      value={editingData.position || ''}
                      onChange={(e) => setEditingData({ ...editingData, position: e.target.value })}
                      placeholder="e.g. ប្រធានសាខា"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                    <datalist id="positions-list">
                      <option value="បុគ្គលិក" />
                      <option value="មន្ត្រី" />
                      <option value="បុគ្គលិកបច្ចេកទេស" />
                      <option value="អនុប្រធានការិយាល័យ" />
                      <option value="ប្រធានការិយាល័យ" />
                      <option value="អនុប្រធាននាយកដ្ឋាន" />
                      <option value="ប្រធាននាយកដ្ឋាន" />
                      <option value="ទីប្រឹក្សា" />
                      <option value="ជំនាញការ" />
                      <option value="ជំនួយការអគ្គនាយករង" />
                      <option value="ជំនួយការអគ្គនាយក" />
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Section 2: Network & Device Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px' }}>⚙️</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>ព័ត៌មានបណ្តាញ និងឧបករណ៍ (Network & Device)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>MAC Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.mac_address || ''}
                      onChange={(e) => setEditingData({ ...editingData, mac_address: e.target.value })}
                      placeholder="e.g. F4:8E:38:9E:B4:F7"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Device Type</label>
                    <select
                      className="form-input"
                      value={editingData.device_type || ''}
                      onChange={(e) => setEditingData({ ...editingData, device_type: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    >
                      <option value="">-- Choose Type --</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Printer">Printer</option>
                      <option value="Server">Server</option>
                      <option value="IP-Phone">IP-Phone</option>
                      <option value="Switch">Switch</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Status</label>
                    <select
                      className="form-input"
                      value={editingData.status || 'Using'}
                      onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    >
                      <option value="Using">Using</option>
                      <option value="Available">Available</option>
                      <option value="Broken">Broken</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Internet Permission</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.internet_permission || ''}
                      onChange={(e) => setEditingData({ ...editingData, internet_permission: e.target.value })}
                      placeholder="e.g. Allow"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Other (ផ្សេងៗ)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.other || ''}
                      onChange={(e) => setEditingData({ ...editingData, other: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingModal(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>❌ Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || (editingData.isNew && (!editingData.ip || !selectedBranchData.some(node => node.ip === editingData.ip)))} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                <span>✔️</span> {isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកព័ត៌មាន'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. HQ IP Edit Modal */}
      {editingModal === 'hq_ip' && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave} style={{ maxWidth: '560px', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                  {editingData.isNew ? 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី' : 'Edit HQ IP Mapping'} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>({editingData.isNew ? 'Add User to IP' : editingData.ip})</span>
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {editingData.isNew && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>វាយបញ្ចូលអាសយដ្ឋាន IP (Type IP Address Manual)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.ip || ''}
                      onChange={(e) => setEditingData({ ...editingData, ip: e.target.value.trim() })}
                      placeholder={`e.g. ${selectedDept.subnet.split('.').slice(0,3).join('.')}.247`}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', width: '100%', fontWeight: '700', color: '#2563eb' }}
                    />
                    {(() => {
                      if (!editingData.ip) return null;
                      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
                      if (!ipPattern.test(editingData.ip)) {
                        return <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: '700', marginTop: '2px' }}>⚠️ ទម្រង់ IP មិនត្រឹមត្រូវឡើយ (Invalid IP format)</span>;
                      }
                      const matchedNode = selectedDeptData.find(node => node.ip === editingData.ip);
                      if (!matchedNode) {
                        return <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះមិនស្ថិតនៅក្នុង Subnet របស់នាយកដ្ឋាននេះទេ (IP outside this subnet)</span>;
                      }
                      if (matchedNode.position === 'Gateway Router' || matchedNode.status === 'AVAILABLE' && matchedNode.device_type === 'Gateway') {
                        return <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះជា Gateway IP (Gateway IP)</span>;
                      }
                      if (matchedNode.status !== 'Available') {
                        const occupiedBy = matchedNode.user_name_kh || matchedNode.user_name_en || matchedNode.user_name || 'ឧបករណ៍ផ្សេងទៀត';
                        return <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700', marginTop: '2px' }}>⚠️ អាសយដ្ឋាន IP នេះកំពុងប្រើប្រាស់ដោយ "{occupiedBy}" រួចហើយ</span>;
                      }
                      return <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>✅ អាសយដ្ឋាន IP នេះទំនេរ អាចប្រើប្រាស់បាន (IP is Available)</span>;
                    })()}
                  </div>
                </div>
              )}
              
              {/* Section 1: User Information */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px' }}>👤</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>ព័ត៌មានអ្នកប្រើប្រាស់ (User Information)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>ឈ្មោះឡាតាំង (Latin Name)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.user_name_en || ''}
                      onChange={(e) => setEditingData({ ...editingData, user_name_en: e.target.value })}
                      placeholder="e.g. SO KENG"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>ឈ្មោះខ្មែរ (Khmer Name)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.user_name_kh || ''}
                      onChange={(e) => setEditingData({ ...editingData, user_name_kh: e.target.value })}
                      placeholder="e.g. សូ កេង"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>តួនាទី (Position)</label>
                    <input
                      type="text"
                      list="positions-list"
                      className="form-input"
                      value={editingData.position || ''}
                      onChange={(e) => setEditingData({ ...editingData, position: e.target.value })}
                      placeholder="e.g. បុគ្គលិក"
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Network & Device Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px' }}>⚙️</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>ព័ត៌មានបណ្តាញ និងឧបករណ៍ (Network & Device)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Old IP Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.old_ip || ''}
                      onChange={(e) => setEditingData({ ...editingData, old_ip: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Status</label>
                    <select
                      className="form-input"
                      value={editingData.status || 'USING'}
                      onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    >
                      <option value="USING">USING</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="DISABLE">DISABLE</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Group System</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.group_system || ''}
                      onChange={(e) => setEditingData({ ...editingData, group_system: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Internet Permission</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.internet_permission || ''}
                      onChange={(e) => setEditingData({ ...editingData, internet_permission: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>Other (ផ្សេងៗ)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingData.other || ''}
                      onChange={(e) => setEditingData({ ...editingData, other: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingModal(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>❌ Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || (editingData.isNew && (!editingData.ip || !selectedDeptData.some(node => node.ip === editingData.ip)))} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                <span>✔️</span> {isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកព័ត៌មាន'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. VPN Remote User Edit / Add Modal */}
      {(editingModal === 'vpn_user' || editingModal === 'vpn_user_add') && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave}>
            <div className="modal-header">
              <div className="modal-title">
                {editingModal === 'vpn_user_add' ? 'ចុះឈ្មោះអ្នកប្រើប្រាស់ (Add New VPN User)' : `Edit VPN User: ${editingData.username || editingData.name}`}
              </div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name (ឈ្មោះពេញ)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.name || ''}
                  onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Position (ឋានៈ)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.position || ''}
                  onChange={(e) => setEditingData({ ...editingData, position: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username (ឈ្មោះអ្នកប្រើប្រាស់)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.username || ''}
                  onChange={(e) => setEditingData({ ...editingData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.password || ''}
                  onChange={(e) => setEditingData({ ...editingData, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.department || ''}
                  onChange={(e) => setEditingData({ ...editingData, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company / Partner</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.company || ''}
                  onChange={(e) => setEditingData({ ...editingData, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={editingData.status || 'inactive'}
                  onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.purpose || ''}
                  onChange={(e) => setEditingData({ ...editingData, purpose: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">VPN Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.vpn_type || ''}
                  onChange={(e) => setEditingData({ ...editingData, vpn_type: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'កំពុងរក្សាទុក...' : (editingModal === 'vpn_user_add' ? 'ចុះឈ្មោះអ្នកប្រើប្រាស់' : 'រក្សាទុកព័ត៌មាន')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. S2S VPN parameters Edit Modal */}
      {editingModal === 's2s_vpn' && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave}>
            <div className="modal-header">
              <div className="modal-title">Edit VPN Connection: {editingData.name}</div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Connection Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.name || ''}
                  onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.address || ''}
                  onChange={(e) => setEditingData({ ...editingData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ISP Company</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.isp || ''}
                  onChange={(e) => setEditingData({ ...editingData, isp: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Public IP</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.public_ip || ''}
                    onChange={(e) => setEditingData({ ...editingData, public_ip: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Public Subnet</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.subnet || ''}
                    onChange={(e) => setEditingData({ ...editingData, subnet: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Public Gateway</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.gateway || ''}
                    onChange={(e) => setEditingData({ ...editingData, gateway: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">LAN Host IP</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.lan_ip || ''}
                    onChange={(e) => setEditingData({ ...editingData, lan_ip: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">LAN Subnet</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.lan_subnet || ''}
                    onChange={(e) => setEditingData({ ...editingData, lan_subnet: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">LAN Gateway</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.lan_gateway || ''}
                    onChange={(e) => setEditingData({ ...editingData, lan_gateway: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pre-Share Key (IKEY)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.ikey || ''}
                  onChange={(e) => setEditingData({ ...editingData, ikey: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Tunnel ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.tunnel || ''}
                    onChange={(e) => setEditingData({ ...editingData, tunnel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Tunnel Status</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.status || ''}
                    onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.contact || ''}
                  onChange={(e) => setEditingData({ ...editingData, contact: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                <input
                  type="checkbox"
                  id="reopen_requested"
                  checked={editingData.reopen_requested === 1}
                  onChange={(e) => setEditingData({ ...editingData, reopen_requested: e.target.checked ? 1 : 0 })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="reopen_requested" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Reopen Requested? (ស្នើសុំបើកដំណើរការឡើងវិញ)</label>
              </div>
              <div className="form-group">
                <label className="form-label">Reference Document (លិខិតយោង / ឯកសារយោង)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-input"
                    value={editingData.reference_doc || ''}
                    onChange={(e) => setEditingData({ ...editingData, reference_doc: e.target.value })}
                    style={{ flex: '1', minWidth: '150px' }}
                  >
                    <option value="">-- ជ្រើសរើសពីប្រព័ន្ធផ្ទុកឯកសារ (Files) --</option>
                    {driveFiles.map((file) => (
                      <option key={file.id} value={file.name}>
                        {file.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    value={editingData.reference_doc || ''}
                    onChange={(e) => setEditingData({ ...editingData, reference_doc: e.target.value })}
                    placeholder="ឬវាយបញ្ចូលឈ្មោះឯកសារ/លេខលិខិត"
                    style={{ flex: '1.2' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Other Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingData.other || ''}
                  onChange={(e) => setEditingData({ ...editingData, other: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Syncing...' : 'Save & Sync'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branch Add Modal */}
      {editingModal === 'branch_add' && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave} style={{ maxWidth: '560px', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                  Add New NSSF Branch <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>(បន្ថែមព័ត៌មានថ្មី)</span>
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {modalError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '12px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}
              
              {/* Section 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>1</div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Select Standard Branch (ជ្រើសរើសសាខាគំរូ)</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '16px', fontSize: '16px', pointerEvents: 'none' }}>🏛️</div>
                  <select
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 48px',
                      border: '1.5px solid #dbeafe',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1e3a8a',
                      backgroundColor: '#fff',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.03)'
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [kh, en] = val.split('|');
                        setEditingData({
                          ...editingData,
                          name_kh: kh,
                          name_en: en
                        });
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">-- ជ្រើសរើសសាខា ប.ស.ស. --</option>
                    {NSSF_BRANCHES_LIST.map((b, i) => (
                      <option key={i} value={`${b.name_kh}|${b.name_en}`}>
                        {b.name_kh} ({b.name_en})
                      </option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: '#2563eb', fontSize: '10px' }}>▼</div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>2</div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Branch Information (ព័ត៌មានសាខា)</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Branch Name Khmer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#2563eb', fontWeight: '800', fontSize: '15px' }}>អូ</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Branch Name Khmer</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ឈ្មោះសាខាខ្មែរ)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.name_kh || ''}
                      onChange={(e) => setEditingData({ ...editingData, name_kh: e.target.value })}
                      placeholder="ឈ្មោះសាខាខ្មែរ"
                    />
                  </div>

                  {/* Branch Name English */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#2563eb', fontWeight: '800', fontSize: '13px' }}>EN</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Branch Name English</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ឈ្មោះសាខាអង់គ្លេស)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.name_en || ''}
                      onChange={(e) => setEditingData({ ...editingData, name_en: e.target.value })}
                      placeholder="Branch name English"
                    />
                  </div>

                  {/* Subnet */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="1" width="6" height="4" rx="1" />
                        <rect x="1" y="19" width="6" height="4" rx="1" />
                        <rect x="17" y="19" width="6" height="4" rx="1" />
                        <path d="M12 5v9m0 0H4v5m8-5h8v5" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Subnet</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(អាសយដ្ឋានបណ្តាញ Subnet)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.subnet || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleaned = val.trim();
                        const match = cleaned.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\.\d{1,3})?$/);
                        if (match) {
                          const prefix = `${match[1]}.${match[2]}.${match[3]}`;
                          setEditingData({
                            ...editingData,
                            subnet: val,
                            mask: '255.255.255.0',
                            gateway: `${prefix}.1`
                          });
                        } else {
                          setEditingData({
                            ...editingData,
                            subnet: val
                          });
                        }
                      }}
                      placeholder="e.g. 192.168.141.0"
                    />
                  </div>

                  {/* Subnet Mask */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Subnet Mask</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ម៉ាស់បណ្តាញ)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.mask || ''}
                      onChange={(e) => setEditingData({ ...editingData, mask: e.target.value })}
                      placeholder="e.g. 255.255.255.0"
                    />
                  </div>

                  {/* Gateway */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="8" rx="2" />
                        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01" />
                        <path d="M2 13h20" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Gateway</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ច្រកទ្វារ Gateway)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.gateway || ''}
                      onChange={(e) => setEditingData({ ...editingData, gateway: e.target.value })}
                      placeholder="e.g. 192.168.141.1"
                    />
                  </div>

                  {/* Number of Computers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="12" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Number of Computers</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ចំនួនកុំព្យូទ័រ)</span>
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      value={editingData.no_computer || 0}
                      onChange={(e) => setEditingData({ ...editingData, no_computer: e.target.value })}
                      placeholder="e.g. 15"
                    />
                  </div>

                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setEditingModal(null)}
              >
                <span>❌</span> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
                disabled={isSubmitting}
              >
                <span>✔️</span> {isSubmitting ? 'កំពុងបញ្ចូល...' : 'បន្ថែមព័ត៌មាន'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HQ Department Add Modal */}
      {editingModal === 'hq_add' && editingData && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleModalSave} style={{ maxWidth: '560px', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                  Add New HQ Department <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>(បន្ថែមព័ត៌មានថ្មី)</span>
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setEditingModal(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {modalError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '12px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}
              
              {/* Section 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>1</div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Select Standard Department (ជ្រើសរើសនាយកដ្ឋានគំរូ)</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ position: 'absolute', left: '16px', fontSize: '16px', pointerEvents: 'none' }}>🏛️</div>
                  <select
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 48px',
                      border: '1.5px solid #dbeafe',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1e3a8a',
                      backgroundColor: '#fff',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.03)'
                    }}
                    onChange={(e) => {
                      const idx = e.target.value;
                      if (idx !== "") {
                        const dept = NSSF_HQ_DEPTS_LIST[parseInt(idx)];
                        setEditingData({
                          ...editingData,
                          name_en: dept.name,
                          vlan_id: dept.vlan,
                          subnet: dept.subnet,
                          mask: dept.mask,
                          gateway: dept.gateway,
                          gw_device: dept.device
                        });
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">-- ជ្រើសរើសនាយកដ្ឋាន/ការិយាល័យ ប.ស.ស. --</option>
                    {NSSF_HQ_DEPTS_LIST.map((d, i) => (
                      <option key={i} value={i}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: '#2563eb', fontSize: '10px' }}>▼</div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>2</div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Department Identification (ព័ត៌មាននាយកដ្ឋាន)</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Department Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#2563eb', fontWeight: '800', fontSize: '13px' }}>EN</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Department Name</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ឈ្មោះនាយកដ្ឋាន/ការិយាល័យ)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.name_en || ''}
                      onChange={(e) => setEditingData({ ...editingData, name_en: e.target.value })}
                      placeholder="e.g. IT Department"
                    />
                  </div>

                  {/* VLAN ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#2563eb', fontWeight: '800', fontSize: '12px' }}>VLAN</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>VLAN ID</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(លេខសំគាល់ VLAN)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.vlan_id || ''}
                      onChange={(e) => setEditingData({ ...editingData, vlan_id: e.target.value })}
                      placeholder="e.g. VLAN 100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>3</div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Network Configuration (ការកំណត់បណ្តាញ)</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Subnet */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="1" width="6" height="4" rx="1" />
                        <rect x="1" y="19" width="6" height="4" rx="1" />
                        <rect x="17" y="19" width="6" height="4" rx="1" />
                        <path d="M12 5v9m0 0H4v5m8-5h8v5" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Subnet</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(អាសយដ្ឋានបណ្តាញ Subnet)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.subnet || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleaned = val.trim();
                        const match = cleaned.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\.\d{1,3})?$/);
                        if (match) {
                          const prefix = `${match[1]}.${match[2]}.${match[3]}`;
                          setEditingData({
                            ...editingData,
                            subnet: val,
                            mask: '255.255.255.0',
                            gateway: `${prefix}.1`
                          });
                        } else {
                          setEditingData({
                            ...editingData,
                            subnet: val
                          });
                        }
                      }}
                      placeholder="e.g. 10.10.10.0"
                    />
                  </div>

                  {/* Subnet Mask */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Subnet Mask</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ម៉ាស់បណ្តាញ)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.mask || ''}
                      onChange={(e) => setEditingData({ ...editingData, mask: e.target.value })}
                      placeholder="e.g. 255.255.255.0"
                    />
                  </div>

                  {/* Gateway */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="8" rx="2" />
                        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01" />
                        <path d="M2 13h20" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Gateway</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ច្រកទ្វារ Gateway)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      required
                      value={editingData.gateway || ''}
                      onChange={(e) => setEditingData({ ...editingData, gateway: e.target.value })}
                      placeholder="e.g. 10.10.10.1"
                    />
                  </div>

                  {/* Gateway Device */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                        <line x1="20" y1="6" x2="14" y2="6" />
                        <line x1="20" y1="18" x2="14" y2="18" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Gateway Device</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ឧបករណ៍ Gateway)</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      value={editingData.gw_device || ''}
                      onChange={(e) => setEditingData({ ...editingData, gw_device: e.target.value })}
                      placeholder="e.g. Core Switch"
                    />
                  </div>

                  {/* Number of Computers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="12" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Number of Computers</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>(ចំនួនកុំព្យូទ័រ)</span>
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '60%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                      value={editingData.no_computer || 0}
                      onChange={(e) => setEditingData({ ...editingData, no_computer: e.target.value })}
                      placeholder="e.g. 35"
                    />
                  </div>

                </div>
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', padding: '16px 24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setEditingModal(null)}
              >
                <span>❌</span> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
                disabled={isSubmitting}
              >
                <span>✔️</span> {isSubmitting ? 'កំពុងបញ្ចូល...' : 'បន្ថែមព័ត៌មាន'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Print PDF & Signature Options Modal */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title">✍️ បោះពុម្ពរបាយការណ៍ / PDF Sign Options</div>
              <button type="button" className="modal-close" onClick={() => setShowPrintModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* If user is admin, allow choosing signer from list */}
              {isUserAdmin && (
                <div className="form-group" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <label className="form-label" style={{ color: '#0b45b5', fontWeight: '800' }}>👑 Admin: Select Signer on Behalf of (ចុះហត្ថលេខាជំនួស)</label>
                  <select
                    className="form-input"
                    value={signerName}
                    style={{ border: '2.5px solid #0b45b5', fontWeight: '700' }}
                    onChange={(e) => {
                      const selected = vpnUsers.find(u => u.name === e.target.value);
                      if (selected) {
                        setSignerName(selected.name);
                        setSignerTitle(selected.position || 'ប្រធាននាយកដ្ឋានសេវាមូលដ្ឋានសុខាភិបាល');
                        
                        // Load signature image from localStorage if it exists
                        const savedSig = localStorage.getItem('sig_' + selected.username);
                        if (savedSig) {
                          setSignatureImage(savedSig);
                        } else {
                          setSignatureImage('');
                          clearCanvas();
                        }
                      }
                    }}
                  >
                    <option value="">-- Choose Signer --</option>
                    {vpnUsers
                      .filter(u => u.name && u.name !== '-' && u.position && u.position !== '-')
                      .map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.position})</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {!isUserAdmin && currentLoginUser && (
                <div style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontWeight: '700', border: '1px dashed #bfdbfe' }}>
                  🔒 គណនីបុគ្គលិកធម្មតា៖ ហត្ថលេខាត្រូវបានកំណត់ចំពោះតែគណនីផ្ទាល់ខ្លួនរបស់អ្នកប៉ុណ្ណោះ។
                </div>
              )}

              {!currentLoginUser && (
                <div style={{ fontSize: '11px', backgroundColor: '#fffbeb', color: '#92400e', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontWeight: '700', border: '1px dashed #fef3c7' }}>
                  ⚠️ មិនទាន់មានគណនីបច្ចុប្បន្នត្រូវបានជ្រើសរើស (សូមជ្រើសរើសនៅ Navbar ខាងលើ)។
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Signer Name (ឈ្មោះអ្នកចុះហត្ថលេខា)</label>
                <input
                  type="text"
                  className="form-input"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  disabled={!isUserAdmin}
                  style={!isUserAdmin ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: '700' } : {}}
                  placeholder="e.g. មាន ណារិមន្ត"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Signer Title / Role (តួនាទីក្នុងលិខិត)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-input"
                    style={{ width: '40%', fontWeight: '700' }}
                    value={['អ្នករៀបចំ', 'ប្រធានការិយាល័យ', 'អនុប្រធានការិយាល័យ', 'ប្រធាននាយកដ្ឋាន', 'មន្ត្រីបច្ចេកវិទ្យាព័ត៌មាន', 'បុគ្គលិក'].includes(signerTitle) ? signerTitle : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setSignerTitle(e.target.value);
                      }
                    }}
                  >
                    <option value="អ្នករៀបចំ">អ្នករៀបចំ</option>
                    <option value="ប្រធានការិយាល័យ">ប្រធានការិយាល័យ</option>
                    <option value="អនុប្រធានការិយាល័យ">អនុប្រធានការិយាល័យ</option>
                    <option value="ប្រធាននាយកដ្ឋាន">ប្រធាននាយកដ្ឋាន</option>
                    <option value="មន្ត្រីបច្ចេកវិទ្យាព័ត៌មាន">មន្ត្រីបច្ចេកវិទ្យាព័ត៌មាន</option>
                    <option value="បុគ្គលិក">បុគ្គលិក</option>
                    <option value="custom">ផ្សេងៗ (Custom)...</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '60%', fontWeight: '700' }}
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. ប្រធានការិយាល័យ"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Draw Signature (គូរហត្ថលេខា)</span>
                  <button 
                    type="button" 
                    onClick={clearCanvas} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    🧹 Clear
                  </button>
                </label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', backgroundColor: '#fff', overflow: 'hidden', height: '150px', position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={150}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Use your mouse or touchscreen to draw your signature in the white box above.
                </div>
              </div>

              {/* Upload Signature Image file */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Or Upload Signature Image (ឬបញ្ចូលរូបភាពហត្ថលេខា)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    style={{ display: 'none' }}
                    id="sig-image-upload"
                  />
                  <label 
                    htmlFor="sig-image-upload" 
                    className="btn btn-secondary"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      padding: '8px 12px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '11px'
                    }}
                  >
                    📁 បញ្ចូលរូបភាពហត្ថលេខា (Select Image)
                  </label>
                  {signatureImage && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                      ✓ Image Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  const canvas = canvasRef.current;
                  let finalSig = '';
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
                    const hasDrawing = buffer.some(color => color !== 0);
                    if (hasDrawing) {
                      finalSig = canvas.toDataURL();
                      setSignatureImage(finalSig);
                    } else {
                      setSignatureImage('');
                    }
                  }
                  handlePrintPDF(getFilteredVpnUsers(), finalSig);
                  setShowPrintModal(false);
                }}
              >
                📕 Export & Print PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 9. PDF & Image Document Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', width: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>បង្ហាញឯកសារ៖ {previewFile.name}</span>
              </div>
              <button onClick={() => setPreviewFile(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: '700' }}>❌ បិទ</button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {previewFile.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '24px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '30px 24px', textAlign: 'center', borderRadius: '20px', border: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fffbeb', border: '1.5px solid #fef3c7', color: '#f59e0b', marginBottom: '20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>Logout</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 28px 0', fontWeight: '600' }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ 
                  flex: 1, 
                  padding: '11px 16px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #cbd5e1', 
                  backgroundColor: '#fff', 
                  color: '#475569', 
                  fontSize: '12.5px', 
                  fontWeight: '800', 
                  cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                style={{ 
                  flex: 1, 
                  padding: '11px 16px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: '#ef4444', 
                  color: '#fff', 
                  fontSize: '12.5px', 
                  fontWeight: '800', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' 
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned My Profile Settings Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '100%', padding: 0, overflow: 'hidden', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', height: '600px' }}>
              
              {/* Left Sidebar Pane */}
              <div style={{ width: '220px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '24px 16px', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                
                {/* Header back button */}
                <div onClick={() => setShowProfileModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14.5px', fontWeight: '800', color: '#1e293b', marginBottom: '32px' }}>
                  <span>←</span> My Profile
                </div>

                {/* Tab Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div 
                    onClick={() => setProfileActiveTab('info')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      cursor: 'pointer', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      backgroundColor: profileActiveTab === 'info' ? '#eff6ff' : 'transparent',
                      color: profileActiveTab === 'info' ? '#2563eb' : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>👤</span> Profile Information
                  </div>
                  <div 
                    onClick={() => setProfileActiveTab('password')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      cursor: 'pointer', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      backgroundColor: profileActiveTab === 'password' ? '#eff6ff' : 'transparent',
                      color: profileActiveTab === 'password' ? '#2563eb' : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>🔒</span> Change Password
                  </div>
                  <div 
                    onClick={() => setProfileActiveTab('session')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      cursor: 'pointer', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      backgroundColor: profileActiveTab === 'session' ? '#eff6ff' : 'transparent',
                      color: profileActiveTab === 'session' ? '#2563eb' : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>🖥️</span> Session Information
                  </div>
                  <div 
                    onClick={() => setProfileActiveTab('logs')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      cursor: 'pointer', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      backgroundColor: profileActiveTab === 'logs' ? '#eff6ff' : 'transparent',
                      color: profileActiveTab === 'logs' ? '#2563eb' : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>🕒</span> Activity Log
                  </div>
                  {currentLoginUser && currentLoginUser.role === 'admin' && (
                    <div 
                      onClick={() => setProfileActiveTab('templates')}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '10px 12px', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontSize: '12px', 
                        fontWeight: '800', 
                        backgroundColor: profileActiveTab === 'templates' ? '#eff6ff' : 'transparent',
                        color: profileActiveTab === 'templates' ? '#2563eb' : '#64748b',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span>⚙️</span> Telegram Templates
                    </div>
                  )}
                </div>

                {/* Support banner */}
                <div style={{ marginTop: 'auto', backgroundColor: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '12px', padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af', display: 'block', marginBottom: '4px' }}>❓ Need help?</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#3b82f6', cursor: 'pointer' }}>Contact IT Support</span>
                </div>

              </div>

              {/* Right Content Pane */}
              <div style={{ flex: 1, padding: '36px 40px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', textAlign: 'left' }}>
                
                {profileActiveTab === 'info' && (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '28px', height: '100%' }}>
                    
                    {/* Top section: Initials Avatar and camera overlay */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '2.5px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>
                          {currentLoginUser ? currentLoginUser.username.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#fff', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', boxShadow: 'var(--shadow-sm)' }}>
                          📷
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{profileForm.full_name || currentLoginUser?.username}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>Update your profile picture and personal information.</span>
                      </div>
                    </div>

                    {/* Grid Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileForm.full_name} 
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Role</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={currentLoginUser?.role || 'admin'} 
                          disabled 
                          style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#94a3b8' }} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={currentLoginUser?.username || 'admin'} 
                          disabled 
                          style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#94a3b8' }} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Language</label>
                        <select 
                          className="form-input" 
                          value={profileForm.language} 
                          onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                        >
                          <option value="English">🇰🇭 Khmer / English</option>
                          <option value="Khmer">🇰🇭 Khmer</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Email</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={profileForm.email} 
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Time Zone</label>
                        <select 
                          className="form-input" 
                          value={profileForm.timezone} 
                          onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        >
                          <option value="(GMT+07:00) Bangkok">(GMT+07:00) Bangkok</option>
                          <option value="(GMT+07:00) Phnom Penh">(GMT+07:00) Phnom Penh</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Phone</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileForm.phone} 
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Date Format</label>
                        <select 
                          className="form-input" 
                          value={profileForm.date_format} 
                          onChange={(e) => setProfileForm({ ...profileForm, date_format: e.target.value })}
                        >
                          <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                          <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Department</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileForm.department} 
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#64748b' }}>Theme</label>
                        <select 
                          className="form-input" 
                          value={profileForm.theme} 
                          onChange={(e) => setProfileForm({ ...profileForm, theme: e.target.value })}
                        >
                          <option value="Light">Light</option>
                          <option value="Dark">Dark</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#0088cc' }}>Telegram Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. @Panhcharoth_IT"
                          value={profileForm.telegram_username || ''} 
                          onChange={(e) => setProfileForm({ ...profileForm, telegram_username: e.target.value })} 
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px', color: '#0088cc' }}>Telegram Chat ID</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. 123456789"
                          value={profileForm.telegram_chat_id || ''} 
                          onChange={(e) => setProfileForm({ ...profileForm, telegram_chat_id: e.target.value })} 
                        />
                      </div>

                    </div>

                    {/* Save button and feedback */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                      {profileModalError && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>⚠️ {profileModalError}</div>}
                      {profileModalSuccess && <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✓ រក្សាទុកព័ត៌មានរួចរាល់! (Profile Saved)</div>}
                      
                      {profileForm.telegram_chat_id && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleSendTelegramTestNotification}
                          style={{
                            padding: '11px 18px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            backgroundColor: '#eff6ff',
                            color: '#0088cc',
                            border: '1.5px solid rgba(0, 136, 204, 0.15)',
                            cursor: 'pointer'
                          }}
                          disabled={isTelegramNotifyLoading}
                        >
                          {isTelegramNotifyLoading ? 'Sending...' : '✈️ Send Test Notification'}
                        </button>
                      )}

                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ marginLeft: 'auto', padding: '11px 24px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '800' }}
                        disabled={profileModalLoading}
                      >
                        {profileModalLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                  </form>
                )}

                {profileActiveTab === 'password' && (
                  <form onSubmit={handleUpdateProfilePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Change Password</h3>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Please update your password regularly to secure your SOC operations access.</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', marginTop: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>Current Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={profileOldPassword}
                          onChange={(e) => setProfileOldPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={profileNewPassword}
                          onChange={(e) => setProfileNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>Confirm New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={profileConfirmPassword}
                          onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      {profileModalError && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>⚠️ {profileModalError}</div>}
                      {profileModalSuccess && <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✓ រក្សាទុកលេខសម្ងាត់រួចរាល់! (Password Updated)</div>}
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ width: 'max-content', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}
                        disabled={profileModalLoading}
                      >
                        {profileModalLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}

                {profileActiveTab === 'session' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Session Information</h3>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Your current session credentials and location tracking parameters.</span>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '12.5px' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#64748b' }}>Account Username</td>
                          <td style={{ padding: '12px 8px', fontWeight: '800', color: '#1e293b' }}>{currentLoginUser?.username}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#64748b' }}>Active Role</td>
                          <td style={{ padding: '12px 8px', fontWeight: '800', color: '#2563eb' }}>{currentLoginUser?.role}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#64748b' }}>Remote IP Host</td>
                          <td style={{ padding: '12px 8px', fontWeight: '800', color: '#1e293b' }}>{currentLoginUser?.client_ip || '10.10.10.21'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#64748b' }}>Session Last Login</td>
                          <td style={{ padding: '12px 8px', fontWeight: '800', color: '#1e293b' }}>{currentLoginUser?.last_login || 'Today 08:12'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {profileActiveTab === 'logs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Activity Log</h3>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recent actions performed under this administrative profile.</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontWeight: '700' }}>Today 08:12</span>
                        <span style={{ color: '#10b981', fontWeight: '800' }}>LOGIN</span>
                        <span style={{ color: '#1e293b', fontWeight: '600' }}>Logged in from IP 10.10.10.21</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontWeight: '700' }}>Yesterday 16:45</span>
                        <span style={{ color: '#2563eb', fontWeight: '800' }}>SYNC</span>
                        <span style={{ color: '#1e293b', fontWeight: '600' }}>Triggered Google Sheets Synchronization</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontWeight: '700' }}>Yesterday 14:20</span>
                        <span style={{ color: '#eab308', fontWeight: '800' }}>UPDATE</span>
                        <span style={{ color: '#1e293b', fontWeight: '600' }}>Modified permissions for staff account</span>
                      </div>
                    </div>
                  </div>
                )}

                {profileActiveTab === 'templates' && (
                  <form onSubmit={handleSaveTemplates} style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚙️</span> Telegram Notification Templates
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      Configure the message structure and format for automated Telegram broadcasts and user alerts.
                    </span>

                    {isTemplatesLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>
                        Loading templates...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', color: '#0088cc', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📋 Leave Request Message Template</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>Placeholders: {'{recipients}'}, {'{name}'}, {'{position}'}, {'{subject}'}, {'{reason}'}, {'{closing}'}</span>
                          </label>
                          <textarea
                            className="form-input"
                            rows={6}
                            style={{ fontFamily: 'inherit', padding: '12px', fontSize: '13px', lineHeight: '1.6', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={telegramTemplatesForm.telegram_leave_template}
                            onChange={(e) => setTelegramTemplatesForm({ ...telegramTemplatesForm, telegram_leave_template: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '700', fontSize: '12px', color: '#0088cc', display: 'flex', justifyContent: 'space-between' }}>
                            <span>🚨 System Log Alert Template</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>Placeholders: {'{alert_type}'}, {'{host}'}, {'{ip}'}, {'{status}'}, {'{time}'}</span>
                          </label>
                          <textarea
                            className="form-input"
                            rows={6}
                            style={{ fontFamily: 'inherit', padding: '12px', fontSize: '13px', lineHeight: '1.6', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={telegramTemplatesForm.telegram_alert_template}
                            onChange={(e) => setTelegramTemplatesForm({ ...telegramTemplatesForm, telegram_alert_template: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                      {profileModalError && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>⚠️ {profileModalError}</div>}
                      {profileModalSuccess && <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✓ រក្សាទុកពុម្ពគំរូរួចរាល់! (Templates Updated)</div>}
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ marginLeft: 'auto', padding: '11px 24px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '800' }}
                        disabled={profileModalLoading || isTemplatesLoading}
                      >
                        {profileModalLoading ? 'Saving...' : 'Save Templates'}
                      </button>
                    </div>
                  </form>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Telegram Login Modal */}
      {showTelegramLoginModal && (
        <div className="modal-overlay" style={{ zIndex: 1210 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '28px 24px', borderRadius: '20px', border: 'none', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', color: '#0088cc' }}>✈️</span> Telegram Sign In
              </h3>
              <button onClick={() => setShowTelegramLoginModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <form onSubmit={handleTelegramLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '600', lineHeight: '1.4' }}>
                Please enter your registered Telegram <b>Username</b> (e.g. <code>@username</code>) or your numeric Telegram <b>Chat ID</b> to authenticate.
              </p>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '11.5px' }}>Telegram Account / Chat ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. @Panhcharoth_IT or 123456789"
                  value={telegramUsernameInput}
                  onChange={(e) => setTelegramUsernameInput(e.target.value)}
                  required
                />
              </div>

              {telegramLoginError && (
                <div style={{ color: '#ef4444', fontSize: '11.5px', fontWeight: '700', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  ⚠️ {telegramLoginError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowTelegramLoginModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: '#0088cc', borderColor: '#0088cc', fontSize: '12px', fontWeight: '800' }}
                  disabled={telegramLoginLoading}
                >
                  {telegramLoginLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
