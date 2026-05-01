/* ─── Clock ─────────────────────────────────────────────────── */
const DAYS   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

let _clockTimer = null;

function startClock() {
  if (_clockTimer) clearInterval(_clockTimer);
  function tick() {
    const el = document.getElementById('clock');
    const dt = document.getElementById('dateTh');
    if (!el) return;
    const now = new Date();
    el.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2, '0')).join(':');
    if (dt) dt.textContent =
      `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
  }
  tick();
  _clockTimer = setInterval(tick, 1000);
}

/* ─── Drawer table ──────────────────────────────────────────── */
const DRAWERS = [
  { id: 'D1', dc: 6, dt: '24.2°C', dr: '48% RH', ct: '24.6°C', cr: '50% RH' },
  { id: 'D2', dc: 6, dt: '24.6°C', dr: '49% RH', ct: '24.8°C', cr: '52% RH' },
  { id: 'D3', dc: 6, dt: '23.9°C', dr: '51% RH', ct: '24.3°C', cr: '52% RH' },
  { id: 'D4', dc: 6, dt: '24.2°C', dr: '47% RH', ct: '24.5°C', cr: '48% RH' },
  { id: 'D5', dc: 6, dt: '24.6°C', dr: '48% RH', ct: '25.0°C', cr: '50% RH' },
  { id: 'D6', dc: 6, dt: '23.9°C', dr: '49% RH', ct: '24.1°C', cr: '51% RH' },
];

function initCartPage() {
  if (!document.getElementById('cartInfoName')) return;
  if (!MC_STATE.hardwareId) MC_STATE.hardwareId = 'MC-A-001';
  seedMcData();

  const cart    = getCart(MC_STATE.currentCartId);
  const paired  = cart && cart.pairedHwId === MC_STATE.hardwareId;
  const shortId = paired ? cart.name.replace('รถเข็น ', '') : '—';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('cartInfoAvatar',        shortId);
  set('cartInfoName',          paired ? cart.name : '—');
  set('cartInfoHwId',          'รหัส ' + MC_STATE.hardwareId);
  set('cartInfoStatName',      paired ? cart.name : '—');
  set('cartInfoStatHw',        MC_STATE.hardwareId);
  const zone1DrawerIds = (MC_STATE.drawers || []).filter(d => d.zone === 1).map(d => d.id);
  const zone1Cassettes = (MC_STATE.cassettes || []).filter(c => zone1DrawerIds.includes(c.drawerId));
  set('cartInfoDrawerCount',   paired ? (zone1DrawerIds.length || '—') : '—');
  set('cartInfoCassetteCount', paired ? (zone1Cassettes.length || '—') : '—');
  set('cartNavHwId',           MC_STATE.hardwareId || '—');
  set('cartNavName',           paired ? cart.name : '—');

  const btnStart = document.getElementById('btnStart');
  if (btnStart) btnStart.disabled = !paired;

  const badge = document.getElementById('cartStatusBadge');
  const badgeText = document.getElementById('cartStatusText');
  if (badge && badgeText) {
    badgeText.textContent = paired ? 'พร้อมใช้งาน' : 'ยังไม่ได้จับคู่';
    badge.classList.toggle('btn-ready-unpaired', !paired);
  }

  const tbody = document.getElementById('drawerTable');
  if (tbody) {
    tbody.innerHTML = '';
    if (paired) {
      const stateDrawers  = MC_STATE.drawers  || [];
      const stateCassettes = MC_STATE.cassettes || [];
      // demo sensor offsets per drawer index
      const tempOffsets = [0, 0.4, -0.3, 0, 0.4, -0.3, 0.2, -0.1];
      const rhOffsets   = [0, 1,   3,   -1,  0,   1,   2,  -1];
      stateDrawers.forEach((d, i) => {
        const cassCount = stateCassettes.filter(c => c.drawerId === d.id).length;
        const baseTemp  = 24.2;
        const baseRh    = 48;
        const dt = (baseTemp + tempOffsets[i % tempOffsets.length]).toFixed(1) + '°C';
        const dr = (baseRh   + rhOffsets[i   % rhOffsets.length])   + '% RH';
        const ct = (baseTemp + tempOffsets[i % tempOffsets.length] + 0.4).toFixed(1) + '°C';
        const cr = (baseRh   + rhOffsets[i   % rhOffsets.length]   + 2)   + '% RH';
        tbody.insertAdjacentHTML('beforeend', `
          <tr>
            <td><div class="drawer-id">${d.id}</div><div class="drawer-sub">${cassCount} Cassette</div></td>
            <td class="temp-val">${dt}</td>
            <td class="rh-val">${dr}</td>
            <td class="temp-val">${ct}</td>
            <td class="rh-val">${cr}</td>
            <td><span class="status-pill">ปกติ</span></td>
          </tr>`);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">ยังไม่ได้จับคู่กับรถเข็น</td></tr>`;
    }
  }
}


/* ─── Ward state + data ─────────────────────────────────────── */
const WARDS = [
  { id: 'W3A', name: 'Ward 3A', dept: 'หอผู้ป่วยอายุรกรรม',    floor: 'ชั้น 3 ตึก A', cap: '24/30', status: 'available' },
  { id: 'W3B', name: 'Ward 3B', dept: 'หอผู้ป่วยศัลยกรรม',      floor: 'ชั้น 3 ตึก A', cap: '18/28', status: 'available' },
  { id: 'W4A', name: 'Ward 4A', dept: 'หอผู้ป่วยกระดูกและข้อ',  floor: 'ชั้น 4 ตึก A', cap: '22/26', status: 'available' },
  { id: 'W4B', name: 'Ward 4B', dept: 'หอผู้ป่วยโรคหัวใจ',      floor: 'ชั้น 4 ตึก A', cap: '26/28', status: 'near' },
  { id: 'W5A', name: 'Ward 5A', dept: 'ICU อายุรกรรม',          floor: 'ชั้น 5 ตึก A', cap: '11/12', status: 'near' },
  { id: 'W5B', name: 'Ward 5B', dept: 'ICU ศัลยกรรม',           floor: 'ชั้น 5 ตึก A', cap: '8/10',  status: 'available' },
  { id: 'W2A', name: 'Ward 2A', dept: 'หอผู้ป่วยสูตินรีเวช',     floor: 'ชั้น 2 ตึก B', cap: '14/22', status: 'available' },
  { id: 'W2B', name: 'Ward 2B', dept: 'หอผู้ป่วยกุมารเวชกรรม',  floor: 'ชั้น 2 ตึก B', cap: '15/24', status: 'available' },
  { id: 'W6A', name: 'Ward 6A', dept: 'หู ตา คอ จมูก',           floor: 'ชั้น 6 ตึก A', cap: '12/20', status: 'available' },
];
const STATUS_LABEL = { available: 'ว่างรับผู้ป่วย', near: 'เกือบเต็ม', full: 'เต็ม' };
const DEFAULT_WARD_ID = 'W3A';

function getCurrentWard() {
  const id = localStorage.getItem('mc_ward_id') || DEFAULT_WARD_ID;
  return WARDS.find(w => w.id === id) || WARDS[0];
}

function setCurrentWard(id) {
  localStorage.setItem('mc_ward_id', id);
}

function applyWardToPage() {
  const w = getCurrentWard();
  document.querySelectorAll('[data-ward-name]').forEach(el => el.textContent = w.name);
  document.querySelectorAll('[data-ward-dept]').forEach(el => el.textContent = w.dept);
  document.querySelectorAll('[data-ward-floor]').forEach(el => el.textContent = w.floor);
  document.querySelectorAll('[data-ward-dept-floor]').forEach(el => el.textContent = `${w.dept} · ${w.floor}`);
  document.querySelectorAll('[data-ward-full]').forEach(el => el.textContent = `${w.name} — ${w.dept}`);
}

function applyCartToPage() {
  if (!MC_STATE.hardwareId) MC_STATE.hardwareId = 'MC-A-001';
  const cart = getCart(MC_STATE.currentCartId);
  const paired = cart && cart.pairedHwId === MC_STATE.hardwareId;
  const shortId = paired ? cart.name.replace('รถเข็น ', '') : '—';
  const cartName = cart ? cart.name : 'Med Cart A-1';
  const hwId = MC_STATE.hardwareId;
  document.querySelectorAll('[data-cart-shortid]').forEach(el => el.textContent = shortId);
  document.querySelectorAll('[data-cart-name]').forEach(el => el.textContent = cartName);
  document.querySelectorAll('[data-hw-id]').forEach(el => el.textContent = hwId);
  document.querySelectorAll('[data-ward-name]').forEach(el => el.textContent = paired ? getCurrentWard().name : '—');
}

/* ─── Ward selection (pg-select-ward) ───────────────────────── */
let _selectedWard = null;

function initSelectWard() {
  const grid = document.getElementById('wardGrid');
  if (!grid) return;
  renderWards(WARDS);
}

function renderWards(list) {
  const grid = document.getElementById('wardGrid');
  if (!grid) return;
  const currentId = getCurrentWard().id;
  grid.innerHTML = list.map(w => {
    const isCurrent = w.id === currentId;
    return `
    <div class="ward-card ${isCurrent ? 'current' : ''} ${_selectedWard === w.id ? 'selected' : ''}" data-id="${w.id}" ${isCurrent ? '' : `onclick="selectWard('${w.id}')"`}>
      ${isCurrent ? '<span class="current-badge">ปัจจุบัน</span>' : ''}
      <div class="ward-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="ward-card-head">
        <div class="ward-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
          </svg>
        </div>
        <div>
          <div class="ward-card-title">${w.name}</div>
          <div class="ward-card-dept">${w.dept}</div>
        </div>
      </div>
      <div class="ward-card-meta">
        <span class="ward-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${w.floor}
        </span>
        <span class="ward-card-status status-${w.status}">${STATUS_LABEL[w.status]} · <span class="ward-card-cap">${w.cap}</span></span>
      </div>
    </div>`;
  }).join('');
}

function selectWard(id) {
  _selectedWard = id;
  document.querySelectorAll('.ward-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
  const btn = document.getElementById('confirmWardBtn');
  if (btn) btn.disabled = false;
}

function filterWards(q) {
  const query = (q || '').toLowerCase().trim();
  if (!query) { renderWards(WARDS); return; }
  const filtered = WARDS.filter(w =>
    w.name.toLowerCase().includes(query) ||
    w.dept.toLowerCase().includes(query) ||
    w.floor.toLowerCase().includes(query)
  );
  renderWards(filtered);
}

function confirmWardChange() {
  if (!_selectedWard) return;
  setCurrentWard(_selectedWard);
  location.hash = '#pg-login';
}

/* ─── Toggle env detail ─────────────────────────────────────── */
function toggleEnv() {
  const sec  = document.querySelector('.env-section');
  const btn  = document.getElementById('toggleBtn');
  const chev = btn.querySelector('.chevron');
  const expanded = sec.classList.toggle('expanded');
  chev.classList.toggle('open', expanded);
  btn.childNodes[0].textContent = expanded ? 'ซ่อนรายละเอียด ' : 'แสดงรายละเอียด ';
}

/* ─── Login ─────────────────────────────────────────────────── */
function togglePassword() {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eyeIcon');
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  icon.innerHTML = show
    ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

/* ─── Demo users ────────────────────────────────────────────── */
const DEMO_USERS = {
  'admin':   { role: 'พยาบาล',     name: 'นส.สมใจ ดีมาก' },
  'admin_2': { role: 'เภสัชกร',    name: 'นายสมชาย เภสัช' },
  'admin_3': { role: 'หัวหน้าเวร', name: 'นางวันดี หัวหน้าเวร' },
};
const DEMO_PASSWORD = '1234';

function fillDemoUser(username) {
  const u = document.getElementById('username');
  const p = document.getElementById('password');
  if (u) u.value = username;
  if (p) p.value = DEMO_PASSWORD;
  document.querySelectorAll('.demo-chip').forEach(c => c.classList.remove('active'));
  const clicked = [...document.querySelectorAll('.demo-chip')].find(c => c.textContent.startsWith(username));
  if (clicked) clicked.classList.add('active');
  if (p) p.focus();
}

function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const activeTab = document.querySelector('.auth-tab.active');
  const method = activeTab ? activeTab.dataset.method : 'password';

  if (method === 'password') {
    const username = (document.getElementById('username')?.value || '').trim();
    const password = document.getElementById('password')?.value || '';
    const user = DEMO_USERS[username];
    if (!user || password !== DEMO_PASSWORD) {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง\n\nทดสอบด้วย: admin, admin_2, admin_3\nPassword: 1234');
      return;
    }
    localStorage.setItem('mc_user', JSON.stringify({ username, ...user }));
  } else {
    // Card/Face → default to admin (พยาบาล)
    localStorage.setItem('mc_user', JSON.stringify({ username: 'admin', ...DEMO_USERS.admin }));
  }
  location.hash = '#pg-dashboard';
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('mc_user')) || null; } catch { return null; }
}

function switchAuthMethod(method) {
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.method === method);
  });
  const map = { password: 'authPanelPassword', card: 'authPanelCard', face: 'authPanelFace' };
  Object.values(map).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
  const target = document.getElementById(map[method]);
  if (target) target.hidden = false;
}

function simulateCardScan() {
  const modal = document.getElementById('cardScanModal');
  if (!modal) return;
  modal.hidden = false;
  const pw = document.getElementById('cspPassword');
  if (pw) { pw.value = ''; pw.focus(); }
}

function closeCardScanModal() {
  const modal = document.getElementById('cardScanModal');
  if (modal) modal.hidden = true;
}

function confirmCardScanLogin(e) {
  if (e) e.preventDefault();
  const password = document.getElementById('cspPassword')?.value || '';
  if (password !== DEMO_PASSWORD) {
    alert('รหัสผ่านไม่ถูกต้อง\n\nPassword: 1234');
    return;
  }
  closeCardScanModal();
  localStorage.setItem('mc_user', JSON.stringify({ username: 'admin', ...DEMO_USERS.admin }));
  location.hash = '#pg-dashboard';
}

/* ═══════════════════════════════════════════════════════════
   MEDICATION CART — Data model & state
   ═══════════════════════════════════════════════════════════ */
const DRUG_LIST = [
  // Standard oral drugs
  { id: 'PARA500',  name: 'Paracetamol',  dose: '500 mg',   max: 30, type:'oral' },
  { id: 'AMOX250',  name: 'Amoxicillin',  dose: '250 mg',   max: 30, type:'oral' },
  { id: 'MET500',   name: 'Metformin',    dose: '500 mg',   max: 30, type:'oral' },
  { id: 'AMLO5',    name: 'Amlodipine',   dose: '5 mg',     max: 30, type:'oral' },
  { id: 'OMEP20',   name: 'Omeprazole',   dose: '20 mg',    max: 30, type:'oral' },
  { id: 'ATO20',    name: 'Atorvastatin', dose: '20 mg',    max: 30, type:'oral' },
  { id: 'SIM10',    name: 'Simvastatin',  dose: '10 mg',    max: 30, type:'oral' },
  { id: 'IBU400',   name: 'Ibuprofen',    dose: '400 mg',   max: 30, type:'oral' },
  { id: 'LOR10',    name: 'Loratadine',   dose: '10 mg',    max: 30, type:'oral' },
  { id: 'PRED5',    name: 'Prednisolone', dose: '5 mg',     max: 30, type:'oral' },
  // IV / Injectable (ICU cart)
  { id: 'NSS1000',  name: 'Normal Saline', dose: '1000 ml', max: 12, type:'iv' },
  { id: 'D5W1000',  name: '5% Dextrose',   dose: '1000 ml', max: 12, type:'iv' },
  { id: 'RL500',    name: 'Ringer Lactate',dose: '500 ml',  max: 12, type:'iv' },
  { id: 'KCL10',    name: 'KCl',           dose: '10 mEq',  max: 20, type:'iv' },
  { id: 'NAHCO3',   name: 'NaHCO3',        dose: '50 ml',   max: 15, type:'iv' },
  { id: 'HEP5K',    name: 'Heparin',       dose: '5000 U',  max: 20, type:'iv' },
  { id: 'INSREG',   name: 'Insulin Regular',dose: '100 U/ml',max: 10, type:'iv' },
  { id: 'CEF1G',    name: 'Ceftriaxone',   dose: '1 g IV',  max: 15, type:'iv' },
];

const ROUNDS = ['เช้า', 'กลางวัน', 'เย็น', 'ก่อนนอน'];

/* ─── Users + PIN ───────────────────────────────────────────── */
const USERS = [
  { id:'u1', name:'ภก.สมชาย', role:'PHARMACIST', pin:'1234' },
  { id:'u2', name:'ภก.วิภา',   role:'PHARMACIST', pin:'2345' },
  { id:'u3', name:'พย.นิดา',   role:'NURSE',      pin:'3456' },
  { id:'u4', name:'พย.มนัส',   role:'NURSE',      pin:'4567' },
  { id:'u0', name:'Admin',     role:'ADMIN',      pin:'0000' },
];

function getUserByPin(pin) { return USERS.find(u => u.pin === pin); }
function roleLabel(role) { return role === 'PHARMACIST' ? 'เภสัชกร' : role === 'NURSE' ? 'พยาบาล' : role === 'ADMIN' ? 'ผู้ดูแลระบบ' : role; }

/* ─── Cart Templates + Carts ────────────────────────────────── */
const CART_TEMPLATES = [
  {
    id: 'T1',
    name: 'มาตรฐาน 5 ลิ้นชัก',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'พื้นที่ทั่วไป',    zone:'ZONE1', rows:4, cols:5, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:2, label:'พื้นที่ควบคุม',   zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:3, label:'พื้นที่ควบคุม',   zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:4, label:'พื้นที่ทั่วไป',    zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:5, label:'พื้นที่ควบคุม',   zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
    ],
  },
  {
    id: 'T2',
    name: 'รถเข็น ICU (3 ลิ้นชัก)',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'พื้นที่ควบคุม',  zone:'ZONE1', rows:2, cols:3, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:2, label:'พื้นที่ควบคุม',  zone:'ZONE1', rows:2, cols:3, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:3, label:'พื้นที่ทั่วไป',   zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
    ],
  },
  {
    id: 'T3',
    name: 'รถเข็นขนาดเล็ก (2 ลิ้นชัก)',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'พื้นที่ทั่วไป',  zone:'ZONE1', rows:1, cols:3, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:2, label:'พื้นที่ควบคุม', zone:'ZONE1', rows:1, cols:3, hasLock:true, allowedRoles:['PHARMACIST'] },
    ],
  },
];

const CARTS = [
  { id:'CART-A01', name:'รถเข็น A01',   templateId:'T1', isActive:true,  pairedHwId:'MC-A-001' }, // เครื่องนี้
  { id:'CART-A02', name:'รถเข็น A02',   templateId:'T1', isActive:true,  pairedHwId:'MC-A-002' }, // เครื่องอื่นจับคู่แล้ว
  { id:'CART-B01', name:'รถเข็น B01',   templateId:'T1', isActive:true,  pairedHwId:'MC-B-001' }, // เครื่องอื่นจับคู่แล้ว
  { id:'CART-B02', name:'รถเข็น B02',   templateId:'T3', isActive:false, pairedHwId:null },        // ยังไม่จับคู่ (inactive)
  { id:'CART-C01', name:'รถเข็น C01',   templateId:'T3', isActive:true,  pairedHwId:null },        // ว่าง เลือกได้
  { id:'CART-ICU1',name:'รถเข็น ICU-1', templateId:'T2', isActive:true,  pairedHwId:'MC-ICU-1' }, // เครื่องอื่นจับคู่แล้ว
  { id:'CART-ICU2',name:'รถเข็น ICU-2', templateId:'T2', isActive:false, pairedHwId:null },        // ยังไม่จับคู่ (inactive)
  { id:'CART-E01', name:'รถเข็น E01',   templateId:'T3', isActive:true,  pairedHwId:null },        // ว่าง เลือกได้
];

function getCartTemplate(id) { return CART_TEMPLATES.find(t => t.id === id); }
function getCart(id) { return CARTS.find(c => c.id === id); }

const OUT_ALERT_MS = 30 * 60 * 1000; // 30 minutes

const MC_STATE = {
  currentUser: 'ภก.สมชาย',
  drawers: [],
  cassettes: [],
  auditLog: [],
  currentDrawerId: null,
  refillCassetteId: null,
  refillStep: 1,
  refillAdded: 0,
  refillDetected: null,
  // Session (Part 0)
  session: { mode: null, scope: null, round: null, refilledCassettes: [], user: null,
             hisMode: 'ONLINE', hisStatus: 'idle', hisLastSync: null, hisOrderCount: 0 },
  currentCartId: 'CART-A01',
  isAdmin: false,
  editingTemplateId: null,
  editingCartId: null,
  cartData: {},
  hardwareId: '',
};

/* Static patient roster — referenced from seedMcData. Kept at module scope so
   the patient list can be re-seeded after sessionStorage restore (which skips
   the full seedMcData body once cartData is non-empty). */
const _STATIC_PATIENTS = [
  // Ward A — general
  { id:'P1',  name:'นางนภา ใจดี',          hn:'6401101', gender:'หญิง', ward:'Ward A', bed:'3A-01', age:65, condition:'เบาหวาน + ความดันสูง',         allergies:[] },
  { id:'P2',  name:'นายวิชัย มานะ',        hn:'6401234', gender:'ชาย',  ward:'Ward A', bed:'3A-05', age:54, condition:'ปวดศีรษะเรื้อรัง',             allergies:['Penicillin','Sulfonamides'] },
  { id:'P3',  name:'นางสมหญิง รักดี',      hn:'6400892', gender:'หญิง', ward:'Ward A', bed:'3A-08', age:72, condition:'GERD + ปวดหลัง',               allergies:[] },
  { id:'P7',  name:'นายอรุณ พิทักษ์',      hn:'6401567', gender:'ชาย',  ward:'Ward A', bed:'3A-03', age:48, condition:'ภูมิแพ้ + อักเสบ',             allergies:['Penicillin'] },
  { id:'P8',  name:'นายชลธี ศรีวรรณ',      hn:'6401388', gender:'ชาย',  ward:'Ward A', bed:'3A-06', age:60, condition:'ไขมันในเลือดสูง',              allergies:[] },
  { id:'P11', name:'นางสุภาพร วงศ์ทอง',    hn:'6401621', gender:'หญิง', ward:'Ward A', bed:'3A-10', age:55, condition:'ความดันสูง + ไขมันในเลือด',    allergies:[] },
  { id:'P12', name:'นายธนวัฒน์ พิมพ์ทอง', hn:'6401742', gender:'ชาย',  ward:'Ward A', bed:'3A-11', age:42, condition:'ปอดอักเสบ + เจ็บคอ',           allergies:['Sulfa'] },
  { id:'P13', name:'นางวรรณา สุขสม',        hn:'6401803', gender:'หญิง', ward:'Ward A', bed:'3A-12', age:68, condition:'เบาหวาน Type 2 + ความดัน',    allergies:[] },
  { id:'P14', name:'นายปิยะ ศรีสงคราม',    hn:'6401955', gender:'ชาย',  ward:'Ward A', bed:'3A-15', age:51, condition:'หัวใจวาย + บวมน้ำ',            allergies:['Aspirin','Ibuprofen'] },
  // Ward B — ICU / critical
  { id:'P4',  name:'นายประสิทธิ์ เก่งกล้า', hn:'6400211', gender:'ชาย',  ward:'Ward B', bed:'ICU-02', age:60, condition:'ติดเชื้อรุนแรง',       allergies:[] },
  { id:'P5',  name:'นางมานี แก้ว',           hn:'6400345', gender:'หญิง', ward:'Ward B', bed:'ICU-04', age:58, condition:'หัวใจขาดเลือด + DM',  allergies:['Sulfa'] },
  { id:'P6',  name:'นายสุรชัย ดีงาม',        hn:'6400478', gender:'ชาย',  ward:'Ward B', bed:'ICU-07', age:67, condition:'หลังผ่าตัด',          allergies:[] },
  { id:'P9',  name:'นางพิมพา ราตรี',          hn:'6400512', gender:'หญิง', ward:'Ward B', bed:'ICU-1',  age:71, condition:'ภาวะช็อก',            allergies:[] },
  { id:'P10', name:'นายชาติชาย กล้าหาญ',    hn:'6400634', gender:'ชาย',  ward:'Ward B', bed:'ICU-2',  age:53, condition:'หลอดเลือดสมอง',       allergies:[] },
];

function seedMcData() {
  // Patients are static reference data — always ensure they are present, even
  // when cartData was restored from sessionStorage (which skips full seeding).
  if (!MC_STATE.patients || !MC_STATE.patients.length) {
    MC_STATE.patients = _STATIC_PATIENTS.slice();
  }

  if (Object.keys(MC_STATE.cartData || {}).length) {
    // Already seeded — load active cart's data
    loadCartData(MC_STATE.currentCartId);
    return;
  }

  const now = Date.now();

  /* ───── Per-cart data ─────────────────────────────────────── */
  MC_STATE.cartData = {
    'CART-A01': buildCartA01Data(now),
    'CART-B01': buildCartB01Data(now),
  };

  // Patients are seeded above (idempotent via _STATIC_PATIENTS)

  /* ───── Orders (per patient based on condition) ────────── */
  MC_STATE.orders = [
    // P1 นภา (DM + HT)
    { id:'O01', patientId:'P1', drugId:'MET500',  rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    { id:'O02', patientId:'P1', drugId:'AMLO5',   rounds:['เช้า'],                qty:1, status:'PENDING' },
    { id:'O03', patientId:'P1', drugId:'SIM10',   rounds:['ก่อนนอน'],             qty:1, status:'PENDING' },
    // P2 วิชัย
    { id:'O04', patientId:'P2', drugId:'PARA500', rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O05', patientId:'P2', drugId:'LOR10',   rounds:['เช้า'],                qty:1, status:'PENDING' },
    // P3 สมหญิง
    { id:'O06', patientId:'P3', drugId:'IBU400',  rounds:['กลางวัน'],             qty:1, status:'PENDING' },
    { id:'O07', patientId:'P3', drugId:'OMEP20',  rounds:['เช้า'],                qty:1, status:'PENDING' },
    { id:'O08', patientId:'P3', drugId:'PARA500', rounds:['ก่อนนอน'],             qty:2, status:'PENDING' },
    // P7 อรุณ
    { id:'O17', patientId:'P7', drugId:'LOR10',   rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    { id:'O18', patientId:'P7', drugId:'PRED5',   rounds:['เช้า'],                qty:1, status:'PENDING' },
    // P8 ชลธี
    { id:'O19', patientId:'P8', drugId:'ATO20',   rounds:['ก่อนนอน'],             qty:1, status:'PENDING' },
    { id:'O20', patientId:'P8', drugId:'SIM10',   rounds:['ก่อนนอน'],             qty:1, status:'PENDING' },
    // P4 ประสิทธิ์ — ICU IV antibiotics
    { id:'O09', patientId:'P4', drugId:'CEF1G',   rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    { id:'O10', patientId:'P4', drugId:'NSS1000', rounds:['เช้า','กลางวัน','เย็น','ก่อนนอน'], qty:1, status:'PENDING' },
    // P5 มานี — ICU heart + DM
    { id:'O11', patientId:'P5', drugId:'INSREG',  rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O12', patientId:'P5', drugId:'HEP5K',   rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    { id:'O13', patientId:'P5', drugId:'NSS1000', rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    // P6 สุรชัย — post-op
    { id:'O14', patientId:'P6', drugId:'RL500',   rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O15', patientId:'P6', drugId:'PARA500', rounds:['เช้า','เย็น'],         qty:2, status:'PENDING' },
    // P9 พิมพา — ICU shock
    { id:'O21', patientId:'P9', drugId:'NAHCO3',  rounds:['เช้า','กลางวัน'],      qty:2, status:'PENDING' },
    { id:'O22', patientId:'P9', drugId:'D5W1000', rounds:['เช้า','เย็น'],         qty:1, status:'PENDING' },
    { id:'O23', patientId:'P9', drugId:'KCL10',   rounds:['เช้า'],                qty:2, status:'PENDING' },
    // P10 ชาติชาย — stroke
    { id:'O24', patientId:'P10', drugId:'HEP5K',  rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O25', patientId:'P10', drugId:'NSS1000',rounds:['เช้า','เย็น'],            qty:1, status:'PENDING' },
    // P11 สุภาพร (HT + high cholesterol) — completed
    { id:'O26', patientId:'P11', drugId:'AMLO5',   rounds:['เช้า'],                   qty:1, status:'PENDING' },
    { id:'O27', patientId:'P11', drugId:'OMEP20',  rounds:['เช้า','เย็น'],            qty:1, status:'PENDING' },
    { id:'O28', patientId:'P11', drugId:'SIM10',   rounds:['ก่อนนอน'],               qty:1, status:'PENDING' },
    { id:'O29', patientId:'P11', drugId:'PARA500', rounds:['เช้า','กลางวัน'],         qty:1, status:'PENDING' },
    // P12 ธนวัฒน์ (ปอดอักเสบ) — in progress
    { id:'O30', patientId:'P12', drugId:'AMOX250', rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O31', patientId:'P12', drugId:'PARA500', rounds:['เช้า','เย็น','ก่อนนอน'], qty:1, status:'PENDING' },
    { id:'O32', patientId:'P12', drugId:'OMEP20',  rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O33', patientId:'P12', drugId:'LOR10',   rounds:['เช้า','เย็น'],           qty:1, status:'PENDING' },
    // P13 วรรณา (DM2 + HT) — all pending
    { id:'O34', patientId:'P13', drugId:'MET500',  rounds:['เช้า','เย็น'],           qty:2, status:'PENDING' },
    { id:'O35', patientId:'P13', drugId:'AMLO5',   rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O36', patientId:'P13', drugId:'SIM10',   rounds:['ก่อนนอน'],              qty:1, status:'PENDING' },
    { id:'O37', patientId:'P13', drugId:'OMEP20',  rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O43', patientId:'P13', drugId:'INSREG',  rounds:['เช้า','เย็น'],           qty:1, status:'PENDING' },  // HIGH ALERT — insulin for DM
    // P14 ปิยะ (หัวใจวาย + บวมน้ำ) — all pending
    { id:'O38', patientId:'P14', drugId:'OMEP20',  rounds:['เช้า','เย็น'],           qty:1, status:'PENDING' },
    { id:'O39', patientId:'P14', drugId:'ATO20',   rounds:['ก่อนนอน'],              qty:1, status:'PENDING' },
    { id:'O40', patientId:'P14', drugId:'MET500',  rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O41', patientId:'P14', drugId:'PARA500', rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O42', patientId:'P14', drugId:'AMLO5',   rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O44', patientId:'P14', drugId:'HEP5K',   rounds:['เช้า','เย็น'],           qty:1, status:'PENDING' },  // HIGH ALERT — heparin for cardiac
  ];

  // Lock countdown timers (runtime only)
  MC_STATE.lockTimers = {};
  MC_STATE.cassetteLockTimers = {};

  // ─── Default session ────────────────────────────────────────
  MC_STATE.session.mode          = 'patient';
  MC_STATE.session.scope         = 'allday';
  MC_STATE.session.hisMode       = 'ONLINE';
  MC_STATE.session.hisStatus     = 'ok';
  MC_STATE.session.hisLastSync   = now - 8 * 60 * 1000;
  MC_STATE.session.hisOrderCount = 38;

  // ─── Order progress: all orders start PENDING (empty cart by default) ──

  // ─── Seed audit log ─────────────────────────────────────────
  const _m = min => now - min * 60 * 1000;
  MC_STATE.auditLog = [
    { ts:_m(2),  cassetteId:'C09', drugLabel:'Metformin 500 mg',   drawerId:'D3', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'นภา ใจดี',           qty:2 },
    { ts:_m(5),  cassetteId:'C01', drugLabel:'Paracetamol 500 mg', drawerId:'D1', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'วิชัย มานะ',         qty:3 },
    { ts:_m(7),  cassetteId:'C17', drugLabel:'Omeprazole 20 mg',   drawerId:'D5', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'สุภาพร วงศ์ทอง',     qty:2 },
    { ts:_m(9),  cassetteId:'C17', drugLabel:'Omeprazole 20 mg',   drawerId:'D5', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'สมหญิง รักดี',       qty:1 },
    { ts:_m(11), cassetteId:'C11', drugLabel:'Amlodipine 5 mg',    drawerId:'D3', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'สุภาพร วงศ์ทอง',     qty:1 },
    { ts:_m(13), cassetteId:'C15', drugLabel:'Simvastatin 10 mg',  drawerId:'D4', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'สุภาพร วงศ์ทอง',     qty:1 },
    { ts:_m(14), cassetteId:'C11', drugLabel:'Amlodipine 5 mg',    drawerId:'D3', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'นภา ใจดี',           qty:1 },
    { ts:_m(16), cassetteId:'',    drugLabel:'',                   drawerId:'D6', action:'PATIENT_PACKED',    user:'ภก.สมชาย', patient:'สุภาพร วงศ์ทอง',     patients:1 },
    { ts:_m(18), cassetteId:'',    drugLabel:'',                   drawerId:'D6', action:'PATIENT_PACKED',    user:'ภก.สมชาย', patient:'นภา ใจดี',           patients:1 },
    { ts:_m(21), cassetteId:'',    drugLabel:'',                   drawerId:'D6', action:'PATIENT_PACKED',    user:'ภก.สมชาย', patient:'วิชัย มานะ',         patients:1 },
    { ts:_m(26), cassetteId:'C05', drugLabel:'Amoxicillin 250 mg', drawerId:'D2', action:'DISPENSED_PATIENT', user:'ภก.สมชาย', patient:'ธนวัฒน์ พิมพ์ทอง', qty:3 },
    { ts:_m(28), cassetteId:null,  drugLabel:'',                   drawerId:'D2', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 2 · พื้นที่ควบคุม',    userRole:'PHARMACIST', reason:'MANUAL' },
    { ts:_m(34), cassetteId:'C19', drugLabel:'Loratadine 10 mg',   drawerId:'D5', action:'RETURNED',          user:'ภก.สมชาย' },
    { ts:_m(35), cassetteId:'C07', drugLabel:'Prednisolone 5 mg',  drawerId:'D2', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(39), cassetteId:'C19', drugLabel:'Loratadine 10 mg',   drawerId:'D5', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(45), cassetteId:null,  drugLabel:'',                   drawerId:'D5', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 5 · พื้นที่ควบคุม', userRole:'PHARMACIST', reason:'MANUAL' },
    { ts:_m(54), cassetteId:null,  drugLabel:'HIS Sync สำเร็จ',   drawerId:'—',  action:'HIS_SYNCED',        user:'ระบบ',      note:'38 orders · ONLINE' },
    { ts:_m(61), cassetteId:'C04', drugLabel:'Loratadine 10 mg',   drawerId:'D1', action:'REFILLED',          user:'ภก.สมชาย', added:15 },
    { ts:_m(68), cassetteId:'C03', drugLabel:'Ibuprofen 400 mg',   drawerId:'D1', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(76), cassetteId:null,  drugLabel:'',                   drawerId:'D1', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 1 · พื้นที่ทั่วไป',    userRole:'PHARMACIST', reason:'MANUAL' },
    { ts:_m(90), cassetteId:null,  drugLabel:'เริ่ม Session ใหม่', drawerId:'—',  action:'SESSION_STARTED',   user:'ภก.สมชาย', note:'เภสัชกร' },
  ];

  // Load default cart's drawers/cassettes/slots into active state
  loadCartData(MC_STATE.currentCartId);

  // Initial paused orders
  recomputePausedOrders(true);
}

/* ─── Per-cart data builders ────────────────────────────────── */
function buildCartA01Data(now) {
  // Template 1: 5 Zone 1 drawers × 4 cassettes + 1 Zone 2 drawer with 9 slots
  return {
    drawers: [
      { id:'D1', name:'ลิ้นชัก 1 · พื้นที่ทั่วไป',         zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D2', name:'ลิ้นชัก 2 · พื้นที่ควบคุม',         zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D3', name:'ลิ้นชัก 3 · พื้นที่ควบคุม',         zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D4', name:'ลิ้นชัก 4 · พื้นที่ทั่วไป',         zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D5', name:'ลิ้นชัก 5 · พื้นที่ควบคุม',         zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D6', name:'ลิ้นชัก 6 · พื้นที่จัดยาผู้ป่วย',     zone:2, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
    ],
    cassettes: [
      // D1 ยาสามัญ (20 cassettes) — empty by default; prep flow fills them dynamically
      { id:'C01',   drugId:null, drawerId:'D1', slotNumber:1,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C02',   drugId:null, drawerId:'D1', slotNumber:2,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C03',   drugId:null, drawerId:'D1', slotNumber:3,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C04',   drugId:null, drawerId:'D1', slotNumber:4,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C05', drugId:null, drawerId:'D1', slotNumber:5,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C06', drugId:null, drawerId:'D1', slotNumber:6,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C07', drugId:null, drawerId:'D1', slotNumber:7,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C08', drugId:null, drawerId:'D1', slotNumber:8,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C09', drugId:null, drawerId:'D1', slotNumber:9,  quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C10', drugId:null, drawerId:'D1', slotNumber:10, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C11', drugId:null, drawerId:'D1', slotNumber:11, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C12', drugId:null, drawerId:'D1', slotNumber:12, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C13', drugId:null, drawerId:'D1', slotNumber:13, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C14', drugId:null, drawerId:'D1', slotNumber:14, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C15', drugId:null, drawerId:'D1', slotNumber:15, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C16', drugId:null, drawerId:'D1', slotNumber:16, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C17', drugId:null, drawerId:'D1', slotNumber:17, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C18', drugId:null, drawerId:'D1', slotNumber:18, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C19', drugId:null, drawerId:'D1', slotNumber:19, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C20', drugId:null, drawerId:'D1', slotNumber:20, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D2 ยาเฉพาะ — empty
      { id:'C05', drugId:null, drawerId:'D2', slotNumber:1, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C06', drugId:null, drawerId:'D2', slotNumber:2, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C07', drugId:null, drawerId:'D2', slotNumber:3, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C08', drugId:null, drawerId:'D2', slotNumber:4, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C21', drugId:null, drawerId:'D2', slotNumber:5, quantity:0, maxQty:10, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C22', drugId:null, drawerId:'D2', slotNumber:6, quantity:0, maxQty:20, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      // D3 ยาฉีด — empty
      { id:'C09', drugId:null, drawerId:'D3', slotNumber:1, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C10', drugId:null, drawerId:'D3', slotNumber:2, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C11', drugId:null, drawerId:'D3', slotNumber:3, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C12', drugId:null, drawerId:'D3', slotNumber:4, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D4 ยาเด็ก — empty
      { id:'C13', drugId:null, drawerId:'D4', slotNumber:1, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C14', drugId:null, drawerId:'D4', slotNumber:2, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C15', drugId:null, drawerId:'D4', slotNumber:3, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C16', drugId:null, drawerId:'D4', slotNumber:4, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D5 ยาเฉพาะทาง — empty
      { id:'C17', drugId:null, drawerId:'D5', slotNumber:1, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C18', drugId:null, drawerId:'D5', slotNumber:2, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C19', drugId:null, drawerId:'D5', slotNumber:3, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C20', drugId:null, drawerId:'D5', slotNumber:4, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
    ],
    patientSlots: [
      { id:'S-01', slotNumber:1, patientId:'P1', status:'PACKED', packedItems:[
          { drugName:'Metformin',   drugDose:'500 mg', qty:2 },
          { drugName:'Amlodipine',  drugDose:'5 mg',   qty:1 },
          { drugName:'Simvastatin', drugDose:'10 mg',  qty:1 },
        ]},
      { id:'S-02', slotNumber:2, patientId:'P2', status:'PACKED', packedItems:[
          { drugName:'Paracetamol', drugDose:'500 mg', qty:3 },
          { drugName:'Loratadine',  drugDose:'10 mg',  qty:1 },
        ]},
      { id:'S-03', slotNumber:3, patientId:'P3', status:'ASSIGNED', packedItems:null },
      { id:'S-04', slotNumber:4, patientId:'P7', status:'ASSIGNED', packedItems:null },
      { id:'S-05', slotNumber:5, patientId:'P8', status:'ASSIGNED', packedItems:null },
      { id:'S-06', slotNumber:6, patientId:'P11', status:'PACKED',   packedItems:[
          { drugName:'Amlodipine',  drugDose:'5 mg',   qty:1 },
          { drugName:'Omeprazole',  drugDose:'20 mg',  qty:2 },
          { drugName:'Simvastatin', drugDose:'10 mg',  qty:1 },
        ]},
      { id:'S-07', slotNumber:7, patientId:'P12', status:'ASSIGNED', packedItems:null },
      { id:'S-08', slotNumber:8, patientId:'P13', status:'ASSIGNED', packedItems:null },
      { id:'S-09', slotNumber:9, patientId:'P14', status:'ASSIGNED', packedItems:null },
    ],
    initialOutCassettes: [],
  };
}

function buildCartB01Data(now) {
  // Template 2 ICU: 3 Zone 1 drawers + 1 Zone 2 (D1 6 cass, D2 6 cass, D3 4 cass, D4 6 slots)
  return {
    drawers: [
      { id:'D1', name:'ลิ้นชัก 1 · พื้นที่ควบคุม',          zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D2', name:'ลิ้นชัก 2 · พื้นที่ควบคุม',          zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D3', name:'ลิ้นชัก 3 · พื้นที่ทั่วไป',          zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D4', name:'ลิ้นชัก 4 · พื้นที่จัดยาผู้ป่วย',     zone:2, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
    ],
    cassettes: [
      // D1 ยา IV — empty; prep flow fills dynamically
      { id:'C01', drugId:null, drawerId:'D1', slotNumber:1, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C02', drugId:null, drawerId:'D1', slotNumber:2, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C03', drugId:null, drawerId:'D1', slotNumber:3, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C04', drugId:null, drawerId:'D1', slotNumber:4, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C05', drugId:null, drawerId:'D1', slotNumber:5, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C06', drugId:null, drawerId:'D1', slotNumber:6, quantity:0, maxQty:12, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D2 ยา IV สำรอง — empty
      { id:'C07', drugId:null, drawerId:'D2', slotNumber:1, quantity:0, maxQty:20, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C08', drugId:null, drawerId:'D2', slotNumber:2, quantity:0, maxQty:15, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C09', drugId:null, drawerId:'D2', slotNumber:3, quantity:0, maxQty:20, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C10', drugId:null, drawerId:'D2', slotNumber:4, quantity:0, maxQty:20, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C11', drugId:null, drawerId:'D2', slotNumber:5, quantity:0, maxQty:10, status:'IN', removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C12', drugId:null, drawerId:'D2', slotNumber:6, quantity:0, maxQty:15, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D3 ยากิน — empty
      { id:'C13', drugId:null, drawerId:'D3', slotNumber:1, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C14', drugId:null, drawerId:'D3', slotNumber:2, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C15', drugId:null, drawerId:'D3', slotNumber:3, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C16', drugId:null, drawerId:'D3', slotNumber:4, quantity:0, maxQty:30, status:'IN', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
    ],
    patientSlots: [
      { id:'S-01', slotNumber:1, patientId:'P4',  status:'ASSIGNED', packedItems:null },
      { id:'S-02', slotNumber:2, patientId:'P5',  status:'ASSIGNED', packedItems:null },
      { id:'S-03', slotNumber:3, patientId:'P6',  status:'ASSIGNED', packedItems:null },
      { id:'S-04', slotNumber:4, patientId:'P9',  status:'ASSIGNED', packedItems:null },
      { id:'S-05', slotNumber:5, patientId:'P10', status:'ASSIGNED', packedItems:null },
      { id:'S-06', slotNumber:6, patientId:null,  status:'EMPTY',    packedItems:null },
    ],
    initialOutCassettes: [],
  };
}

function _buildTemplateDataFor(cartId) {
  const cart = getCart(cartId);
  if (!cart) return;
  const tmpl = getCartTemplate(cart.templateId);
  if (!tmpl) return;

  const drawers = tmpl.drawers.map((td, idx) => ({
    id: `D${idx + 1}`,
    name: `ลิ้นชัก ${idx + 1} · ${td.label}`,
    zone: td.zone === 'ZONE1' ? 1 : 2,
    lockStatus: 'LOCKED',
    unlockedBy: null, unlockedAt: null, autoLockAfter: 30,
  }));

  const cassettes = [];
  let cNum = 1;
  tmpl.drawers.forEach((td, idx) => {
    if (td.zone !== 'ZONE1') return;
    const drawerId = `D${idx + 1}`;
    const totalSlots = (td.rows || 1) * (td.cols || td.cassetteSlots || 4);
    for (let slot = 1; slot <= totalSlots; slot++) {
      cassettes.push({
        id: `C${String(cNum++).padStart(2, '0')}`,
        drugId: null, drawerId, slotNumber: slot,
        quantity: 0, maxQty: 30, status: 'IN', removedAt: null,
        hasElectricLock: false, cassetteLockStatus: 'UNLOCKED',
      });
    }
  });

  const z2Def = tmpl.drawers.find(td => td.zone === 'ZONE2');
  const numSlots = z2Def ? (z2Def.patientSlots || 6) : 0;

  // Auto-assign patients from the global pool (offset by cart index so each cart gets different patients)
  const cartIdx = CARTS.findIndex(c => c.id === cartId);
  const patients = MC_STATE.patients || [];
  const offset = cartIdx * 3;

  const patientSlots = Array.from({ length: numSlots }, (_, i) => {
    const p = patients[(offset + i) % patients.length] || null;
    return {
      id: `S-${String(i + 1).padStart(2, '0')}`,
      slotNumber: i + 1,
      patientId: p ? p.id : null,
      status: p ? 'ASSIGNED' : 'EMPTY',
      packedItems: null,
    };
  });

  MC_STATE.cartData[cartId] = { drawers, cassettes, patientSlots, initialOutCassettes: [] };
}

function loadCartData(cartId) {
  if (!MC_STATE.cartData[cartId]) _buildTemplateDataFor(cartId);
  const data = MC_STATE.cartData[cartId];
  if (!data) return;

  MC_STATE.drawers = data.drawers;
  MC_STATE.cassettes = data.cassettes;
  MC_STATE.patientSlots = data.patientSlots;
  // log initial REMOVED audits if not yet logged for this cart
  (data.initialOutCassettes || []).forEach(cid => {
    const exists = MC_STATE.auditLog.find(e => e.action === 'REMOVED' && e.cassetteId === cid);
    if (!exists) addAudit('REMOVED', cid);
  });
  recomputePausedOrders(true);
}

/* ─── Patient / Order helpers ───────────────────────────────── */
function getPatient(id) { return MC_STATE.patients.find(p => p.id === id); }
function getOrder(id) { return MC_STATE.orders.find(o => o.id === id); }
function patientOrders(patientId) { return MC_STATE.orders.filter(o => o.patientId === patientId); }

// Returns orders filtered by current session scope (round/allday)
function ordersInScope(orders) {
  const s = MC_STATE.session;
  if (!s || s.scope === 'allday') return orders;
  if (s.scope === 'round' && s.round) {
    return orders.filter(o => o.rounds.includes(s.round));
  }
  return orders;
}

// Qty needed for a given order under current scope
function orderQtyInScope(order) {
  const s = MC_STATE.session;
  if (s.scope === 'round') return order.qty;             // one dose for the selected round
  if (s.scope === 'allday') return order.qty * order.rounds.length; // all rounds
  return order.qty;
}

function findCassetteByDrug(drugId) {
  return MC_STATE.cassettes.find(c => c.drugId === drugId);
}

function patientStatus(patientId) {
  const orders = ordersInScope(patientOrders(patientId));
  if (orders.length === 0) return 'NONE';
  if (orders.every(o => o.status === 'DONE' || o.status === 'SKIPPED')) return 'DONE';
  if (orders.some(o => o.status === 'IN_PROGRESS' || o.status === 'DONE')) return 'IN_PROGRESS';
  return 'PENDING';
}

function sessionScopeLabel() {
  const s = MC_STATE.session;
  if (!s || !s.scope) return '';
  if (s.scope === 'round') return `รอบ ${s.round}`;
  return 'ทั้งวัน';
}

function sessionModeLabel() {
  const s = MC_STATE.session;
  if (!s || !s.mode) return '';
  return s.mode === 'patient' ? 'ตามรายผู้ป่วย' : 'ตามรายการยา';
}

function getDrug(id) { return DRUG_LIST.find(d => d.id === id); }

/* ─── Cassette info modal (clicked from Drawer Map) ─── */
function openCassetteInfo(drawerId, slotNum) {
  const overlay = document.getElementById('cassInfoOverlay');
  const body    = document.getElementById('cassInfoBody');
  if (!overlay || !body) return;

  const cass    = (MC_STATE.cassettes || []).find(function(c) {
    return c.drawerId === drawerId && c.slotNumber === slotNum;
  });
  const drawer  = (MC_STATE.drawers || []).find(function(d) { return d.id === drawerId; });
  const isDone  = (typeof _PPD_DONE_CASSETTES !== 'undefined') &&
                  _PPD_DONE_CASSETTES.has(drawerId + ':' + slotNum);
  const drawerNum = drawerId.replace('D', '');

  const svgPill = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  const svgIV   = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="18" x2="12" y2="21"/></svg>';
  const svgEmpty = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';

  if (!cass || !cass.drugId) {
    var modal = document.getElementById('cassInfoModal');
    if (modal) modal.classList.add('cass-v2');

    body.innerHTML =
      '<div class="cass-info-v2">'
      + '<div class="cass-info-v2-header">'
      +   '<div class="cass-info-v2-avatar">C' + slotNum + '</div>'
      +   '<div class="cass-info-v2-head-text">'
      +     '<div class="cass-info-v2-eyebrow">CASSETTE DETAIL</div>'
      +     '<div class="cass-info-v2-title">Drawer ' + drawerNum + ' · Cassette ' + slotNum + '</div>'
      +     '<div class="cass-info-v2-tags">'
      +       '<span class="cass-info-v2-tag tag-empty">ว่าง</span>'
      +       '<span class="cass-info-v2-tag tag-info">ยังไม่ถูกจอง</span>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + '<div class="cass-info-v2-body">'
      +   '<div class="cass-info-v2-section">'
      +     '<div class="cass-info-v2-section-title">รายละเอียดช่อง</div>'
      +     '<div class="cass-info-v2-fields">'
      +       '<div class="cass-info-v2-field"><span class="lbl">ประเภท</span><span class="val muted">ยังไม่ถูกจอง</span></div>'
      +       '<div class="cass-info-v2-field"><span class="lbl">สถานะ</span><span class="val muted">ว่าง</span></div>'
      +       '<div class="cass-info-v2-field"><span class="lbl">รายการยา</span><span class="val muted">—</span></div>'
      +       '<div class="cass-info-v2-field"><span class="lbl">เวลาบันทึก</span><span class="val muted">—</span></div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="cass-info-v2-section">'
      +     '<div class="cass-info-v2-section-title">รายการยาในช่องนี้</div>'
      +     '<div class="cass-info-v2-empty-state">ช่องนี้ยังว่าง พร้อมเลือกใช้งาน</div>'
      +   '</div>'
      + '</div>'
      + '<div class="cass-info-v2-footer">'
      +   '<button type="button" class="cass-info-v2-btn cass-info-v2-btn-secondary" onclick="closeCassetteInfo()">ปิด</button>'
      +   (cass ? '<button type="button" class="cass-info-v2-btn cass-info-v2-btn-primary" onclick="openAssignDrug(\'' + cass.id + '\')">+ เลือกยา</button>'
              : '<button type="button" class="cass-info-v2-btn cass-info-v2-btn-primary" onclick="closeCassetteInfo()">ปิด</button>')
      + '</div>'
      + '</div>';
    overlay.hidden = false;
    return;
  }

  const drug = getDrug(cass.drugId);
  const isIV = drug && drug.type === 'iv';
  const unit = isIV ? 'ถุง' : 'เม็ด';
  const max  = cass.maxQty || (drug && drug.max) || 30;
  const qty  = cass.quantity || 0;

  // Collect ward orders for this drug
  const allWardOrders = _wardOrders().filter(function(o) { return o.drugId === cass.drugId; });
  const patientMap    = {};
  (MC_STATE.patients || []).forEach(function(p) { patientMap[p.id] = p; });

  // Filter by selected round if prep is round-scoped
  const prepRound     = typeof selectedPrepRound !== 'undefined' ? selectedPrepRound : null;
  const prepType      = typeof selectedPrepType  !== 'undefined' ? selectedPrepType  : null;
  const _PPW_ROUND_MAP_LOCAL = { morning:'เช้า', noon:'กลางวัน', evening:'เย็น', bedtime:'ก่อนนอน' };
  const roundTh       = (prepRound && prepRound !== 'all') ? (_PPW_ROUND_MAP_LOCAL[prepRound] || prepRound) : null;

  const scopedOrders  = roundTh
    ? allWardOrders.filter(function(o) { return o.rounds && o.rounds.includes(roundTh); })
    : allWardOrders;

  const totalDispense = scopedOrders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);
  const patientCount  = (new Set(scopedOrders.map(function(o) { return o.patientId; }))).size;

  // Prep-type label
  const _PTP_TYPE_LABELS_LOCAL = { patient:'จัดตามผู้ป่วย', medication:'จัดตามรายการยา', prn:'จัดยา PRN' };
  const _PTP_ROUND_LABELS_LOCAL = { all:'ทุกรอบเวลา', morning:'รอบเช้า', noon:'รอบกลางวัน', evening:'รอบเย็น', bedtime:'รอบก่อนนอน' };
  const prepTypeLabel  = (prepType  && _PTP_TYPE_LABELS_LOCAL[prepType])   || 'จัดยา';
  const prepRoundLabel = (prepRound && _PTP_ROUND_LABELS_LOCAL[prepRound]) || 'ทุกรอบเวลา';

  // Status pill
  let statusPill;
  if (isDone)                           statusPill = '<span class="cass-info-status-pill done">✓ จัดยาแล้ว</span>';
  else if (cass.status === 'OUT')       statusPill = '<span class="cass-info-status-pill warn">ถูกนำออก</span>';
  else if (cass.status === 'OUT_ALERT') statusPill = '<span class="cass-info-status-pill alert">ค้างนอกเกิน 30 นาที</span>';
  else                                  statusPill = '<span class="cass-info-status-pill ok">พร้อมใช้</span>';

  // Quantity progress bar (filled vs capacity)
  const qtyPct  = max > 0 ? Math.round(qty / max * 100) : 0;
  const qtyBarColor = qtyPct >= 60 ? 'var(--accent)' : qtyPct >= 30 ? '#f59e0b' : '#ef4444';
  const qtyBar  = '<div style="margin-top:5px;background:rgba(0,0,0,0.07);border-radius:4px;height:5px;overflow:hidden;">'
    + '<div style="height:100%;border-radius:4px;width:' + qtyPct + '%;background:' + qtyBarColor + ';transition:width .3s;"></div></div>';

  // Patient rows — show rounds per patient
  const patientRowsHtml = scopedOrders.map(function(o) {
    const p     = patientMap[o.patientId] || { name: o.patientId, bed: '—' };
    const init  = p.name ? p.name.replace(/^[^ก-๙]*/,'').charAt(0) || p.name.charAt(0) : '?';
    const rounds = roundTh ? roundTh : (o.rounds || []).join(' / ');
    return '<div class="cass-info-pt-row">'
      + '<div class="cass-info-pt-avatar">' + init + '</div>'
      + '<div class="cass-info-pt-info">'
      +   '<div class="cass-info-pt-name">' + (p.name || o.patientId) + '</div>'
      +   '<div class="cass-info-pt-bed">เตียง ' + (p.bed || '—') + (rounds ? ' · ' + rounds : '') + '</div>'
      + '</div>'
      + '<div class="cass-info-pt-qty">×' + (o.qty || 1) + ' ' + unit + '</div>'
      + '</div>';
  }).join('');

  // Round breakdown row (all-round mode: shows per-round qty chips)
  let roundBreakdownHtml = '';
  if (!roundTh) {
    const roundCounts = {};
    allWardOrders.forEach(function(o) {
      (o.rounds || []).forEach(function(r) {
        roundCounts[r] = (roundCounts[r] || 0) + (o.qty || 1);
      });
    });
    const roundOrder = ['เช้า','กลางวัน','เย็น','ก่อนนอน'];
    const chips = roundOrder.filter(function(r) { return roundCounts[r]; }).map(function(r) {
      return '<span class="cass-info-round-chip">' + r + ' · ' + roundCounts[r] + ' ' + unit + '</span>';
    }).join('');
    if (chips) roundBreakdownHtml =
      '<div class="cass-info-row" style="flex-direction:column;align-items:flex-start;gap:8px;">'
      + '<span class="cass-info-row-label">แบ่งตามรอบเวลา</span>'
      + '<div class="cass-info-round-row" style="margin:0;">' + chips + '</div>'
      + '</div>';
  }

  // ── Decide layout by prep mode ──
  const isPatientMode = prepType === 'patient'
    && typeof _PPW_DETAIL !== 'undefined'
    && _PPW_DETAIL.type === 'patient'
    && _PPW_DETAIL.id;

  if (isPatientMode) {
    // ════════════════════════════════════════════════════
    // PATIENT MODE: patient header + drug detail below
    // ════════════════════════════════════════════════════
    const pt   = patientMap[_PPW_DETAIL.id] || { name: _PPW_DETAIL.id, bed: '—', ward: '—', hn: '—' };
    const init = pt.name ? (pt.name.match(/[ก-๙a-zA-Z]/) ? pt.name.match(/[ก-๙a-zA-Z]/)[0] : pt.name.charAt(0)) : '?';

    // How much of this drug does THIS patient need?
    const ptOrders = scopedOrders.filter(function(o) { return o.patientId === _PPW_DETAIL.id; });
    const ptQty    = ptOrders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);
    const ptRounds = roundTh ? roundTh
      : ptOrders.length > 0 ? (ptOrders[0].rounds || []).join(' · ') : '—';

    const allergyHtml = (pt.allergies && pt.allergies.length > 0)
      ? '<div class="cass-info-allergy-row">⚠ Drug Allergy: ' + pt.allergies.join(', ') + '</div>'
      : '';

    body.innerHTML =
      // ── Patient header ──
      '<div class="cass-info-pt-hero">'
      + '<div class="cass-info-pt-hero-avatar">' + init + '</div>'
      + '<div class="cass-info-pt-hero-info">'
      +   '<div class="cass-info-pt-hero-eyebrow">จัดยาสำหรับผู้ป่วย</div>'
      +   '<div class="cass-info-pt-hero-name">' + (pt.name || _PPW_DETAIL.id) + '</div>'
      +   '<div class="cass-info-pt-hero-sub">'
      +     (pt.ward || '') + (pt.bed ? ' · เตียง ' + pt.bed : '') + (pt.hn ? ' · HN ' + pt.hn : '')
      +   '</div>'
      +   allergyHtml
      + '</div>'
      + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">'
      +   '<span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(79,70,229,.12);color:#4f46e5;">' + prepTypeLabel + '</span>'
      +   '<span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:#f1f5f9;color:#475569;">' + prepRoundLabel + '</span>'
      + '</div>'
      + '</div>'
      // ── Drug card inside cassette ──
      + '<div class="cass-info-drug-card">'
      +   '<div class="cass-info-drug-card-icon' + (isIV ? ' iv' : '') + '">' + (isIV ? svgIV : svgPill) + '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div class="cass-info-drug-card-name">' + (drug ? drug.name : cass.drugId) + '</div>'
      +     '<div class="cass-info-drug-card-dose">' + (drug ? drug.dose : '') + ' · ' + (isIV ? 'ยาฉีด/IV' : 'ยากิน') + '</div>'
      +   '</div>'
      +   (ptQty > 0
          ? '<div class="cass-info-drug-card-qty">×' + ptQty + ' ' + unit + '</div>'
          : '')
      + '</div>'
      // ── Cassette rows ──
      + '<div class="cass-info-rows">'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">ตำแหน่ง</span><span class="cass-info-row-val">' + (drawer ? drawer.name : 'ลิ้นชัก ' + drawerNum) + ' · ช่อง ' + slotNum + '</span></div>'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">ปริมาณในถาด</span>'
      +     '<span class="cass-info-row-val" style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:110px;">'
      +       '<span>' + qty + ' / ' + max + ' ' + unit + '</span>' + qtyBar
      +     '</span>'
      +   '</div>'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">รอบเวลา</span><span class="cass-info-row-val">' + ptRounds + '</span></div>'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">สถานะ</span>' + statusPill + '</div>'
      + '</div>';

  } else {
    // ════════════════════════════════════════════════════
    // DRUG MODE: drug header + patient list below
    // ════════════════════════════════════════════════════
    body.innerHTML =
      // ── Header: drug icon + name + prep-type badge ──
      '<div class="cass-info-head">'
      + '<div class="cass-info-icon' + (isIV ? ' iv' : '') + '">' + (isIV ? svgIV : svgPill) + '</div>'
      + '<div style="flex:1;min-width:0;">'
      +   '<div class="cass-info-name">' + (drug ? drug.name : cass.drugId) + '</div>'
      +   '<div class="cass-info-dose">' + (drug ? drug.dose : '') + ' · ' + (isIV ? 'ยาฉีด/IV' : 'ยากิน') + '</div>'
      +   '<div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap;">'
      +     '<span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;background:var(--accent-lt);color:var(--accent-dk);">' + prepTypeLabel + '</span>'
      +     '<span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;background:#f1f5f9;color:#475569;">' + prepRoundLabel + '</span>'
      +   '</div>'
      + '</div>'
      + '</div>'
      // ── Cassette detail rows ──
      + '<div class="cass-info-rows">'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">ตำแหน่ง</span><span class="cass-info-row-val">' + (drawer ? drawer.name : 'ลิ้นชัก ' + drawerNum) + ' · ช่อง ' + slotNum + '</span></div>'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">ปริมาณยา</span>'
      +     '<span class="cass-info-row-val" style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:110px;">'
      +       '<span>' + qty + ' / ' + max + ' ' + unit + '</span>' + qtyBar
      +     '</span>'
      +   '</div>'
      +   '<div class="cass-info-row"><span class="cass-info-row-label">จ่ายให้ผู้ป่วย</span><span class="cass-info-row-val ok">' + patientCount + ' คน · ' + totalDispense + ' ' + unit + '</span></div>'
      +   roundBreakdownHtml
      +   '<div class="cass-info-row"><span class="cass-info-row-label">สถานะ</span>' + statusPill + '</div>'
      + '</div>'
      // ── Patient list ──
      + (patientRowsHtml
          ? '<div class="cass-info-pt-section">'
            + '<div class="cass-info-pt-section-title">รายชื่อผู้ป่วย (' + patientCount + ' ราย)</div>'
            + patientRowsHtml
            + '</div>'
          : '<div style="padding:10px 0 4px;text-align:center;color:var(--text-3);font-size:12px;">ไม่มีรายการสำหรับรอบที่เลือก</div>');
  }

  overlay.hidden = false;
}

function closeCassetteInfo(e) {
  if (e && e.target && e.target.id !== 'cassInfoOverlay') return;
  const overlay = document.getElementById('cassInfoOverlay');
  if (overlay) overlay.hidden = true;
  const modal = document.getElementById('cassInfoModal');
  if (modal) modal.classList.remove('cass-v2');
}
function getCassette(id) { return MC_STATE.cassettes.find(c => c.id === id); }
function getDrawer(id) { return MC_STATE.drawers.find(d => d.id === id); }
function drawerCassettes(drawerId) { return MC_STATE.cassettes.filter(c => c.drawerId === drawerId); }

/* ─── Zone helpers ──────────────────────────────────────────── */
function zone1Drawers() { return MC_STATE.drawers.filter(d => d.zone === 1); }
function zone2Drawer()  { return MC_STATE.drawers.find(d => d.zone === 2); }

/* ─── Cassette picking ─────────────────────────────────────── */
// Prefer IN cassette with available qty, fallback to any matching drug
function findCassetteByDrug(drugId) {
  const usable = MC_STATE.cassettes.find(c => c.drugId === drugId && c.status === 'IN' && c.quantity > 0);
  if (usable) return usable;
  return MC_STATE.cassettes.find(c => c.drugId === drugId);
}

// All cassettes matching a drug (for total available across duplicates)
function cassettesByDrug(drugId) {
  return MC_STATE.cassettes.filter(c => c.drugId === drugId);
}

/* ─── Patient slots (Zone 2) ────────────────────────────────── */
function getPatientSlot(slotId) { return MC_STATE.patientSlots.find(s => s.id === slotId); }
function getSlotByPatient(patientId) { return MC_STATE.patientSlots.find(s => s.patientId === patientId); }
function getPatientFromSlot(slotId) {
  const s = getPatientSlot(slotId);
  return s && s.patientId ? getPatient(s.patientId) : null;
}

/* ─── Lock system ───────────────────────────────────────────── */
function isDrawerUnlocked(drawerId) {
  const d = getDrawer(drawerId);
  return d && d.lockStatus === 'UNLOCKED';
}

function canUserUnlockDrawer(user, drawer) {
  if (!user || !drawer) return false;
  if (user.role === 'ADMIN') return true;
  // Look up allowed roles from template if cart is configured
  const cart = MC_STATE.currentCartId ? getCart(MC_STATE.currentCartId) : null;
  const tmpl = cart ? getCartTemplate(cart.templateId) : null;
  if (tmpl) {
    const drawerNum = parseInt(drawer.id.replace('D',''), 10);
    const cfg = tmpl.drawers.find(d => d.drawerNumber === drawerNum);
    if (cfg) {
      if (!cfg.allowedRoles.includes(user.role)) return false;
      // Nurse extra rule on Zone 1: only when drawer has drugs in active session
      if (cfg.zone === 'ZONE1' && user.role === 'NURSE') {
        if (!MC_STATE.session.mode) return false;
        const orders = ordersInScope(MC_STATE.orders).filter(o => o.status === 'PENDING');
        return orders.some(o => {
          const cass = findCassetteByDrug(o.drugId);
          return cass && cass.drawerId === drawer.id;
        });
      }
      return true;
    }
  }
  // Fallback (no template configured)
  if (drawer.zone === 2) return true;
  if (user.role === 'PHARMACIST') return true;
  if (user.role === 'NURSE') {
    if (!MC_STATE.session.mode) return false;
    const orders = ordersInScope(MC_STATE.orders).filter(o => o.status === 'PENDING');
    return orders.some(o => {
      const cass = findCassetteByDrug(o.drugId);
      return cass && cass.drawerId === drawer.id;
    });
  }
  return false;
}

function addLockAudit(type, drawerId, user, extra={}) {
  const d = getDrawer(drawerId);
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    action: type,
    drawerId,
    drawerName: d ? d.name : drawerId,
    user: user ? user.name : MC_STATE.currentUser,
    userRole: user ? user.role : null,
    ...extra,
  });
}

function unlockDrawer(drawerId, user) {
  const d = getDrawer(drawerId);
  if (!d) return;
  d.lockStatus = 'UNLOCKED';
  d.unlockedBy = user.id;
  d.unlockedAt = Date.now();
  // clear existing timer if any
  if (MC_STATE.lockTimers[drawerId]) {
    clearTimeout(MC_STATE.lockTimers[drawerId]);
  }
  // set auto-lock after autoLockAfter seconds
  MC_STATE.lockTimers[drawerId] = setTimeout(() => {
    lockDrawer(drawerId, 'AUTO');
    showAutoLockBanner(drawerId);
    if (typeof rerenderLockViews === 'function') rerenderLockViews();
  }, (d.autoLockAfter || 30) * 1000);
  addLockAudit('DRAWER_UNLOCKED', drawerId, user);
}

/* ─── Cassette Electric Lock helpers ────────────────────────── */
function isCassetteElectricLocked(cassetteId) {
  const c = getCassette(cassetteId);
  return c && c.hasElectricLock && c.cassetteLockStatus !== 'UNLOCKED';
}

function unlockCassetteElectric(cassetteId, user) {
  const c = getCassette(cassetteId);
  if (!c || !c.hasElectricLock) return;
  c.cassetteLockStatus = 'UNLOCKED';
  if (!MC_STATE.cassetteLockTimers) MC_STATE.cassetteLockTimers = {};
  if (MC_STATE.cassetteLockTimers[cassetteId]) clearTimeout(MC_STATE.cassetteLockTimers[cassetteId]);
  MC_STATE.cassetteLockTimers[cassetteId] = setTimeout(() => {
    c.cassetteLockStatus = 'LOCKED';
    if (document.getElementById('slotList')) renderSlotList();
  }, 30000);
  addAudit('CASSETTE_UNLOCKED', cassetteId);
}

function lockCassetteElectric(cassetteId) {
  const c = getCassette(cassetteId);
  if (c) c.cassetteLockStatus = 'LOCKED';
  if (MC_STATE.cassetteLockTimers && MC_STATE.cassetteLockTimers[cassetteId]) {
    clearTimeout(MC_STATE.cassetteLockTimers[cassetteId]);
    delete MC_STATE.cassetteLockTimers[cassetteId];
  }
}

/* ─── Auto-lock banner (toast) ──────────────────────────────── */
function showAutoLockBanner(drawerId) {
  const drawer = getDrawer(drawerId);
  if (!drawer) return;
  // Don't show if user is not in active task
  if (!MC_STATE.session.user) return;
  let banner = document.getElementById('autoLockBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'autoLockBanner';
    banner.className = 'auto-lock-banner';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <div class="alb-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
    </div>
    <div class="alb-text">
      <div class="alb-title">${drawer.name} ล็อคอัตโนมัติ</div>
      <div class="alb-sub">หมดเวลา 30 วินาที — กดเปิดอีกครั้งเพื่อดำเนินการต่อ</div>
    </div>
    <button type="button" class="alb-btn" onclick="reopenDrawer('${drawerId}')">เปิดอีกครั้ง</button>
    <button type="button" class="alb-close" onclick="dismissAutoLockBanner()">×</button>
  `;
  banner.hidden = false;
  // auto-dismiss after 8s
  if (banner._t) clearTimeout(banner._t);
  banner._t = setTimeout(dismissAutoLockBanner, 8000);
}

function dismissAutoLockBanner() {
  const b = document.getElementById('autoLockBanner');
  if (b) b.hidden = true;
}

function reopenDrawer(drawerId) {
  dismissAutoLockBanner();
  // Same as confirmAndUnlock — but no PIN since session.user is already set
  confirmAndUnlock(drawerId);
}

function lockDrawer(drawerId, reason='MANUAL') {
  const d = getDrawer(drawerId);
  if (!d) return;
  d.lockStatus = 'LOCKED';
  d.unlockedBy = null;
  d.unlockedAt = null;
  if (MC_STATE.lockTimers[drawerId]) {
    clearTimeout(MC_STATE.lockTimers[drawerId]);
    delete MC_STATE.lockTimers[drawerId];
  }
  addLockAudit('DRAWER_LOCKED', drawerId, null, { reason });
}

function lockCountdownSeconds(drawerId) {
  const d = getDrawer(drawerId);
  if (!d || d.lockStatus !== 'UNLOCKED' || !d.unlockedAt) return 0;
  const elapsed = (Date.now() - d.unlockedAt) / 1000;
  return Math.max(0, Math.ceil((d.autoLockAfter || 30) - elapsed));
}

function rerenderLockViews() {
  // called after lock state changes — refresh any visible lists
  if (document.getElementById('drawerGrid')) renderDrawerGrid();
  if (document.getElementById('slotList')) renderSlotList();
  if (document.getElementById('patientOrderList')) renderPatientDetail();
  if (document.getElementById('drugDetailTable')) renderDrugDetail();
}

/* ─── PIN Modal ─────────────────────────────────────────────── */
let _pinPending = null; // { type, drawerId/cassetteId, onUnlock }

function openPinModal(drawerId, onUnlock) {
  _pinPending = { type: 'DRAWER', drawerId, onUnlock };
  const drawer = getDrawer(drawerId);
  document.getElementById('pinModalTarget').textContent = drawer ? drawer.name : drawerId;
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinSubmitBtn').disabled = true;
  updatePinDots('');
  setPinHint('user');
  document.getElementById('pinModal').hidden = false;
  setTimeout(() => document.getElementById('pinInput').focus(), 50);
}

function openCassettePinModal(cassetteId, onUnlock) {
  const c = getCassette(cassetteId);
  const drug = c ? getDrug(c.drugId) : null;
  _pinPending = { type: 'CASSETTE', cassetteId, onUnlock };
  const label = drug ? `Cassette · ${drug.name} ${drug.dose}` : cassetteId;
  document.getElementById('pinModalTarget').textContent = label;
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinSubmitBtn').disabled = true;
  updatePinDots('');
  setPinHint('user');
  document.getElementById('pinModal').hidden = false;
  setTimeout(() => document.getElementById('pinInput').focus(), 50);
}

function setPinHint(kind) {
  const list = document.getElementById('pinHintList');
  if (!list) return;
  if (kind === 'admin') {
    list.innerHTML = `<span>Admin · 0000</span>`;
  } else {
    list.innerHTML = `
      <span>ภก.สมชาย · 1234</span>
      <span>ภก.วิภา · 2345</span>
      <span>พย.นิดา · 3456</span>
      <span>พย.มนัส · 4567</span>`;
  }
}

function closePinModal() {
  _pinPending = null;
  document.getElementById('pinModal').hidden = true;
  document.getElementById('pinInput').value = '';
}

function onPinInput() {
  const v = document.getElementById('pinInput').value.replace(/\D/g, '').slice(0, 4);
  document.getElementById('pinInput').value = v;
  updatePinDots(v);
  document.getElementById('pinSubmitBtn').disabled = v.length !== 4;
}

function onPinKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!document.getElementById('pinSubmitBtn').disabled) submitPin();
  } else if (e.key === 'Escape') {
    closePinModal();
  }
}

function updatePinDots(pin) {
  const dots = document.querySelectorAll('#pinDots .pin-dot');
  dots.forEach((d, i) => d.classList.toggle('filled', i < pin.length));
}

function showPinError(msg) {
  const el = document.getElementById('pinError');
  el.textContent = msg;
  document.getElementById('pinInput').value = '';
  updatePinDots('');
  document.getElementById('pinSubmitBtn').disabled = true;
  document.getElementById('pinInput').focus();
}

function submitPin() {
  if (!_pinPending) return;
  const pin = document.getElementById('pinInput').value.trim();
  if (pin.length !== 4) return;
  const user = getUserByPin(pin);

  // Admin login special-case
  if (_pinPending.drawerId === 'ADMIN') {
    if (!user || user.role !== 'ADMIN') {
      showPinError('PIN ไม่ถูกต้อง — ต้องเป็น Admin');
      return;
    }
    const cb = _pinPending.onUnlock;
    closePinModal();
    if (cb) cb();
    return;
  }

  // Session auth — sets the user for the entire session
  if (_pinPending.drawerId === 'SESSION_AUTH') {
    if (!user || (user.role !== 'PHARMACIST' && user.role !== 'NURSE')) {
      showPinError('PIN ไม่ถูกต้อง — ต้องเป็นเภสัชกรหรือพยาบาล');
      return;
    }
    MC_STATE.session.user = user;
    MC_STATE.currentUser = user.name;
    MC_STATE.auditLog.unshift({
      ts: Date.now(),
      action:'SESSION_STARTED',
      drugLabel:'เริ่ม Session ใหม่',
      drawerId:'—',
      user: user.name,
      note: roleLabel(user.role),
    });
    const cb = _pinPending.onUnlock;
    closePinModal();
    if (cb) cb();
    return;
  }

  // Cassette electric lock unlock
  if (_pinPending && _pinPending.type === 'CASSETTE') {
    if (!user) {
      showPinError('PIN ไม่ถูกต้อง กรุณาลองใหม่');
      return;
    }
    const cassetteId = _pinPending.cassetteId;
    const cb = _pinPending.onUnlock;
    closePinModal();
    unlockCassetteElectric(cassetteId, user);
    if (typeof renderSlotList === 'function') renderSlotList();
    if (cb) cb();
    return;
  }

  const drawerId = _pinPending.type === 'DRAWER' ? _pinPending.drawerId : null;
  const drawer = getDrawer(drawerId);
  if (!drawer) { closePinModal(); return; }

  if (!user) {
    showPinError('PIN ไม่ถูกต้อง กรุณาลองใหม่');
    addLockAudit('UNLOCK_DENIED', drawer.id, null, { reason:'WRONG_PIN' });
    return;
  }
  if (!canUserUnlockDrawer(user, drawer)) {
    showPinError(`${user.name} (${roleLabel(user.role)}) ไม่มีสิทธิ์เปิด ${drawer.name}`);
    addLockAudit('UNLOCK_DENIED', drawer.id, user, { reason:'NO_PERMISSION' });
    return;
  }

  // Start unlocking animation
  const target = _pinPending;
  closePinModal();
  drawer.lockStatus = 'UNLOCKING';
  rerenderLockViews();

  setTimeout(() => {
    unlockDrawer(target.drawerId, user);
    rerenderLockViews();
    if (target.onUnlock) {
      try { target.onUnlock(); } catch (err) { console.error(err); }
    }
  }, 800);
}

/* ─── Cart setup auth (PIN 0000 / Admin before entering ตั้งค่าเครื่อง) ── */
function openCartSetupAuth() {
  _pinPending = { drawerId: 'ADMIN', onUnlock: () => { location.hash = '#pg-admin-carts'; } };
  document.getElementById('pinModalTarget').textContent = 'Admin Console — ยืนยัน Admin';
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinSubmitBtn').disabled = true;
  updatePinDots('');
  setPinHint('admin');
  document.getElementById('pinModal').hidden = false;
  setTimeout(() => document.getElementById('pinInput').focus(), 50);
}

/* ─── Session auth (PIN once at session start) ──────────────── */
function openSessionAuthModal(onSuccess) {
  _pinPending = { drawerId:'SESSION_AUTH', onUnlock: onSuccess };
  document.getElementById('pinModalTarget').textContent = 'เริ่ม Session — ยืนยันตัวตน';
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinSubmitBtn').disabled = true;
  updatePinDots('');
  setPinHint('user');
  document.getElementById('pinModal').hidden = false;
  setTimeout(() => document.getElementById('pinInput').focus(), 50);
}

/* ─── Unlock gate for actions ───────────────────────────────── */
// New auth model: PIN once at session start, drawer unlock = role check + confirm (no PIN).
function ensureUnlocked(drawerId, thenFn) {
  confirmAndUnlock(drawerId, thenFn);
}

function confirmAndUnlock(drawerId, thenFn) {
  const drawer = getDrawer(drawerId);
  if (!drawer) return;
  if (drawer.lockStatus === 'UNLOCKED') { thenFn && thenFn(); return; }
  if (drawer.lockStatus === 'UNLOCKING') return;

  const user = MC_STATE.session.user;
  // No session user yet — fallback to PIN modal (e.g. when user opens drawer page directly)
  if (!user) {
    openPinModal(drawerId, thenFn);
    return;
  }

  if (!canUserUnlockDrawer(user, drawer)) {
    alert(`${user.name} (${roleLabel(user.role)}) ไม่มีสิทธิ์เปิด ${drawer.name}`);
    addLockAudit('UNLOCK_DENIED', drawerId, user, { reason:'NO_PERMISSION' });
    return;
  }

  if (!confirm(`เปิด ${drawer.name}?\n\nผู้ใช้: ${user.name} (${roleLabel(user.role)})`)) return;

  drawer.lockStatus = 'UNLOCKING';
  rerenderLockViews();
  setTimeout(() => {
    unlockDrawer(drawerId, user);
    rerenderLockViews();
    if (thenFn) thenFn();
  }, 800);
}

function lockNow(drawerId) {
  lockDrawer(drawerId, 'MANUAL');
  rerenderLockViews();
}

function refreshAlertStatus() {
  const now = Date.now();
  MC_STATE.cassettes.forEach(c => {
    if (c.status === 'OUT' && c.removedAt && now - c.removedAt > OUT_ALERT_MS) {
      c.status = 'OUT_ALERT';
    }
  });
}

/* ─── Auto-pause / auto-resume orders ───────────────────────── */
function recomputePausedOrders(silent = false) {
  if (!MC_STATE.orders) return;
  MC_STATE.orders.forEach(o => {
    if (o.status !== 'PENDING' && o.status !== 'PAUSED') return;
    const usable = MC_STATE.cassettes.find(c =>
      c.drugId === o.drugId && c.status === 'IN' && c.quantity > 0);
    if (!usable && o.status === 'PENDING') {
      o.status = 'PAUSED';
      if (!silent) logOrderPauseResume('ORDER_PAUSED', o);
    } else if (usable && o.status === 'PAUSED') {
      o.status = 'PENDING';
      if (!silent) logOrderPauseResume('ORDER_RESUMED', o);
    }
  });
}

function logOrderPauseResume(type, o) {
  const drug = getDrug(o.drugId);
  const p = getPatient(o.patientId);
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    action: type,
    drugLabel: drug ? `${drug.name} ${drug.dose}` : '—',
    drawerId: '—',
    user: MC_STATE.currentUser,
    patient: p ? p.name : '—',
    note: type === 'ORDER_PAUSED' ? 'Cassette ถูกถอด' : 'Cassette กลับเข้าระบบ',
  });
}

function statusOf(cassette) { return cassette.status; }

function countByStatus() {
  refreshAlertStatus();
  const total = MC_STATE.cassettes.length;
  let inC = 0, out = 0, alert = 0;
  MC_STATE.cassettes.forEach(c => {
    if (c.status === 'IN') inC++;
    else if (c.status === 'OUT') out++;
    else if (c.status === 'OUT_ALERT') { out++; alert++; }
  });
  return { total, in: inC, out, alert };
}

function minutesAgo(ts) {
  if (!ts) return '—';
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'น้อยกว่า 1 นาที';
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  return `${h} ชม. ${m % 60} นาที`;
}

function addAudit(action, cassetteId, extra = {}) {
  const c = getCassette(cassetteId);
  const d = c ? getDrug(c.drugId) : null;
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    cassetteId,
    drugLabel: d ? `${d.name} ${d.dose}` : '—',
    drawerId: c ? c.drawerId : '—',
    action,
    user: MC_STATE.currentUser,
    ...extra,
  });
}

/* ─── Load-mode (pg-load-mode) — Session setup ─────────────── */
function initLoadMode() {
  const next = document.getElementById('modeNextBtn');
  if (!next) return;
  refreshCartSelect();
  const s = MC_STATE.session;
  // Auto-trigger HIS sync once per session if ONLINE + idle (silent background)
  if (s.user && s.hisMode === 'ONLINE' && s.hisStatus === 'idle') {
    setTimeout(simulateHisSync, 250);
  }
  // restore selection if re-entering page
  if (s.mode) {
    const el = document.querySelector(`.mode-option[data-group="type"][data-value="${s.mode}"]`);
    if (el) el.classList.add('selected');
  }
  if (s.scope) {
    const el = document.querySelector(`.mode-option[data-group="period"][data-value="${s.scope}"]`);
    if (el) el.classList.add('selected');
    document.getElementById('modeRoundPills').hidden = s.scope !== 'round';
  }
  if (s.round) {
    const pill = document.querySelector(`.round-pill[data-round="${s.round}"]`);
    if (pill) pill.classList.add('selected');
  }
  updateModeNext();
}

function selectModeOption(el) {
  const group = el.dataset.group;
  document.querySelectorAll(`.mode-option[data-group="${group}"]`).forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  const value = el.dataset.value;
  if (group === 'type') {
    MC_STATE.session.mode = value;
  } else if (group === 'period') {
    MC_STATE.session.scope = value;
    const pills = document.getElementById('modeRoundPills');
    if (pills) pills.hidden = (value !== 'round');
    if (value !== 'round') MC_STATE.session.round = null;
  }
  updateModeNext();
}

function selectRound(round) {
  document.querySelectorAll('.round-pill').forEach(p => p.classList.toggle('selected', p.dataset.round === round));
  MC_STATE.session.round = round;
  updateModeNext();
}

function updateModeNext() {
  const btn = document.getElementById('modeNextBtn');
  if (!btn) return;
  const s = MC_STATE.session;
  const modeOk = s.mode && s.scope && (s.scope !== 'round' || s.round);
  btn.disabled = !modeOk;
}

function proceedLoadMode() {
  const s = MC_STATE.session;
  if (!s.mode || !s.scope) return;
  if (s.scope === 'round' && !s.round) return;
  location.hash = s.mode === 'patient' ? '#pg-patient-queue' : '#pg-drug-queue';
}

/* ─── Cart selector in pg-load-mode ─────────────────────────── */
function refreshCartSelect() {
  const sel = document.getElementById('sessionCartSelect');
  if (!sel) return;
  const active = CARTS.filter(c => c.isActive);
  sel.innerHTML = active.map(c => `<option value="${c.id}" ${c.id===MC_STATE.currentCartId?'selected':''}>${c.name}</option>`).join('');
}
function setSessionCart(id) {
  MC_STATE.currentCartId = id;
  loadCartData(id);
  refreshCartSelect();
  rerenderLockViews();
}

/* ─── Patients in current cart ──────────────────────────────── */
function patientsInCurrentCart() {
  const slotIds = (MC_STATE.patientSlots || [])
    .map(s => s.patientId)
    .filter(Boolean);
  return MC_STATE.patients.filter(p => slotIds.includes(p.id));
}

function isPatientInCurrentCart(patientId) {
  return (MC_STATE.patientSlots || []).some(s => s.patientId === patientId);
}

/* ─── Session Override panel (pg-session-config) ────────────── */
function initSessionConfig() {
  const root = document.getElementById('sessionCfgRoot');
  if (!root) return;
  seedMcData();
  const cart = getCart(MC_STATE.currentCartId);
  if (!cart) { location.hash = '#pg-load-mode'; return; }
  const tmpl = getCartTemplate(cart.templateId);
  const sub = document.getElementById('sessionCfgSub');
  if (sub) sub.textContent = `${cart.name} · Template: ${tmpl ? tmpl.name : '—'}`;
  renderSessionConfig();
}

function renderSessionConfig() {
  const root = document.getElementById('sessionCfgRoot');
  if (!root) return;
  const cart = getCart(MC_STATE.currentCartId);
  const tmpl = getCartTemplate(cart.templateId);
  if (!tmpl) { root.innerHTML = '<div class="audit-empty">ไม่พบ Template</div>'; return; }

  root.innerHTML = tmpl.drawers
    .filter(d => d.zone !== 'DISABLED')
    .map(d => {
      const drawerId = 'D' + d.drawerNumber;
      if (d.zone === 'ZONE1') return renderZone1ConfigBlock(d, drawerId);
      if (d.zone === 'ZONE2') return renderZone2ConfigBlock(d, drawerId);
      return '';
    }).join('');
}

function renderZone1ConfigBlock(cfg, drawerId) {
  const slots = (cfg.rows || 1) * (cfg.cols || cfg.cassetteSlots || 0);
  const usedDrugs = {};
  const rows = [];
  for (let i = 1; i <= slots; i++) {
    const cass = MC_STATE.cassettes.find(c => c.drawerId === drawerId && c.slotNumber === i);
    const drugId = cass ? cass.drugId : '';
    if (drugId) {
      usedDrugs[drugId] = (usedDrugs[drugId] || 0) + 1;
    }
    rows.push({ slotNumber: i, cass, drugId });
  }
  const dupDrugs = Object.entries(usedDrugs).filter(([_, n]) => n > 1).map(([id]) => id);

  return `
    <div class="form-card sess-cfg-block sess-cfg-zone1">
      <div class="form-card-title-row">
        <div class="form-card-title">${drawerId} · ${cfg.label}</div>
        <span class="sess-cfg-meta">${slots} cassette slots</span>
      </div>
      ${dupDrugs.length ? `<div class="sess-warn">⚠ ยาซ้ำใน Drawer นี้: ${dupDrugs.map(id => getDrug(id)?.name).join(', ')}</div>` : ''}
      <div class="sess-cfg-rows">
        ${rows.map(r => `
          <div class="sess-cfg-row">
            <span class="sess-slot-num">ช่อง ${r.slotNumber}</span>
            <select onchange="changeCassetteDrug('${drawerId}', ${r.slotNumber}, this.value)">
              <option value="">— ว่าง —</option>
              ${DRUG_LIST.map(dr => `<option value="${dr.id}" ${dr.id===r.drugId?'selected':''}>${dr.name} ${dr.dose}</option>`).join('')}
            </select>
            ${r.cass ? `<span class="sess-cass-id">${r.cass.id}</span>` : '<span class="sess-cass-id sess-cass-empty">—</span>'}
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderZone2ConfigBlock(cfg, drawerId) {
  const slots = cfg.patientSlots || 0;
  const allSlots = MC_STATE.patientSlots.slice(0, slots);
  const assignedPatients = new Set(allSlots.map(s => s.patientId).filter(Boolean));

  return `
    <div class="form-card sess-cfg-block sess-cfg-zone2">
      <div class="form-card-title-row">
        <div class="form-card-title">${drawerId} · ${cfg.label}</div>
        <span class="sess-cfg-meta">${slots} patient slots</span>
      </div>
      <div class="sess-cfg-rows">
        ${allSlots.map(s => `
          <div class="sess-cfg-row">
            <span class="sess-slot-num">${s.id}</span>
            <select onchange="changeSlotPatient('${s.id}', this.value)">
              <option value="">— ว่าง —</option>
              ${MC_STATE.patients.map(p => `
                <option value="${p.id}" ${s.patientId===p.id?'selected':''}>
                  ${p.name} (${p.ward} · เตียง ${p.bed})
                </option>
              `).join('')}
            </select>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function changeCassetteDrug(drawerId, slotNumber, drugId) {
  const cass = MC_STATE.cassettes.find(c => c.drawerId === drawerId && c.slotNumber === slotNumber);
  if (!drugId) {
    if (cass) {
      const old = getDrug(cass.drugId);
      MC_STATE.cassettes = MC_STATE.cassettes.filter(c => c !== cass);
      MC_STATE.auditLog.unshift({
        ts: Date.now(), action:'SESSION_CONFIG_CHANGED',
        drugLabel: 'ยกเลิก cassette', drawerId,
        user: MC_STATE.currentUser,
        note: `${drawerId} ช่อง ${slotNumber}: ลบ ${old?.name || cass.drugId}`,
      });
    }
    renderSessionConfig();
    return;
  }
  const newDrug = getDrug(drugId);
  if (cass) {
    if (cass.drugId === drugId) return;
    const oldDrug = getDrug(cass.drugId);
    cass.drugId = drugId;
    MC_STATE.auditLog.unshift({
      ts: Date.now(), action:'SESSION_CONFIG_CHANGED',
      drugLabel: `${newDrug.name} ${newDrug.dose}`, drawerId,
      user: MC_STATE.currentUser,
      note: `${drawerId} ช่อง ${slotNumber}: เปลี่ยน ${oldDrug?.name || cass.drugId} → ${newDrug.name}`,
    });
  } else {
    const newId = 'C' + String(MC_STATE.cassettes.length + 1).padStart(2, '0');
    MC_STATE.cassettes.push({
      id:newId, drugId, drawerId, slotNumber,
      quantity: newDrug.max, maxQty: newDrug.max,
      status:'IN', removedAt:null,
    });
    MC_STATE.auditLog.unshift({
      ts: Date.now(), action:'SESSION_CONFIG_CHANGED',
      drugLabel: `${newDrug.name} ${newDrug.dose}`, drawerId,
      user: MC_STATE.currentUser,
      note: `${drawerId} ช่อง ${slotNumber}: เพิ่ม ${newDrug.name}`,
    });
  }
  renderSessionConfig();
}

function changeSlotPatient(slotId, patientId) {
  const slot = getPatientSlot(slotId);
  if (!slot) return;
  if (patientId) {
    // Validation: a patient can only be in 1 slot
    const conflict = MC_STATE.patientSlots.find(s => s !== slot && s.patientId === patientId);
    if (conflict) {
      alert(`ผู้ป่วยนี้อยู่ใน ${conflict.id} แล้ว — ผู้ป่วย 1 คนมีได้แค่ 1 slot ต่อ session`);
      renderSessionConfig();
      return;
    }
  }
  const oldName = slot.patientId ? getPatient(slot.patientId)?.name : null;
  const newName = patientId ? getPatient(patientId)?.name : null;
  slot.patientId = patientId || null;
  slot.status = patientId ? 'ASSIGNED' : 'EMPTY';
  MC_STATE.auditLog.unshift({
    ts: Date.now(), action:'SESSION_CONFIG_CHANGED',
    drugLabel: 'Slot assignment', drawerId: 'D6',
    user: MC_STATE.currentUser,
    note: `${slotId}: ${oldName || '—'} → ${newName || '—'}`,
  });
  renderSessionConfig();
}

function resetSessionConfig() {
  if (!confirm('รีเซ็ต Config กลับเป็นค่าเริ่มต้นจาก Template?')) return;
  // Force re-seed by clearing all per-cart data
  MC_STATE.cartData = {};
  MC_STATE.drawers = [];
  MC_STATE.cassettes = [];
  MC_STATE.patientSlots = [];
  MC_STATE.orders = [];
  seedMcData();
  MC_STATE.auditLog.unshift({
    ts: Date.now(), action:'SESSION_CONFIG_CHANGED',
    drugLabel: 'รีเซ็ต Config', drawerId:'—',
    user: MC_STATE.currentUser, note:'กลับค่าเริ่มต้นจาก Template',
  });
  renderSessionConfig();
}

function confirmSessionConfig() { location.hash = '#pg-load-mode'; }

/* ─── Drawer reorder (admin) ───────────────────────────────── */
function moveDrawer(idx, dir) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= t.drawers.length) return;
  const tmp = t.drawers[idx];
  t.drawers[idx] = t.drawers[newIdx];
  t.drawers[newIdx] = tmp;
  // renumber
  t.drawers.forEach((d, i) => d.drawerNumber = i + 1);
  renderTemplateEdit(t);
}

/* ─── Admin login ───────────────────────────────────────────── */
function logout() {
  MC_STATE.currentUser = null;
  location.hash = '#pg-cart';
}

/* ─── HIS Sync ──────────────────────────────────────────────── */
function setHisMode(mode) {
  MC_STATE.session.hisMode = mode;
  if (mode === 'OFFLINE') {
    // Use pre-loaded cache immediately
    MC_STATE.session.hisStatus = 'ok';
    MC_STATE.session.hisLastSync = Date.now();
    MC_STATE.session.hisOrderCount = MC_STATE.orders.length;
    addHisAudit('HIS_OFFLINE', `ใช้ Cache · ${MC_STATE.orders.length} orders`);
  } else {
    MC_STATE.session.hisStatus = 'idle';
  }
  renderHisPanel();
}

function simulateHisSync() {
  MC_STATE.session.hisStatus = 'loading';
  renderHisPanel();
  setTimeout(() => {
    // 80% success rate
    const success = Math.random() < 0.8;
    if (success) {
      MC_STATE.session.hisStatus = 'ok';
      MC_STATE.session.hisLastSync = Date.now();
      MC_STATE.session.hisOrderCount = MC_STATE.orders.length;
      addHisAudit('HIS_SYNCED', `${MC_STATE.orders.length} orders · ONLINE`);
    } else {
      MC_STATE.session.hisStatus = 'error';
      addHisAudit('HIS_OFFLINE', 'HIS ไม่ตอบสนอง');
    }
    renderHisPanel();
  }, 1000);
}

function useHisCacheFallback() {
  MC_STATE.session.hisStatus = 'ok';
  MC_STATE.session.hisLastSync = Date.now();
  MC_STATE.session.hisOrderCount = MC_STATE.orders.length;
  addHisAudit('HIS_OFFLINE', `Fallback Cache · ${MC_STATE.orders.length} orders`);
  renderHisPanel();
}

function addHisAudit(type, note) {
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    action: type,
    drugLabel: type === 'HIS_SYNCED' ? 'HIS Sync สำเร็จ' : 'HIS Offline',
    drawerId: '—',
    user: MC_STATE.currentUser,
    note,
  });
}

function renderHisPanel() {
  const el = document.getElementById('hisPanel');
  if (!el) return;
  const s = MC_STATE.session;
  const lastSync = s.hisLastSync
    ? new Date(s.hisLastSync).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
    : '—';

  let body = '';
  if (s.hisMode === 'OFFLINE') {
    body = `
      <div class="his-status his-offline">
        <span class="his-dot"></span>
        <div class="his-status-text">
          <div class="his-status-title">โหมด Offline</div>
          <div class="his-status-sub">ใช้ข้อมูล Cache · ${s.hisOrderCount} orders · ล่าสุด ${lastSync}</div>
        </div>
      </div>`;
  } else if (s.hisStatus === 'idle') {
    body = `
      <div class="his-status his-idle">
        <span class="his-dot"></span>
        <div class="his-status-text">
          <div class="his-status-title">พร้อมเชื่อมต่อ HIS</div>
          <div class="his-status-sub">กดปุ่ม Sync เพื่อดึงข้อมูลล่าสุด</div>
        </div>
        <button type="button" class="mc-btn mc-btn-primary his-btn" onclick="simulateHisSync()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Sync HIS
        </button>
      </div>`;
  } else if (s.hisStatus === 'loading') {
    body = `
      <div class="his-status his-loading">
        <span class="rfid-spinner" style="width:14px;height:14px"></span>
        <div class="his-status-text">
          <div class="his-status-title">กำลังเชื่อมต่อ HIS...</div>
          <div class="his-status-sub">ดึง orders จากระบบ HIS</div>
        </div>
      </div>`;
  } else if (s.hisStatus === 'ok') {
    body = `
      <div class="his-status his-ok">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div class="his-status-text">
          <div class="his-status-title">HIS Sync สำเร็จ</div>
          <div class="his-status-sub">${s.hisOrderCount} orders · ${lastSync}</div>
        </div>
      </div>`;
  } else if (s.hisStatus === 'error') {
    body = `
      <div class="his-status his-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="his-status-text">
          <div class="his-status-title">HIS ไม่ตอบสนอง</div>
          <div class="his-status-sub">เลือกการดำเนินการต่อ</div>
        </div>
        <div class="his-actions">
          <button type="button" class="mc-btn mc-btn-outline his-btn" onclick="useHisCacheFallback()">ใช้ Cache</button>
          <button type="button" class="mc-btn mc-btn-outline his-btn" onclick="simulateHisSync()">ลองใหม่</button>
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div class="his-panel-head">
      <div class="his-panel-title">HIS Connection</div>
      <div class="his-mode-toggle">
        <button type="button" class="${s.hisMode==='ONLINE'?'on':''}" onclick="setHisMode('ONLINE')">Online</button>
        <button type="button" class="${s.hisMode==='OFFLINE'?'on':''}" onclick="setHisMode('OFFLINE')">Offline</button>
      </div>
    </div>
    ${body}
  `;
  // Update load-mode next button: only allow proceeding when HIS is OK
  updateModeNext();
}

/* ─── Entry: ใช้งานตามปกติ ──────────────────────────────────── */
function startNormalFlow() {
  location.hash = '#pg-prep-type';
}

function openAdminLogin() {
  _pinPending = { drawerId:'ADMIN', onUnlock: enterAdmin };
  document.getElementById('pinModalTarget').textContent = 'ตั้งค่าระบบ (Admin)';
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinSubmitBtn').disabled = true;
  updatePinDots('');
  setPinHint('admin');
  document.getElementById('pinModal').hidden = false;
  setTimeout(() => document.getElementById('pinInput').focus(), 50);
}

function enterAdmin() {
  MC_STATE.isAdmin = true;
  location.hash = '#pg-admin-carts';
}

function exitAdmin() {
  MC_STATE.isAdmin = false;
  location.hash = '#pg-cart';
}

function saveAdminConfig() {
  const btn = document.getElementById('adminSaveBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> บันทึกแล้ว`;
  setTimeout(() => {
    MC_STATE.isAdmin = false;
    location.hash = '#pg-cart';
  }, 800);
}

/* ─── CFG-1 Cart List ───────────────────────────────────────── */
function initAdminCarts() {
  const list = document.getElementById('cartList');
  if (!list) return;
  if (!MC_STATE.isAdmin) { location.hash = '#pg-load-mode'; return; }
  seedMcData();
  renderCartList();
  renderHisPanel();
  renderPendingBadge();
}

function renderTmplList() {
  const list = document.getElementById('tmplList');
  if (!list) return;
  list.innerHTML = CART_TEMPLATES.map(t => {
    const used = CARTS.filter(c => c.templateId === t.id).length;
    const drawerChips = t.drawers.map(d =>
      `<span class="tmpl-drawer-chip">${d.label}</span>`
    ).join('');
    return `
      <div class="tmpl-card">
        <div class="tmpl-card-top">
          <div>
            <div class="tmpl-card-name">${t.name}</div>
            <div class="tmpl-card-meta">${t.drawers.length} ลิ้นชัก · ใช้กับรถ <b>${used}</b> คัน</div>
          </div>
          <button type="button" class="mc-btn mc-btn-outline" onclick="editTemplate('${t.id}')">แก้ไข</button>
        </div>
        <div class="tmpl-drawer-chips">${drawerChips}</div>
      </div>`;
  }).join('') || '<div class="audit-empty">ยังไม่มี Template</div>';
}

function showTemplatesPanel() {
  const el = document.getElementById('tmplList');
  if (el) el.scrollIntoView({ behavior:'smooth' });
}

function renderCartList() {
  renderTmplList();
  const list = document.getElementById('cartList');
  if (!list) return;
  const tmplOptions = CART_TEMPLATES.map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('');

  const hwId = MC_STATE.hardwareId || 'MC-A-001';
  list.innerHTML = CARTS.map(c => {
    const tmpl        = getCartTemplate(c.templateId);
    const isCurrent   = c.id === MC_STATE.currentCartId;
    const pairedHere  = c.pairedHwId === hwId;
    const pairedOther = c.pairedHwId && !pairedHere;
    const canPair     = !pairedOther && c.isActive;
    const stateClass  = !c.isActive ? 'cart-card-off' : pairedOther ? 'cart-card-paired' : isCurrent ? 'cart-current' : '';

    const pairStatus = pairedHere
      ? `<span class="cc-pair-status cc-pair-mine"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> จับคู่กับเครื่องนี้ (${hwId})</span>`
      : pairedOther
        ? `<span class="cc-pair-status cc-pair-other"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> จับคู่กับ ${c.pairedHwId}</span>`
        : `<span class="cc-pair-status cc-pair-none">ยังไม่ได้จับคู่</span>`;

    return `
      <div class="cart-card ${stateClass}" id="cc-${c.id}">
        <div class="cart-card-header">
          <div>
            <div class="cart-card-name">${c.name}</div>
            <div class="cart-card-ward"><span class="cart-card-id">${c.id}</span></div>
          </div>
          ${isCurrent ? '<span class="cart-badge cart-badge-current">ใช้อยู่</span>' : ''}
        </div>

        <div class="cart-field-row">
          <label class="cart-field-label">Template</label>
          <select class="cart-tmpl-select" onchange="setCartTemplate('${c.id}', this.value)">
            ${CART_TEMPLATES.map(t => `<option value="${t.id}" ${c.templateId===t.id?'selected':''}>${t.name}</option>`).join('')}
          </select>
        </div>

        <div class="cart-tmpl-info">
          ${tmpl ? tmpl.drawers.map(d => `<span class="cart-tmpl-chip">${d.label}</span>`).join('') : ''}
        </div>

        <div class="cc-pair-row">
          ${pairStatus}
          ${canPair && !pairedHere
            ? `<button type="button" class="cc-pair-btn" onclick="pairCartHere('${c.id}')">จับคู่กับเครื่องนี้</button>`
            : pairedHere
              ? `<button type="button" class="cc-pair-btn cc-pair-btn-unlink" onclick="unpairCart('${c.id}')">ยกเลิกการจับคู่</button>`
              : ''}
        </div>

        <div class="cart-card-footer">
          <label class="cart-toggle-wrap">
            <input type="checkbox" class="cart-toggle-input" ${c.isActive?'checked':''}
              onchange="toggleCartActive('${c.id}')">
            <span class="cart-toggle-track"><span class="cart-toggle-thumb"></span></span>
            <span class="cart-toggle-label">${c.isActive?'เปิดใช้งาน':'ปิดใช้งาน'}</span>
          </label>
          <div class="cc-actions">
            <button type="button" class="cc-action-btn" onclick="editCart('${c.id}')" title="แก้ไข">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              แก้ไข
            </button>
            <button type="button" class="cc-action-btn cc-action-delete" onclick="deleteCart('${c.id}')" title="ลบ" ${isCurrent ? 'disabled title="ไม่สามารถลบรถที่กำลังใช้งาน"' : ''}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              ลบ
            </button>
          </div>
        </div>
      </div>`;
  }).join('') || '<div class="audit-empty">ยังไม่มีรถเข็น</div>';
}

function useCart(id) {
  MC_STATE.currentCartId = id;
  renderCartList();
}

function editCart(id) {
  MC_STATE.editingCartId = id;
  location.hash = '#pg-admin-cart-edit';
}

function setCartTemplate(id, templateId) {
  const c = getCart(id);
  if (!c) return;
  c.templateId = templateId;
  // Rebuild drawer/cassette data from new template (clears old config)
  delete MC_STATE.cartData[id];
  _buildTemplateDataFor(id);
  // If this is the active cart, reload live state
  if (id === MC_STATE.currentCartId) loadCartData(id);
  renderCartList();
}

function toggleCartActive(id) {
  const c = getCart(id);
  if (c) { c.isActive = !c.isActive; renderCartList(); }
}

function pairCartHere(id) {
  const hwId = MC_STATE.hardwareId || 'MC-A-001';
  CARTS.forEach(c => { if (c.pairedHwId === hwId) c.pairedHwId = null; });
  const c = getCart(id);
  if (c) { c.pairedHwId = hwId; MC_STATE.currentCartId = id; }
  renderCartList();
}

function unpairCart(id) {
  const c = getCart(id);
  if (c) { c.pairedHwId = null; }
  renderCartList();
}

function deleteCart(id) {
  if (id === MC_STATE.currentCartId) return;
  if (!confirm('ลบรถเข็นนี้ออกจากระบบใช่ไหม?')) return;
  const idx = CARTS.findIndex(c => c.id === id);
  if (idx !== -1) CARTS.splice(idx, 1);
  renderCartList();
}

function newCart() {
  const newId = 'CART-' + (CARTS.length + 1).toString().padStart(3, '0');
  const c = { id:newId, name:`รถเข็นใหม่ ${newId}`, templateId:CART_TEMPLATES[0].id, isActive:true };
  CARTS.push(c);
  editCart(newId);
}

/* ─── Pending IoT Devices (mock data) ──────────────────────── */
const PENDING_DEVICES = [
  { mac:'AA:BB:CC:DD:EE:F1', connectedAt: Date.now() - 5  * 60 * 1000, keyStatus:'ok' },
  { mac:'CC:DD:EE:FF:00:A3', connectedAt: Date.now() - 2  * 60 * 1000, keyStatus:'ok' },
];

let _acmSelectedMac = null;

function openAddCartModal() {
  _acmSelectedMac = null;
  renderAcmStep1();
  document.getElementById('addCartModal').hidden = false;
  document._acmEsc = e => { if (e.key === 'Escape') closeAddCartModal(); };
  document.addEventListener('keydown', document._acmEsc);
}

function closeAddCartModal() {
  const step2 = document.getElementById('acmStep2');
  const nameVal = (document.getElementById('newCartName')?.value || '').trim();
  if (!step2?.hidden && nameVal) {
    if (!confirm('ยกเลิกการเพิ่มรถเข็นใช่ไหม?')) return;
  }
  document.getElementById('addCartModal').hidden = true;
  if (document._acmEsc) {
    document.removeEventListener('keydown', document._acmEsc);
    document._acmEsc = null;
  }
}

function renderAcmStep1() {
  document.getElementById('acmTitle').textContent = 'เพิ่มรถเข็นใหม่';
  document.getElementById('acmSub').textContent   = 'เลือก Device ที่รอยืนยัน';
  document.getElementById('acmStep1').hidden = false;
  document.getElementById('acmStep2').hidden = true;

  const list = document.getElementById('acmDeviceList');
  const form = document.getElementById('acmManualForm');
  if (form) form.hidden = true;

  if (!PENDING_DEVICES.length) {
    list.innerHTML = `<div class="acm-empty">ยังไม่มีรถเข็นใหม่รอยืนยัน — เปิดรถแล้วต่อ WiFi: <b>MedCart-WiFi</b></div>`;
    return;
  }
  list.innerHTML = PENDING_DEVICES.map(d => {
    const mins = Math.floor((Date.now() - d.connectedAt) / 60000);
    const time = mins < 1 ? 'เพิ่งเชื่อมต่อ' : `${mins} นาทีที่แล้ว`;
    return `
      <div class="acm-device-card">
        <div class="acm-device-info">
          <div class="acm-device-mac">${d.mac}</div>
          <div class="acm-device-meta">${time}</div>
        </div>
        <div class="acm-device-right">
          <span class="acm-key-badge acm-key-ok">Key ยืนยันแล้ว</span>
          <button type="button" class="acm-btn-select" onclick="selectPendingDevice('${d.mac}')">เลือกรถนี้</button>
        </div>
      </div>`;
  }).join('');
}

function toggleManualKeyForm() {
  const form = document.getElementById('acmManualForm');
  const btn  = document.getElementById('acmManualToggle');
  if (!form) return;
  const show = form.hidden;
  form.hidden = !show;
  btn.hidden = show;
  if (show) {
    document.getElementById('manualMac').value = '';
    document.getElementById('manualKey').value = '';
    document.getElementById('manualKeyError').textContent = '';
    setTimeout(() => document.getElementById('manualMac').focus(), 50);
  }
}

function submitManualKey(e) {
  e.preventDefault();
  const mac = (document.getElementById('manualMac').value || '').trim().toUpperCase();
  const key = (document.getElementById('manualKey').value || '').trim();
  const errEl = document.getElementById('manualKeyError');

  if (!mac || !key) { errEl.textContent = 'กรุณากรอก MAC Address และ Secret Key'; return; }
  if (PENDING_DEVICES.some(d => d.mac === mac) || CARTS.some(c => c.pairedHwId === mac)) {
    errEl.textContent = 'MAC Address นี้มีอยู่ในระบบแล้ว';
    return;
  }
  errEl.textContent = '';

  // Mock validation: any key starting with "MC-" or 16+ chars is accepted
  const valid = key.startsWith('MC-') || key.length >= 8;
  if (!valid) { errEl.textContent = 'Secret Key ไม่ถูกต้อง (ตัวอย่าง: MC-KEY-XXXX-XXXX)'; return; }

  PENDING_DEVICES.push({ mac, connectedAt: Date.now(), keyStatus: 'ok', manual: true });
  document.getElementById('acmManualForm').hidden = true;
  document.getElementById('acmManualToggle').hidden = false;
  renderAcmStep1();
  renderPendingBadge();
}

function selectPendingDevice(mac) {
  _acmSelectedMac = mac;
  const d = PENDING_DEVICES.find(x => x.mac === mac);
  if (!d) return;
  const mins = Math.floor((Date.now() - d.connectedAt) / 60000);
  const time = mins < 1 ? 'เพิ่งเชื่อมต่อ' : `${mins} นาทีที่แล้ว`;

  document.getElementById('acmTitle').textContent = 'กรอกข้อมูลรถเข็น';
  document.getElementById('acmSub').textContent   = 'กรอกข้อมูลพื้นฐานของรถเข็นใหม่';
  document.getElementById('acmSelectedDevice').innerHTML = `
    <div class="acm-device-selected-banner">
      <span class="acm-device-mac">${mac}</span>
      <span class="acm-device-meta">${time}</span>
      <span class="acm-key-badge acm-key-ok">Key ยืนยันแล้ว</span>
    </div>`;

  document.getElementById('newCartTemplate').innerHTML =
    CART_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  document.getElementById('newCartName').value = '';
  document.getElementById('newCartNameError').textContent = '';
  document.getElementById('newCartAsset').value = '';

  document.getElementById('acmStep1').hidden = true;
  document.getElementById('acmStep2').hidden = false;
  setTimeout(() => document.getElementById('newCartName').focus(), 50);
}

function backToPendingList() {
  const nameVal = (document.getElementById('newCartName')?.value || '').trim();
  if (nameVal && !confirm('ยกเลิกการกรอกข้อมูลใช่ไหม?')) return;
  renderAcmStep1();
}

function validateNewCartName() {
  const name   = (document.getElementById('newCartName')?.value || '').trim();
  const errEl  = document.getElementById('newCartNameError');
  if (!errEl) return true;
  if (name && CARTS.some(c => c.name === name)) {
    errEl.textContent = 'ชื่อนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น';
    return false;
  }
  errEl.textContent = '';
  return true;
}

function submitAddCart(e) {
  e.preventDefault();
  const name = (document.getElementById('newCartName')?.value || '').trim();
  if (!name || !validateNewCartName()) return;
  const templateId = document.getElementById('newCartTemplate').value;
  const assetNo    = (document.getElementById('newCartAsset')?.value || '').trim();

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const newId = `CART-${letters[Math.floor(CARTS.length / 10) % 26]}${String(CARTS.length % 10 + 1).padStart(2,'0')}`;
  CARTS.push({ id: newId, name, templateId, isActive: true, pairedHwId: _acmSelectedMac, assetNo: assetNo || null });

  const idx = PENDING_DEVICES.findIndex(d => d.mac === _acmSelectedMac);
  if (idx !== -1) PENDING_DEVICES.splice(idx, 1);

  document.getElementById('addCartModal').hidden = true;
  if (document._acmEsc) { document.removeEventListener('keydown', document._acmEsc); document._acmEsc = null; }

  renderCartList();
  renderPendingBadge();
  showAddCartToast(`รถเข็น ${name} พร้อมใช้งานแล้ว`);
}

function showAddCartToast(msg) {
  const toast = document.getElementById('addCartToast');
  const msgEl = document.getElementById('addCartToastMsg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3500);
}

function renderPendingBadge() {
  const badge = document.getElementById('pendingDeviceBadge');
  if (!badge) return;
  const count = PENDING_DEVICES.filter(d => d.keyStatus === 'ok').length;
  badge.textContent = `${count} เครื่องรอยืนยัน`;
  badge.hidden = count === 0;
}

/* ─── CFG-2 Cart Editor ─────────────────────────────────────── */
function initAdminCartEdit() {
  const root = document.getElementById('cartEditRoot');
  if (!root) return;
  if (!MC_STATE.isAdmin) { location.hash = '#pg-load-mode'; return; }
  const c = getCart(MC_STATE.editingCartId);
  if (!c) { location.hash = '#pg-admin-carts'; return; }
  renderCartEdit(c);
}

function renderCartEdit(c) {
  const root = document.getElementById('cartEditRoot');
  const hasCustom = !!(c.customDrawers);
  const previewTpl = hasCustom
    ? { id: '__preview__', name: c.name, drawers: c.customDrawers }
    : getCartTemplate(c.templateId);

  const sharedTemplates = CART_TEMPLATES.filter(t => !t.id.startsWith('__cart_'));

  const customBadge = hasCustom
    ? `<span style="font-size:11px;font-weight:600;color:var(--adm-dk);background:var(--adm-lt);padding:2px 8px;border-radius:10px;margin-left:6px;">เฉพาะรถนี้</span>`
    : '';
  const resetBtn = hasCustom
    ? `<button type="button" class="mc-btn mc-btn-outline" style="font-size:12px;color:var(--text-2);" onclick="resetCartCustomDrawers('${c.id}')">คืนค่า Template</button>`
    : '';

  root.innerHTML = `
    <div class="form-card">
      <div class="form-card-title">ข้อมูลรถเข็น</div>
      <div class="cfg-field">
        <label>ชื่อรถเข็น</label>
        <input type="text" value="${c.name}" oninput="updateCartField('name', this.value)" />
      </div>
      <div class="cfg-field">
        <label>Template ที่ใช้</label>
        <select onchange="setCartTemplate('${c.id}', this.value); renderCartEdit(getCart('${c.id}'))">
          ${sharedTemplates.map(t => `<option value="${t.id}" ${c.templateId===t.id?'selected':''}>${t.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;flex-direction:row;gap:8px;align-items:center;flex-wrap:wrap;">
        <button type="button" class="mc-btn mc-btn-outline" onclick="editCartTemplate('${c.id}')">
          แก้ไขลิ้นชัก${customBadge}
        </button>
        ${resetBtn}
      </div>
    </div>
    ${renderTemplatePreview(previewTpl)}
  `;
}

function updateCartField(field, val) {
  const c = getCart(MC_STATE.editingCartId);
  if (c) c[field] = val;
}

/* ─── CFG-3 Template Editor ────────────────────────────────── */
function editTemplate(id) {
  MC_STATE.editingTemplateId = id;
  MC_STATE.editingCartTemplate = false;
  location.hash = '#pg-admin-template';
}

function editCartTemplate(cartId) {
  const cart = getCart(cartId);
  if (!cart) return;
  const src = cart.customDrawers || (getCartTemplate(cart.templateId) || {}).drawers || [];
  const drawers = JSON.parse(JSON.stringify(src));
  const tmpId = '__cart_' + cartId;
  const existIdx = CART_TEMPLATES.findIndex(t => t.id === tmpId);
  if (existIdx !== -1) CART_TEMPLATES.splice(existIdx, 1);
  CART_TEMPLATES.push({ id: tmpId, name: cart.name, drawers });
  MC_STATE.editingTemplateId = tmpId;
  MC_STATE.editingCartTemplate = true;
  MC_STATE.editingCartId = cartId;
  location.hash = '#pg-admin-template';
}

function resetCartCustomDrawers(cartId) {
  const cart = getCart(cartId);
  if (!cart) return;
  delete cart.customDrawers;
  renderCartEdit(cart);
}

function newTemplate() {
  const newId = 'T' + (CART_TEMPLATES.length + 1);
  const t = {
    id:newId, name:'Template ใหม่', createdBy:'u0',
    drawers: [
      { drawerNumber:1, label:'ลิ้นชัก 1', zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:2, label:'ลิ้นชัก 2', zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
    ],
  };
  CART_TEMPLATES.push(t);
  editTemplate(newId);
}

function initAdminTemplate() {
  const root = document.getElementById('templateEditRoot');
  if (!root) return;
  if (!MC_STATE.isAdmin) { location.hash = '#pg-load-mode'; return; }
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t) { location.hash = '#pg-admin-carts'; return; }
  renderTemplateEdit(t);
}

function renderTemplateEdit(t) {
  const root = document.getElementById('templateEditRoot');
  const isCartMode = !!MC_STATE.editingCartTemplate;
  const cancelTarget = isCartMode ? '#pg-admin-cart-edit' : '#pg-admin-carts';
  const saveLabel    = isCartMode ? 'บันทึกลิ้นชัก' : 'บันทึก Template';
  const nameField    = isCartMode ? '' : `
        <div class="form-card">
          <div class="form-card-title">ข้อมูล Template</div>
          <div class="cfg-field">
            <label>ชื่อ Template</label>
            <input type="text" value="${t.name}" oninput="updateTemplateName(this.value)" />
          </div>
        </div>`;
  root.innerHTML = `
    <div class="tmpl-edit-grid">
      <div class="tmpl-edit-form">
        ${nameField}
        <div class="form-card">
          <div class="form-card-title-row">
            <div class="form-card-title">ลิ้นชัก (${t.drawers.length})</div>
            <button type="button" class="mc-btn mc-btn-outline drawer-add-btn" onclick="addDrawerConfig()" ${t.drawers.length>=8?'disabled':''}>
              + เพิ่ม Drawer
            </button>
          </div>
          <div class="drawer-builder" id="drawerBuilder"></div>
        </div>
        <div class="tmpl-actions">
          <button type="button" class="mc-btn mc-btn-outline" onclick="location.hash='${cancelTarget}'">ยกเลิก</button>
          <button type="button" class="mc-btn mc-btn-primary" onclick="saveTemplate()">${saveLabel}</button>
        </div>
      </div>
      <div class="tmpl-edit-preview">
        <div class="form-card">
          <div class="form-card-title">Preview</div>
          ${renderTemplatePreview(t)}
        </div>
      </div>
    </div>`;
  renderDrawerBuilder();
}

function renderDrawerBuilder() {
  const root = document.getElementById('drawerBuilder');
  if (!root) return;
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t) return;
  root.innerHTML = t.drawers.map((d, idx) => {
    const rows = d.rows || 2;
    const cols = d.cols || 2;
    const total = rows * cols;
    const slotCells = Array.from({length: total}, (_, i) =>
      `<span class="slot-builder-cell">${i + 1}</span>`
    ).join('');
    return `
    <div class="drawer-builder-item">
      <div class="builder-head">
        <span class="builder-num">#${d.drawerNumber}</span>
        <input type="text" class="builder-label" value="${d.label}" oninput="updateDrawerCfg(${idx},'label',this.value)" />
        <div class="builder-reorder">
          <button type="button" onclick="moveDrawer(${idx},-1)" ${idx===0?'disabled':''} title="ขึ้น">↑</button>
          <button type="button" onclick="moveDrawer(${idx},1)" ${idx===t.drawers.length-1?'disabled':''} title="ลง">↓</button>
        </div>
        <button type="button" class="builder-del" onclick="removeDrawerCfg(${idx})" title="ลบ Drawer">×</button>
      </div>
      <div class="builder-row builder-row-slots">
        <label>Cassette grid</label>
        <div class="slot-builder">
          <div class="slot-grid-controls">
            <div class="slot-dim-group">
              <span class="slot-dim-label">แถว</span>
              <div class="slot-dim-row">
                <button type="button" class="slot-ctrl-btn" onclick="changeDrawerDim(${idx},'rows',-1)" ${rows<=1?'disabled':''}>−</button>
                <span class="slot-ctrl-count">${rows}</span>
                <button type="button" class="slot-ctrl-btn" onclick="changeDrawerDim(${idx},'rows',1)" ${rows>=6?'disabled':''}>+</button>
              </div>
            </div>
            <span class="slot-dim-x">×</span>
            <div class="slot-dim-group">
              <span class="slot-dim-label">คอลัมน์</span>
              <div class="slot-dim-row">
                <button type="button" class="slot-ctrl-btn" onclick="changeDrawerDim(${idx},'cols',-1)" ${cols<=1?'disabled':''}>−</button>
                <span class="slot-ctrl-count">${cols}</span>
                <button type="button" class="slot-ctrl-btn" onclick="changeDrawerDim(${idx},'cols',1)" ${cols>=8?'disabled':''}>+</button>
              </div>
            </div>
            <span class="slot-dim-total">= ${total} ช่อง</span>
          </div>
          <div class="slot-builder-grid" style="grid-template-columns:repeat(${cols},1fr)">${slotCells}</div>
        </div>
      </div>
      <div class="builder-row">
        <label>Electric lock</label>
        <label class="cb"><input type="checkbox" ${d.hasLock?'checked':''} onchange="updateDrawerCfg(${idx},'hasLock',this.checked)" /> เปิดใช้งาน</label>
      </div>
      ${d.hasLock ? `
        <div class="builder-row">
          <label>สิทธิ์ปลดล็อค</label>
          <div class="role-checks">
            <label class="cb"><input type="checkbox" ${d.allowedRoles.includes('PHARMACIST')?'checked':''} onchange="toggleRole(${idx},'PHARMACIST',this.checked)" /> เภสัชกร</label>
            <label class="cb"><input type="checkbox" ${d.allowedRoles.includes('NURSE')?'checked':''} onchange="toggleRole(${idx},'NURSE',this.checked)" /> พยาบาล</label>
          </div>
        </div>` : ''}
    </div>`;
  }).join('');
}

function updateTemplateName(v) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (t) t.name = v;
  refreshTmplPreview();
}

function updateDrawerCfg(idx, field, val) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t || !t.drawers[idx]) return;
  t.drawers[idx][field] = val;
  renderDrawerBuilder();
  refreshTmplPreview();
}

function changeDrawerDim(idx, dim, delta) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t || !t.drawers[idx]) return;
  const d = t.drawers[idx];
  const max = dim === 'rows' ? 6 : 8;
  d[dim] = Math.min(max, Math.max(1, (d[dim] || 2) + delta));
  renderDrawerBuilder();
  refreshTmplPreview();
}

function toggleRole(idx, role, on) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t || !t.drawers[idx]) return;
  const set = new Set(t.drawers[idx].allowedRoles);
  if (on) set.add(role); else set.delete(role);
  t.drawers[idx].allowedRoles = [...set];
}

function addDrawerConfig() {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t || t.drawers.length >= 8) return;
  const num = t.drawers.length + 1;
  t.drawers.push({ drawerNumber:num, label:`ลิ้นชัก ${num}`, zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] });
  renderTemplateEdit(t);
}

function removeDrawerCfg(idx) {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t) return;
  if (!confirm('ลบลิ้นชักนี้?')) return;
  t.drawers.splice(idx, 1);
  // renumber
  t.drawers.forEach((d, i) => d.drawerNumber = i + 1);
  renderTemplateEdit(t);
}

function refreshTmplPreview() {
  const wrap = document.querySelector('.tmpl-edit-preview .form-card');
  if (!wrap) return;
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  wrap.innerHTML = `<div class="form-card-title">Preview</div>${renderTemplatePreview(t)}`;
}

function renderTemplatePreview(t) {
  if (!t) return '<div class="audit-empty">—</div>';
  const zone1Drawers = t.drawers.filter(d => d.zone !== 'ZONE2');
  const zone2Drawer  = t.drawers.find(d => d.zone === 'ZONE2');
  const totalCassettes = zone1Drawers.reduce((s, d) => s + (d.rows||1) * (d.cols || d.cassetteSlots || 4), 0);
  const totalPatientSlots = zone2Drawer ? (zone2Drawer.rows||1) * (zone2Drawer.cols || zone2Drawer.patientSlots || 6) : 0;

  return `
    <div class="tmpl-preview">
      <div class="tmpl-preview-name">${t.name}</div>
      <div class="tmpl-preview-stats" style="display:flex;gap:8px;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:700;color:var(--adm-dk);background:var(--adm-lt);padding:2px 10px;border-radius:20px;">${zone1Drawers.length} ลิ้นชัก · ${totalCassettes} cassette</span>
        ${totalPatientSlots ? `<span style="font-size:11px;font-weight:700;color:var(--text-2);background:var(--bg);border:1px solid var(--border);padding:2px 10px;border-radius:20px;">${totalPatientSlots} ช่องผู้ป่วย</span>` : ''}
      </div>
      <div class="tmpl-preview-stack">
        ${t.drawers.map(d => {
          const isZone2 = d.zone === 'ZONE2';
          const rows = d.rows || 1;
          const cols = d.cols || d.cassetteSlots || d.patientSlots || 4;
          const total = rows * cols;
          const chips = isZone2
            ? Array.from({length: total}, (_, i) =>
                `<span class="tmpl-prev-chip" style="background:var(--bg);color:var(--text-3);border-color:var(--border);">S${i + 1}</span>`
              ).join('')
            : Array.from({length: total}, (_, i) =>
                `<span class="tmpl-prev-chip">C${i + 1}</span>`
              ).join('');
          const lockIcon = d.hasLock
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`
            : '';
          const drawerClass = isZone2 ? 'tmpl-prev-drawer' : 'tmpl-prev-drawer tmpl-prev-zone1';
          const slotLabel = isZone2 ? 'ช่องผู้ป่วย' : 'ช่อง';
          return `
          <div class="${drawerClass}" style="${isZone2 ? 'border-left-color:var(--border);opacity:0.85;' : ''}">
            <div class="tmpl-prev-head">
              <span class="tmpl-prev-num" style="${isZone2 ? 'background:var(--text-3);' : ''}">D${d.drawerNumber}</span>
              <span class="tmpl-prev-label">${d.label}</span>
              <span class="tmpl-prev-slots" style="${isZone2 ? 'color:var(--text-2);background:var(--bg);' : ''}">${rows}×${cols} = ${total} ${slotLabel}</span>
              ${lockIcon ? `<span class="tmpl-prev-lock">${lockIcon}</span>` : ''}
            </div>
            <div class="tmpl-prev-chips" style="grid-template-columns:repeat(${cols},1fr)">${chips}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function saveTemplate() {
  const t = getCartTemplate(MC_STATE.editingTemplateId);
  if (!t) return;
  if (t.drawers.length === 0) { alert('ต้องมีลิ้นชักอย่างน้อย 1 อัน'); return; }

  if (MC_STATE.editingCartTemplate) {
    // Save drawers to the cart only — don't touch shared templates
    const cart = getCart(MC_STATE.editingCartId);
    if (cart) cart.customDrawers = JSON.parse(JSON.stringify(t.drawers));
    // Remove temp template entry
    const idx = CART_TEMPLATES.findIndex(x => x.id === t.id);
    if (idx !== -1) CART_TEMPLATES.splice(idx, 1);
    MC_STATE.editingCartTemplate = false;
    MC_STATE.auditLog.unshift({
      ts: Date.now(), action: 'CART_DRAWERS_UPDATED',
      drugLabel: cart ? cart.name : '—', drawerId:'—',
      user: 'Admin', note: `${t.drawers.length} ลิ้นชัก (เฉพาะรถ)`,
    });
    alert('บันทึกลิ้นชักเฉพาะรถเข็นเรียบร้อย');
    location.hash = '#pg-admin-cart-edit';
    return;
  }

  const dup = CART_TEMPLATES.filter(x => x.name === t.name);
  if (dup.length > 1) { alert('ชื่อ Template ซ้ำกับ Template อื่น'); return; }
  MC_STATE.auditLog.unshift({
    ts: Date.now(), action: 'CART_TEMPLATE_UPDATED',
    drugLabel: t.name, drawerId:'—',
    user: 'Admin', note: `${t.drawers.length} ลิ้นชัก`,
  });
  alert('บันทึก Template เรียบร้อย');
  location.hash = '#pg-admin-carts';
}

/* ─── Bottom tab bar ────────────────────────────────────────── */
const TAB_HASHES = {
  dispense: { patient: '#pg-patient-queue', drug: '#pg-drug-queue' },
  zone1: '#pg-load-meds',
  zone2: '#pg-zone2',
  audit: '#pg-audit',
};
const PAGE_TO_TAB = {
  'pg-patient-queue':'dispense','pg-patient-detail':'dispense',
  'pg-drug-queue':'dispense','pg-drug-detail':'dispense',
  'pg-load-meds':'zone1','pg-drawer-detail':'zone1','pg-refill':'zone1','pg-config':'zone1',
  'pg-zone2':'zone2',
  'pg-audit':'audit',
  'pg-session-summary':'dispense',
};

function tabGo(tab) {
  if (tab === 'dispense') {
    const mode = MC_STATE.session.mode;
    location.hash = mode === 'drug' ? '#pg-drug-queue' : '#pg-patient-queue';
    return;
  }
  location.hash = TAB_HASHES[tab];
}

function updateTabBar() {
  const bar = document.getElementById('mcTabBar');
  if (!bar) return;
  const hash = location.hash.replace('#', '') || 'pg-cart';
  const inSession = !!MC_STATE.session.mode && PAGE_TO_TAB[hash];
  bar.hidden = !inSession;
  if (!inSession) return;
  const activeTab = PAGE_TO_TAB[hash];
  bar.querySelectorAll('.mc-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === activeTab);
  });
}

/* ─── Session top bar (shared) ──────────────────────────────── */
function renderSessionBar() {
  const bar = document.getElementById('sessionBar');
  if (!bar) return;
  const s = MC_STATE.session;
  const user = s.user;
  // Compute progress (rough: orders done in scope vs total)
  const orders = ordersInScope(MC_STATE.orders);
  const done = orders.filter(o => o.status === 'DONE' || o.status === 'SKIPPED').length;
  const total = orders.length;
  const hisBadge = s.hisMode === 'OFFLINE'
    ? `<span class="sess-badge sess-his-off">Offline</span>`
    : s.hisStatus === 'ok'
      ? `<span class="sess-badge sess-his-on">Online</span>`
      : '';
  bar.innerHTML = `
    ${user ? `<span class="sess-badge sess-user">${user.name}</span>
              <span class="sess-badge sess-role">${roleLabel(user.role)}</span>` : ''}
    <span class="sess-badge sess-mode">${sessionModeLabel() || '—'}</span>
    <span class="sess-badge sess-scope">${sessionScopeLabel() || '—'}</span>
    ${hisBadge}
    ${total > 0 ? `<span class="sess-badge sess-progress">${done}/${total}</span>` : ''}
  `;
}

/* ─── A1: Patient Queue (pg-patient-queue) ──────────────────── */
let _pqFilter = 'ALL';
let _pqSearch  = '';

function initPatientQueue() {
  const list = document.getElementById('patientList');
  if (!list) return;
  seedMcData();
  if (!MC_STATE.session.mode) { location.hash = '#pg-load-mode'; return; }
  _pqFilter = 'ALL';
  _pqSearch  = '';
  renderSessionBar();
  renderPatientQueue();
}

function setPqFilter(f) {
  _pqFilter = f;
  document.querySelectorAll('.pq-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.f === f));
  renderPatientQueue();
}

function filterPatientQueue() {
  _pqSearch = (document.getElementById('pqSearch')?.value || '').trim().toLowerCase();
  renderPatientQueue();
}

function renderPatientQueue() {
  const list = document.getElementById('patientList');
  if (!list) return;

  const allPts = patientsInCurrentCart();
  let doneCount = 0;
  let totalWithOrders = 0;

  // Build enriched list with computed statuses first (for progress bar)
  const enriched = allPts.map(p => {
    const orders = ordersInScope(patientOrders(p.id));
    if (orders.length === 0) return null;
    const status = patientStatus(p.id);
    if (status === 'DONE') doneCount++;
    totalWithOrders++;
    return { p, orders, status };
  }).filter(Boolean);

  // Apply status filter
  let filtered = enriched;
  if (_pqFilter !== 'ALL') {
    filtered = enriched.filter(e => e.status === _pqFilter);
  }

  // Apply text search (name, bed, condition, ward)
  if (_pqSearch) {
    filtered = filtered.filter(({ p }) =>
      p.name.toLowerCase().includes(_pqSearch) ||
      String(p.bed).toLowerCase().includes(_pqSearch) ||
      (p.condition || '').toLowerCase().includes(_pqSearch) ||
      (p.ward || '').toLowerCase().includes(_pqSearch)
    );
  }

  const cards = filtered.map(({ p, orders, status }) => {
    const roundsSet = new Set();
    orders.forEach(o => o.rounds.forEach(r => {
      if (MC_STATE.session.scope === 'round' && r !== MC_STATE.session.round) return;
      roundsSet.add(r);
    }));
    const roundChips = [...roundsSet].map(r => `<span class="round-chip">${r}</span>`).join('');
    const allergyHtml = p.allergies && p.allergies.length
      ? `<span class="patient-allergy">⚠ แพ้: ${p.allergies.join(', ')}</span>` : '';
    return `
      <button type="button" class="patient-card p-${status.toLowerCase()}" data-pid="${p.id}" onclick="openPatient('${p.id}')">
        <div class="patient-head">
          <div class="patient-avatar">${p.bed}</div>
          <div class="patient-name-wrap">
            <div class="patient-name">${p.name}</div>
            <div class="patient-meta">${p.ward} · เตียง ${p.bed}${p.condition ? ' · ' + p.condition : ''}</div>
          </div>
          <div class="patient-right">
            <span class="patient-status status-${status.toLowerCase()}">${statusLabel(status)}</span>
            <span class="patient-drug-count">${orders.length} รายการ</span>
          </div>
        </div>
        <div class="patient-foot">
          <div class="patient-rounds">${roundChips}</div>
          ${allergyHtml}
        </div>
      </button>`;
  }).join('');

  list.innerHTML = cards || '<div class="audit-empty">ไม่พบผู้ป่วยที่ตรงกับเงื่อนไข</div>';

  // Progress bar (always full count, not filtered)
  const prog = document.getElementById('patientProgress');
  if (prog) {
    const pct = totalWithOrders ? (doneCount / totalWithOrders) * 100 : 0;
    prog.querySelector('.prog-fill').style.width = pct + '%';
    prog.querySelector('[data-done]').textContent = doneCount;
    prog.querySelector('[data-total]').textContent = totalWithOrders;
  }

  // Result count label
  const countEl = document.getElementById('pqResultCount');
  if (countEl) {
    if (_pqFilter !== 'ALL' || _pqSearch) {
      countEl.textContent = `แสดง ${filtered.length} จาก ${totalWithOrders} คน`;
    } else {
      countEl.textContent = `ผู้ป่วยทั้งหมด ${totalWithOrders} คน`;
    }
  }
}

function statusLabel(s) {
  return s === 'DONE' ? 'เสร็จสิ้น' :
         s === 'IN_PROGRESS' ? 'กำลังจัด' :
         s === 'PENDING' ? 'รอดำเนินการ' :
         s === 'SKIPPED' ? 'ข้าม' : s;
}

function openPatient(patientId) {
  MC_STATE.currentPatientId = patientId;
  location.hash = '#pg-patient-detail';
}

/* ─── Zone 2 / Slot status helpers ──────────────────────────── */
function computeSlotStatus(slot) {
  if (!slot.patientId) return 'EMPTY';
  if (slot.status === 'PACKED') return 'PACKED';
  const orders = ordersInScope(patientOrders(slot.patientId));
  if (orders.length === 0) return 'ASSIGNED';
  const anyDone = orders.some(o => o.status === 'DONE' || o.status === 'SKIPPED');
  if (anyDone) return 'IN_PROGRESS';
  return 'ASSIGNED';
}

function slotStatusLabel(s) {
  return s === 'EMPTY' ? 'ว่าง' :
         s === 'ASSIGNED' ? 'พร้อมจัด' :
         s === 'IN_PROGRESS' ? 'กำลังจัด' :
         s === 'PACKED' ? 'แพ็คแล้ว' : s;
}

/* ─── Zone 2 Dashboard (pg-zone2) ───────────────────────────── */
function initZone2() {
  const grid = document.getElementById('zone2Grid');
  if (!grid) return;
  seedMcData();
  renderSessionBar();
  renderZone2LockCard();
  renderZone2Grid();
}

function renderZone2LockCard() {
  const card = document.getElementById('zone2LockCard');
  if (!card) return;
  const drawer = zone2Drawer();
  if (!drawer) return;
  MC_STATE.currentDrawerId = drawer.id;
  renderDrawerLockCard_into(card, drawer);
}

function renderDrawerLockCard_into(card, drawer) {
  if (drawer.lockStatus === 'UNLOCKING') {
    card.className = 'drawer-lock-card lock-card-unlocking';
    card.innerHTML = `
      <div class="lock-card-left">
        <span class="lock-spinner lock-spinner-lg"></span>
        <div><div class="lock-card-title">กำลังปลดล็อค...</div><div class="lock-card-sub">กรุณารอสักครู่</div></div>
      </div>`;
    return;
  }
  if (drawer.lockStatus === 'UNLOCKED') {
    const secs = lockCountdownSeconds(drawer.id);
    const pct = (secs / (drawer.autoLockAfter || 30)) * 100;
    card.className = 'drawer-lock-card lock-card-unlocked';
    card.innerHTML = `
      <div class="lock-card-left">
        <div class="lock-card-icon lock-card-icon-open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg></div>
        <div style="flex:1;">
          <div class="lock-card-title">เปิดอยู่ — พร้อมใช้งาน</div>
          <div class="lock-countdown" data-countdown="${drawer.id}"><div class="lock-countdown-track"><div class="lock-countdown-fill" style="width:${pct}%"></div></div><span>ล็อคใน <b data-secs>${secs}</b>s</span></div>
        </div>
      </div>
      <button type="button" class="mc-btn mc-btn-outline lock-card-btn" onclick="lockNow('${drawer.id}')">ล็อคทันที</button>`;
    return;
  }
  card.className = 'drawer-lock-card lock-card-locked';
  card.innerHTML = `
    <div class="lock-card-left">
      <div class="lock-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
      <div><div class="lock-card-title">ล็อคอยู่</div><div class="lock-card-sub">ปลดล็อคก่อนเข้าถึงช่องแพ็คผู้ป่วย</div></div>
    </div>
    <button type="button" class="mc-btn mc-btn-primary lock-card-btn" onclick="openPinModal('${drawer.id}')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
      ปลดล็อค
    </button>`;
}

function renderZone2Grid() {
  const grid = document.getElementById('zone2Grid');
  if (!grid) return;
  grid.innerHTML = MC_STATE.patientSlots.map(s => {
    const status = computeSlotStatus(s);
    const patient = s.patientId ? getPatient(s.patientId) : null;
    const onClick = status === 'EMPTY' ? '' :
                    status === 'PACKED' ? `onclick="openSlotDetail('${s.id}')"` :
                    `onclick="openSlotAndDispense('${s.id}')"`;
    return `
      <button type="button" class="slot-cell slot-${status.toLowerCase()}" ${onClick}>
        <div class="slot-cell-id">${s.id}</div>
        <div class="slot-cell-name">${patient ? patient.name : 'ว่าง'}</div>
        <div class="slot-cell-sub">${patient ? `${patient.ward} · เตียง ${patient.bed}` : '—'}</div>
        <div class="slot-cell-status">${slotStatusLabel(status)}</div>
      </button>`;
  }).join('');
}

function openSlotDetail(slotId) {
  const slot = getPatientSlot(slotId);
  if (!slot || !slot.packedItems) return;
  const patient = getPatient(slot.patientId);
  const itemsHtml = slot.packedItems.map(it =>
    `<li><b>${it.drugName} ${it.drugDose}</b> × ${it.qty}</li>`
  ).join('');
  document.getElementById('slotModalBody').innerHTML = `
    <div class="pack-label">
      <div class="pack-label-head">
        <div class="pack-label-ward">${slot.id} · ${patient.ward} · เตียง ${patient.bed}</div>
        <div class="pack-label-name">${patient.name}</div>
      </div>
      <div class="pack-label-list">
        <div class="pack-list-title">รายการในช่อง</div>
        <ul>${itemsHtml || '<li class="none">—</li>'}</ul>
      </div>
    </div>`;
  document.getElementById('slotModal').hidden = false;
}

function closeSlotModal() { document.getElementById('slotModal').hidden = true; }

function openSlotAndDispense(slotId) {
  const slot = getPatientSlot(slotId);
  if (!slot || !slot.patientId) return;
  MC_STATE.currentPatientId = slot.patientId;
  // If no mode yet, default to BY_PATIENT / ALL_DAY
  if (!MC_STATE.session.mode) {
    MC_STATE.session.mode = 'patient';
    MC_STATE.session.scope = 'allday';
  }
  location.hash = '#pg-patient-detail';
}

/* ─── A2: Patient Detail (pg-patient-detail) ────────────────── */
function initPatientDetail() {
  const root = document.getElementById('patientOrderList');
  if (!root) return;
  seedMcData();
  if (!MC_STATE.currentPatientId) { location.hash = '#pg-patient-queue'; return; }
  renderSessionBar();
  renderPatientDetail();
}

function renderPatientDetail() {
  const p = getPatient(MC_STATE.currentPatientId);
  if (!p) return;
  const slot = getSlotByPatient(p.id);
  const slotId = slot ? slot.id : '—';
  document.getElementById('patientDetailName').textContent = p.name;
  const ageStr = p.age ? `อายุ ${p.age}` : '';
  const condStr = p.condition || '';
  const allergyStr = (p.allergies && p.allergies.length)
    ? `<span class="patient-allergy" title="แพ้ยา"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg> แพ้: ${p.allergies.join(', ')}</span>`
    : '';
  document.getElementById('patientDetailMeta').innerHTML =
    `<span>${p.ward}</span><span class="sep">·</span><span>เตียง ${p.bed}</span>${ageStr ? `<span class="sep">·</span><span>${ageStr}</span>` : ''}<span class="sep">·</span><span>Slot <b>${slotId}</b></span><span class="sep">·</span><span>${sessionScopeLabel()}</span>${condStr ? `<br/><span class="patient-cond">${condStr}</span>` : ''} ${allergyStr}`;

  const orders = ordersInScope(patientOrders(p.id));
  const root = document.getElementById('patientOrderList');
  root.innerHTML = orders.map(o => {
    const drug = getDrug(o.drugId);
    const cass = findCassetteByDrug(o.drugId);
    const drawer = cass ? getDrawer(cass.drawerId) : null;
    const need = orderQtyInScope(o);
    const avail = cass ? cass.quantity : 0;
    const insuff = avail < need;
    const cassPaused = cass && cass.status !== 'IN';
    const roundsTags = o.rounds
      .filter(r => MC_STATE.session.scope !== 'round' || r === MC_STATE.session.round)
      .map(r => `<span class="round-chip">${r}</span>`).join('');

    let actionCell = '';
    if (o.status === 'DONE') {
      actionCell = `<span class="order-state state-done"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> หยิบแล้ว</span>`;
    } else if (o.status === 'SKIPPED') {
      actionCell = `<span class="order-state state-skipped">ข้าม</span>`;
    } else if (o.status === 'PAUSED') {
      actionCell = `
        <div class="order-actions">
          <span class="order-state state-paused">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
            Cassette ถูกถอด — รอ
          </span>
          <button type="button" class="order-btn order-btn-ghost" onclick="skipOrder('${o.id}')">ข้าม</button>
        </div>`;
    } else if (insuff) {
      actionCell = `
        <div class="order-actions">
          <button type="button" class="order-btn order-btn-warn" onclick="partialPick('${o.id}')">จัดบางส่วน (${avail})</button>
          <button type="button" class="order-btn order-btn-ghost" onclick="skipOrder('${o.id}')">ข้าม</button>
        </div>`;
    } else {
      actionCell = `<button type="button" class="order-btn order-btn-primary" onclick="pickOrder('${o.id}')">หยิบ</button>`;
    }

    return `
      <div class="order-row ${insuff && o.status==='PENDING' ? 'insufficient':''} ${o.status==='PAUSED' ? 'paused':''} ${o.status==='DONE'?'is-done':''}">
        <div class="order-drug">
          <div class="order-drug-name">${drug.name} <span class="order-drug-dose">${drug.dose}</span></div>
          <div class="order-rounds">${roundsTags}</div>
        </div>
        <div class="order-loc">
          <div class="order-loc-label">ตำแหน่ง</div>
          <div class="order-loc-val">${drawer ? drawer.id : '—'} · ${cass ? cass.id : '—'}</div>
        </div>
        <div class="order-qty">
          <div class="order-qty-label">ต้องการ / มี</div>
          <div class="order-qty-val ${insuff?'qty-warn':''}"><b>${need}</b> / ${avail}</div>
        </div>
        <div class="order-action-cell">${actionCell}</div>
      </div>`;
  }).join('');

  // Pack button enabled when all orders resolved + slot exists
  const allDone = orders.every(o => o.status === 'DONE' || o.status === 'SKIPPED');
  const btn = document.getElementById('packBtn');
  if (btn) {
    btn.disabled = !allDone || !slot;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
      แพ็คลง Slot ${slotId}
    `;
  }
}

function pickOrder(orderId) {
  const o = getOrder(orderId);
  const cass = findCassetteByDrug(o.drugId);
  const need = orderQtyInScope(o);
  if (!cass || cass.quantity < need) return;
  // Require unlock
  ensureUnlocked(cass.drawerId, () => {
    const c2 = findCassetteByDrug(o.drugId);
    if (!c2 || c2.quantity < need) return;
    o.status = 'DONE';
    o.dispensedQty = need;
    c2.quantity -= need;
    const drug = getDrug(o.drugId);
    const p = getPatient(o.patientId);
    MC_STATE.auditLog.unshift({
      ts: Date.now(), cassetteId: c2.id,
      drugLabel: `${drug.name} ${drug.dose}`,
      drawerId: c2.drawerId, action: 'DISPENSED_PATIENT',
      user: MC_STATE.currentUser, patient: p.name, qty: need,
    });
    renderPatientDetail();
  });
}

function partialPick(orderId) {
  const o = getOrder(orderId);
  const cass = findCassetteByDrug(o.drugId);
  const qty = cass ? cass.quantity : 0;
  if (qty <= 0) { skipOrder(orderId); return; }
  ensureUnlocked(cass.drawerId, () => {
    const c2 = findCassetteByDrug(o.drugId);
    const q2 = c2 ? c2.quantity : 0;
    if (q2 <= 0) { skipOrder(orderId); return; }
    o.status = 'DONE';
    o.dispensedQty = q2;
    c2.quantity = 0;
    const drug = getDrug(o.drugId);
    const p = getPatient(o.patientId);
    MC_STATE.auditLog.unshift({
      ts: Date.now(), cassetteId: c2.id,
      drugLabel: `${drug.name} ${drug.dose}`,
      drawerId: c2.drawerId, action: 'DISPENSED_PATIENT',
      user: MC_STATE.currentUser, patient: p.name, qty: q2, note: 'บางส่วน',
    });
    renderPatientDetail();
  });
}

function skipOrder(orderId) {
  const o = getOrder(orderId);
  o.status = 'SKIPPED';
  const drug = getDrug(o.drugId);
  const p = getPatient(o.patientId);
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    cassetteId: '—',
    drugLabel: `${drug.name} ${drug.dose}`,
    drawerId: '—',
    action: 'SKIPPED',
    user: MC_STATE.currentUser,
    patient: p.name,
  });
  renderPatientDetail();
}

function openPackModal() {
  const p = getPatient(MC_STATE.currentPatientId);
  const slot = getSlotByPatient(p.id);
  if (!slot) { alert('ผู้ป่วยนี้ยังไม่ได้ถูกกำหนด Slot'); return; }
  // Require Zone 2 drawer unlocked before packing
  const d6 = zone2Drawer();
  if (d6 && d6.lockStatus !== 'UNLOCKED') {
    openPinModal(d6.id, () => openPackModal());
    return;
  }

  const orders = ordersInScope(patientOrders(p.id));
  const done = orders.filter(o => o.status === 'DONE');
  const skipped = orders.filter(o => o.status === 'SKIPPED');
  const lines = done.map(o => {
    const drug = getDrug(o.drugId);
    return `<li><b>${drug.name} ${drug.dose}</b> × ${o.dispensedQty}${o.dispensedQty < orderQtyInScope(o)?' <span class="tag-partial">บางส่วน</span>':''}</li>`;
  }).join('');
  const skippedLines = skipped.map(o => {
    const drug = getDrug(o.drugId);
    return `<li>${drug.name} ${drug.dose} <span class="tag-skip">ข้าม</span></li>`;
  }).join('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  document.getElementById('packModalBody').innerHTML = `
    <div class="pack-label">
      <div class="pack-label-head">
        <div class="pack-label-ward">${slot.id} · ${p.ward} · เตียง ${p.bed}</div>
        <div class="pack-label-name">${p.name}</div>
        <div class="pack-label-meta">${sessionScopeLabel()} · ${dateStr}</div>
      </div>
      <div class="pack-label-list">
        <div class="pack-list-title">รายการในช่อง</div>
        <ul>${lines || '<li class="none">—</li>'}</ul>
        ${skipped.length ? `<div class="pack-list-title skip">ข้ามไม่จัด</div><ul>${skippedLines}</ul>` : ''}
      </div>
    </div>`;
  document.getElementById('packModal').hidden = false;
}

function closePackModal() { document.getElementById('packModal').hidden = true; }

function confirmPack() {
  const p = getPatient(MC_STATE.currentPatientId);
  const slot = getSlotByPatient(p.id);
  const orders = ordersInScope(patientOrders(p.id));
  const done = orders.filter(o => o.status === 'DONE');

  if (slot) {
    slot.packedItems = done.map(o => {
      const d = getDrug(o.drugId);
      return { drugName: d.name, drugDose: d.dose, qty: o.dispensedQty };
    });
    slot.status = 'PACKED';
  }

  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    drugLabel: 'แพ็คยาลง Slot',
    drawerId: 'D6',
    action: 'PATIENT_PACKED',
    user: MC_STATE.currentUser,
    patient: p.name,
    slotId: slot ? slot.id : null,
    qty: done.reduce((s,o) => s + (o.dispensedQty || 0), 0),
    note: `${done.length} รายการ`,
  });
  closePackModal();

  const allDone = patientsInCurrentCart().every(pt => {
    const os = ordersInScope(patientOrders(pt.id));
    if (os.length === 0) return true;
    return os.every(o => o.status === 'DONE' || o.status === 'SKIPPED');
  });
  if (allDone) {
    location.hash = '#pg-session-summary';
  } else {
    location.hash = '#pg-patient-queue';
  }
}

/* ─── A3/B3: Session Summary (pg-session-summary) ───────────── */
function initSessionSummary() {
  const root = document.getElementById('summaryRoot');
  if (!root) return;
  seedMcData();
  renderSessionBar();
  renderSessionSummary();
}

function renderSessionSummary() {
  const s = MC_STATE.session;
  const orders = s.scope ? ordersInScope(MC_STATE.orders) : MC_STATE.orders;
  const done = orders.filter(o => o.status === 'DONE');
  const skipped = orders.filter(o => o.status === 'SKIPPED');
  const partial = done.filter(o => o.dispensedQty < orderQtyInScope(o));
  const totalUnits = done.reduce((sum, o) => sum + (o.dispensedQty || 0), 0);
  const ptDispensed = new Set(done.map(o => o.patientId)).size;
  const refilledIds = s.refilledCassettes || [];

  const root = document.getElementById('summaryRoot');
  root.innerHTML = `
    <div class="summary-hero">
      <div class="summary-hero-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="summary-hero-title">จัดยารอบนี้เสร็จสิ้น</div>
      <div class="summary-hero-sub">${sessionModeLabel()} · ${sessionScopeLabel()}</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">ผู้ป่วยที่จัดได้</div>
        <div class="summary-val">${ptDispensed} <span class="summary-unit">คน</span></div>
      </div>
      <div class="summary-card">
        <div class="summary-label">จำนวนยารวม</div>
        <div class="summary-val">${totalUnits} <span class="summary-unit">เม็ด/หน่วย</span></div>
      </div>
      <div class="summary-card">
        <div class="summary-label">รายการที่ข้าม</div>
        <div class="summary-val ${skipped.length>0?'val-warn':''}">${skipped.length} <span class="summary-unit">รายการ</span></div>
      </div>
    </div>

    ${refilledIds.length ? `
      <div class="summary-section">
        <div class="summary-section-title">Cassette ที่เติมยาในรอบนี้ (${refilledIds.length})</div>
        <ul class="summary-list">
          ${refilledIds.map(id => {
            const c = getCassette(id);
            const d = c ? getDrug(c.drugId) : null;
            return c && d ? `<li><b>${c.id}</b> — ${d.name} ${d.dose} · เหลือ ${c.quantity}/${d.max}</li>` : '';
          }).join('')}
        </ul>
      </div>` : ''}

    ${partial.length ? `
      <div class="summary-section">
        <div class="summary-section-title">จัดบางส่วน (${partial.length})</div>
        <ul class="summary-list">
          ${partial.map(o => {
            const d = getDrug(o.drugId);
            const p = getPatient(o.patientId);
            return `<li><b>${p.name}</b> — ${d.name} ${d.dose} · ได้ ${o.dispensedQty}/${orderQtyInScope(o)}</li>`;
          }).join('')}
        </ul>
      </div>` : ''}

    ${skipped.length ? `
      <div class="summary-section">
        <div class="summary-section-title">รายการที่ข้าม (${skipped.length})</div>
        <ul class="summary-list">
          ${skipped.map(o => {
            const d = getDrug(o.drugId);
            const p = getPatient(o.patientId);
            return `<li><b>${p.name}</b> — ${d.name} ${d.dose}</li>`;
          }).join('')}
        </ul>
      </div>` : ''}

    <button type="button" class="mc-btn mc-btn-primary summary-close-btn" onclick="closeSession()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ปิดรอบ · เริ่มรอบใหม่
    </button>
  `;
}

function closeSession() {
  const s = MC_STATE.session;
  const orders = s.scope ? ordersInScope(MC_STATE.orders) : MC_STATE.orders;
  const done = orders.filter(o => o.status === 'DONE').length;
  const skipped = orders.filter(o => o.status === 'SKIPPED').length;
  const refilled = (s.refilledCassettes || []).length;
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    action: 'SESSION_CLOSED',
    drugLabel: 'ปิดรอบจัดยา',
    drawerId: '—',
    user: MC_STATE.currentUser,
    note: `${sessionModeLabel()} · ${sessionScopeLabel()} · จัด ${done} · ข้าม ${skipped} · เติม ${refilled}`,
  });
  // reset session state but preserve cassette quantities
  MC_STATE.orders.forEach(o => { o.status = 'PENDING'; o.dispensedQty = undefined; });
  MC_STATE.patientSlots.forEach(sl => {
    if (sl.status === 'PACKED') { sl.status = 'ASSIGNED'; sl.packedItems = null; }
  });
  MC_STATE.session = { mode: null, scope: null, round: null, refilledCassettes: [], user: null };
  MC_STATE.currentPatientId = null;
  MC_STATE.currentDrugId = null;
  location.hash = '#pg-dashboard';
}

/* ─── B1: Drug Queue (pg-drug-queue) ────────────────────────── */
function initDrugQueue() {
  const list = document.getElementById('drugList');
  if (!list) return;
  seedMcData();
  if (!MC_STATE.session.mode) { location.hash = '#pg-load-mode'; return; }
  renderSessionBar();
  renderDrugQueue();
}

function drugsInSession() {
  // Only include orders for patients in the current cart
  const orders = ordersInScope(MC_STATE.orders).filter(o => isPatientInCurrentCart(o.patientId));
  const map = {};
  orders.forEach(o => {
    if (!map[o.drugId]) map[o.drugId] = { drugId: o.drugId, needTotal: 0, patientIds: new Set(), allDone: true };
    map[o.drugId].needTotal += orderQtyInScope(o);
    map[o.drugId].patientIds.add(o.patientId);
    if (o.status === 'PENDING' || o.status === 'IN_PROGRESS') map[o.drugId].allDone = false;
  });
  return Object.values(map);
}

function renderDrugQueue() {
  const items = drugsInSession();
  items.forEach(d => {
    const cass = findCassetteByDrug(d.drugId);
    d.available = cass ? cass.quantity : 0;
    d.insufficient = d.available < d.needTotal;
  });
  items.sort((a, b) => {
    // insufficient first, then pending, then done
    const rank = x => x.insufficient ? 0 : x.allDone ? 2 : 1;
    return rank(a) - rank(b);
  });

  let doneCount = 0;
  items.forEach(d => { if (d.allDone) doneCount++; });

  const list = document.getElementById('drugList');
  list.innerHTML = items.map(d => {
    const drug = getDrug(d.drugId);
    const cass = findCassetteByDrug(d.drugId);
    const drawer = cass ? getDrawer(cass.drawerId) : null;
    const statusCls = d.allDone ? 'done' : d.insufficient ? 'insuff' : 'pending';
    return `
      <button type="button" class="drug-card drug-${statusCls}" data-drug="${d.drugId}" onclick="openDrug('${d.drugId}')">
        <div class="drug-head">
          <div class="drug-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"/>
              <path d="M8.5 8.5l7 7"/>
            </svg>
          </div>
          <div class="drug-name-wrap">
            <div class="drug-name">${drug.name} <span class="drug-dose">${drug.dose}</span></div>
            <div class="drug-meta">${drawer ? drawer.name.split('·')[0].trim() : '—'} · ช่อง ${cass ? cass.slotNumber : '—'}</div>
          </div>
          <span class="drug-badge badge-${d.allDone?'in':d.insufficient?'out_alert':'out'}">${d.allDone?'จัดครบ':d.insufficient?'ยาไม่พอ':'รอจัด'}</span>
        </div>
        <div class="drug-foot">
          <div class="drug-foot-item"><span>ต้องการ</span><b>${d.needTotal}</b></div>
          <div class="drug-foot-item"><span>มีใน cassette</span><b class="${d.insufficient?'qty-warn':''}">${d.available}</b></div>
          <div class="drug-foot-item"><span>ผู้ป่วย</span><b>${d.patientIds.size} คน</b></div>
        </div>
      </button>`;
  }).join('') || '<div class="audit-empty">ไม่มีรายการยาในช่วงเวลานี้</div>';

  const total = items.length;
  const prog = document.getElementById('drugProgress');
  if (prog) {
    prog.querySelector('.prog-fill').style.width = total ? (doneCount/total*100)+'%' : '0%';
    prog.querySelector('[data-done]').textContent = doneCount;
    prog.querySelector('[data-total]').textContent = total;
  }
}

function openDrug(drugId) {
  MC_STATE.currentDrugId = drugId;
  location.hash = '#pg-drug-detail';
}

/* ─── B2: Drug Detail (pg-drug-detail) ──────────────────────── */
function initDrugDetail() {
  const root = document.getElementById('drugDetailTable');
  if (!root) return;
  seedMcData();
  if (!MC_STATE.currentDrugId) { location.hash = '#pg-drug-queue'; return; }
  renderSessionBar();
  renderDrugDetail();
}

function renderDrugDetail() {
  const drug = getDrug(MC_STATE.currentDrugId);
  const cass = findCassetteByDrug(drug.id);
  const drawer = cass ? getDrawer(cass.drawerId) : null;
  document.getElementById('drugDetailName').innerHTML = `${drug.name} <span class="wiz-cass-dose">${drug.dose}</span>`;
  document.getElementById('drugDetailLoc').textContent = drawer ? `${drawer.name} · ช่องที่ ${cass.slotNumber}` : '—';
  document.getElementById('drugDetailAvail').textContent = cass ? cass.quantity : 0;

  const relatedOrders = ordersInScope(MC_STATE.orders).filter(o => o.drugId === drug.id && isPatientInCurrentCart(o.patientId));
  const pending = relatedOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');
  const totalNeed = pending.reduce((s, o) => s + orderQtyInScope(o), 0);

  document.getElementById('drugDetailNeed').textContent = totalNeed;
  const short = (cass ? cass.quantity : 0) < totalNeed;
  document.getElementById('drugDetailNeed').classList.toggle('qty-warn', short);

  const rows = relatedOrders.map(o => {
    const p = getPatient(o.patientId);
    const need = orderQtyInScope(o);
    const rounds = o.rounds
      .filter(r => MC_STATE.session.scope !== 'round' || r === MC_STATE.session.round)
      .map(r => `<span class="round-chip">${r}</span>`).join('');
    const statusBadge = o.status === 'DONE' ? '<span class="order-state state-done">หยิบแล้ว</span>' :
                        o.status === 'SKIPPED' ? '<span class="order-state state-skipped">ข้าม</span>' : '';
    const rowCls = (o.status === 'PENDING' && short) ? 'row-short' : '';
    return `
      <tr class="${rowCls}">
        <td>${p.name}</td>
        <td>${p.ward}</td>
        <td>${p.bed}</td>
        <td>${rounds}</td>
        <td><b>${need}</b></td>
        <td>${statusBadge}</td>
      </tr>`;
  }).join('');

  document.getElementById('drugDetailTable').innerHTML = `
    <table class="drug-table">
      <thead><tr><th>ผู้ป่วย</th><th>Ward</th><th>เตียง</th><th>รอบ</th><th>จำนวน</th><th>สถานะ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  const btn = document.getElementById('drugPickAllBtn');
  const skipBtn = document.getElementById('drugSkipBtn');
  if (btn) {
    const anyPending = pending.length > 0;
    btn.disabled = !anyPending;
    btn.textContent = short && anyPending ? 'หยิบบางส่วน (ยาไม่พอ)' : 'หยิบยาทั้งหมด';
    btn.classList.toggle('mc-btn-warn', short && anyPending);
    btn.classList.toggle('mc-btn-primary', !short && anyPending);
  }
  if (skipBtn) skipBtn.hidden = pending.length === 0;
}

function pickAllForDrug() {
  const drug = getDrug(MC_STATE.currentDrugId);
  const cass = findCassetteByDrug(drug.id);
  if (!cass) return;
  ensureUnlocked(cass.drawerId, () => _performPickAll(drug, findCassetteByDrug(drug.id)));
}

function _performPickAll(drug, cass) {
  const pending = ordersInScope(MC_STATE.orders).filter(o => o.drugId === drug.id && o.status === 'PENDING');
  let remaining = cass ? cass.quantity : 0;
  let dispensed = 0;
  let partial = [];
  pending.forEach(o => {
    const need = orderQtyInScope(o);
    if (remaining >= need) {
      o.status = 'DONE';
      o.dispensedQty = need;
      remaining -= need;
      dispensed += need;
    } else if (remaining > 0) {
      o.status = 'DONE';
      o.dispensedQty = remaining;
      dispensed += remaining;
      partial.push(o);
      remaining = 0;
    } else {
      o.status = 'SKIPPED';
    }
  });
  if (cass) cass.quantity = remaining;
  MC_STATE.auditLog.unshift({
    ts: Date.now(),
    cassetteId: cass ? cass.id : '—',
    drugLabel: `${drug.name} ${drug.dose}`,
    drawerId: cass ? cass.drawerId : '—',
    action: 'DISPENSED_DRUG',
    user: MC_STATE.currentUser,
    qty: dispensed,
    patients: pending.length,
    note: partial.length ? `บางส่วน ${partial.length} ราย` : '',
  });
  renderDrugDetail();
  // Navigate back or to summary
  const allDrugsDone = drugsInSession().every(d => {
    const pend = ordersInScope(MC_STATE.orders).filter(o => o.drugId === d.drugId && (o.status === 'PENDING' || o.status === 'IN_PROGRESS'));
    return pend.length === 0;
  });
  if (allDrugsDone) {
    setTimeout(() => location.hash = '#pg-session-summary', 800);
  } else {
    setTimeout(() => location.hash = '#pg-drug-queue', 600);
  }
}

function skipAllForDrug() {
  const drug = getDrug(MC_STATE.currentDrugId);
  const pending = ordersInScope(MC_STATE.orders).filter(o => o.drugId === drug.id && o.status === 'PENDING');
  pending.forEach(o => { o.status = 'SKIPPED'; });
  MC_STATE.auditLog.unshift({
    ts: Date.now(), cassetteId:'—', drugLabel: `${drug.name} ${drug.dose}`,
    drawerId:'—', action:'SKIPPED', user: MC_STATE.currentUser,
    patients: pending.length,
  });
  location.hash = '#pg-drug-queue';
}

/* ─── Dashboard (pg-load-meds) ──────────────────────────────── */
function initLoadMeds() {
  const grid = document.getElementById('drawerGrid');
  if (!grid) return;
  seedMcData();
  refreshAlertStatus();
  renderLoadMedsHeader();
  renderDrawerGrid();
  renderStatusBar();
}

function renderLoadMedsHeader() {
  const { out, alert } = countByStatus();
  const badge = document.getElementById('outBadge');
  if (badge) badge.querySelector('[data-out]').textContent = out;

  const alertEl = document.getElementById('mcAlert');
  if (!alertEl) return;
  if (alert > 0) {
    alertEl.hidden = false;
    const alerts = MC_STATE.cassettes.filter(c => c.status === 'OUT_ALERT');
    const list = alerts.map(c => {
      const d = getDrug(c.drugId);
      return `${c.id} (${d.name} ${d.dose}) ค้างนอก ${minutesAgo(c.removedAt)}`;
    }).join(', ');
    alertEl.querySelector('[data-alert-sub]').textContent = list;
  } else {
    alertEl.hidden = true;
  }
}

function renderDrawerGrid() {
  const grid = document.getElementById('drawerGrid');
  if (!grid) return;
  const cart = getCart(MC_STATE.currentCartId);
  const tmpl = cart ? getCartTemplate(cart.templateId) : null;

  grid.innerHTML = zone1Drawers().map(d => {
    const drawerNum = parseInt(d.id.replace('D',''), 10);
    const cfg = tmpl ? tmpl.drawers.find(td => td.drawerNumber === drawerNum) : null;
    const cols = cfg ? (cfg.cols || 4) : 4;
    const rows = cfg ? (cfg.rows || 1) : 1;
    const totalSlots = rows * cols;

    const cassBySlot = {};
    drawerCassettes(d.id).forEach(c => { cassBySlot[c.slotNumber] = c; });
    const outCount = Object.values(cassBySlot).filter(c => c.drugId && c.status !== 'IN').length;
    const configuredCount = Object.values(cassBySlot).filter(c => c.drugId).length;

    const cells = Array.from({length: totalSlots}, (_, i) => {
      const slotNum = i + 1;
      const c = cassBySlot[slotNum];
      const drug = c && c.drugId ? getDrug(c.drugId) : null;
      if (!drug) return `
        <div class="dm-cell dm-cell-empty" title="ช่อง ${slotNum} · ว่าง">
          <span class="dm-cell-num">${slotNum}</span>
          <span class="dm-cell-label">ว่าง</span>
        </div>`;
      const isOut   = c.status === 'OUT' || c.status === 'OUT_ALERT';
      const isAlert = c.status === 'OUT_ALERT';
      const pct = c.maxQty ? Math.round(c.quantity / c.maxQty * 100) : 0;
      const stateClass = isAlert ? 'dm-cell-alert' : isOut ? 'dm-cell-out' : pct <= 30 ? 'dm-cell-low' : 'dm-cell-ok';
      const qtyText = isOut ? 'ออกนอก' : `${c.quantity}/${c.maxQty}`;
      const elecLock = c.hasElectricLock && c.cassetteLockStatus !== 'UNLOCKED';
      const lockMark = elecLock ? `<span class="dm-cell-lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>` : '';
      return `
        <div class="dm-cell ${stateClass} ${elecLock ? 'dm-cell-elec-locked' : ''}" title="ช่อง ${slotNum} · ${drug.name} ${drug.dose} · ${qtyText}">
          ${lockMark}
          <span class="dm-cell-num">${slotNum}</span>
          <span class="dm-cell-label">${drug.name}</span>
          <span class="dm-cell-dose">${drug.dose}</span>
          <span class="dm-cell-qty">${qtyText}</span>
        </div>`;
    }).join('');

    const statusFoot = configuredCount === 0
      ? `<div class="drawer-tile-foot" style="color:var(--text-3)">ยังไม่ได้ตั้งค่า</div>`
      : outCount
        ? `<div class="drawer-tile-foot">ออกนอก ${outCount} ช่อง</div>`
        : `<div class="drawer-tile-foot all-in">ครบทุกช่อง</div>`;

    return `
      <button type="button" class="drawer-tile" onclick="openDrawer('${d.id}')">
        <div class="drawer-tile-head">
          <div class="drawer-tile-name">${d.name}</div>
          ${renderLockBadge(d)}
        </div>
        <div class="dm-cassette-rack" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
        ${d.lockStatus === 'UNLOCKED' ? renderLockCountdown(d) : ''}
        ${statusFoot}
      </button>`;
  }).join('');
}

function renderLockBadge(drawer) {
  if (drawer.lockStatus === 'UNLOCKING') {
    return `<span class="lock-badge lock-unlocking"><span class="lock-spinner"></span> ปลดล็อค...</span>`;
  }
  if (drawer.lockStatus === 'UNLOCKED') {
    return `<span class="lock-badge lock-unlocked">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
      เปิด
    </span>`;
  }
  return `<span class="lock-badge lock-locked">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
    ล็อค
  </span>`;
}

function renderLockCountdown(drawer) {
  const secs = lockCountdownSeconds(drawer.id);
  const pct = (secs / (drawer.autoLockAfter || 30)) * 100;
  return `
    <div class="lock-countdown" data-countdown="${drawer.id}" onclick="event.stopPropagation()">
      <div class="lock-countdown-track"><div class="lock-countdown-fill" style="width:${pct}%"></div></div>
      <span><b data-secs>${secs}</b>s</span>
    </div>`;
}

/* Periodic countdown tick */
let _lockTicker = null;
function startLockTicker() {
  if (_lockTicker) clearInterval(_lockTicker);
  _lockTicker = setInterval(() => {
    const anyUnlocked = MC_STATE.drawers.some(d => d.lockStatus === 'UNLOCKED');
    if (!anyUnlocked) return;
    // Update countdown elements in place (no full rerender)
    document.querySelectorAll('[data-countdown]').forEach(el => {
      const did = el.dataset.countdown;
      const drawer = getDrawer(did);
      if (!drawer || drawer.lockStatus !== 'UNLOCKED') { rerenderLockViews(); return; }
      const secs = lockCountdownSeconds(did);
      const pct = (secs / (drawer.autoLockAfter || 30)) * 100;
      const fill = el.querySelector('.lock-countdown-fill');
      const label = el.querySelector('[data-secs]');
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = secs;
    });
  }, 1000);
}

function renderStatusBar() {
  const bar = document.getElementById('mcStatusBar');
  if (!bar) return;
  const { total, in: inC, out } = countByStatus();
  bar.querySelector('[data-total]').textContent = total;
  bar.querySelector('[data-in]').textContent = inC;
  bar.querySelector('[data-out-bar]').textContent = out;
}

function openDrawer(id) {
  MC_STATE.currentDrawerId = id;
  location.hash = '#pg-drawer-detail';
}

/* ─── Drawer Detail (pg-drawer-detail) ──────────────────────── */
function initDrawerDetail() {
  const list = document.getElementById('slotList');
  if (!list) return;
  seedMcData(); refreshAlertStatus();
  const drawer = getDrawer(MC_STATE.currentDrawerId);
  if (!drawer) { location.hash = '#pg-load-meds'; return; }

  document.getElementById('drawerDetailName').textContent = drawer.name;
  const cs = drawerCassettes(drawer.id);
  const outCount = cs.filter(c => c.status !== 'IN').length;
  document.getElementById('drawerDetailSub').textContent =
    `${cs.length} ช่องใช้งาน · ${outCount === 0 ? 'ครบทุกช่อง' : `ออก ${outCount} ช่อง`}`;

  renderDrawerLockCard();
  renderSlotList();
}

function renderDrawerLockCard() {
  const card = document.getElementById('drawerLockCard');
  if (!card) return;
  const drawer = getDrawer(MC_STATE.currentDrawerId);
  if (!drawer) return;

  if (drawer.lockStatus === 'UNLOCKING') {
    card.className = 'drawer-lock-card lock-card-unlocking';
    card.innerHTML = `
      <div class="lock-card-left">
        <span class="lock-spinner lock-spinner-lg"></span>
        <div>
          <div class="lock-card-title">กำลังปลดล็อค...</div>
          <div class="lock-card-sub">กรุณารอสักครู่</div>
        </div>
      </div>`;
    return;
  }

  if (drawer.lockStatus === 'UNLOCKED') {
    const secs = lockCountdownSeconds(drawer.id);
    const pct = (secs / (drawer.autoLockAfter || 30)) * 100;
    card.className = 'drawer-lock-card lock-card-unlocked';
    card.innerHTML = `
      <div class="lock-card-left">
        <div class="lock-card-icon lock-card-icon-open">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
        </div>
        <div style="flex:1;">
          <div class="lock-card-title">เปิดอยู่ — พร้อมใช้งาน</div>
          <div class="lock-countdown" data-countdown="${drawer.id}">
            <div class="lock-countdown-track"><div class="lock-countdown-fill" style="width:${pct}%"></div></div>
            <span>ล็อคใน <b data-secs>${secs}</b>s</span>
          </div>
        </div>
      </div>
      <button type="button" class="mc-btn mc-btn-outline lock-card-btn" onclick="lockNow('${drawer.id}')">ล็อคทันที</button>`;
    return;
  }

  // LOCKED
  card.className = 'drawer-lock-card lock-card-locked';
  card.innerHTML = `
    <div class="lock-card-left">
      <div class="lock-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <div>
        <div class="lock-card-title">ล็อคอยู่</div>
        <div class="lock-card-sub">ต้องปลดล็อคก่อนเติมยาหรือหยิบยา</div>
      </div>
    </div>
    <button type="button" class="mc-btn mc-btn-primary lock-card-btn" onclick="openPinModal('${drawer.id}')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
      ปลดล็อค
    </button>`;
}

function renderSlotList() {
  const list = document.getElementById('slotList');
  if (!list) return;
  const drawer = getDrawer(MC_STATE.currentDrawerId);
  const cart = getCart(MC_STATE.currentCartId);
  const tmpl = cart ? getCartTemplate(cart.templateId) : null;
  const drawerNum = parseInt(drawer.id.replace('D',''), 10);
  const cfg = tmpl ? tmpl.drawers.find(d => d.drawerNumber === drawerNum) : null;
  const cfgCols = cfg ? (cfg.cols || 4) : 4;
  const maxSlots = cfg ? ((cfg.rows || 1) * (cfg.cols || cfg.cassetteSlots || 4)) : 4;

  const cs = drawerCassettes(drawer.id);

  const cells = [];
  for (let i = 1; i <= maxSlots; i++) {
    const cass = cs.find(c => c.slotNumber === i);
    if (!cass || !cass.drugId) {
      const cassId = cass ? cass.id : '';
      cells.push(`
        <div class="cass-cell cass-cell-empty${cassId ? ' cass-cell-empty-clickable' : ''}"${cassId ? ` onclick="openAssignDrug('${cassId}')"` : ''}>
          <span class="cass-cell-num">${i}</span>
          <span class="cass-cell-drug">ว่าง</span>
          ${cassId ? `<button type="button" class="cass-btn cass-btn-assign" onclick="event.stopPropagation();openAssignDrug('${cassId}')">+ เลือกยา</button>` : ''}
        </div>`);
      continue;
    }
    const drug = getDrug(cass.drugId);
    const pct = cass.maxQty ? Math.round(cass.quantity / cass.maxQty * 100) : 0;
    const isElecLocked = cass.hasElectricLock && cass.cassetteLockStatus !== 'UNLOCKED';
    const stateClass = cass.status === 'OUT_ALERT' ? 'cass-cell-alert'
                     : cass.status === 'OUT'       ? 'cass-cell-out'
                     : pct <= 30                   ? 'cass-cell-low'
                     :                               'cass-cell-ok';
    const actionBtn = cass.status === 'IN'
      ? `<button type="button" class="cass-btn cass-btn-remove" onclick="event.stopPropagation();removeCassette('${cass.id}')">ถอด</button>`
      : `<button type="button" class="cass-btn cass-btn-refill" onclick="event.stopPropagation();startRefill('${cass.id}')">เติมยา</button>`;
    const lockOverlay = isElecLocked ? `
      <div class="cass-lock-overlay" onclick="openCassettePinModal('${cass.id}', ()=>{ renderSlotList(); })">
        <svg class="cass-lock-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <span class="cass-lock-label">Electric Lock</span>
        <span class="cass-lock-tap">แตะเพื่อปลดล็อค</span>
      </div>` : '';
    cells.push(`
      <div class="cass-cell ${stateClass} ${cass.hasElectricLock ? 'has-electric-lock' : ''} ${isElecLocked ? 'cass-locked' : ''}">
        <span class="cass-cell-num">${i}</span>
        <span class="cass-cell-drug">${drug ? drug.name : cass.id}</span>
        <span class="cass-cell-dose">${drug ? drug.dose : ''}</span>
        <div class="cass-cell-qty-row">
          <span class="cass-cell-qty">${cass.quantity}/${cass.maxQty}</span>
          <span class="cass-cell-pct">${pct}%</span>
        </div>
        <div class="cass-cell-bar"><div class="cass-cell-bar-fill" style="width:${pct}%;background:${pct<=30?'#f59e0b':pct<=60?'#60a5fa':'#34d399'}"></div></div>
        ${!isElecLocked ? actionBtn : ''}
        ${cass.status === 'OUT' || cass.status === 'OUT_ALERT' ? `<span class="cass-cell-status-tag">ออก</span>` : ''}
        ${lockOverlay}
      </div>`);
  }

  list.innerHTML = `<div class="cass-grid" style="grid-template-columns:repeat(${cfgCols},1fr)">${cells.join('')}</div>`;
}

function removeCassette(cassetteId) {
  const cass = getCassette(cassetteId);
  if (!cass || cass.status !== 'IN') return;
  // Check cassette electric lock first
  if (isCassetteElectricLocked(cassetteId)) {
    openCassettePinModal(cassetteId, () => removeCassette(cassetteId));
    return;
  }
  // Require unlock first
  ensureUnlocked(cass.drawerId, () => {
    const c2 = getCassette(cassetteId);
    if (!c2 || c2.status !== 'IN') return;
    c2.status = 'OUT';
    c2.removedAt = Date.now();
    c2.removedBy = MC_STATE.currentUser;
    addAudit('REMOVED', c2.id);
    recomputePausedOrders();
    renderSlotList();
    rerenderLockViews();
  });
}

function labelStatus(s) {
  return s === 'IN' ? 'พร้อมใช้งาน' : s === 'OUT' ? 'ถูกนำออก' : 'ค้างนอกเกิน 30 นาที';
}

/* ─── Refill wizard (pg-refill) ─────────────────────────────── */
function startRefillFirstOut() {
  seedMcData(); refreshAlertStatus();
  const firstOut = MC_STATE.cassettes.find(c => c.status !== 'IN');
  if (!firstOut) { alert('ไม่มี Cassette ที่ต้องเติมยาในขณะนี้'); return; }
  startRefill(firstOut.id);
}

function refillDrawerFirst() {
  const drawer = getDrawer(MC_STATE.currentDrawerId);
  if (!drawer) return;
  const firstOut = drawerCassettes(drawer.id).find(c => c.status !== 'IN');
  if (!firstOut) { alert('ลิ้นชักนี้ไม่มี Cassette ที่ต้องเติมยา'); return; }
  startRefill(firstOut.id);
}

function startRefill(cassetteId) {
  MC_STATE.refillCassetteId = cassetteId;
  MC_STATE.refillStep = 1;
  MC_STATE.refillAdded = 0;
  MC_STATE.refillDetected = null;
  location.hash = '#pg-refill';
}

function initRefill() {
  const root = document.getElementById('refillRoot');
  if (!root) return;
  seedMcData();
  if (!MC_STATE.refillCassetteId) { location.hash = '#pg-load-meds'; return; }
  renderRefill();
}

function renderRefill() {
  const root = document.getElementById('refillRoot');
  if (!root) return;
  const c = getCassette(MC_STATE.refillCassetteId);
  const drug = getDrug(c.drugId);
  const drawer = getDrawer(c.drawerId);
  const max = drug.max;
  const step = MC_STATE.refillStep;

  // stepper
  const stepper = `
    <div class="wiz-steps">
      ${[1,2,3].map(n => `
        <div class="wiz-step ${n<step?'done':''} ${n===step?'active':''}">
          <div class="wiz-step-num">${n<step ? '✓' : n}</div>
          <div class="wiz-step-label">${['ยืนยันการถอด','เติมยา','ใส่กลับ'][n-1]}</div>
        </div>
      `).join('<div class="wiz-line"></div>')}
    </div>`;

  let body = '';
  if (step === 1) {
    body = `
      <div class="wiz-panel">
        <div class="wiz-title">ยืนยันการถอด Cassette</div>
        <div class="wiz-sub">ระบบตรวจพบว่า Cassette นี้ถูกนำออกจากรถเข็น</div>
        <div class="wiz-cass-card">
          <div class="wiz-cass-id">${c.id}</div>
          <div class="wiz-cass-drug">${drug.name} <span class="wiz-cass-dose">${drug.dose}</span></div>
          <div class="wiz-kv-list">
            <div class="wiz-kv"><span>ตำแหน่งเดิม</span><b>${drawer.name} · ช่อง ${c.slotNumber}</b></div>
            <div class="wiz-kv"><span>ถอดโดย</span><b>${c.removedBy || MC_STATE.currentUser}</b></div>
            <div class="wiz-kv"><span>เวลาที่ถอด</span><b>${minutesAgo(c.removedAt)} ที่แล้ว</b></div>
            <div class="wiz-kv"><span>ปริมาณคงเหลือ</span><b>${c.quantity} / ${max}</b></div>
          </div>
        </div>
        <button type="button" class="mc-btn mc-btn-primary wiz-btn-main" onclick="advanceRefill()">ยืนยัน — ดำเนินการเติมยา →</button>
      </div>`;
  } else if (step === 2) {
    const newTotal = c.quantity + MC_STATE.refillAdded;
    const exceed = newTotal > max;
    body = `
      <div class="wiz-panel">
        <div class="wiz-title">เติมยาเข้า Cassette</div>
        <div class="wiz-sub">${drug.name} ${drug.dose} · ${c.id}</div>

        <div class="wiz-qty-card">
          <div class="wiz-qty-row">
            <div class="wiz-qty-block"><div class="wiz-qty-label">คงเหลือ</div><div class="wiz-qty-val">${c.quantity}</div></div>
            <div class="wiz-qty-op">+</div>
            <div class="wiz-qty-block"><div class="wiz-qty-label">เติมเพิ่ม</div><div class="wiz-qty-val added">${MC_STATE.refillAdded}</div></div>
            <div class="wiz-qty-op">=</div>
            <div class="wiz-qty-block ${exceed?'exceed':''}"><div class="wiz-qty-label">รวมใหม่</div><div class="wiz-qty-val">${newTotal} <span class="wiz-qty-max">/ ${max}</span></div></div>
          </div>
          ${exceed ? '<div class="wiz-warn">⚠ จำนวนเกินค่าสูงสุดที่กำหนด กรุณาปรับลด</div>' : ''}
        </div>

        <div class="wiz-input-row">
          <button type="button" class="mc-btn mc-btn-outline wiz-scan-btn" onclick="refillBarcode()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
              <line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/><line x1="16" y1="8" x2="16" y2="16"/>
            </svg>
            สแกน Barcode
          </button>
          <div class="wiz-manual">
            <label>ระบุจำนวนเอง</label>
            <input type="number" id="refillInput" min="0" max="${max - c.quantity}" value="${MC_STATE.refillAdded}" oninput="onRefillInput(this.value)" />
          </div>
        </div>

        <button type="button" class="mc-btn mc-btn-primary wiz-btn-main" ${(exceed || MC_STATE.refillAdded === 0)?'disabled':''} onclick="advanceRefill()">ยืนยัน → ไปขั้นใส่กลับ →</button>
        <button type="button" class="mc-btn mc-btn-ghost wiz-btn-back" onclick="goBackRefill()">← ย้อนกลับ</button>
      </div>`;
  } else if (step === 3) {
    const detected = MC_STATE.refillDetected;
    let statusBlock = '';
    if (detected === null) {
      statusBlock = `
        <button type="button" class="mc-btn mc-btn-primary wiz-btn-main" onclick="simulateRfid()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/>
          </svg>
          จำลองการตรวจจับ RFID
        </button>`;
    } else if (detected === 'loading') {
      statusBlock = `
        <div class="wiz-rfid-loading">
          <div class="rfid-spinner"></div>
          <span>กำลังตรวจจับ RFID…</span>
        </div>`;
    } else if (detected === c.drawerId) {
      statusBlock = `
        <div class="wiz-rfid-ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <div class="rfid-title">ตรวจพบในตำแหน่งที่ถูกต้อง</div>
            <div class="rfid-sub">${drawer.name} · ช่อง ${c.slotNumber}</div>
          </div>
        </div>
        <button type="button" class="mc-btn mc-btn-primary wiz-btn-main" onclick="finishRefill()">เสร็จสิ้น — บันทึกข้อมูล ✓</button>`;
    } else {
      const wrongDrawer = getDrawer(detected);
      statusBlock = `
        <div class="wiz-rfid-err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <div>
            <div class="rfid-title">ใส่ผิดลิ้นชัก!</div>
            <div class="rfid-sub">ตรวจพบใน <b>${wrongDrawer.name}</b> — ที่ถูกต้องคือ <b>${drawer.name} · ช่อง ${c.slotNumber}</b></div>
          </div>
        </div>
        <button type="button" class="mc-btn mc-btn-primary wiz-btn-main" onclick="confirmManualReturn()">ย้ายแล้ว — ยืนยัน ✓</button>
        <div class="wiz-err-actions">
          <button type="button" class="mc-btn mc-btn-outline" onclick="retryRfid()">ลองตรวจจับใหม่</button>
          <button type="button" class="mc-btn mc-btn-warn" onclick="lockWrongDrawer()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            ล็อค ${wrongDrawer.name}
          </button>
        </div>`;
    }

    body = `
      <div class="wiz-panel">
        <div class="wiz-title">ใส่ Cassette กลับเข้ารถเข็น</div>
        <div class="wiz-sub">วาง ${c.id} ลงในตำแหน่งที่กำหนด แล้วกดตรวจจับ RFID</div>

        <div class="wiz-target-card">
          <div class="wiz-target-label">ตำแหน่งที่ต้องใส่กลับ</div>
          <div class="wiz-target-name">${drawer.name}</div>
          <div class="wiz-target-slot">ช่องที่ ${c.slotNumber}</div>
        </div>

        ${statusBlock}
      </div>`;
  }

  root.innerHTML = stepper + body;
}

function advanceRefill() {
  MC_STATE.refillStep = Math.min(3, MC_STATE.refillStep + 1);
  renderRefill();
}
function goBackRefill() {
  MC_STATE.refillStep = Math.max(1, MC_STATE.refillStep - 1);
  renderRefill();
}

function onRefillInput(v) {
  const c = getCassette(MC_STATE.refillCassetteId);
  const drug = getDrug(c.drugId);
  const max = drug.max;
  let n = parseInt(v || '0', 10); if (isNaN(n)) n = 0;
  if (n < 0) n = 0;
  MC_STATE.refillAdded = n;
  renderRefill();
}

function refillBarcode() {
  const c = getCassette(MC_STATE.refillCassetteId);
  const drug = getDrug(c.drugId);
  const room = drug.max - c.quantity;
  const simulated = 10 + Math.floor(Math.random() * 21); // 10-30
  MC_STATE.refillAdded = Math.min(simulated, room);
  renderRefill();
}

function simulateRfid() {
  MC_STATE.refillDetected = 'loading';
  renderRefill();
  setTimeout(() => {
    const c = getCassette(MC_STATE.refillCassetteId);
    const correct = Math.random() < 0.6; // spec: 60% correct / 40% wrong
    if (correct) {
      MC_STATE.refillDetected = c.drawerId;
    } else {
      const others = zone1Drawers().filter(d => d.id !== c.drawerId);
      MC_STATE.refillDetected = others[Math.floor(Math.random() * others.length)].id;
      addAudit('WRONG_DRAWER', c.id, { detectedDrawer: MC_STATE.refillDetected });
    }
    renderRefill();
  }, 1500);
}

function lockWrongDrawer() {
  const detectedId = MC_STATE.refillDetected;
  if (!detectedId) return;
  const drawer = getDrawer(detectedId);
  if (!drawer) return;
  lockDrawer(detectedId, 'MANUAL');
  alert(`${drawer.name} ถูกล็อคแล้ว`);
  rerenderLockViews();
}

function retryRfid() {
  MC_STATE.refillDetected = null;
  renderRefill();
}

function confirmManualReturn() {
  MC_STATE.refillDetected = getCassette(MC_STATE.refillCassetteId).drawerId;
  renderRefill();
}

function finishRefill() {
  const c = getCassette(MC_STATE.refillCassetteId);
  const drug = getDrug(c.drugId);
  // Refill qty
  c.quantity = Math.min(drug.max, c.quantity + MC_STATE.refillAdded);
  addAudit('REFILLED', c.id, { added: MC_STATE.refillAdded });
  // Track in session
  if (!MC_STATE.session.refilledCassettes) MC_STATE.session.refilledCassettes = [];
  if (!MC_STATE.session.refilledCassettes.includes(c.id)) {
    MC_STATE.session.refilledCassettes.push(c.id);
  }
  // Return to drawer
  c.status = 'IN';
  c.removedAt = null;
  c.lastRefillAt = Date.now();
  addAudit('RETURNED', c.id);
  recomputePausedOrders();
  // reset state
  MC_STATE.refillCassetteId = null;
  MC_STATE.refillStep = 1;
  MC_STATE.refillAdded = 0;
  MC_STATE.refillDetected = null;
  // navigate back to drawer detail if we came from there, else dashboard
  location.hash = MC_STATE.currentDrawerId ? '#pg-drawer-detail' : '#pg-load-meds';
}

/* ─── Assign drug to empty slot (first-time fill) ───────────── */
let _ASSIGN_SELECTED_DRUG = null;

function openAssignDrug(cassetteId) {
  const cass = getCassette(cassetteId);
  if (!cass) return;
  const drawerNum = cass.drawerId.replace('D', '');

  const overlay = document.getElementById('cassInfoOverlay');
  const body    = document.getElementById('cassInfoBody');
  const modal   = document.getElementById('cassInfoModal');
  if (!overlay || !body) return;
  if (modal) modal.classList.add('cass-v2');

  _ASSIGN_SELECTED_DRUG = null;

  const drugListHtml = DRUG_LIST.map(d =>
    `<button type="button" class="assign-drug-row" onclick="_selectAssignDrug('${d.id}',this)">
      <div class="assign-drug-icon ${d.type === 'iv' ? 'iv' : 'oral'}">${d.type === 'iv' ? 'IV' : 'PO'}</div>
      <div class="assign-drug-info">
        <div class="assign-drug-name">${d.name}</div>
        <div class="assign-drug-dose">${d.dose} · max ${d.max}</div>
      </div>
    </button>`
  ).join('');

  body.innerHTML =
    '<div class="cass-info-v2">'
    + '<div class="cass-info-v2-header">'
    +   '<div class="cass-info-v2-avatar">+</div>'
    +   '<div class="cass-info-v2-head-text">'
    +     '<div class="cass-info-v2-eyebrow">เลือกยาเข้าช่อง</div>'
    +     '<div class="cass-info-v2-title">Drawer ' + drawerNum + ' · Cassette ' + cass.slotNumber + '</div>'
    +     '<div class="cass-info-v2-tags"><span class="cass-info-v2-tag tag-empty">ว่าง</span></div>'
    +   '</div>'
    + '</div>'
    + '<div class="cass-info-v2-body">'
    +   '<div class="cass-info-v2-section">'
    +     '<div class="cass-info-v2-section-title">เลือกชนิดยา</div>'
    +     '<div class="assign-drug-list">' + drugListHtml + '</div>'
    +   '</div>'
    +   '<div class="cass-info-v2-section assign-qty-section" id="assignQtySection" style="display:none;">'
    +     '<div class="cass-info-v2-section-title">ระบุจำนวนเริ่มต้น</div>'
    +     '<div class="assign-qty-input">'
    +       '<input type="number" id="assignQtyInput" min="1" value="1" oninput="_validateAssignQty()" />'
    +       '<div class="assign-qty-hint" id="assignQtyHint">—</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="cass-info-v2-footer">'
    +   '<button type="button" class="cass-info-v2-btn cass-info-v2-btn-secondary" onclick="closeCassetteInfo()">ยกเลิก</button>'
    +   '<button type="button" class="cass-info-v2-btn cass-info-v2-btn-primary" id="assignConfirmBtn" disabled onclick="confirmAssignDrug(\'' + cassetteId + '\')">บันทึก</button>'
    + '</div>'
    + '</div>';

  overlay.hidden = false;
}

function _selectAssignDrug(drugId, el) {
  _ASSIGN_SELECTED_DRUG = drugId;
  const drug = getDrug(drugId);
  if (!drug) return;

  const list = el.parentElement;
  list.querySelectorAll('.assign-drug-row').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');

  const qtySection = document.getElementById('assignQtySection');
  if (qtySection) qtySection.style.display = '';

  const hint = document.getElementById('assignQtyHint');
  if (hint) hint.textContent = drug.name + ' ' + drug.dose + ' · สูงสุด ' + drug.max + ' ' + (drug.type === 'iv' ? 'ถุง' : 'เม็ด');

  const input = document.getElementById('assignQtyInput');
  if (input) { input.max = drug.max; if (parseInt(input.value, 10) > drug.max) input.value = drug.max; }

  _validateAssignQty();
}

function _validateAssignQty() {
  const drug = _ASSIGN_SELECTED_DRUG ? getDrug(_ASSIGN_SELECTED_DRUG) : null;
  const input = document.getElementById('assignQtyInput');
  const btn   = document.getElementById('assignConfirmBtn');
  if (!btn) return;
  const qty = input ? parseInt(input.value, 10) : 0;
  const valid = drug && qty >= 1 && qty <= drug.max;
  btn.disabled = !valid;
}

function confirmAssignDrug(cassetteId) {
  const drugId = _ASSIGN_SELECTED_DRUG;
  if (!drugId) return;
  const drug = getDrug(drugId);
  if (!drug) return;
  const cass = getCassette(cassetteId);
  if (!cass) return;

  const input = document.getElementById('assignQtyInput');
  const qty = Math.max(1, Math.min(drug.max, parseInt(input?.value || '1', 10) || 1));

  cass.drugId = drug.id;
  cass.quantity = qty;
  cass.maxQty = drug.max;
  cass.status = 'IN';
  cass.removedAt = null;
  cass.lastRefillAt = Date.now();

  addAudit('REFILLED', cass.id, { added: qty });

  if (!MC_STATE.session.refilledCassettes) MC_STATE.session.refilledCassettes = [];
  if (!MC_STATE.session.refilledCassettes.includes(cass.id)) {
    MC_STATE.session.refilledCassettes.push(cass.id);
  }

  recomputePausedOrders();

  _ASSIGN_SELECTED_DRUG = null;
  closeCassetteInfo();

  // Re-render whatever views are visible
  if (document.getElementById('slotList'))    renderSlotList();
  if (document.getElementById('drawerGrid'))  renderDrawerGrid();
  if (document.getElementById('dashInventory')) renderDashInventory();
}

/* ─── Config (pg-config) — Cart ↔ Template mapping ──────────── */
let _cfgSelectedTemplateId = null;

function initConfig() {
  const root = document.getElementById('cfgTmplReadonly');
  if (!root) return;
  seedMcData();
  const cart = getCart(MC_STATE.currentCartId);
  _cfgSelectedTemplateId = cart ? cart.templateId : (CART_TEMPLATES[0]?.id || null);
  _renderConfigPage();
}

function _renderConfigPage() {
  const cart = getCart(MC_STATE.currentCartId);

  const hwEl = document.getElementById('cfgBarHwId');
  if (hwEl) hwEl.textContent = MC_STATE.hardwareId || 'MC-A-001';

  const hwId = MC_STATE.hardwareId || 'MC-A-001';
  const cartSel = document.getElementById('cfgBarCartName');
  if (cartSel) {
    cartSel.innerHTML = CARTS.map(c => {
        const isMine  = c.pairedHwId === hwId;
      const takenBy = c.pairedHwId && !isMine ? c.pairedHwId : null;
      const disabled = takenBy || !c.isActive;
      const label = takenBy     ? `${c.name}  ⚠ จับคู่กับ ${takenBy} แล้ว`
                  : !c.isActive ? `${c.name}  — Inactive`
                  : c.name;
      const style = takenBy     ? 'color:#d97706;background:#fffbeb'   // amber — ถูกใช้งาน
                  : !c.isActive ? 'color:#9ca3af;background:#f9fafb'   // gray — ปิดใช้งาน
                  : '';
      return `<option value="${c.id}"${c.id === MC_STATE.currentCartId ? ' selected' : ''}${disabled ? ' disabled' : ''} style="${style}">${label}</option>`;
    }).join('');
  }

  const readonlyEl = document.getElementById('cfgTmplReadonly');
  if (readonlyEl) {
    const tmpl = cart ? getCartTemplate(cart.templateId) : null;
    readonlyEl.innerHTML = tmpl ? `
      <div class="cfg-tmpl-readonly-row">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <span class="cfg-tmpl-readonly-name">${tmpl.name}</span>
        <span class="cfg-tmpl-readonly-hint">แก้ไขได้ในส่วน Templates ด้านล่าง</span>
      </div>` : `<div class="cfg-tmpl-readonly-row cfg-tmpl-readonly-empty">ยังไม่ได้กำหนด Template</div>`;
  }
}

function cfgSelectCart(id) {
  MC_STATE.currentCartId = id;
  _renderConfigPage();
}

function saveCartPairing() {
  const hwId = MC_STATE.hardwareId || 'MC-A-001';
  const newCart = getCart(MC_STATE.currentCartId);
  if (!newCart) return;

  // Release old pairing for this hardware
  CARTS.forEach(c => { if (c.pairedHwId === hwId) c.pairedHwId = null; });
  // Set new pairing
  newCart.pairedHwId = hwId;

  loadCartData(MC_STATE.currentCartId);
  _renderConfigPage();

  const btn = document.querySelector('[onclick="saveCartPairing()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> บันทึกแล้ว`;
    setTimeout(() => { btn.disabled = false; btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> บันทึก`; }, 1200);
  }
}

/* ─── Audit Log (pg-audit) ─────────────────────────────────── */
let _auditFilter = 'ALL';

const AUDIT_CATEGORIES = {
  ZONE1:  ['REMOVED', 'RETURNED', 'REFILLED', 'WRONG_DRAWER'],
  ZONE2:  ['PATIENT_PACKED'],
  LOCK:   ['DRAWER_UNLOCKED', 'DRAWER_LOCKED', 'UNLOCK_DENIED'],
  HIS:    ['HIS_SYNCED', 'HIS_OFFLINE'],
  ALERTS: ['WRONG_DRAWER', 'UNLOCK_DENIED', 'ORDER_PAUSED'],
};
function initAudit() {
  const list = document.getElementById('auditList');
  if (!list) return;
  seedMcData();
  _auditFilter = 'ALL';
  renderAudit();
}

function setAuditFilter(f) {
  _auditFilter = f;
  document.querySelectorAll('.audit-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  renderAudit();
}

function renderAudit() {
  const list = document.getElementById('auditList');
  if (!list) return;
  const items = MC_STATE.auditLog.filter(e => {
    if (_auditFilter === 'ALL') return true;
    const cat = AUDIT_CATEGORIES[_auditFilter];
    return cat && cat.includes(e.action);
  });
  if (items.length === 0) {
    list.innerHTML = '<div class="audit-empty">ไม่มีรายการในหมวดนี้</div>';
    return;
  }
  list.innerHTML = items.map(e => {
    const d = getDrawer(e.drawerId);
    const time = new Date(e.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const isLockEvent = ['DRAWER_UNLOCKED','DRAWER_LOCKED','UNLOCK_DENIED'].includes(e.action);
    let title, parts;
    if (isLockEvent) {
      title = e.drawerName || (d ? d.name : e.drawerId);
      parts = [e.user || '—'];
      if (e.userRole) parts.push(roleLabel(e.userRole));
      if (e.reason) parts.push(`เหตุผล: ${e.reason === 'AUTO' ? 'อัตโนมัติ' : e.reason === 'MANUAL' ? 'ผู้ใช้ล็อค' : e.reason}`);
    } else {
      title = e.drugLabel || '—';
      parts = [e.cassetteId, d ? d.name : e.drawerId, e.user];
      if (e.patient) parts.push(`ผู้ป่วย: ${e.patient}`);
      if (e.qty) parts.push(`จำนวน ${e.qty}`);
      if (e.added) parts.push(`เติม +${e.added}`);
      if (e.patients) parts.push(`${e.patients} ราย`);
      if (e.detectedDrawer) parts.push(`ตรวจพบที่ ${getDrawer(e.detectedDrawer)?.name || e.detectedDrawer}`);
      if (e.note) parts.push(e.note);
    }
    return `
      <div class="audit-row">
        <div class="audit-time">${time}</div>
        <span class="audit-action audit-${e.action.toLowerCase()}">${actionLabel(e.action)}</span>
        <div class="audit-info">
          <div class="audit-drug">${title}</div>
          <div class="audit-meta">${parts.filter(Boolean).join(' · ')}</div>
        </div>
      </div>`;
  }).join('');
}

function actionLabel(a) {
  return a === 'REMOVED' ? 'ถอด' :
         a === 'RETURNED' ? 'ใส่กลับ' :
         a === 'REFILLED' ? 'เติมยา' :
         a === 'WRONG_DRAWER' ? 'ผิดลิ้นชัก' :
         a === 'DISPENSED_PATIENT' ? 'จัดให้ผู้ป่วย' :
         a === 'DISPENSED_DRUG' ? 'จ่ายตามรายการยา' :
         a === 'SKIPPED' ? 'ข้าม' :
         a === 'DRAWER_UNLOCKED' ? 'ปลดล็อค' :
         a === 'DRAWER_LOCKED' ? 'ล็อค' :
         a === 'UNLOCK_DENIED' ? 'ปฏิเสธปลดล็อค' :
         a === 'SESSION_CLOSED' ? 'ปิดรอบ' :
         a === 'SESSION_STARTED' ? 'เริ่ม Session' :
         a === 'PATIENT_PACKED' ? 'แพ็คลง Slot' :
         a === 'CART_TEMPLATE_UPDATED' ? 'แก้ Template' :
         a === 'SESSION_CONFIG_CHANGED' ? 'แก้ Config รอบ' :
         a === 'HIS_SYNCED' ? 'HIS Sync' :
         a === 'HIS_OFFLINE' ? 'HIS Offline' :
         a === 'ORDER_PAUSED' ? 'Order Pause' :
         a === 'ORDER_RESUMED' ? 'Order Resume' : a;
}

/* ─── Cart Detail Modal ─────────────────────────────────────── */
function openCartDetail() {
  const cart    = CARTS.find(c => c.id === MC_STATE.currentCartId) || {};
  const tmpl    = getCartTemplate(cart.templateId) || {};
  const drawers  = MC_STATE.drawers || [];
  const cassettes = MC_STATE.cassettes || [];
  const avail   = cassettes.filter(c => c.drugId).length;
  const paired  = cart && cart.pairedHwId === MC_STATE.hardwareId;

  const row = (label, val, cls = '') =>
    `<div class="cdm-row"><span class="cdm-row-label">${label}</span><span class="cdm-row-val ${cls}">${val}</span></div>`;

  document.getElementById('cartDetailBody').innerHTML = `
    <div class="cdm-section">
      <div class="cdm-section-label">ข้อมูลทั่วไป</div>
      ${row('รหัสรถเข็น',          MC_STATE.hardwareId || 'MC-A-001', 'mono')}
      ${row('ยี่ห้อ / รุ่น',        'OmniRx Pro X2')}
      ${row('หมายเลขซีเรียล',      'SN-20240315-001', 'mono')}
      ${row('เวอร์ชันซอฟต์แวร์',    'v3.2.1')}
      ${row('สถานะ', paired ? 'พร้อมใช้งาน' : 'ยังไม่ได้จับคู่', paired ? 'ok' : 'warn')}
    </div>
    <div class="cdm-section">
      <div class="cdm-section-label">ฮาร์ดแวร์ &amp; เครือข่าย</div>
      ${row('แบตเตอรี่',           '<span style="color:#059669;font-weight:600;">⚡ 85%</span> <span style="font-weight:400;color:var(--muted)">(กำลังชาร์จ · ใช้งานได้ประมาณ 6 ชม. 48 นาที)</span>')}
      ${row('เครือข่าย',            'Wi-Fi (-52 dBm)')}
      ${row('IP Address',          '192.168.10.45', 'mono')}
      ${row('MAC Address',         'A4:C3:F0:12:34:56', 'mono')}
    </div>
    <div class="cdm-section">
      <div class="cdm-section-label">ประวัติการบำรุงรักษา</div>
      ${row('ซ่อมบำรุงล่าสุด',     '15 มี.ค. 2567')}
      ${row('ซ่อมบำรุงครั้งถัดไป', '15 มิ.ย. 2567')}
      ${row('ผู้รับผิดชอบ',         'ฝ่ายเทคนิคการแพทย์')}
      ${row('จำนวนการซ่อม (YTD)',  '2 ครั้ง')}
    </div>
    <button type="button" class="cdm-reset-btn" onclick="resetCart()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
      Reset รถเข็น
    </button>`;

  document.getElementById('cartDetailModal').hidden = false;
  document._cdmEsc = e => { if (e.key === 'Escape') closeCartDetail(); };
  document.addEventListener('keydown', document._cdmEsc);
}

function closeCartDetail() {
  document.getElementById('cartDetailModal').hidden = true;
  if (document._cdmEsc) {
    document.removeEventListener('keydown', document._cdmEsc);
    document._cdmEsc = null;
  }
}

/* ─── Reset demo / cart ─────────────────────────────────────── */
function resetCart() {
  const hwId = MC_STATE.hardwareId || 'MC-A-001';
  CARTS.forEach(c => { if (c.pairedHwId === hwId) c.pairedHwId = null; });
  closeCartDetail();
  applyCartToPage();
  if (location.hash === '#pg-cart' || location.hash === '') {
    initCartPage();
  } else {
    location.hash = '#pg-cart';
  }
}

function resetDemo() {
  // Disable saveNavState so the hashchange that follows can't overwrite
  // the cleared sessionStorage with the still-populated in-memory state.
  window.saveNavState = function() {};

  // Clear ALL persisted state
  try { localStorage.removeItem('mc_ward_id'); } catch {}
  try { localStorage.removeItem('mc_user');    } catch {}
  try { sessionStorage.clear(); } catch {}

  // Navigate to landing page then hard-reload. Use hash-only assignment
  // (location.hash) instead of location.replace() to avoid Chrome's
  // "Unsafe attempt to load URL" error when running from file://.
  location.hash = '#pg-cart';
  location.reload();
}

/* ─── Dashboard init ────────────────────────────────────────── */
function initDashboard() {
  const heroEl = document.getElementById('dashHero');
  if (!heroEl) return;
  const user = getCurrentUser();
  if (!user) { location.hash = '#pg-login'; return; }

  seedMcData();
  refreshAlertStatus();
  renderDashHero(user);
  renderDashStats();
  renderDashFocus();
  renderDashChips();
  renderDashActions();
  renderDashInventory();
  renderDashRounds();
}

function renderDashHero(user) {
  const el = document.getElementById('dashHero');
  if (!el) return;
  const orders = (MC_STATE.orders || []).filter(o => isPatientInCurrentCart(o.patientId));
  const total = orders.length;
  const done  = orders.filter(o => o.status === 'DONE' || o.status === 'SKIPPED').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  // Time-aware Thai greeting
  const hr = new Date().getHours();
  let greet = 'สวัสดีตอนเช้า', emoji = '☀️';
  if      (hr >= 12 && hr < 17) { greet = 'สวัสดีตอนกลางวัน'; emoji = '🌤️'; }
  else if (hr >= 17 && hr < 19) { greet = 'สวัสดีตอนเย็น';     emoji = '🌅'; }
  else if (hr >= 19 || hr < 5)  { greet = 'สวัสดีตอนค่ำ';      emoji = '🌙'; }

  const cart = getCart(MC_STATE.currentCartId);
  const cartName = cart ? cart.name : 'Med Cart';
  const cartId   = MC_STATE.hardwareId || 'MC-A-001';

  el.innerHTML = `
    <div class="hero-blobs" aria-hidden="true">
      <span class="hero-blob blob-1"></span>
      <span class="hero-blob blob-2"></span>
      <span class="hero-blob blob-3"></span>
    </div>
    <div class="hero-content">
      <div class="hero-row">
        <div class="hero-left">
          <div class="hero-greet-tag">
            <span class="hero-greet-emoji">${emoji}</span>
            <span>${greet}</span>
          </div>
          <div class="hero-greet">${user.name}</div>
          <div class="hero-meta">
            <span class="hero-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Ward 3A · อายุรกรรม
            </span>
            <span class="hero-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              ${roleLabel(user.role)}
            </span>
          </div>
        </div>
        <div class="hero-cart-info">
          <div class="hero-cart-info-head">
            <span class="hero-cart-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="2"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="13" x2="19" y2="13"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/></svg>
            </span>
            <div>
              <div class="hero-cart-info-name">${cartName}</div>
              <div class="hero-cart-info-id">รหัส ${cartId}</div>
            </div>
          </div>
          <div class="hero-cart-info-row">
            <span class="hero-cart-stat">
              <span class="hero-cart-dot online"></span> Online
            </span>
            <span class="hero-cart-sep">·</span>
            <span class="hero-cart-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>
              85%
            </span>
            <span class="hero-cart-sep">·</span>
            <span class="hero-cart-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              Wi-Fi
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderDashChips() {
  const el = document.getElementById('dashChips');
  if (!el) return;
  const stat   = (MC_STATE.cassettes||[]).filter(c=>c.status==='OUT_ALERT').length;
  const rounds = ROUNDS.length;
  const evals  = 3;
  const checks = 1;
  const histN  = (MC_STATE.auditLog||[]).length;
  const offCart= (MC_STATE.cassettes||[]).filter(c=>c.status!=='IN').length;
  el.innerHTML = `
    <a href="#pg-dispense-dashboard" class="dash-chip dash-chip-purple" style="text-decoration:none;cursor:pointer;">
      <span class="chip-icon">📊</span> MAR ภาพรวม <b>เปิด</b>
    </a>
    <span class="dash-chip dash-chip-blue">
      <span class="chip-icon">📅</span> ตารางรอบยา <b>${rounds} รอบ</b>
    </span>
    <span class="dash-chip dash-chip-green">
      <span class="chip-icon">✓</span> ประเมินหลังให้ยา <b>รอ ${evals}</b>
    </span>
    <span class="dash-chip dash-chip-orange">
      <span class="chip-icon">⚠</span> ตรวจสอบคำสั่งยา <b>${checks}</b>
    </span>
    <span class="dash-chip dash-chip-gray">
      <span class="chip-icon">📜</span> ประวัติการใช้ยา <b>${histN} รอเริ่ม</b> · Off-cart <b>${offCart}</b>
    </span>`;
}

function renderDashFocus() {
  const el = document.getElementById('dashFocus');
  if (!el) return;

  const roundTimes = { 'เช้า':'08:00', 'กลางวัน':'12:00', 'เย็น':'16:00', 'ก่อนนอน':'20:00' };
  const statAlerts  = (MC_STATE.cassettes||[]).filter(c => c.status === 'OUT_ALERT').length;
  const pending     = (MC_STATE.orders||[]).filter(o => isPatientInCurrentCart(o.patientId) && o.status === 'PENDING').length;
  const refillCount = (MC_STATE.cassettes||[]).filter(c => c.status !== 'IN').length;
  const cur         = currentRound();

  let variant, eyebrow, title, sub, btnLabel, btnAction;

  if (pending > 0) {
    variant   = 'focus-dispense';
    eyebrow   = `รอบ${cur} · ${roundTimes[cur] || ''}`;
    title     = `ผู้ป่วยรอรับยา ${pending} รายการ`;
    sub       = 'สแกน QR และจ่ายยาให้ครบทุกรายการ';
    btnLabel  = 'เริ่มจ่ายยาเลย';
    btnAction = "alert('Dispense — ดู flow ที่ Mode A/B')";
  } else if (refillCount > 0) {
    variant   = 'focus-prep';
    eyebrow   = 'เตรียมยาสำหรับรอบถัดไป';
    title     = `Cassette ${refillCount} อัน รอจัดยา`;
    sub       = 'จัดยาให้ครบก่อนถึงเวลาจ่ายยารอบถัดไป';
    btnLabel  = 'จัดยาตอนนี้';
    btnAction = 'startNormalFlow()';
  } else {
    variant   = 'focus-ok';
    eyebrow   = 'ทุกอย่างเรียบร้อย';
    title     = 'รถเข็นพร้อมใช้งาน';
    sub       = 'ยาจัดครบ ไม่มีรายการเร่งด่วน';
    btnLabel  = 'ดูรายงาน';
    btnAction = "location.hash='#pg-audit'";
  }

  const iconMap = {
    'focus-urgent':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'focus-dispense':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    'focus-prep':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    'focus-ok':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  };

  el.innerHTML = `
    <div class="dash-focus ${variant}">
      <div class="dash-focus-icon">${iconMap[variant]}</div>
      <div class="dash-focus-body">
        <div class="dash-focus-eyebrow">${eyebrow}</div>
        <div class="dash-focus-title">${title}</div>
        <div class="dash-focus-sub">${sub}</div>
      </div>
      <button type="button" class="dash-focus-btn" onclick="${btnAction}">${btnLabel} →</button>
    </div>`;
}

function renderDashActions() {
  const el = document.getElementById('dashActions');
  if (!el) return;
  const refillCount = (MC_STATE.cassettes||[]).filter(c=>c.status!=='IN').length;
  const dispCount = (MC_STATE.orders||[]).filter(o=>isPatientInCurrentCart(o.patientId) && o.status==='PENDING').length;
  const svgArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  el.innerHTML = `
    <button type="button" class="action-card-v2 action-teal" onclick="startNormalFlow()">
      <div class="action-bg" aria-hidden="true"></div>
      <div class="action-icon-v2">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </div>
      <div class="action-text-v2">
        <div class="action-name-v2">จัดยาเข้ารถเข็น</div>
        <div class="action-sub-v2">Medication Preparation</div>
      </div>
      ${refillCount > 0 ? `<span class="action-badge-v2 amber">${refillCount}</span>` : ''}
      <div class="action-arrow">${svgArrow}</div>
    </button>

    <button type="button" class="action-card-v2 action-coral" onclick="location.hash='#pg-dispense-rounds'">
      <div class="action-bg" aria-hidden="true"></div>
      <div class="action-icon-v2">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </div>
      <div class="action-text-v2">
        <div class="action-name-v2">จ่ายยาให้ผู้ป่วย</div>
        <div class="action-sub-v2">Medication Administration</div>
      </div>
      ${dispCount > 0 ? `<span class="action-badge-v2 red">${dispCount}</span>` : ''}
      <div class="action-arrow">${svgArrow}</div>
    </button>

    <a href="#pg-dispense-dashboard" class="action-card-v2 action-violet" style="text-decoration:none;color:inherit;">
      <div class="action-bg" aria-hidden="true"></div>
      <div class="action-icon-v2">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v18h18"/><polyline points="7 14 11 10 15 14 21 8"/>
        </svg>
      </div>
      <div class="action-text-v2">
        <div class="action-name-v2">รายงานการจ่ายยา</div>
        <div class="action-sub-v2">Medication Administration Record</div>
      </div>
      <div class="action-arrow">${svgArrow}</div>
    </a>`;
}

function renderDashTeam() {
  const el = document.getElementById('dashTeam');
  if (!el) return;
  const team = [
    { initials:'สม', name:'นส.สมใจ ดีมาก',     role:'พยาบาล',  status:'กำลังจ่ายยา', color:'var(--accent-dk)', dot:'#10b981' },
    { initials:'วก', name:'ภก.วิภา เจริญยา',  role:'เภสัชกร', status:'กำลังจัดยา',  color:'var(--accent)',    dot:'#10b981' },
    { initials:'ปร', name:'นส.ปราณี รุ่งเรือง', role:'พยาบาล',  status:'ว่าง',         color:'#0a3d35',          dot:'#94a3b8' },
  ];
  el.innerHTML = team.map(m => `
    <div class="team-row">
      <div class="team-avatar" style="background:${m.color}">${m.initials}</div>
      <div class="team-info">
        <div class="team-name">${m.name}</div>
        <div class="team-meta">${m.role} · ${m.status}</div>
      </div>
      <span class="team-dot" style="background:${m.dot}"></span>
    </div>`).join('');
  document.getElementById('dashTeamCount').textContent = team.length + ' คน';
}

/* Inventory section (cart inventory hero + cassette stats + drawer map) */
function renderDashInventory() {
  const el = document.getElementById('dashInventory');
  if (!el) return;
  const cart = getCart(MC_STATE.currentCartId);
  const wardName = getCurrentWard().name;
  const cassettes = MC_STATE.cassettes || [];
  const total = cassettes.length;
  const z1 = zone1Drawers();
  const drawerCount = z1.length + (zone2Drawer() ? 1 : 0);
  const filled  = cassettes.filter(c => c.quantity > 0 && c.status === 'IN').length;
  const inProgress = cassettes.filter(c => c.status === 'OUT' || c.status === 'OUT_ALERT').length;
  const empty   = cassettes.filter(c => c.quantity === 0).length;
  const recentRefilled = (MC_STATE.session.refilledCassettes || []).length;

  // Drawer map grid (Zone 1 only) — layout from template rows × cols
  const tmpl = cart ? getCartTemplate(cart.templateId) : null;
  const drawerCards = z1.map(d => {
    const drawerNum = parseInt(d.id.replace('D',''), 10);
    const cfg = tmpl ? tmpl.drawers.find(td => td.drawerNumber === drawerNum) : null;
    const cols = cfg ? (cfg.cols || 4) : 4;
    const rows = cfg ? (cfg.rows || 1) : 1;
    const totalSlots = rows * cols;

    const cassBySlot = {};
    drawerCassettes(d.id).forEach(c => { cassBySlot[c.slotNumber] = c; });

    const filledN = Object.values(cassBySlot).filter(c => c.drugId && c.quantity > 0).length;

    const cells = Array.from({length: totalSlots}, (_, i) => {
      const slotNum = i + 1;
      const cass    = cassBySlot[slotNum];
      const isDone  = (typeof _PPD_DONE_CASSETTES !== 'undefined') &&
                      _PPD_DONE_CASSETTES.has(d.id + ':' + slotNum);
      const hasCass = cass && cass.drugId;
      // All slots are clickable — empty slots open the empty-state modal
      const clickAttr = ` onclick="openCassetteInfo('${d.id}',${slotNum})" style="cursor:pointer;"`;

      if (isDone && hasCass) {
        return `<div class="inv-cell inv-cell-done"${clickAttr} title="ช่อง ${slotNum} · จัดยาแล้ว · กดดูรายละเอียด">
          <span class="inv-cell-done-mark"><svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span class="inv-cell-slot">${slotNum}</span>
        </div>`;
      }
      const cellCls = hasCass ? 'inv-cell-filled' : 'inv-cell-empty';
      return `<div class="inv-cell ${cellCls}"${clickAttr} title="ช่อง ${slotNum}${hasCass ? ' · กดดูรายละเอียด' : ' · ว่าง · กดดูรายละเอียด'}">
        <span class="inv-cell-dot"></span>
        <span class="inv-cell-slot">${slotNum}</span>
      </div>`;
    }).join('');

    return `
      <div class="inv-drawer">
        <div class="inv-drawer-head">
          <span class="inv-drawer-id">${d.id}</span>
          <span class="inv-drawer-label">${d.name.split('·')[1]?.trim() || ''}</span>
          <span class="inv-drawer-count">${filledN}/${totalSlots}</span>
        </div>
        <div class="inv-drawer-cells" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <!-- Hero banner -->
    <div class="inv-hero">
      <div class="inv-hero-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </div>
      <div class="inv-hero-text">
        <div class="inv-hero-tag">LIVE CART INVENTORY</div>
        <div class="inv-hero-title">ข้อมูล Cassette รถเข็นยา</div>
        <div class="inv-hero-sub">${cart ? cart.name : '—'} · ${wardName} · พร้อมใช้งาน</div>
      </div>
      <div class="inv-hero-badge">
        <span class="inv-badge-dot"></span>
        ${recentRefilled > 0 ? `${recentRefilled} ช่องเติมยาเรียบร้อยแล้ว` : 'ระบบพร้อมใช้งาน'}
      </div>
    </div>

    <!-- 4 stat tiles -->
    <div class="inv-stats">
      <div class="inv-stat">
        <div class="inv-stat-val">${total}</div>
        <div class="inv-stat-label">Cassette ทั้งหมด</div>
        <div class="inv-stat-sub">${drawerCount} Drawer</div>
      </div>
      <div class="inv-stat">
        <div class="inv-stat-val inv-val-blue">${filled}</div>
        <div class="inv-stat-label">เติมยาแล้ว</div>
        <div class="inv-stat-sub">จัดยาครบแล้ว</div>
      </div>
      <div class="inv-stat">
        <div class="inv-stat-val inv-val-orange">${inProgress}</div>
        <div class="inv-stat-label">กำลังจัด</div>
        <div class="inv-stat-sub">เลือกแล้ว · รอจัดยา</div>
      </div>
      <div class="inv-stat">
        <div class="inv-stat-val inv-val-green">${total - filled - inProgress}</div>
        <div class="inv-stat-label">ว่าง</div>
        <div class="inv-stat-sub">รอจัดยา</div>
      </div>
    </div>

    <!-- Drawer map -->
    <div class="form-card inv-map-card">
      <div class="inv-map-head">
        <div class="form-card-title">Drawer Map</div>
        <div class="inv-map-sub">${z1.length} Drawer · เฉลี่ย ${z1.length ? Math.round(total/z1.length) : 0} Cassette ต่อ Drawer · ${total} ช่องทั้งหมด</div>
      </div>
      <div class="inv-grid">${drawerCards}</div>
      <div class="inv-legend">
        <span class="inv-legend-item"><span class="inv-legend-dot inv-cell-ready"></span>พร้อมใช้</span>
        <span class="inv-legend-item"><span class="inv-legend-dot inv-cell-by-patient"></span>By Patient</span>
        <span class="inv-legend-item"><span class="inv-legend-dot inv-cell-by-item"></span>By Item</span>
        <span class="inv-legend-item"><span class="inv-legend-dot inv-cell-by-round"></span>By Round</span>
        <span class="inv-legend-item"><span class="inv-legend-dot inv-cell-unavail"></span>ไม่พร้อมใช้</span>
      </div>
    </div>`;
}

function currentRound() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11)  return 'เช้า';
  if (h >= 11 && h < 15) return 'กลางวัน';
  if (h >= 15 && h < 19) return 'เย็น';
  return 'ก่อนนอน';
}

function renderDashRounds() {
  const el = document.getElementById('dashRounds');
  if (!el) return;
  const cur = currentRound();
  const roundIcons = {
    'เช้า':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
    'กลางวัน':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
    'เย็น':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="22" x2="12" y2="14"/><path d="M5 18l3-3M19 18l-3-3"/></svg>',
    'ก่อนนอน':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
  };
  const roundTimes = { 'เช้า':'08:00', 'กลางวัน':'12:00', 'เย็น':'16:00', 'ก่อนนอน':'20:00' };

  // Count patients with orders in each round (current cart only)
  const counts = {};
  ROUNDS.forEach(r => {
    const pts = new Set();
    (MC_STATE.orders || []).forEach(o => {
      if (!isPatientInCurrentCart(o.patientId)) return;
      if (o.rounds.includes(r)) pts.add(o.patientId);
    });
    counts[r] = pts.size;
  });

  el.innerHTML = ROUNDS.map(r => `
    <div class="dash-round-card ${r === cur ? 'round-current' : ''}">
      <div class="dash-round-icon">${roundIcons[r]}</div>
      <div class="dash-round-time">${roundTimes[r]}</div>
      <div class="dash-round-name">${r}</div>
      <div class="dash-round-count">${counts[r]} คน</div>
    </div>
  `).join('');

  const info = document.getElementById('dashRoundsInfo');
  if (info) info.textContent = `รอบปัจจุบัน: ${cur}`;
}

function renderDashStats() {
  const el = document.getElementById('dashStatsGrid');
  if (!el) return;
  const orders = (MC_STATE.orders || []).filter(o => isPatientInCurrentCart(o.patientId));
  const patients = [...new Set(orders.map(o => o.patientId))].length;
  const total   = orders.length;
  const done    = orders.filter(o => o.status === 'DONE' || o.status === 'SKIPPED').length;
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const donePct    = total ? Math.round(done / total * 100) : 0;
  const pendingPct = total ? Math.round(pending / total * 100) : 0;

  el.innerHTML = `
    <div class="dash-stat tone-indigo">
      <div class="dash-stat-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="dash-stat-num">${patients}</div>
      <div class="dash-stat-label">ผู้ป่วย</div>
      <div class="dash-stat-sub">Ward 3A · อายุรกรรม</div>
    </div>
    <div class="dash-stat tone-teal">
      <div class="dash-stat-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
      </div>
      <div class="dash-stat-num">${total}</div>
      <div class="dash-stat-label">รายการยา</div>
      <div class="dash-stat-sub">HIS + Manual</div>
    </div>
    <div class="dash-stat tone-green">
      <div class="dash-stat-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="dash-stat-num">${done}</div>
      <div class="dash-stat-label">จ่ายแล้ว</div>
      <div class="dash-stat-sub">${donePct}% ของรายการทั้งหมด</div>
    </div>
    <div class="dash-stat tone-amber">
      <div class="dash-stat-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="dash-stat-num">${pending}</div>
      <div class="dash-stat-label">รอจ่าย</div>
      <div class="dash-stat-sub">${pendingPct}% ของรายการทั้งหมด</div>
    </div>`;
}

function renderDashCartStatus() {
  const el = document.getElementById('dashCartStatus');
  if (!el) return;
  const cart = getCart(MC_STATE.currentCartId);
  const tmpl = cart ? getCartTemplate(cart.templateId) : null;
  const cassetteCount = (MC_STATE.cassettes || []).length;
  const slotCount = (MC_STATE.patientSlots || []).filter(s => s.patientId).length;
  const totalSlots = (MC_STATE.patientSlots || []).length;

  // Build drawer map
  const drawerMap = (MC_STATE.drawers || []).map(d => {
    if (d.zone === 1) {
      const cs = drawerCassettes(d.id).filter(c => c.drugId).sort((a,b) => a.slotNumber - b.slotNumber);
      const dots = cs.length
        ? cs.map(c => `<span class="cmap-dot cmap-${c.status.toLowerCase()}" title="${c.id}"></span>`).join('')
        : `<span style="font-size:10px;color:var(--text-3)">ยังไม่ได้ตั้งค่า</span>`;
      return `
        <div class="cmap-row">
          <span class="cmap-id">${d.id}</span>
          <div class="cmap-dots">${dots}</div>
          <span class="cmap-zone">Z1</span>
        </div>`;
    } else {
      const slots = MC_STATE.patientSlots.sort((a,b) => a.slotNumber - b.slotNumber);
      const cells = slots.map(s => `<span class="cmap-cell cmap-cell-${(s.patientId ? (s.status||'ASSIGNED') : 'EMPTY').toLowerCase()}" title="${s.id}">${s.slotNumber}</span>`).join('');
      return `
        <div class="cmap-row cmap-row-z2">
          <span class="cmap-id">${d.id}</span>
          <div class="cmap-cells">${cells}</div>
          <span class="cmap-zone">Z2</span>
        </div>`;
    }
  }).join('');

  el.innerHTML = `
    <div class="dash-cart-info">
      <div class="dash-cart-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="3" width="14" height="14" rx="2"/>
          <line x1="5" y1="8" x2="19" y2="8"/>
          <line x1="5" y1="13" x2="19" y2="13"/>
          <circle cx="8" cy="20" r="1.5"/>
          <circle cx="16" cy="20" r="1.5"/>
        </svg>
      </div>
      <div class="dash-cart-text">
        <div class="dash-cart-name">${cart ? cart.name : '—'}</div>
        <div class="dash-cart-meta">${getCurrentWard().name} · ${tmpl ? tmpl.name : '—'}</div>
      </div>
    </div>
    <div class="dash-cart-meters">
      <div class="dash-meter">
        <span class="meter-label">Cassettes</span>
        <span class="meter-val">${cassetteCount}</span>
      </div>
      <div class="dash-meter">
        <span class="meter-label">Slots ใช้</span>
        <span class="meter-val">${slotCount}/${totalSlots}</span>
      </div>
      <div class="dash-meter">
        <span class="meter-label">แบตเตอรี่</span>
        <span class="meter-val">85%</span>
      </div>
      <div class="dash-meter">
        <span class="meter-label">เครือข่าย</span>
        <span class="meter-val meter-on">Online</span>
      </div>
    </div>
    <div class="dash-cart-map">${drawerMap}</div>`;
}

function renderDashActivity() {
  const el = document.getElementById('dashActivity');
  if (!el) return;
  const items = (MC_STATE.auditLog || []).slice(0, 5);
  if (items.length === 0) {
    el.innerHTML = '<div class="audit-empty">ยังไม่มีกิจกรรม</div>';
    return;
  }
  el.innerHTML = items.map(e => {
    const time = new Date(e.ts).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
    const meta = [e.cassetteId, e.patient, e.note].filter(Boolean).join(' · ');
    return `
      <div class="dash-activity-item">
        <div class="activity-time">${time}</div>
        <span class="audit-action audit-${e.action.toLowerCase()}">${actionLabel(e.action)}</span>
        <div class="activity-info">
          <div class="activity-text">${e.drugLabel || '—'}</div>
          <div class="activity-meta">${meta || (e.user || '—')}</div>
        </div>
      </div>`;
  }).join('');
}

/* ─── Session state persistence ─────────────────────────────── */
const _STATE_KEYS = ['isAdmin','currentCartId','currentPatientId','currentDrugId',
                     'editingCartId','editingTemplateId','session','currentDrawerId',
                     // Persist user-modifiable data so refresh keeps changes (assigned drugs,
                     // dispensed orders, audit history). Static seed data (patients) is excluded
                     // since it never changes; "Reset Demo" still wipes everything.
                     'cartData','orders','auditLog'];

function saveNavState() {
  const snap = {};
  _STATE_KEYS.forEach(k => { if (MC_STATE[k] !== undefined) snap[k] = MC_STATE[k]; });
  // Save standalone prep-flow variables
  snap._ppwDetail        = _PPW_DETAIL;
  snap._prepType         = selectedPrepType;
  snap._prepRound        = selectedPrepRound;
  snap._ppdDrawer        = _PPD_SELECTED_DRAWER;
  snap._ppdCassette      = _PPD_SELECTED_CASSETTE;
  snap._ppwDoneSet       = Array.from(_PPW_DONE_SET || []);
  snap._ppdDoneCassettes = Array.from(_PPD_DONE_CASSETTES || []);
  try { sessionStorage.setItem('mc_nav', JSON.stringify(snap)); } catch {}
}

function restoreNavState() {
  try {
    const snap = JSON.parse(sessionStorage.getItem('mc_nav') || '{}');
    _STATE_KEYS.forEach(k => { if (snap[k] !== undefined) MC_STATE[k] = snap[k]; });
    // Restore standalone prep-flow variables
    if (snap._ppwDetail)        { _PPW_DETAIL.type = snap._ppwDetail.type; _PPW_DETAIL.id = snap._ppwDetail.id; _PPW_DETAIL.orderIds = snap._ppwDetail.orderIds || []; }
    if (snap._prepType  != null) selectedPrepType  = snap._prepType;
    if (snap._prepRound != null) selectedPrepRound = snap._prepRound;
    if (snap._ppdDrawer   != null) _PPD_SELECTED_DRAWER   = snap._ppdDrawer;
    if (snap._ppdCassette != null) _PPD_SELECTED_CASSETTE = snap._ppdCassette;
    if (snap._ppwDoneSet)       _PPW_DONE_SET       = new Set(snap._ppwDoneSet);
    if (snap._ppdDoneCassettes) _PPD_DONE_CASSETTES = new Set(snap._ppdDoneCassettes);
  } catch {}
}

/* ─── Page init — เรียกหลัง render template ─────────────────── */
function initPage() {
  restoreNavState();
  _selectedWard = null;
  startClock();
  startLockTicker();
  updateTabBar();
  applyWardToPage();
  applyCartToPage();
  initCartPage();
  initSelectWard();
  initDashboard();
  initLoadMode();
  initPatientQueue();
  initPatientDetail();
  initZone2();
  initAdminCarts();
  initAdminCartEdit();
  initAdminTemplate();
  initSessionConfig();
  initDrugQueue();
  initDrugDetail();
  initSessionSummary();
  initLoadMeds();
  initDrawerDetail();
  initRefill();
  initConfig();
  initAudit();
  initPrepType();
  initPrepWork();
  initPrepDrawer();
  initScanDrug();
  initDispenseRounds();
  initDispenseQueue();
  initDispenseVerify();
  initDispenseAdminister();
  initDispenseSummary();
  initDispenseDashboard();
}


/* ══════════════════════════════════════════════════════════
   INTEGRATED JS: pg-prep-type
   ══════════════════════════════════════════════════════════ */

/* ── ward filter helper ── */
function _wardOrders() {
  const ward    = getCurrentWard();
  const side    = ward.id.slice(-1);           // 'A' or 'B'
  const wardKey = 'Ward ' + side;              // 'Ward A' or 'Ward B'
  const patMap  = {};
  (MC_STATE.patients || []).forEach(function(p) { patMap[p.id] = p; });
  return (MC_STATE.orders || []).filter(function(o) {
    var p = patMap[o.patientId];
    return p && p.ward === wardKey;
  });
}

/* ── renderPrepTypePage ── */
function renderPrepTypePage() {
  const orders   = _wardOrders();
  const patients = new Set(orders.map(function(o) { return o.patientId; })).size;
  const drugs    = new Set(orders.map(function(o) { return o.drugId; })).size;
  const total    = orders.length;
  const morning  = orders.filter(function(o) { return o.rounds && o.rounds.includes('เช้า'); }).length;
  const noon     = orders.filter(function(o) { return o.rounds && o.rounds.includes('กลางวัน'); }).length;
  const evening  = orders.filter(function(o) { return o.rounds && o.rounds.includes('เย็น'); }).length;
  const bedtime  = orders.filter(function(o) { return o.rounds && o.rounds.includes('ก่อนนอน'); }).length;
  const allRound = morning + noon + evening + bedtime;

  function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  // Hero
  set('ptpNumPatients', patients);
  set('ptpNumTotal', allRound);

  // Type cards
  set('ptpChipPatients',  patients + ' ผู้ป่วย');
  set('ptpChipOrders',    allRound + ' รายการ');
  set('ptpChipDrugs',     drugs + ' ชนิดยา');
  set('ptpChipOrdersMed', patients + ' ผู้ป่วย');

  // Round totals
  set('ptpNumAllRounds', allRound);
  set('ptpNumMorning',   morning);
  set('ptpNumNoon',      noon);
  set('ptpNumEvening',   evening);
  set('ptpNumBedtime',   bedtime);
}



function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  if (!msg) { t.classList.remove('show'); return; }
  t.textContent = msg;
  t.classList.add('show');
}


/* ── Page init stubs for integrated pages ─────────────────── */

let selectedPrepType = null;
let selectedPrepRound = null;

const _PTP_TYPE_LABELS  = { patient: 'จัดยาตามผู้ป่วย', medication: 'จัดยาสามัญ' };
const _PTP_ROUND_LABELS = { all: 'ทุกรอบเวลา', morning: 'รอบเช้า', noon: 'รอบเที่ยง', evening: 'รอบเย็น', bedtime: 'ก่อนนอน' };

function selectPrepType(type) {
  selectedPrepType = type;
  selectedPrepRound = null;

  // update type card selection
  const cardMap = { patient: 'ptpCardPatient', medication: 'ptpCardMedication' };
  Object.values(cardMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('selected', id === cardMap[type]);
  });
  const status = document.getElementById('ptpTypeStatus');
  if (status) status.textContent = '✓ ' + _PTP_TYPE_LABELS[type];

  const lock       = document.getElementById('ptpRoundLock');
  const content    = document.getElementById('ptpRoundContent');
  const rs         = document.getElementById('ptpRoundStatus');
  const roundPanel = document.getElementById('ptpRoundPanel');

  if (type === 'medication') {
    if (roundPanel) roundPanel.style.display = 'none';
    selectedPrepRound = 'all';
    const s1 = document.getElementById('ptpStep1'); if (s1) { s1.classList.remove('active'); s1.classList.add('done'); }
    const s2 = document.getElementById('ptpStep2'); if (s2) { s2.classList.add('done'); s2.classList.remove('active'); }
    const s3 = document.getElementById('ptpStep3'); if (s3) s3.classList.add('active');
  } else {
    if (roundPanel) roundPanel.style.display = '';
    if (lock)    lock.style.display = 'none';
    if (content) content.style.display = 'block';
    ['ptpRoundAll','ptpRoundMorning','ptpRoundNoon','ptpRoundEvening','ptpRoundBedtime'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('selected');
    });
    if (rs) rs.textContent = 'เลือก 1 รอบ';
    const s1 = document.getElementById('ptpStep1'); if (s1) { s1.classList.remove('active'); s1.classList.add('done'); }
    const s2 = document.getElementById('ptpStep2'); if (s2) { s2.classList.add('active'); s2.classList.remove('done'); }
  }

  _ptpUpdateConfirmBar();
}

function selectPrepRound(round) {
  selectedPrepRound = round;

  const roundEls = { all: 'ptpRoundAll', morning: 'ptpRoundMorning', noon: 'ptpRoundNoon', evening: 'ptpRoundEvening', bedtime: 'ptpRoundBedtime' };
  Object.entries(roundEls).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('selected', key === round);
  });
  const rs = document.getElementById('ptpRoundStatus');
  if (rs) rs.textContent = '✓ ' + _PTP_ROUND_LABELS[round];

  // step indicators
  const s2 = document.getElementById('ptpStep2'); if (s2) { s2.classList.remove('active'); s2.classList.add('done'); }
  const s3 = document.getElementById('ptpStep3'); if (s3) s3.classList.add('active');

  _ptpUpdateConfirmBar();
}

function _ptpUpdateConfirmBar() {
  const summary = document.getElementById('ptpConfirmSummary');
  const btn     = document.getElementById('ptpConfirmBtn');
  const isMedication = selectedPrepType === 'medication';
  const ready = !!(selectedPrepType && (isMedication || selectedPrepRound));
  if (btn) btn.disabled = !ready;
  if (summary) {
    if (!selectedPrepType) {
      summary.textContent = 'เลือกประเภทและรอบเวลา';
    } else if (isMedication) {
      summary.textContent = 'จัดยาสามัญ · จัดยาสำรองในรถ';
    } else if (!selectedPrepRound) {
      summary.textContent = _PTP_TYPE_LABELS[selectedPrepType] + ' · เลือกรอบเวลา';
    } else {
      summary.textContent = _PTP_TYPE_LABELS[selectedPrepType] + ' · ' + _PTP_ROUND_LABELS[selectedPrepRound];
    }
  }
}

function confirmPrepFlow() {
  if (!selectedPrepType) return;
  if (selectedPrepType !== 'medication' && !selectedPrepRound) return;
  goToPrepFlow(selectedPrepType, selectedPrepRound);
}

function goToPrepFlow(type, round) {
  selectedPrepType = type;
  selectedPrepRound = round || null;
  location.hash = '#pg-prep-work';
}

function initPrepType() {
  if (location.hash.replace('#','') !== 'pg-prep-type') return;
  seedMcData();

  // reset selection state
  selectedPrepType = null;
  selectedPrepRound = null;

  // reset type cards
  ['ptpCardPatient','ptpCardMedication'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('selected');
  });
  const roundPanel = document.getElementById('ptpRoundPanel');
  if (roundPanel) roundPanel.style.display = '';
  const ts = document.getElementById('ptpTypeStatus'); if (ts) ts.textContent = 'เลือก 1 รูปแบบ';

  // lock round panel
  const lock    = document.getElementById('ptpRoundLock');
  const content = document.getElementById('ptpRoundContent');
  if (lock)    lock.style.display = '';
  if (content) content.style.display = 'none';
  ['ptpRoundAll','ptpRoundMorning','ptpRoundNoon','ptpRoundEvening','ptpRoundBedtime'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('selected');
  });
  const rs = document.getElementById('ptpRoundStatus'); if (rs) rs.textContent = 'เลือกประเภทก่อน';

  // step indicators
  ['ptpStep1','ptpStep2','ptpStep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', i === 0);
    el.classList.remove('done');
  });

  // confirm bar
  _ptpUpdateConfirmBar();

  if (typeof renderPrepTypePage === 'function') renderPrepTypePage();
}

/* ── pg-prep-work ─────────────────────────────────────────── */
const _PPW_ROUND_MAP = { morning:'เช้า', noon:'กลางวัน', evening:'เย็น', bedtime:'ก่อนนอน' };
var _PPW_DONE_SET = new Set();
var _PPW_DETAIL = { type: null, id: null, orderIds: [] };

function initPrepWork() {
  if (location.hash.replace('#','') !== 'pg-prep-work') return;
  if (!_PPW_DONE_SET) _PPW_DONE_SET = new Set();
  seedMcData();
  // Default to medication mode (Order ยาจากหมอ — group by drug)
  if (!selectedPrepType)  selectedPrepType  = 'medication';
  if (!selectedPrepRound) selectedPrepRound = 'all';
  _syncPpwRoundChips();
  renderPrepWorkPage();
}

function setPpwRound(round) {
  selectedPrepRound = round;
  _syncPpwRoundChips();
  renderPrepWorkPage();
}

function _syncPpwRoundChips() {
  var chips = document.querySelectorAll('#ppwRoundChips .ppw-round-chip');
  chips.forEach(function(c) {
    c.classList.toggle('active', c.dataset.round === (selectedPrepRound || 'all'));
  });
}

function renderPrepWorkPage() {
  const type  = selectedPrepType  || 'patient';
  const round = selectedPrepRound || 'all';

  const roundTh   = _PPW_ROUND_MAP[round] || null;
  const roundLabel = _PTP_ROUND_LABELS[round] || 'ทุกรอบเวลา';
  const typeLabel  = _PTP_TYPE_LABELS[type]  || 'จัดยา';

  // filter orders by ward then by round
  const orders = _wardOrders().filter(function(o) {
    if (!roundTh) return true;
    return o.rounds && o.rounds.includes(roundTh);
  });

  // lookup helpers
  const patients   = MC_STATE.patients || [];
  const patientMap = {};
  patients.forEach(function(p) { patientMap[p.id] = p; });
  const drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  // update hero
  const set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('ppwTitle',  typeLabel);
  set('ppwSub',    roundLabel);
  set('ppwNavSub', typeLabel + ' · ' + roundLabel);

  var listEl = document.getElementById('ppwList');
  if (!listEl) return;

  if (type === 'patient') {
    // group by patient
    var groups = {};
    orders.forEach(function(o) {
      if (!groups[o.patientId]) groups[o.patientId] = [];
      groups[o.patientId].push(o);
    });
    var patientIds = Object.keys(groups);

    set('ppwStatA',    patientIds.length);
    set('ppwStatALbl', 'ผู้ป่วย');
    set('ppwStatB',    orders.length);
    set('ppwStatBLbl', 'รายการ');
    set('ppwPanelTitle', 'รายชื่อผู้ป่วย (' + patientIds.length + ' ราย)');

    if (!patientIds.length) {
      listEl.innerHTML = '<div class="ppw-empty">ไม่มีรายการใน' + roundLabel + '</div>';
      return;
    }

    listEl.innerHTML = '<div class="ppw-list">' + patientIds.map(function(pid) {
      var p   = patientMap[pid] || { name: pid, ward: '—', bed: '—' };
      var oList = groups[pid];
      var chips = oList.map(function(o) {
        var d = drugMap[o.drugId] || { name: o.drugId, dose: '' };
        var label = d.name + (d.dose ? ' ' + d.dose : '');
        if (round === 'all') label += ' (' + (o.rounds || []).join('/') + ')';
        return '<span class="ppw-chip">' + label + '</span>';
      }).join('');
      var svgPatient = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/></svg>';
      var svgDone    = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>';
      var isDone = _PPW_DONE_SET.has('patient:' + pid);
      var doneClass = isDone ? ' ppw-row-done' : '';
      var orderIds = oList.map(function(o) { return o.id; }).join(',');
      return '<div class="ppw-row' + doneClass + '" onclick="openPrepDetail(\'patient\',\'' + pid + '\',\'' + orderIds + '\')">'
        + '<div class="ppw-avatar">' + (isDone ? svgDone : svgPatient) + '</div>'
        + '<div class="ppw-row-body">'
        +   '<div class="ppw-row-name">' + p.name + '</div>'
        +   '<div class="ppw-row-meta">' + p.ward + ' · เตียง ' + p.bed + '</div>'
        +   '<div class="ppw-chips">' + chips + '</div>'
        + '</div>'
        + '<div class="ppw-badge">' + (isDone ? 'จัดแล้ว' : oList.length + ' รายการ') + '</div>'
        + '</div>';
    }).join('') + '</div>';

  } else if (type === 'medication') {
    // จัดยาสามัญ — group orders by drug
    var groups = {};
    orders.forEach(function(o) {
      if (!groups[o.drugId]) groups[o.drugId] = [];
      groups[o.drugId].push(o);
    });
    var drugIds = Object.keys(groups);
    var uniquePatients = new Set(orders.map(function(o) { return o.patientId; })).size;

    set('ppwStatA',    drugIds.length);
    set('ppwStatALbl', 'ชนิดยา');
    set('ppwStatB',    uniquePatients);
    set('ppwStatBLbl', 'ผู้ป่วย');
    set('ppwPanelTitle', 'จัดยาสามัญ (' + drugIds.length + ' ชนิด)');

    if (!drugIds.length) {
      listEl.innerHTML = '<div class="ppw-empty">ไม่มีรายการยาสามัญ</div>';
      return;
    }

    var svgPill = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
    var svgIV   = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="18" x2="12" y2="21"/></svg>';
    var svgDoneDrug = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>';

    listEl.innerHTML = '<div class="ppw-list">' + drugIds.map(function(did) {
      var d     = drugMap[did] || { name: did, dose: '', type: 'oral' };
      var oList = groups[did];
      var typeStr = d.type === 'iv' ? 'ยาฉีด/IV' : 'ยากิน';
      var isDone  = _PPW_DONE_SET.has('drug:' + did);
      var doneClass = isDone ? ' ppw-row-done' : '';
      var orderIds = oList.map(function(o) { return o.id; }).join(',');
      var drugIcon = isDone ? svgDoneDrug : (d.type === 'iv' ? svgIV : svgPill);
      return '<div class="ppw-row' + doneClass + '" onclick="openPrepDetail(\'drug\',\'' + did + '\',\'' + orderIds + '\')">'
        + '<div class="ppw-avatar drug">' + drugIcon + '</div>'
        + '<div class="ppw-row-body">'
        +   '<div class="ppw-row-name">' + d.name + (d.dose ? ' ' + d.dose : '') + '</div>'
        +   '<div class="ppw-row-meta">' + typeStr + '</div>'
        + '</div>'
        + '<div class="ppw-badge">' + (isDone ? 'จัดแล้ว' : oList.length + ' คน') + '</div>'
        + '</div>';
    }).join('') + '</div>';

  }
}

/* ── pg-prep-drawer (Drawer Map page) ────────────────────── */

function openPrepDetail(type, id, orderIdsStr) {
  _PPW_DETAIL.type     = type;
  _PPW_DETAIL.id       = id;
  _PPW_DETAIL.orderIds = orderIdsStr ? orderIdsStr.split(',') : [];
  location.hash = '#pg-prep-drawer';
}

/* pg-prep-drawer state */
var _PPD_SELECTED_DRAWER   = null;
var _PPD_SELECTED_CASSETTE = null;
var _PPD_DONE_CASSETTES    = new Set(); // 'D1:3' format — persists across drawer page visits

function initPrepDrawer() {
  if (location.hash.replace('#','') !== 'pg-prep-drawer') return;
  _PPD_SELECTED_DRAWER   = null;
  _PPD_SELECTED_CASSETTE = null;
  seedMcData();
  _renderPrepDrawerPage();
}

function _renderPrepDrawerPage() {
  var type     = _PPW_DETAIL.type;
  var id       = _PPW_DETAIL.id;
  var orderIds = _PPW_DETAIL.orderIds;

  // Apply mode class for CSS-driven design differences
  var ppdBody = document.querySelector('.ppd-body');
  if (ppdBody) {
    ppdBody.classList.remove('ppd-mode-patient', 'ppd-mode-drug');
    ppdBody.classList.add(type === 'patient' ? 'ppd-mode-patient' : 'ppd-mode-drug');
  }

  // Update mode-specific text
  var btnLabel = document.getElementById('ppdStartBtnLabel');
  var selSub   = document.getElementById('ppdSelSub');
  if (type === 'patient') {
    if (btnLabel) btnLabel.textContent = 'เริ่มจัดยาสำหรับผู้ป่วยรายนี้';
    if (selSub)   selSub.textContent   = 'พร้อมเริ่มจัดยาสำหรับผู้ป่วยรายนี้';
  } else {
    if (btnLabel) btnLabel.textContent = 'เริ่มจัดยานี้';
    if (selSub)   selSub.textContent   = 'พร้อมเริ่มจัดยานี้';
  }

  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });
  var patientMap = {};
  (MC_STATE.patients || []).forEach(function(p) { patientMap[p.id] = p; });

  var orders = (MC_STATE.orders || []).filter(function(o) {
    return orderIds.indexOf(o.id) !== -1;
  });
  var neededDrugIds = [];
  orders.forEach(function(o) {
    if (neededDrugIds.indexOf(o.drugId) === -1) neededDrugIds.push(o.drugId);
  });

  var drawers1  = (MC_STATE.drawers  || []).filter(function(d) { return d.zone === 1; });
  var cassettes = MC_STATE.cassettes || [];

  // ── Hero: fully mode-specific rendering ──
  var heroLeft = document.getElementById('ppdHeroLeft');
  var statOrdersLbl  = document.getElementById('ppdStatOrdersLbl');
  var statDrawersLbl = document.getElementById('ppdStatDrawersLbl');
  var statOrders     = document.getElementById('ppdStatOrders');
  var statDrawers    = document.getElementById('ppdStatDrawers');

  var svgAlertSmall = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var svgPillLg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  var svgIVLg   = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="18" x2="12" y2="21"/></svg>';
  var svgPersonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var svgPillIcon   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="4"/><line x1="6" y1="12" x2="18" y2="12"/></svg>';

  if (type === 'patient') {
    // ─── Patient mode hero ───
    var p = patientMap[id] || { name: id, ward: '—', bed: '—', hn: '—', gender: '—', age: '—', allergies: [] };
    var init = p.name ? (p.name.match(/[ก-๙a-zA-Z]/) ? p.name.match(/[ก-๙a-zA-Z]/)[0] : p.name.charAt(0)) : '?';
    var allergyHtml = (p.allergies && p.allergies.length > 0)
      ? '<div class="ppd-hero-allergy">' + svgAlertSmall + ' Drug Allergy: ' + p.allergies.join(', ') + '</div>'
      : '';

    if (heroLeft) heroLeft.innerHTML =
      '<div class="ppd-hero-pt">'
      + '<div class="ppd-hero-pt-avatar">' + init + '</div>'
      + '<div class="ppd-hero-pt-info">'
      +   '<div class="hero-tag-row"><div class="hero-tag"><span class="hero-tag-dot"></span>จัดยาตามผู้ป่วย</div></div>'
      +   '<div class="hero-greet">' + (p.name || '—') + '</div>'
      +   '<div class="hero-sub">HN: ' + (p.hn || '—') + ' · เตียง ' + (p.bed || '—') + ' · ' + (p.gender || '—') + ', ' + (p.age || '—') + ' ปี</div>'
      +   allergyHtml
      + '</div>'
      + '</div>';

    // Stats: drug count + cassette count
    var neededCassetteCount = neededDrugIds.length; // 1 cassette per drug type
    if (statOrders)     statOrders.textContent     = orders.length;
    if (statOrdersLbl)  statOrdersLbl.textContent  = 'รายการยา';
    if (statDrawers)    statDrawers.textContent    = neededCassetteCount;
    if (statDrawersLbl) statDrawersLbl.textContent = 'Cassette ที่ต้องการ';

    // Right panel: pill icon (showing drug list)
    var rpIcon = document.getElementById('ppdRightPanelIcon');
    if (rpIcon) { rpIcon.className = 'dash-panel-icon dash-panel-icon-indigo'; rpIcon.innerHTML = svgPillIcon; }

  } else {
    // ─── Drug mode hero ───
    var drug  = drugMap[id] || { name: id, dose: '', type: 'oral' };
    var isIV  = drug.type === 'iv';
    var ptCount  = (new Set(orders.map(function(o) { return o.patientId; }))).size;
    var totalQty = orders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);
    var unit  = isIV ? 'ถุง' : 'เม็ด';

    if (heroLeft) heroLeft.innerHTML =
      '<div class="ppd-hero-drug">'
      + '<div class="ppd-hero-drug-icon' + (isIV ? ' iv' : '') + '">' + (isIV ? svgIVLg : svgPillLg) + '</div>'
      + '<div class="ppd-hero-drug-info">'
      +   '<div class="hero-tag-row">'
      +     '<div class="hero-tag"><span class="hero-tag-dot"></span>จัดยาตามรายการยา</div>'
      +     '<div class="hero-tag ppd-hero-route-tag">' + (isIV ? 'IV' : 'PO · Oral') + '</div>'
      +   '</div>'
      +   '<div class="hero-greet">' + drug.name + (drug.dose ? ' ' + drug.dose : '') + '</div>'
      +   '<div class="hero-sub">จ่ายให้ผู้ป่วย ' + ptCount + ' คน · รวม ' + totalQty + ' ' + unit + '</div>'
      + '</div>'
      + '</div>';

    // Stats: patient count + total quantity
    if (statOrders)     statOrders.textContent     = ptCount;
    if (statOrdersLbl)  statOrdersLbl.textContent  = 'ผู้ป่วย';
    if (statDrawers)    statDrawers.textContent    = totalQty;
    if (statDrawersLbl) statDrawersLbl.textContent = unit + ' รวม';

    // Right panel: person icon (showing patient list)
    var rpIcon2 = document.getElementById('ppdRightPanelIcon');
    if (rpIcon2) { rpIcon2.className = 'dash-panel-icon dash-panel-icon-teal'; rpIcon2.innerHTML = svgPersonIcon; }
  }

  // ── Drug list sidebar ──
  _renderPpdDrugList(orders, drugMap);

  // ── STEP 1: Drawer row ──
  _renderPpdDrawerGrid(drawers1, cassettes, neededDrugIds);

  // ── STEP 2: Cassette grid (disabled initially) ──
  _renderPpdCassetteArea(cassettes, neededDrugIds);
}

function _renderPpdDrugList(orders, drugMap) {
  var listEl  = document.getElementById('ppdDrugList');
  var countEl = document.getElementById('ppdDrugCountLabel');
  if (!listEl) return;

  var type = _PPW_DETAIL.type;

  if (type === 'drug') {
    // Medication/PRN mode — show patient list for this drug
    var patientMap = {};
    (MC_STATE.patients || []).forEach(function(p) { patientMap[p.id] = p; });
    if (countEl) countEl.textContent = 'ผู้ป่วยที่ต้องการยานี้ (' + orders.length + ')';

    var html = '';
    orders.forEach(function(o) {
      var p = patientMap[o.patientId] || { name: o.patientId, ward: '—', bed: '—' };
      var initial = p.name ? p.name.replace(/^[^฀-๿]*/, '').charAt(0) || p.name.charAt(0) : '?';
      html += '<div class="ppd-drug-item" style="background:rgba(255,255,255,0.72);border:1px solid rgba(0,0,0,0.06);border-left:3px solid #2563eb;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
        + '<div style="width:30px;height:30px;background:linear-gradient(135deg,#dbeafe,#eff6ff);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#2563eb;">' + initial + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:12.5px;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.name + '</div>'
        +   '<div style="font-size:10px;color:var(--text-3);margin-top:1px;">' + (p.ward || '—') + ' · เตียง ' + (p.bed || '—') + '</div>'
        + '</div>'
        + '<span style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:700;background:#dbeafe;color:#2563eb;">' + (o.qty || 1) + ' หน่วย</span>'
        + '</div>';
    });
    listEl.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">ไม่มีผู้ป่วย</div>';

  } else {
    // Patient mode — show drug list for this patient
    if (countEl) countEl.textContent = 'รายการยา (' + orders.length + ')';

    var drugColors = ['#3B82F6','#0D9488','#8B5CF6','#EF4444','#F59E0B','#EC4899','#6366F1'];
    var drugBg     = ['linear-gradient(135deg,#EFF6FF,#DBEAFE)',
                      'linear-gradient(135deg,#F0FDFA,#CCFBF1)',
                      'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
                      'linear-gradient(135deg,#FEF2F2,#FEE2E2)',
                      'linear-gradient(135deg,#FFFBEB,#FEF3C7)',
                      'linear-gradient(135deg,#FDF2F8,#FCE7F3)',
                      'linear-gradient(135deg,#EEF2FF,#E0E7FF)'];

    var html = '';
    orders.forEach(function(o, i) {
      var drug  = drugMap[o.drugId] || { name: o.drugId, dose: '', type: 'oral' };
      var color = drug.type === 'iv' ? '#0D9488' : drugColors[i % drugColors.length];
      var bg    = drug.type === 'iv' ? 'linear-gradient(135deg,#F0FDFA,#CCFBF1)' : drugBg[i % drugBg.length];
      var rounds = (o.rounds || []).join(', ') || '—';
      var route  = drug.type === 'iv' ? 'IV' : 'PO';

      html += '<div class="ppd-drug-item" style="background:rgba(255,255,255,0.72);border:1px solid rgba(0,0,0,0.06);border-left:3px solid ' + color + ';border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
        + '<div style="width:30px;height:30px;background:' + bg + ';border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="4"/><line x1="6" y1="12" x2="18" y2="12"/></svg>'
        + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="font-size:12.5px;font-weight:700;color:var(--text-1);">' + drug.name + ' ' + drug.dose + '</div>'
        +   '<div style="font-size:10px;color:var(--text-3);margin-top:1px;">' + (o.qty || 1) + ' หน่วย · ' + route + ' · ' + rounds + '</div>'
        + '</div>'
        + '<span style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:700;background:' + bg + ';color:' + color + ';">รอจัด</span>'
        + '</div>';
    });
    listEl.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">ไม่มีรายการยา</div>';
  }

  listEl.querySelectorAll('.ppd-drug-item').forEach(function(el, i) {
    el.style.animationDelay = (i * 0.07) + 's';
  });
}

function _drawerMaxSlots(drawer) {
  var cart = getCart(MC_STATE.currentCartId);
  var tmpl = cart ? getCartTemplate(cart.templateId) : null;
  var drawerNum = parseInt(drawer.id.replace('D', ''), 10);
  var cfg = tmpl ? tmpl.drawers.find(function(td) { return td.drawerNumber === drawerNum; }) : null;
  return cfg ? (cfg.rows || 1) * (cfg.cols || cfg.cassetteSlots || 4) : 4;
}

function _drawerCols(drawer) {
  var cart = getCart(MC_STATE.currentCartId);
  var tmpl = cart ? getCartTemplate(cart.templateId) : null;
  var drawerNum = parseInt(drawer.id.replace('D', ''), 10);
  var cfg = tmpl ? tmpl.drawers.find(function(td) { return td.drawerNumber === drawerNum; }) : null;
  return cfg ? (cfg.cols || 4) : 4;
}

function _renderPpdDrawerGrid(drawers1, cassettes, neededDrugIds) {
  var gridEl = document.getElementById('ppdDrawerGrid');
  if (!gridEl) return;

  var svgDrawer = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="10" y1="10" x2="10" y2="20"/></svg>';

  var html = '';
  drawers1.forEach(function(drawer) {
    var drawerNum  = drawer.id.replace('D', '');
    var isSelected = _PPD_SELECTED_DRAWER === drawer.id;

    var hasDone = false;
    _PPD_DONE_CASSETTES.forEach(function(key) {
      if (key.indexOf(drawer.id + ':') === 0) hasDone = true;
    });
    var doneClass = (hasDone && !isSelected)
      ? ' done-' + (selectedPrepType || 'patient')
      : '';
    var cls = 'ppd-drawer-slot' + (isSelected ? ' selected' : '') + doneClass;

    html += '<div class="' + cls + '" onclick="selectPpdDrawer(\'' + drawer.id + '\')">'
      + '<div class="ppd-drawer-slot-icon">' + svgDrawer + '</div>'
      + '<div class="ppd-drawer-num">' + drawerNum + '</div>'
      + '<div class="ppd-drawer-label">ชั้น ' + drawerNum + '</div>'
      + '</div>';
  });

  gridEl.innerHTML = html;

  // Stagger drawer slot entrance
  gridEl.querySelectorAll('.ppd-drawer-slot').forEach(function(el, i) {
    el.style.animationDelay = (i * 0.06) + 's';
  });
}

function selectPpdDrawer(drawerId) {
  _PPD_SELECTED_DRAWER   = drawerId;
  _PPD_SELECTED_CASSETTE = null;

  var neededDrugIds = _getPpdNeededDrugIds();
  var cassettes = MC_STATE.cassettes || [];
  var drawers1  = (MC_STATE.drawers  || []).filter(function(d) { return d.zone === 1; });
  var drawer    = drawers1.find(function(d) { return d.id === drawerId; });

  // Update drawer status badge
  var statusEl = document.getElementById('ppdHwStatus');
  if (statusEl && drawer) {
    statusEl.textContent = 'ลิ้นชัก ' + drawerId.replace('D','') + ' เลือกแล้ว';
  }

  // Show cassette area, hide lock notice
  var cassLock = document.getElementById('ppdCassLock');
  var cassGrid = document.getElementById('ppdCassetteArea');
  if (cassLock) cassLock.style.display = 'none';
  if (cassGrid) cassGrid.style.display = 'grid';

  // Update cassette panel status info
  var cassInfo = document.getElementById('ppdCassStatusInfo');
  if (cassInfo && drawer) {
    cassInfo.textContent = 'ลิ้นชัก ' + drawerId.replace('D','') + ' · เลือก Cassette';
    cassInfo.style.background = 'var(--amber-lt)';
    cassInfo.style.color = 'var(--amber)';
  }
  _ppdUpdateSelectionColors();

  // Advance step tracker: step1 done → step2 active
  var step1 = document.getElementById('ppdStep1');
  var step2 = document.getElementById('ppdStep2');
  var fill  = document.getElementById('ppdStepFill');
  if (step1) { step1.classList.remove('active'); step1.classList.add('done'); }
  if (step2) { step2.classList.add('active'); }
  if (fill)  { fill.classList.add('done'); }

  // Hide summary + disable start btn when drawer changes
  var sumEl = document.getElementById('ppdSelSummary');
  if (sumEl) sumEl.style.display = 'none';
  var btn = document.getElementById('ppdStartBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; btn.classList.remove('ppd-btn-pop'); }

  _renderPpdDrawerGrid(drawers1, cassettes, neededDrugIds);
  _renderPpdCassetteArea(cassettes, neededDrugIds);
}

function _getPpdNeededDrugIds() {
  var orderIds = _PPW_DETAIL.orderIds || [];
  var orders = (MC_STATE.orders || []).filter(function(o) {
    return orderIds.indexOf(o.id) !== -1;
  });
  var ids = [];
  orders.forEach(function(o) {
    if (ids.indexOf(o.drugId) === -1) ids.push(o.drugId);
  });
  return ids;
}

function _renderPpdCassetteArea(cassettes, neededDrugIds) {
  var areaEl = document.getElementById('ppdCassetteArea');
  if (!areaEl) return;

  if (!_PPD_SELECTED_DRAWER) {
    areaEl.innerHTML = '';
    return;
  }

  var drawer   = (MC_STATE.drawers || []).find(function(d) { return d.id === _PPD_SELECTED_DRAWER; });
  if (!drawer) return;

  var drawerCass = cassettes.filter(function(c) { return c.drawerId === _PPD_SELECTED_DRAWER; });
  var maxSlots   = _drawerMaxSlots(drawer);
  var svgCheck   = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

  var svgDone = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

  var html = '';
  for (var i = 1; i <= maxSlots; i++) {
    var slotNum    = i;
    var isSelected = _PPD_SELECTED_CASSETTE === i;
    var isDone     = _PPD_DONE_CASSETTES.has(_PPD_SELECTED_DRAWER + ':' + i);

    var cls = 'ppd-cass-slot'
      + (isDone     ? ' done'     : '')
      + (isSelected && !isDone ? ' selected' : '');

    var inner = isDone
      ? '<div class="ppd-cass-done-icon">' + svgDone + '</div>'
        + '<div class="ppd-cass-num">' + i + '</div>'
        + '<div class="ppd-cass-done-label">จัดยาแล้ว</div>'
      : '<div class="ppd-cass-check">' + svgCheck + '</div>'
        + '<div class="ppd-cass-num">' + i + '</div>';

    var clickAttr = isDone ? '' : ' onclick="selectPpdCassette(this,' + i + ')"';
    html += '<div class="' + cls + '"' + clickAttr + '>' + inner + '</div>';
  }

  areaEl.innerHTML = html;

  // Stagger cassette slot entrance
  areaEl.querySelectorAll('.ppd-cass-slot').forEach(function(el, i) {
    el.style.animationDelay = (i * 0.05) + 's';
  });
}

function selectPpdCassette(el, num) {
  _PPD_SELECTED_CASSETTE = num;

  // Toggle selected class on all slots
  var grid = document.getElementById('ppdCassetteArea');
  if (grid) {
    grid.querySelectorAll('.ppd-cass-slot').forEach(function(s) { s.classList.remove('selected'); });
  }
  if (el) el.classList.add('selected');

  var drawerNum = _PPD_SELECTED_DRAWER ? _PPD_SELECTED_DRAWER.replace('D','') : '?';

  // Update drawer status badge
  var statusEl = document.getElementById('ppdHwStatus');
  if (statusEl) statusEl.textContent = 'ลิ้นชัก ' + drawerNum + ' · Cassette ' + num;

  // Update cassette panel status info → done
  var cassInfo = document.getElementById('ppdCassStatusInfo');
  if (cassInfo) {
    var _isPatMd = _PPW_DETAIL && _PPW_DETAIL.type === 'patient';
    cassInfo.textContent = 'ลิ้นชัก ' + drawerNum + ' · Cassette ' + num;
    cassInfo.style.background = _isPatMd ? '#eef2ff' : 'var(--accent-lt)';
    cassInfo.style.color      = _isPatMd ? '#4f46e5' : 'var(--accent-dk)';
  }

  // Update confirm summary
  var confirmSummary = document.getElementById('ppdConfirmSummary');
  if (confirmSummary) confirmSummary.textContent = 'เลือกแล้ว: ลิ้นชัก ' + drawerNum + ' · Cassette ' + num;

  // Advance step tracker: step2 done
  var step2 = document.getElementById('ppdStep2');
  if (step2) { step2.classList.remove('active'); step2.classList.add('done'); }

  // Show summary card (re-trigger animation)
  var sumEl  = document.getElementById('ppdSelSummary');
  var selTxt = document.getElementById('ppdSelText');
  if (sumEl) {
    sumEl.style.display = 'none';
    void sumEl.offsetWidth;
    sumEl.style.display = 'flex';
  }
  if (selTxt) selTxt.textContent = 'ลิ้นชัก ' + drawerNum + ' · Cassette ' + num;

  // Enable start button with pop animation
  var btn = document.getElementById('ppdStartBtn');
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor  = 'pointer';
    btn.classList.remove('ppd-btn-pop');
    void btn.offsetWidth;
    btn.classList.add('ppd-btn-pop');
  }
}

function _ppdUpdateSelectionColors() {
  var isPatient = _PPW_DETAIL && _PPW_DETAIL.type === 'patient';
  var hwStatus  = document.getElementById('ppdHwStatus');
  if (hwStatus && _PPD_SELECTED_DRAWER) {
    hwStatus.style.background = isPatient ? '#eef2ff' : '';
    hwStatus.style.color      = isPatient ? '#4f46e5' : '';
  }
}

function confirmPrepDrawer() {
  location.hash = '#pg-scan-drug';
}

/* ── pg-scan-drug ─────────────────────────────────────────── */
var _scanQueue   = [];  // [{ drawerId, slot, drug }]
var _scanIndex   = 0;
var _scanDoneSet = new Set(); // 'D1:3' keys scanned this session
var _PREP_2ND_WITNESSED = new Set();   // keys (D:slot) that already passed 2-witness check
var _PREP_WITNESS_NURSES = { n1:null, n2:null }; // current witness pair being verified

function initScanDrug() {
  if (location.hash.replace('#','') !== 'pg-scan-drug') return;

  // Sync MC_STATE.cassettes to the cartData restored from sessionStorage.
  // restoreNavState() deep-clones cartData via JSON.parse, so MC_STATE.cassettes
  // still references the OLD array from the previous page. Without this call,
  // simulateScan() mutates the old array while saveNavState() serializes the
  // new one — losing all scan results on the next page load.
  seedMcData();

  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  // Build queue: all cassettes containing needed drugs
  var orderIds = _PPW_DETAIL.orderIds || [];
  var orders   = (MC_STATE.orders || []).filter(function(o) { return orderIds.indexOf(o.id) !== -1; });
  var neededDrugIds = [];
  orders.forEach(function(o) {
    if (neededDrugIds.indexOf(o.drugId) === -1) neededDrugIds.push(o.drugId);
  });

  var cassettes = MC_STATE.cassettes || [];
  _scanQueue = [];
  _scanDoneSet = new Set(); // reset each time page loads

  // The user picks a starting cassette in pg-prep-drawer. Use it for the FIRST drug needed:
  //   - If the cassette already holds one of the needed drugs → refill that drug here.
  //   - Else, allocate the first un-loaded drug to this empty cassette.
  // This makes the chosen slot light up first (matches user's intent on the Drawer Map).
  var selectedDrugId = null;
  var taken = new Set();
  if (_PPD_SELECTED_DRAWER && _PPD_SELECTED_CASSETTE) {
    var selCass = cassettes.find(function(c) {
      return c.drawerId === _PPD_SELECTED_DRAWER && c.slotNumber === _PPD_SELECTED_CASSETTE;
    });
    if (selCass) {
      var pickDrugId = (selCass.drugId && neededDrugIds.indexOf(selCass.drugId) !== -1)
        ? selCass.drugId                      // refill — slot already holds a needed drug
        : (!selCass.drugId ? neededDrugIds[0] : null);  // empty — load first needed drug
      if (pickDrugId) {
        selectedDrugId = pickDrugId;
        _scanQueue.push({
          drawerId: selCass.drawerId,
          slot: selCass.slotNumber,
          drug: drugMap[pickDrugId] || { name: pickDrugId, dose: '', type: 'oral' },
          noCassette: false
        });
        taken.add(_PPD_SELECTED_DRAWER + ':' + _PPD_SELECTED_CASSETTE);
      }
    }
  }

  // Remaining drugs: prefer same drawer as selected, then any drawer
  var preferDrawer = _PPD_SELECTED_DRAWER || null;
  neededDrugIds.forEach(function(drugId) {
    if (drugId === selectedDrugId) return;
    var key = function(c) { return c.drawerId + ':' + c.slotNumber; };

    // 1) Existing cassette already loaded with this drug (refill pattern)
    var cass = preferDrawer ? cassettes.find(function(c) {
      return c.status === 'IN' && c.drugId === drugId && c.drawerId === preferDrawer && !taken.has(key(c));
    }) : null;
    if (!cass) {
      cass = cassettes.find(function(c) {
        return c.status === 'IN' && c.drugId === drugId && !taken.has(key(c));
      });
    }

    // 2) Allocate an EMPTY cassette to load this drug (dynamic prep — no pre-stocking required)
    if (!cass) {
      cass = preferDrawer ? cassettes.find(function(c) {
        return c.status === 'IN' && !c.drugId && c.drawerId === preferDrawer && !taken.has(key(c));
      }) : null;
      if (!cass) {
        cass = cassettes.find(function(c) {
          return c.status === 'IN' && !c.drugId && !taken.has(key(c));
        });
      }
    }
    if (cass) taken.add(key(cass));
    _scanQueue.push({
      drawerId: cass ? cass.drawerId : null,
      slot:     cass ? cass.slotNumber : null,
      drug:     drugMap[drugId] || { name: drugId, dose: '', type: 'oral' },
      noCassette: !cass
    });
  });

  // Start from first unscanned item
  _scanIndex = 0;
  while (_scanIndex < _scanQueue.length && _scanDoneSet.has(_scanQueue[_scanIndex].drawerId + ':' + _scanQueue[_scanIndex].slot)) {
    _scanIndex++;
  }

  _applyScanBodyMode();
  _renderScanCurrent();
  _renderScanQueue();
}

function _applyScanBodyMode() {
  var body = document.querySelector('.scan-body');
  if (!body) return;
  body.classList.remove('scan-mode-patient', 'scan-mode-drug');
  var type = _PPW_DETAIL && _PPW_DETAIL.type;
  if (type === 'patient') body.classList.add('scan-mode-patient');
  else if (type === 'drug') body.classList.add('scan-mode-drug');
}

function _renderScanModeBanner() {
  var el = document.getElementById('scanModeCtxBanner');
  if (!el) return;
  var type = _PPW_DETAIL && _PPW_DETAIL.type;
  if (type !== 'patient') { el.style.display = 'none'; el.innerHTML = ''; return; }

  var ptMap = {};
  (MC_STATE.patients || []).forEach(function(p) { ptMap[p.id] = p; });
  var pt = ptMap[_PPW_DETAIL.id] || { name: _PPW_DETAIL.id, bed: '—', ward: '—' };
  var init = pt.name ? (pt.name.match(/[ก-๙a-zA-Z]/) ? pt.name.match(/[ก-๙a-zA-Z]/)[0] : pt.name.charAt(0)) : '?';

  var doneCount = _scanDoneSet.size;
  var total = _scanQueue.length;
  var pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
  var allDone = doneCount >= total && total > 0;

  el.innerHTML =
    '<div class="scan-pt-ctx-banner' + (allDone ? ' all-done' : '') + '">'
    + '<div class="scan-pt-ctx-left">'
    +   '<div class="scan-pt-ctx-avatar">' + init + '</div>'
    +   '<div class="scan-pt-ctx-info">'
    +     '<div class="scan-pt-ctx-eyebrow">จัดยาสำหรับผู้ป่วย</div>'
    +     '<div class="scan-pt-ctx-name">' + (pt.name || _PPW_DETAIL.id) + '</div>'
    +     '<div class="scan-pt-ctx-sub">' + (pt.ward || '') + (pt.bed ? ' · เตียง ' + pt.bed : '') + '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="scan-pt-ctx-right">'
    +   '<div class="scan-pt-ctx-num">' + doneCount + '<span class="scan-pt-ctx-total">/' + total + '</span></div>'
    +   '<div class="scan-pt-ctx-num-lbl">รายการ</div>'
    +   '<div class="scan-pt-ctx-prog"><div style="width:' + pct + '%;"></div></div>'
    + '</div>'
    + '</div>';
  el.style.display = '';
}

function _renderScanCurrent() {
  _renderScanModeBanner();
  var item = _scanQueue[_scanIndex];
  var svgPill = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  var svgIV   = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="18" x2="12" y2="21"/></svg>';

  var nameEl  = document.getElementById('scanDrugName');
  var doseEl  = document.getElementById('scanDrugDose');
  var iconEl  = document.getElementById('scanDrugIcon');
  var locD    = document.getElementById('scanLocDrawer');
  var locC    = document.getElementById('scanLocCassette');
  var badge   = document.getElementById('scanProgressBadge');
  var navSub  = document.getElementById('scanNavSub');
  var area    = document.getElementById('scanArea');
  var line    = document.getElementById('scanLine');
  var barIcon = document.getElementById('scanBarcodeIcon');
  var okIcon  = document.getElementById('scanSuccessIcon');
  var hint    = document.getElementById('scanHint');
  var btn     = document.getElementById('scanConfirmBtn');
  var status  = document.getElementById('scanStatus');

  var doneCount = _scanDoneSet.size;
  var total     = _scanQueue.length;

  if (badge)  badge.textContent  = (doneCount) + ' / ' + total;
  if (navSub) navSub.textContent = 'แสกนยาเข้า Cassette (' + doneCount + '/' + total + ')';
  if (status) status.textContent = 'แสกนแล้ว ' + doneCount + ' / ' + total + ' รายการ';

  // Toggle success card / scan area visibility
  var successCard = document.getElementById('scanSuccessCard');
  var confirmBar  = document.getElementById('scanConfirmBar');

  if (!item) {
    // all done — show success card, hide scan area + confirm bar
    if (nameEl)  nameEl.textContent  = 'ครบทุกรายการแล้ว';
    if (doseEl)  doseEl.textContent  = '';
    if (iconEl)  { iconEl.className = 'scan-drug-icon'; iconEl.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>'; }
    if (locD)    locD.textContent    = '—';
    if (locC)    locC.textContent    = '—';
    if (area)        area.hidden = true;
    if (successCard) successCard.hidden = false;
    if (confirmBar)  confirmBar.style.display = 'none';

    // Build success summary text — mode-aware
    var lastItem = _scanQueue[_scanQueue.length - 1] || null;
    var subEl    = document.getElementById('scanSuccessSub');
    var titleEl  = document.getElementById('scanSuccessTitle');
    var badgeEl  = document.getElementById('scanSuccessBadge');
    var card     = document.getElementById('scanSuccessCard');

    var actualScanned   = _scanDoneSet.size;
    var noCassetteCount = _scanQueue.filter(function(i) { return i.noCassette; }).length;
    var allFailed       = actualScanned === 0 && _scanQueue.length > 0;
    var partialFailed   = actualScanned > 0 && noCassetteCount > 0;

    // 5 Rights check — only show when at least one scan succeeded
    var rightsList   = document.getElementById('scanRightsList');
    var btnDash      = document.getElementById('scanSuccessBtnDash');
    var btnNext      = document.getElementById('scanSuccessBtnNext');
    if (allFailed) {
      // No drugs scanned — skip 5-rights, allow user to navigate away immediately
      if (rightsList) rightsList.style.display = 'none';
      if (btnDash)    btnDash.disabled = false;
      if (btnNext)    btnNext.disabled = false;
    } else {
      if (rightsList) rightsList.style.display = '';
      _populateRightsDetails();
      _resetRightsCheck();
    }

    // Adjust title + badge style based on outcome
    if (titleEl) {
      titleEl.textContent = allFailed
        ? 'ไม่สามารถจัดยาได้'
        : (partialFailed ? 'ตรวจสอบ 5 Rights · จัดยาบางส่วน' : 'ตรวจสอบ 5 Rights ก่อนยืนยัน');
    }
    if (card) {
      card.classList.remove('scan-success-warn', 'scan-success-fail');
      if (allFailed)     card.classList.add('scan-success-fail');
      else if (partialFailed) card.classList.add('scan-success-warn');
    }
    if (badgeEl) {
      badgeEl.innerHTML = allFailed
        ? '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        : '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>';
    }

    if (subEl) {
      var orderIds  = (_PPW_DETAIL && _PPW_DETAIL.orderIds) || [];
      var allOrders = (MC_STATE.orders || []).filter(function(o) { return orderIds.indexOf(o.id) !== -1; });
      var unit      = (lastItem && lastItem.drug && lastItem.drug.type === 'iv') ? 'ถุง' : 'เม็ด';

      // Compute scanned/dispensed totals from actual scan-done set
      var scannedOrderCount = 0;
      var scannedQty = 0;
      _scanQueue.forEach(function(it) {
        if (it.noCassette) return;
        var key = it.drawerId + ':' + it.slot;
        if (!_scanDoneSet.has(key)) return;
        // count orders matching this drug
        var matchingOrders = allOrders.filter(function(o) { return o.drugId === (it.drug && it.drug.id); });
        scannedOrderCount += matchingOrders.length;
        scannedQty += matchingOrders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);
      });

      if (allFailed) {
        subEl.textContent = 'ยาทุกรายการไม่มีใน Cassette ของรถเข็น (' + noCassetteCount + ' รายการ)';
      } else if (_PPW_DETAIL && _PPW_DETAIL.type === 'patient') {
        var pMap = {};
        (MC_STATE.patients || []).forEach(function(p) { pMap[p.id] = p; });
        var pt = pMap[_PPW_DETAIL.id];
        var ptName = pt ? pt.name : _PPW_DETAIL.id;
        var suffix = partialFailed ? ' · ขาด ' + noCassetteCount + ' รายการ' : '';
        var verb = partialFailed ? 'จัด' : 'จัดครบ';
        subEl.textContent = ptName + ' · ' + verb + ' ' + scannedOrderCount + ' รายการ · รวม ' + scannedQty + ' ' + unit + suffix;
      } else if (_PPW_DETAIL && _PPW_DETAIL.type === 'drug') {
        var drugName = lastItem && lastItem.drug ? lastItem.drug.name : '';
        var doseTxt  = lastItem && lastItem.drug && lastItem.drug.dose ? ' ' + lastItem.drug.dose : '';
        var ptCount  = (new Set(allOrders.map(function(o) { return o.patientId; }))).size;
        var suffix2  = partialFailed ? ' · ขาด ' + noCassetteCount + ' รายการ' : '';
        subEl.textContent = drugName + doseTxt + ' · จ่ายให้ ' + ptCount + ' คน · รวม ' + scannedQty + ' ' + unit + suffix2;
      } else {
        subEl.textContent = partialFailed
          ? ('แสกนแล้ว ' + actualScanned + ' รายการ · ขาด ' + noCassetteCount + ' รายการ')
          : 'แสกนครบทุกรายการแล้ว';
      }
    }

    // Keep patient panel visible — user can still see distribution after scanning
    _renderScanPatients(lastItem);
    return;
  }

  // not done yet — show scan area, hide success card
  if (area)        area.hidden = false;
  if (successCard) successCard.hidden = true;
  if (confirmBar)  confirmBar.style.display = '';

  if (nameEl)  nameEl.textContent  = item.drug.name;
  if (doseEl)  doseEl.textContent  = item.drug.dose;
  if (iconEl)  {
    iconEl.className = 'scan-drug-icon' + (item.drug.type === 'iv' ? ' iv' : '');
    iconEl.innerHTML = item.drug.type === 'iv' ? svgIV : svgPill;
  }
  if (locD)    locD.textContent    = item.noCassette ? '—' : 'ลิ้นชัก ' + item.drawerId.replace('D','');
  if (locC)    locC.textContent    = item.noCassette ? 'ไม่มีในรถ' : 'Cassette ' + item.slot;

  _renderScanPatients(item);

  if (item.noCassette) {
    // no cassette — mark area as warning state, auto-skip
    if (area)    { area.classList.remove('scanned'); area.style.borderColor = '#f59e0b'; area.style.background = '#fffbeb'; area.style.pointerEvents = 'none'; }
    if (line)    line.hidden = true;
    if (barIcon) barIcon.hidden = true;
    if (okIcon)  okIcon.hidden  = true;
    if (hint)    hint.textContent = 'ยานี้ไม่มีใน Cassette ของรถ';
    if (btn)     { btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; }
    // auto-advance after 1.2s
    setTimeout(function() {
      _scanIndex++;
      _renderScanCurrent();
      _renderScanQueue();
    }, 1200);
  } else {
    if (area)    { area.classList.remove('scanned'); area.style.borderColor = ''; area.style.background = ''; area.style.pointerEvents = ''; }
    if (line)    line.hidden = false;
    if (barIcon) barIcon.hidden = false;
    if (okIcon)  okIcon.hidden  = true;
    if (hint)    hint.textContent = 'แตะเพื่อแสกนบาร์โค้ดยา';
    if (btn)     { btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; }
  }
}

function _renderScanQueue() {
  var queueEl = document.getElementById('scanQueue');
  if (!queueEl) return;

  var svgCheck = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var svgPill  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';

  var svgWarn = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var html = '';
  var type = _PPW_DETAIL && _PPW_DETAIL.type;

  if (type === 'patient') {
    // ─── Patient mode: full drug checklist ───
    if (_scanQueue.length === 0) { queueEl.innerHTML = ''; return; }

    var svgScan = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="2" height="14"/><rect x="6" y="5" width="1" height="14"/><rect x="9" y="5" width="3" height="14"/><rect x="14" y="5" width="1" height="14"/><rect x="17" y="5" width="2" height="14"/><rect x="21" y="5" width="1" height="14"/></svg>';

    html += '<div class="scan-ql-head">รายการยาที่ต้องจัด</div>';
    _scanQueue.forEach(function(item, i) {
      var key      = item.noCassette ? null : (item.drawerId + ':' + item.slot);
      var done     = key && _scanDoneSet.has(key);
      var isCurr   = (i === _scanIndex);
      var loc      = item.noCassette ? 'ไม่มีใน Cassette' : ('ลิ้นชัก ' + item.drawerId.replace('D','') + ' · Cassette ' + item.slot);

      var stateClass = item.noCassette ? ' ql-warn' : (done ? ' ql-done' : (isCurr ? ' ql-active' : ''));
      var iconHtml = item.noCassette
        ? svgWarn
        : (done
            ? svgCheck
            : (isCurr
                ? svgScan
                : '<span class="scan-ql-dot"></span>'));
      var badge = item.noCassette ? '<span class="scan-ql-badge warn">ไม่มีในรถ</span>'
        : (done    ? '<span class="scan-ql-badge done">แสกนแล้ว</span>'
        : (isCurr  ? '<span class="scan-ql-badge active">กำลังแสกน</span>'
                   : '<span class="scan-ql-badge">รอ</span>'));

      html += '<div class="scan-ql-item' + stateClass + '">'
        + '<div class="scan-ql-icon">' + iconHtml + '</div>'
        + '<div class="scan-ql-info">'
        +   '<div class="scan-ql-name">' + item.drug.name + (item.drug.dose ? ' <span class="scan-ql-dose">' + item.drug.dose + '</span>' : '') + '</div>'
        +   '<div class="scan-ql-loc">' + loc + '</div>'
        + '</div>'
        + badge
        + '</div>';
    });

  } else {
    // ─── Drug mode: remaining queue (usually empty for single-drug prep) ───
    _scanQueue.forEach(function(item, i) {
      if (i === _scanIndex) return;
      var key   = item.noCassette ? null : (item.drawerId + ':' + item.slot);
      var done  = key && _scanDoneSet.has(key);
      var icon  = item.noCassette ? svgWarn : (done ? svgCheck : svgPill);
      var loc   = item.noCassette ? 'ไม่มีใน Cassette' : ('ลิ้นชัก ' + item.drawerId.replace('D','') + ' · Cassette ' + item.slot);
      var statusTxt = item.noCassette ? 'ไม่มีในรถ' : (done ? 'แสกนแล้ว' : 'รอ');
      var extraStyle = item.noCassette ? ' style="border-color:#f59e0b;background:#fffbeb;opacity:1;"' : '';
      html += '<div class="scan-queue-item' + (done ? ' done' : '') + '"' + extraStyle + '>'
        + '<div class="scan-queue-icon">' + icon + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div class="scan-queue-name">' + item.drug.name + (item.drug.dose ? ' ' + item.drug.dose : '') + '</div>'
        +   '<div class="scan-queue-loc">' + loc + '</div>'
        + '</div>'
        + '<div class="scan-queue-status" style="' + (item.noCassette ? 'background:#fef3c7;color:#b45309;' : '') + '">' + statusTxt + '</div>'
        + '</div>';
    });
  }

  queueEl.innerHTML = html;
}

function _renderScanPatients(item) {
  var panelEl = document.getElementById('scanPatientPanel');
  if (!panelEl) return;

  var type = _PPW_DETAIL.type;
  if (type !== 'drug' && type !== 'patient') { panelEl.style.display = 'none'; return; }

  // Patient mode: banner handles patient context, queue handles drug checklist — hide panel
  if (type === 'patient') { panelEl.style.display = 'none'; return; }

  var orderIds   = _PPW_DETAIL.orderIds || [];
  var allOrders  = (MC_STATE.orders || []).filter(function(o) { return orderIds.indexOf(o.id) !== -1; });
  if (!allOrders.length) { panelEl.style.display = 'none'; return; }

  var patientMap = {};
  (MC_STATE.patients || []).forEach(function(p) { patientMap[p.id] = p; });
  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  var svgPerson = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var svgPill   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';

  if (type === 'drug') {
    // ─── Drug mode: show patients receiving this drug ───
    var isIV = item && item.drug && item.drug.type === 'iv';
    var unit = isIV ? 'ถุง' : 'เม็ด';
    var cassettes = MC_STATE.cassettes || [];
    var cass = (item && item.drawerId) ? cassettes.find(function(c) {
      return c.drawerId === item.drawerId && c.slotNumber === item.slot;
    }) : null;
    var stockQty      = cass ? cass.quantity : 0;
    var totalDispense = allOrders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);

    var rowsHtml = allOrders.map(function(o) {
      var p    = patientMap[o.patientId] || { name: o.patientId, bed: '—' };
      var init = p.name ? (p.name.match(/[ก-๙a-zA-Z]/) ? p.name.match(/[ก-๙a-zA-Z]/)[0] : p.name.charAt(0)) : '?';
      return '<div class="scan-patient-row">'
        + '<div class="scan-patient-avatar">' + init + '</div>'
        + '<div class="scan-patient-info">'
        +   '<div class="scan-patient-name">' + (p.name || o.patientId) + '</div>'
        +   '<div class="scan-patient-bed">เตียง ' + (p.bed || '—') + (p.ward ? ' · ' + p.ward : '') + '</div>'
        + '</div>'
        + '<div class="scan-patient-qty">×' + (o.qty || 1) + ' ' + unit + '</div>'
        + '</div>';
    }).join('');

    var stockPct = totalDispense > 0 ? Math.min(100, Math.round(stockQty / totalDispense * 100)) : 0;
    var stockBar =
      '<div class="scan-drug-stock-bar">'
      + '<div class="scan-drug-stock-bar-fill" style="width:' + stockPct + '%;"></div>'
      + '</div>';

    panelEl.className = 'scan-patient-panel scan-pt-panel-drug';
    panelEl.innerHTML =
      '<div class="scan-pt-drug-header">'
      + '<div class="scan-pt-drug-header-top">'
      +   '<span class="scan-pt-drug-dist-label">' + svgPerson + ' จ่ายให้ผู้ป่วย</span>'
      +   '<span class="scan-pt-drug-count">' + allOrders.length + ' คน</span>'
      + '</div>'
      + '<div class="scan-pt-drug-stock-row">'
      +   '<span>คงเหลือ <strong>' + stockQty + '</strong> ' + unit + '</span>'
      +   '<span class="scan-pt-drug-stock-sep">·</span>'
      +   '<span>ต้องจ่าย <strong>' + totalDispense + '</strong> ' + unit + '</span>'
      + '</div>'
      + stockBar
      + '</div>'
      + '<div class="scan-patient-list">' + rowsHtml + '</div>';
    panelEl.style.display = '';
    return;
  }

  // ─── Patient mode: show patient info + drug list ───
  var patient = patientMap[_PPW_DETAIL.id] || { name: _PPW_DETAIL.id, bed: '—', ward: '—' };
  var init    = patient.name ? patient.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';

  // Build drug rows — show scan progress per drug
  var drugRowsHtml = allOrders.map(function(o) {
    var d        = drugMap[o.drugId] || { name: o.drugId, dose: '', type: 'oral' };
    var isIV     = d.type === 'iv';
    var unit     = isIV ? 'ถุง' : 'เม็ด';
    // Find queue item for this drug to check scan status
    var qItem    = (_scanQueue || []).find(function(q) { return q.drug && (q.drug.id === o.drugId || q.drug.name === d.name); });
    var scanned  = qItem && qItem.drawerId && _scanDoneSet.has(qItem.drawerId + ':' + qItem.slot);
    var statusCls = scanned ? ' done' : '';
    var statusIco = scanned
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<span class="scan-drug-row-dot"></span>';
    return '<div class="scan-drug-row' + statusCls + '">'
      + '<div class="scan-drug-row-icon">' + statusIco + '</div>'
      + '<div class="scan-drug-row-info">'
      +   '<div class="scan-drug-row-name">' + d.name + (d.dose ? ' ' + d.dose : '') + '</div>'
      +   '<div class="scan-drug-row-loc">' + (qItem && qItem.drawerId ? 'ลิ้นชัก ' + qItem.drawerId.replace('D','') + ' · Cassette ' + qItem.slot : 'ไม่มีในรถ') + '</div>'
      + '</div>'
      + '<div class="scan-drug-row-qty">×' + (o.qty || 1) + ' ' + unit + '</div>'
      + '</div>';
  }).join('');

  var doneCount = (_scanQueue || []).filter(function(q) {
    return q.drawerId && _scanDoneSet.has(q.drawerId + ':' + q.slot);
  }).length;

  panelEl.innerHTML =
    '<div class="scan-patient-header">'
    + '<div class="scan-patient-title">' + svgPerson + ' จัดยาให้ผู้ป่วย'
    + '</div>'
    + '<div class="scan-patient-stock">' + doneCount + ' / ' + allOrders.length + ' รายการ</div>'
    + '</div>'
    + '<div class="scan-patient-pt-card">'
    +   '<div class="scan-patient-avatar">' + init + '</div>'
    +   '<div class="scan-patient-info">'
    +     '<div class="scan-patient-name">' + (patient.name || _PPW_DETAIL.id) + '</div>'
    +     '<div class="scan-patient-bed">' + (patient.ward || '') + ' · เตียง ' + (patient.bed || '—') + '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="scan-drug-list-head">' + svgPill + ' ยาที่ต้องจัด <span class="scan-patient-count">' + allOrders.length + ' รายการ</span></div>'
    + '<div class="scan-drug-list">' + drugRowsHtml + '</div>';
  panelEl.style.display = '';
}

/* HIGH ALERT drug list (shared with dispense flow at line ~6710) */
var _PREP_HIGH_ALERT = ['INSREG', 'HEP5K', 'KCL10', 'NAHCO3'];

function simulateScan() {
  var item = _scanQueue[_scanIndex];
  console.log('[DEBUG simulateScan] item:', item, 'index:', _scanIndex, 'queue:', _scanQueue);
  if (!item) {
    console.log('[DEBUG simulateScan] no item — queue exhausted or empty');
    return;
  }

  var key = item.drawerId + ':' + item.slot;
  if (_scanDoneSet.has(key)) return;

  // High-alert drug → require 2-witness scan BEFORE loading into cassette.
  // _PREP_2ND_DONE flag is set per-scan by the witness modal.
  var isHighAlert = item.drug && _PREP_HIGH_ALERT.indexOf(item.drug.id) !== -1;
  if (isHighAlert && !_PREP_2ND_WITNESSED.has(key)) {
    _openPrepWitnessModal(key, item.drug);
    return;
  }

  _scanDoneSet.add(key);
  _PPD_DONE_CASSETTES.add(key);

  // Load the scanned drug into the cassette so dispense flow can find it.
  // - Empty cassette: set drugId, init quantity from drug.max (or qty needed)
  // - Existing cassette with same drug: top up to drug.max (refill behavior)
  var cass = (MC_STATE.cassettes || []).find(function(c) {
    return c.drawerId === item.drawerId && c.slotNumber === item.slot;
  });
  console.log('[DEBUG simulateScan] cass found:', cass, 'item.drug:', item.drug);
  if (cass && item.drug && item.drug.id) {
    var drugDef = (typeof getDrug === 'function') ? getDrug(item.drug.id) : null;
    var maxQty  = (drugDef && drugDef.max) || cass.maxQty || 30;
    if (!cass.drugId) {
      cass.drugId   = item.drug.id;
      cass.maxQty   = maxQty;
      cass.quantity = maxQty;       // fresh load — fill to capacity
    } else if (cass.drugId === item.drug.id) {
      cass.quantity = Math.min(maxQty, (cass.quantity || 0) + maxQty);  // refill top-up
    }
    cass.status        = 'IN';
    cass.removedAt     = null;
    cass.lastRefillAt  = Date.now();
    if (typeof addAudit === 'function') {
      try { addAudit('REFILLED', cass.id, { added: cass.quantity }); } catch (e) {}
    }
    // Track in session for dashboard "เติมแล้ว" indicator
    if (!MC_STATE.session.refilledCassettes) MC_STATE.session.refilledCassettes = [];
    if (!MC_STATE.session.refilledCassettes.includes(cass.id)) {
      MC_STATE.session.refilledCassettes.push(cass.id);
    }
    if (typeof recomputePausedOrders === 'function') recomputePausedOrders();
    console.log('[DEBUG simulateScan] LOADED', cass.id, 'with drugId:', cass.drugId, 'qty:', cass.quantity);
  }

  var area    = document.getElementById('scanArea');
  var line    = document.getElementById('scanLine');
  var barIcon = document.getElementById('scanBarcodeIcon');
  var okIcon  = document.getElementById('scanSuccessIcon');
  var hint    = document.getElementById('scanHint');

  if (area)    area.classList.add('scanned');
  if (line)    line.hidden = true;
  if (barIcon) barIcon.hidden = true;
  if (okIcon)  okIcon.hidden  = false;
  if (hint)    hint.textContent = 'แสกนสำเร็จ ✓';

  // Move to next after short delay
  setTimeout(function() {
    _scanIndex++;
    while (_scanIndex < _scanQueue.length && _scanDoneSet.has(_scanQueue[_scanIndex].drawerId + ':' + _scanQueue[_scanIndex].slot)) {
      _scanIndex++;
    }
    _renderScanCurrent();
    _renderScanQueue();
  }, 700);
}

function confirmScan() {
  var type = _PPW_DETAIL.type;
  var id   = _PPW_DETAIL.id;
  if (type && id) _PPW_DONE_SET.add(type + ':' + id);
  _scanDoneSet = new Set();
  _PREP_2ND_WITNESSED = new Set();
  location.hash = '#pg-prep-work';
}

/* ─── Prep flow: 2-witness modal for HIGH ALERT drugs ───── */
function _openPrepWitnessModal(scanKey, drug) {
  _PREP_WITNESS_NURSES = { n1: null, n2: null };
  var overlay = document.getElementById('prepWitnessOverlay');
  if (!overlay) {
    // Lazily inject the modal once
    overlay = document.createElement('div');
    overlay.id = 'prepWitnessOverlay';
    overlay.className = 'prep-witness-overlay';
    overlay.innerHTML =
      '<div class="prep-witness-modal" onclick="event.stopPropagation()">'
      + '  <div class="prep-witness-head">'
      + '    <div class="prep-witness-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>'
      + '    <div>'
      + '      <div class="prep-witness-title">⚠ HIGH ALERT — ต้องสแกนพยาน 2 คน</div>'
      + '      <div class="prep-witness-sub" id="prepWitnessDrug">—</div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="prep-witness-slots" id="prepWitnessSlots"></div>'
      + '  <div class="prep-witness-actions">'
      + '    <button type="button" class="prep-witness-btn prep-witness-btn-cancel" onclick="_closePrepWitnessModal()">ยกเลิก</button>'
      + '    <button type="button" class="prep-witness-btn prep-witness-btn-ok" id="prepWitnessOK" disabled>ยืนยัน</button>'
      + '  </div>'
      + '</div>';
    overlay.addEventListener('click', _closePrepWitnessModal);
    document.body.appendChild(overlay);
  }
  var sub = document.getElementById('prepWitnessDrug');
  if (sub && drug) sub.textContent = drug.name + (drug.dose ? ' ' + drug.dose : '');
  _renderPrepWitnessSlots();
  // Wire confirm to call back into simulateScan once both witnesses set
  var okBtn = document.getElementById('prepWitnessOK');
  if (okBtn) {
    okBtn.onclick = function() {
      _PREP_2ND_WITNESSED.add(scanKey);
      _closePrepWitnessModal();
      // Resume — re-call simulateScan now that the witness check is satisfied
      simulateScan();
    };
  }
  overlay.hidden = false;
}

function _renderPrepWitnessSlots() {
  var slotsEl = document.getElementById('prepWitnessSlots');
  if (!slotsEl) return;
  var slot = function(idx, val) {
    var done = !!val;
    var name = val ? val.name : 'พยาน ' + idx;
    return '<div class="prep-witness-slot' + (done ? ' verified' : '') + '">'
      + '<div class="prep-witness-slot-num">' + idx + '</div>'
      + '<div class="prep-witness-slot-name">' + name + '</div>'
      + (done
          ? '<span class="prep-witness-slot-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'
          : '<button type="button" class="prep-witness-scan-btn" onclick="_simulatePrepWitnessScan(' + idx + ')">📷 สแกนบัตร</button>')
      + '</div>';
  };
  slotsEl.innerHTML = slot(1, _PREP_WITNESS_NURSES.n1) + slot(2, _PREP_WITNESS_NURSES.n2);
  var okBtn = document.getElementById('prepWitnessOK');
  if (okBtn) okBtn.disabled = !(_PREP_WITNESS_NURSES.n1 && _PREP_WITNESS_NURSES.n2);
}

function _simulatePrepWitnessScan(slotIdx) {
  var used = (slotIdx === 1 ? _PREP_WITNESS_NURSES.n2 : _PREP_WITNESS_NURSES.n1);
  var nurses = USERS.filter(function(u) {
    return u.role === 'NURSE' && (!used || u.id !== used.id);
  });
  if (!nurses.length) { alert('ไม่มีพยาบาลที่ใช้ได้'); return; }
  var picked = nurses[Math.floor(Math.random() * nurses.length)];
  if (slotIdx === 1) _PREP_WITNESS_NURSES.n1 = picked;
  else               _PREP_WITNESS_NURSES.n2 = picked;
  if (typeof addAudit === 'function') {
    try {
      addAudit('NURSE_VERIFIED', null, {
        drugLabel: 'พยาน HIGH ALERT (prep) ' + slotIdx + '/2',
        user: picked.name,
      });
    } catch (e) {}
  }
  _renderPrepWitnessSlots();
}

function _closePrepWitnessModal(e) {
  if (e && e.target && e.target.id !== 'prepWitnessOverlay') return;
  var overlay = document.getElementById('prepWitnessOverlay');
  if (overlay) overlay.hidden = true;
}

// Success card actions
function finishScanContinue() {
  var type = _PPW_DETAIL.type;
  var id   = _PPW_DETAIL.id;
  if (type && id) _PPW_DONE_SET.add(type + ':' + id);
  _scanDoneSet = new Set();
  _resetRightsCheck();
  location.hash = '#pg-prep-work';
}

function finishScanGoDashboard() {
  var type = _PPW_DETAIL.type;
  var id   = _PPW_DETAIL.id;
  if (type && id) _PPW_DONE_SET.add(type + ':' + id);
  _scanDoneSet = new Set();
  _resetRightsCheck();
  location.hash = '#pg-dashboard';
}

/* ─── 5 Rights check (inline at end of scan flow) ────────── */
function _populateRightsDetails() {
  var lastItem  = _scanQueue[_scanQueue.length - 1] || null;
  var orderIds  = (_PPW_DETAIL && _PPW_DETAIL.orderIds) || [];
  var allOrders = (MC_STATE.orders || []).filter(function(o) { return orderIds.indexOf(o.id) !== -1; });
  var pMap = {};
  (MC_STATE.patients || []).forEach(function(p) { pMap[p.id] = p; });

  var drug    = lastItem && lastItem.drug ? lastItem.drug : null;
  var drugStr = drug ? (drug.name + (drug.dose ? ' ' + drug.dose : '')) : '—';
  var doseStr = drug && drug.dose ? drug.dose : '—';
  var routeStr = drug && drug.type === 'iv' ? 'IV / ฉีด' : 'PO / กิน';

  // Patient(s)
  var patientStr;
  if (_PPW_DETAIL && _PPW_DETAIL.type === 'patient') {
    var p = pMap[_PPW_DETAIL.id];
    patientStr = p ? (p.name + ' · เตียง ' + (p.bed || '—')) : (_PPW_DETAIL.id || '—');
  } else {
    var pats = new Set(allOrders.map(function(o) { return o.patientId; }));
    patientStr = pats.size + ' คน · ' + Array.from(pats).slice(0, 3).map(function(pid) {
      var p = pMap[pid]; return p ? p.name : pid;
    }).join(', ') + (pats.size > 3 ? '…' : '');
  }

  // Time/round
  var rounds = new Set();
  allOrders.forEach(function(o) { (o.rounds || []).forEach(function(r) { rounds.add(r); }); });
  var timeStr = Array.from(rounds).join(', ') || '—';

  var totalQty = allOrders.reduce(function(s, o) { return s + (o.qty || 1); }, 0);
  var unit = drug && drug.type === 'iv' ? 'ถุง' : 'เม็ด';

  var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setText('scanRightPatient', patientStr);
  setText('scanRightDrug',    drugStr);
  setText('scanRightDose',    doseStr + ' × ' + totalQty + ' ' + unit);
  setText('scanRightRoute',   routeStr);
  setText('scanRightTime',    'รอบ ' + timeStr);
}

function _updateRightsState() {
  var cbs = document.querySelectorAll('#scanRightsList .scan-right-cb');
  var allChecked = cbs.length > 0 && Array.from(cbs).every(function(cb) { return cb.checked; });
  var btnDash = document.getElementById('scanSuccessBtnDash');
  var btnNext = document.getElementById('scanSuccessBtnNext');
  var title   = document.getElementById('scanSuccessTitle');
  if (btnDash) btnDash.disabled = !allChecked;
  if (btnNext) btnNext.disabled = !allChecked;
  if (title)   title.textContent = allChecked ? 'จัดยาสำเร็จ' : 'ตรวจสอบ 5 Rights ก่อนยืนยัน';
}

function _resetRightsCheck() {
  var cbs = document.querySelectorAll('#scanRightsList .scan-right-cb');
  cbs.forEach(function(cb) { cb.checked = false; });
  _updateRightsState();
}



/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 3: Patient Verification (5 Rights)
   ════════════════════════════════════════════════════════ */

var _DV_VERIFIED_PATIENT = null;        // patient ID once verified
var _DV_EXPECTED_PATIENT = null;        // pre-selected from queue (page 2)
var _DV_ROUND            = 'morning';   // current round (default morning)
var _DV_OUT_OF_ROUND     = false;       // true when patient has PENDING orders only outside selected round
var _DV_DUAL_NURSE       = { n1: null, n2: null };  // dual-nurse override verification

const _DV_ROUND_LABEL = { morning:'รอบเช้า · 08:00', noon:'รอบกลางวัน · 12:00',
                          evening:'รอบเย็น · 16:00', bedtime:'รอบก่อนนอน · 20:00' };
const _DV_ROUND_TH    = { morning:'เช้า', noon:'กลางวัน', evening:'เย็น', bedtime:'ก่อนนอน' };

function initDispenseVerify() {
  if (location.hash.replace('#','') !== 'pg-dispense-verify') return;
  seedMcData();

  // Auto-detect round based on time of day
  var hr = new Date().getHours();
  if      (hr < 10)  _DV_ROUND = 'morning';
  else if (hr < 14)  _DV_ROUND = 'noon';
  else if (hr < 18)  _DV_ROUND = 'evening';
  else               _DV_ROUND = 'bedtime';

  _renderDvRoundStrip();
  _showDvScanState();

  // Auto-focus barcode input (simulates scanner ready)
  setTimeout(function() {
    var input = document.getElementById('dvScanInput');
    if (input) input.focus();
  }, 200);

  // Listen for "barcode" keyboard input — typed quickly + ENTER
  var input = document.getElementById('dvScanInput');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && input.value.trim()) {
        simulateWristbandScan(input.value.trim());
        input.value = '';
      }
    });
  }
}

function _renderDvRoundStrip() {
  var nameEl  = document.getElementById('dvRoundName');
  var doneEl  = document.getElementById('dvProgressDone');
  var totalEl = document.getElementById('dvProgressTotal');
  if (nameEl) nameEl.textContent = _DV_ROUND_LABEL[_DV_ROUND] || 'รอบเช้า · 08:00';

  // Count patients with PENDING orders for this round in current ward
  var roundTh = _DV_ROUND_TH[_DV_ROUND];
  var wardPts = _wardOrders().filter(function(o) {
    return o.rounds && o.rounds.indexOf(roundTh) !== -1;
  });
  var totalPatients = (new Set(wardPts.map(function(o) { return o.patientId; }))).size;
  var donePatients  = (new Set(wardPts.filter(function(o) { return o.status === 'DONE'; })
                                       .map(function(o) { return o.patientId; }))).size;
  if (totalEl) totalEl.textContent = totalPatients;
  if (doneEl)  doneEl.textContent  = donePatients;
}

function _showDvScanState() {
  var scanSec   = document.getElementById('dvScanSection');
  var ptSec     = document.getElementById('dvPatientSection');
  var actionBar = document.getElementById('dvActionBar');
  if (scanSec)   scanSec.style.display = '';
  if (ptSec)     ptSec.hidden = true;
  if (actionBar) actionBar.hidden = true;
  // Reset dual-nurse state when returning to scan
  _resetDvDualNurse();
}

function _showDvVerifiedState() {
  var scanSec   = document.getElementById('dvScanSection');
  var ptSec     = document.getElementById('dvPatientSection');
  var actionBar = document.getElementById('dvActionBar');
  if (scanSec)   scanSec.style.display = 'none';
  if (ptSec)     ptSec.hidden = false;
  if (actionBar) actionBar.hidden = false;
}

function simulateWristbandScan(barcode) {
  // Pick a patient — by barcode > expected (from queue) > rotate
  var roundTh = _DV_ROUND_TH[_DV_ROUND];
  var pendingLike = function(s) { return s === 'PENDING' || s === 'PAUSED'; };
  var wardPts;
  if (_DV_ROUND === 'stat') {
    wardPts = _wardOrders().filter(function(o) {
      return pendingLike(o.status) && _DA_HIGH_ALERT.indexOf(o.drugId) !== -1;
    });
  } else {
    wardPts = _wardOrders().filter(function(o) {
      return o.rounds && o.rounds.indexOf(roundTh) !== -1 && pendingLike(o.status);
    });
  }
  var patientIds = Array.from(new Set(wardPts.map(function(o) { return o.patientId; })));

  var pickedId;
  if (barcode) {
    // Try to match HN
    var match = (MC_STATE.patients || []).find(function(p) {
      return p.hn === barcode || p.id === barcode || p.id.toLowerCase() === barcode.toLowerCase();
    });
    pickedId = match ? match.id : (_DV_EXPECTED_PATIENT || patientIds[0]);
  } else if (_DV_EXPECTED_PATIENT) {
    // Pre-selected from queue page → simulate the matching wristband
    pickedId = _DV_EXPECTED_PATIENT;
    _DV_EXPECTED_PATIENT = null; // consume it
  } else {
    // Cycle through patients on each tap
    if (!_DV_VERIFIED_PATIENT) {
      pickedId = patientIds[0] || (MC_STATE.patients[0] && MC_STATE.patients[0].id);
    } else {
      var idx = patientIds.indexOf(_DV_VERIFIED_PATIENT);
      pickedId = patientIds[(idx + 1) % patientIds.length] || patientIds[0];
    }
  }
  if (!pickedId) {
    alert('ไม่พบผู้ป่วยใน round นี้');
    return;
  }
  _DV_VERIFIED_PATIENT = pickedId;

  // Visual scan animation
  var area = document.getElementById('dvScanArea');
  if (area) {
    area.classList.add('scanned');
    setTimeout(function() {
      _renderDvPatient(pickedId);
      _showDvVerifiedState();
    }, 500);
  } else {
    _renderDvPatient(pickedId);
    _showDvVerifiedState();
  }
}

function manualEntryPatient() {
  var hn = prompt('กรอก HN ผู้ป่วย:');
  if (!hn) return;
  simulateWristbandScan(hn.trim());
}

function resetWristbandScan() {
  _DV_VERIFIED_PATIENT = null;
  var area = document.getElementById('dvScanArea');
  if (area) area.classList.remove('scanned');
  _showDvScanState();
  setTimeout(function() {
    var input = document.getElementById('dvScanInput');
    if (input) input.focus();
  }, 100);
}

function _renderDvPatient(patientId) {
  var p = (MC_STATE.patients || []).find(function(x) { return x.id === patientId; });
  if (!p) return;

  // Avatar initials (first chars of first 2 words)
  var initials = p.name ? p.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';

  // Set fields
  var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('dvAvatar', initials);
  set('dvName',   p.name);
  set('dvHn',     'HN ' + p.hn);
  set('dvBed',    'เตียง ' + p.bed);
  set('dvWard',   p.ward);
  set('dvDemo',   p.gender + ' · ' + p.age + ' ปี');
  set('dvCond',   p.condition || '—');

  // Allergy banner
  var banner   = document.getElementById('dvAllergyBanner');
  var listEl   = document.getElementById('dvAllergyList');
  if (banner && listEl) {
    if (p.allergies && p.allergies.length) {
      banner.hidden = false;
      listEl.innerHTML = p.allergies.map(function(a) {
        return '<span class="dv-allergy-item">' + a + '</span>';
      }).join('');
    } else {
      banner.hidden = true;
    }
  }

  // Vital signs (mock — semi-realistic per patient condition)
  _renderDvVitals(p);

  // Drugs to dispense for this round
  _renderDvMeds(p);
}

function _renderDvVitals(p) {
  // Mock vitals — vary by condition for realism (deterministic seed: patient ID)
  var seed = parseInt(p.id.replace(/\D/g, ''), 10) || 0;
  var bpSys, bpDia, hr, temp, spo2, status;

  if (p.condition && p.condition.indexOf('ความดันสูง') !== -1) {
    bpSys = 145 + (seed % 10); bpDia = 92 + (seed % 6); status = 'warn';
  } else if (p.condition && p.condition.indexOf('ICU') !== -1 || p.bed.indexOf('ICU') !== -1) {
    bpSys = 110 - (seed % 8);  bpDia = 70 - (seed % 5);  status = 'warn';
  } else {
    bpSys = 120 + (seed % 8);  bpDia = 78 + (seed % 5);  status = 'ok';
  }
  hr   = 72 + (seed % 14);
  temp = (36.7 + (seed % 5) * 0.1).toFixed(1);
  spo2 = 96 + (seed % 4);

  // Find the cells and set values
  var bpCell   = document.getElementById('dvVitalBP');
  var hrCell   = document.getElementById('dvVitalHR');
  var tempCell = document.getElementById('dvVitalTemp');
  var spo2Cell = document.getElementById('dvVitalSpO2');
  if (bpCell)   bpCell.querySelector('.dv-vital-val').innerHTML   = bpSys + '<span class="dv-vital-sep">/</span>' + bpDia;
  if (hrCell)   hrCell.querySelector('.dv-vital-val').textContent   = hr;
  if (tempCell) tempCell.querySelector('.dv-vital-val').textContent = temp;
  if (spo2Cell) spo2Cell.querySelector('.dv-vital-val').textContent = spo2;

  var statusEl = document.getElementById('dvVitalStatus');
  if (statusEl) {
    statusEl.className = 'dv-vital-status dv-vital-status-' + status;
    statusEl.textContent = status === 'ok' ? 'ปกติ' : (status === 'warn' ? 'ต้องติดตาม' : 'ผิดปกติ');
  }
  var timeEl = document.getElementById('dvVitalTime');
  if (timeEl) timeEl.textContent = 'วัดเมื่อ ' + (15 + (seed % 30)) + ' นาทีที่แล้ว';
}

function _renderDvMeds(p) {
  var roundTh = _DV_ROUND_TH[_DV_ROUND];

  // Treat both PENDING and PAUSED as "still needs dispensing"
  // (PAUSED = waiting for cassette refill; should still appear so user knows what's outstanding)
  var isPendingLike = function(o) { return o.status === 'PENDING' || o.status === 'PAUSED'; };

  // 1) Try to find orders matching the selected round
  var inRound = (MC_STATE.orders || []).filter(function(o) {
    return o.patientId === p.id && isPendingLike(o) && o.rounds && o.rounds.indexOf(roundTh) !== -1;
  });

  var orders;
  if (inRound.length > 0) {
    orders = inRound;
    _DV_OUT_OF_ROUND = false;
  } else {
    // 2) Fallback — show ALL pending orders for this patient (any round). Flag as out-of-round.
    orders = (MC_STATE.orders || []).filter(function(o) {
      return o.patientId === p.id && isPendingLike(o);
    });
    _DV_OUT_OF_ROUND = orders.length > 0;
  }

  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  // High-alert drug list (canonical for this prototype)
  var HIGH_ALERT = ['INSREG', 'HEP5K', 'KCL10', 'NAHCO3'];

  var listEl  = document.getElementById('dvMedsList');
  var countEl = document.getElementById('dvMedsCount');
  if (countEl) countEl.textContent = orders.length + ' รายการ' + (_DV_OUT_OF_ROUND ? ' · จ่ายล่าช้า' : '');

  if (!listEl) return;
  if (!orders.length) {
    _DV_OUT_OF_ROUND = false;
    listEl.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-3);font-size:13px;">ผู้ป่วยรายนี้ไม่มียาที่ต้องจ่าย</div>';
    _renderDvDualNurseBanner();
    _updateDvConfirmGate();
    return;
  }

  var svgPill = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  var svgIV   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/></svg>';

  listEl.innerHTML = orders.map(function(o) {
    var d = drugMap[o.drugId] || { name: o.drugId, dose: '', type: 'oral' };
    var isIV   = d.type === 'iv';
    var isHigh = HIGH_ALERT.indexOf(o.drugId) !== -1;
    var iconCls = isHigh ? 'high-alert' : (isIV ? 'iv' : '');
    var unit    = isIV ? 'ถุง' : 'เม็ด';
    var route   = isIV ? 'IV' : 'PO';
    var orderRounds = (o.rounds || []).join('/') || '—';
    var metaRound = _DV_OUT_OF_ROUND ? ('รอบ ' + orderRounds + ' (เลยกำหนด)') : ('รอบ' + roundTh);
    var outBadge  = _DV_OUT_OF_ROUND ? ' <span class="dv-out-of-round-pill">จ่ายล่าช้า</span>' : '';
    return '<div class="dv-meds-row' + (_DV_OUT_OF_ROUND ? ' dv-meds-row-oor' : '') + '">'
      + '<div class="dv-meds-row-icon ' + iconCls + '">' + (isIV ? svgIV : svgPill) + '</div>'
      + '<div class="dv-meds-row-info">'
      +   '<div class="dv-meds-row-name">'
      +     d.name + (d.dose ? ' ' + d.dose : '')
      +     (isHigh ? ' <span class="dv-high-alert-pill">⚠ HIGH ALERT</span>' : '')
      +     outBadge
      +   '</div>'
      +   '<div class="dv-meds-row-meta">' + route + ' · ' + metaRound + '</div>'
      + '</div>'
      + '<div class="dv-meds-row-qty">×' + (o.qty || 1) + ' ' + unit + '</div>'
      + '</div>';
  }).join('');

  _renderDvDualNurseBanner();
  _updateDvConfirmGate();
}

/* ─── Dual-nurse override (out-of-round dispense) ────────── */
function _renderDvDualNurseBanner() {
  var host = document.getElementById('dvMedsList');
  if (!host) return;
  // Remove any existing banner before re-rendering
  var oldBanner = document.getElementById('dvDualNurseBanner');
  if (oldBanner) oldBanner.remove();

  if (!_DV_OUT_OF_ROUND) return;

  var n1 = _DV_DUAL_NURSE.n1, n2 = _DV_DUAL_NURSE.n2;
  var slot = function(idx, val) {
    var done = !!val;
    var name = val ? val.name : 'พยาบาลคนที่ ' + idx;
    return '<div class="dv-nurse-slot' + (done ? ' verified' : '') + '">'
      + '<div class="dv-nurse-slot-head">'
      +   '<span class="dv-nurse-slot-num">' + idx + '</span>'
      +   '<span class="dv-nurse-slot-name">' + name + '</span>'
      +   (done ? '<span class="dv-nurse-slot-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : '')
      + '</div>'
      + (done
          ? '<div class="dv-nurse-slot-meta">PIN ' + (val.pin || '----').replace(/./g, '•') + ' · ยืนยันแล้ว</div>'
          : '<button type="button" class="dv-nurse-scan-btn" onclick="_dvSimulateNurseScan(' + idx + ')">'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'
            + ' สแกนบัตรพยาบาล'
            + '</button>')
      + '</div>';
  };

  var banner = document.createElement('div');
  banner.id = 'dvDualNurseBanner';
  banner.className = 'dv-dual-nurse-banner';
  banner.innerHTML =
    '<div class="dv-dn-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>'
    + '<div class="dv-dn-text">'
    +   '<div class="dv-dn-title">จ่ายยาล่าช้า (เลยรอบกำหนด) — ต้องยืนยันพยาบาล 2 คน</div>'
    +   '<div class="dv-dn-sub">ยานี้ลืมจ่ายในรอบเวลาที่กำหนด · สแกนบัตรพยาบาล 2 คน เพื่ออนุญาตจ่ายย้อนหลัง</div>'
    + '</div>'
    + '<div class="dv-dn-slots">' + slot(1, n1) + slot(2, n2) + '</div>';

  host.parentElement.appendChild(banner);
}

function _dvSimulateNurseScan(slotIdx) {
  // Pick a NURSE user not already used in the other slot
  var used = (slotIdx === 1 ? _DV_DUAL_NURSE.n2 : _DV_DUAL_NURSE.n1);
  var nurses = USERS.filter(function(u) {
    return u.role === 'NURSE' && (!used || u.id !== used.id);
  });
  if (!nurses.length) { alert('ไม่มีพยาบาลที่ใช้ได้'); return; }
  var picked = nurses[Math.floor(Math.random() * nurses.length)];
  if (slotIdx === 1) _DV_DUAL_NURSE.n1 = picked;
  else               _DV_DUAL_NURSE.n2 = picked;

  if (typeof addAudit === 'function') {
    try {
      addAudit('NURSE_VERIFIED', null, {
        drugLabel: 'ยืนยันพยาบาล (จ่ายล่าช้า) ' + slotIdx + '/2',
        user: picked.name,
      });
    } catch (e) {}
  }

  _renderDvDualNurseBanner();
  _updateDvConfirmGate();
}

function _dvDualNurseOK() {
  return !!(_DV_DUAL_NURSE.n1 && _DV_DUAL_NURSE.n2);
}

function _updateDvConfirmGate() {
  var btn = document.querySelector('.dv-action-bar .dv-btn-primary');
  if (!btn) return;
  var ok = !_DV_OUT_OF_ROUND || _dvDualNurseOK();
  btn.disabled = !ok;
  btn.style.opacity = ok ? '' : '0.45';
  btn.style.cursor  = ok ? '' : 'not-allowed';
  btn.title = ok ? '' : 'ต้องยืนยันพยาบาล 2 คน ก่อนจ่ายยาล่าช้า';
}

function _resetDvDualNurse() {
  _DV_OUT_OF_ROUND = false;
  _DV_DUAL_NURSE = { n1: null, n2: null };
}

function confirmPatientGoAdminister() {
  if (!_DV_VERIFIED_PATIENT) {
    alert('กรุณาสแกน Wristband ก่อน');
    return;
  }
  if (_DV_OUT_OF_ROUND && !_dvDualNurseOK()) {
    alert('การจ่ายยาล่าช้า (เลยรอบกำหนด) ต้องยืนยันบัตรพยาบาล 2 คนก่อน');
    return;
  }
  location.hash = '#pg-dispense-administer';
}


/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 4: Medication Administration
   ════════════════════════════════════════════════════════ */

var _DA_QUEUE       = [];   // [{ orderId, drugId, drug, qty, route, time, status, reason, isHigh, allergyMatch }]
var _DA_INDEX       = 0;
var _DA_SCAN_COUNT  = 0;    // bag scan flag: 0 = not scanned, 1 = scanned
var _DA_2ND_DONE    = false;// 2nd nurse confirmed
var _DA_PENDING_ACTION = null; // 'refused' | 'held' awaiting reason

const _DA_HIGH_ALERT = ['INSREG', 'HEP5K', 'KCL10', 'NAHCO3'];

// Map drug name keywords to allergy strings (simple matcher for demo)
function _daHasAllergy(drug, patient) {
  if (!patient || !patient.allergies || !patient.allergies.length) return null;
  if (!drug || !drug.name) return null;
  var dn = drug.name.toLowerCase();
  for (var i = 0; i < patient.allergies.length; i++) {
    var a   = patient.allergies[i];
    var aLo = a.toLowerCase();
    // Direct name overlap (e.g., Ibuprofen vs Ibuprofen)
    if (dn.indexOf(aLo) !== -1) return a;
    // Class match: Penicillin → Amoxicillin, Ampicillin
    if (aLo === 'penicillin' && (dn.indexOf('amox') !== -1 || dn.indexOf('ampi') !== -1)) return a;
    if (aLo === 'sulfa' && dn.indexOf('sulfa') !== -1) return a;
    if (aLo === 'sulfonamides' && dn.indexOf('sulfa') !== -1) return a;
    // NSAID class
    if (aLo === 'aspirin' && (dn.indexOf('ibuprofen') !== -1 || dn.indexOf('asa') !== -1)) return a;
  }
  return null;
}

function initDispenseAdminister() {
  if (location.hash.replace('#','') !== 'pg-dispense-administer') return;
  seedMcData();

  if (!_DV_VERIFIED_PATIENT) {
    location.hash = '#pg-dispense-verify';
    return;
  }

  _daBuildQueue();
  _daRenderHeader();
  _daRenderList();
  _DA_INDEX = _daFindNextPending();
  _DA_SCAN_COUNT = 0;
  _DA_2ND_DONE   = false;
  _daRenderDetail();
  _daUpdateBottomBar();
}

function _daBuildQueue() {
  var p = (MC_STATE.patients || []).find(function(x) { return x.id === _DV_VERIFIED_PATIENT; });
  if (!p) { _DA_QUEUE = []; return; }
  var roundTh = _DV_ROUND_TH[_DV_ROUND] || 'เช้า';
  var roundTime = { 'เช้า':'08:00', 'กลางวัน':'12:00', 'เย็น':'16:00', 'ก่อนนอน':'20:00' }[roundTh] || '—';

  // Out-of-round dispense: include all pending/paused orders for this patient (any round).
  // Otherwise, restrict to the selected round.
  var orders = (MC_STATE.orders || []).filter(function(o) {
    if (o.patientId !== p.id || o.status === 'DONE') return false;
    if (_DV_OUT_OF_ROUND) return true;
    return o.rounds && o.rounds.indexOf(roundTh) !== -1;
  });

  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  var cassettes = MC_STATE.cassettes || [];
  _DA_QUEUE = orders.map(function(o) {
    var d = drugMap[o.drugId] || { id: o.drugId, name: o.drugId, dose: '', type: 'oral' };
    var orderQty = o.qty || 1;

    // Pick cassette(s) for this drug.
    // Strategy: find one IN cassette with enough stock. Only spread across multiple
    // cassettes if a single cassette doesn't have enough (rare in unit-dose carts).
    var inCassettes = cassettes
      .filter(function(c) { return c.status === 'IN' && c.drugId === o.drugId && c.quantity > 0; })
      .sort(function(a, b) { return b.quantity - a.quantity; });   // most-stocked first

    var pickedLocs = [];
    if (inCassettes.length) {
      var firstFit = inCassettes.find(function(c) { return c.quantity >= orderQty; });
      if (firstFit) {
        pickedLocs = [firstFit];        // single cassette covers the order
      } else {
        // Spread across cassettes only when no single one has enough stock
        var need = orderQty;
        for (var i = 0; i < inCassettes.length && need > 0; i++) {
          pickedLocs.push(inCassettes[i]);
          need -= inCassettes[i].quantity;
        }
      }
    } else {
      // No IN cassette — fallback to any so user sees the location with "ไม่มีในรถเข็น"
      var fallback = cassettes.find(function(c) { return c.drugId === o.drugId; });
      if (fallback) pickedLocs = [fallback];
    }

    var locations = pickedLocs.map(function(c) {
      return { drawerId: c.drawerId, slot: c.slotNumber, cassetteId: c.id, qty: c.quantity };
    });

    return {
      orderId:      o.id,
      drugId:       o.drugId,
      drug:         d,
      qty:          orderQty,
      route:        d.type === 'iv' ? 'IV' : 'PO',
      time:         roundTime,
      round:        roundTh,
      status:       'pending',
      reason:       null,
      isHigh:       _DA_HIGH_ALERT.indexOf(o.drugId) !== -1,
      allergyMatch: _daHasAllergy(d, p),
      stage:        'locked',
      locations:    locations,
      scannedCount: 0,
      // ── 7 Rights — manual confirmations ──
      rightRouteConfirmed:  false,
      rightReasonConfirmed: false
    };
  });
}

/* ── 7 Rights — compute the live state for an item (all sub-text dynamic) ── */
function _da7Rights(item) {
  if (!item) return [];

  // ── Live patient info ──
  var pt = (MC_STATE.patients || []).find(function(p) { return p.id === _DV_VERIFIED_PATIENT; });

  // ── Live time + round window ──
  var ROUND_TIME = { 'เช้า': 8, 'กลางวัน': 12, 'เย็น': 16, 'ก่อนนอน': 20 };
  var roundHr = ROUND_TIME[item.round] || 8;
  var now     = new Date();
  var nowHr   = now.getHours();
  var nowMin  = now.getMinutes();
  var pad2    = function(n) { return String(n).padStart(2, '0'); };
  var nowStr  = pad2(nowHr) + ':' + pad2(nowMin);
  var diffMin = (nowHr - roundHr) * 60 + nowMin;
  var absDiff = Math.abs(diffMin);
  var inWindow = absDiff <= 120;   // ±2 hours

  // ── Right Drug — barcode match (the scanner only counts when active item matches) ──
  var drugScanned = item.scannedCount > 0;
  var drugSub;
  if (item.allergyMatch) {
    drugSub = '⚠ ยานี้อยู่ในรายการแพ้ของผู้ป่วย';
  } else if (drugScanned) {
    drugSub = 'Barcode ตรงกับ ' + item.drug.name + (item.drug.dose ? ' ' + item.drug.dose : '');
  } else {
    drugSub = 'รอสแกน — ต้อง match กับ ' + item.drug.name;
  }

  // ── Right Dose — 1 ถุง บรรจุ N เม็ด/ขวด ──
  var pillUnit = item.route === 'IV' ? 'ขวด' : 'เม็ด';
  var bagLbl   = item.scannedCount >= 1 ? '✓ สแกนแล้ว 1 ถุง' : 'รอสแกน · 1 ถุง';
  var doseSub  = bagLbl + ' (บรรจุ ' + item.qty + ' ' + pillUnit
              + (item.drug.dose ? ' × ' + item.drug.dose : '') + ')';

  // ── Right Route — auto-resolved Thai label ──
  var routeMap = { 'IV': 'ฉีดเข้าเส้น (IV)', 'PO': 'รับประทาน (PO)', 'IM': 'ฉีดเข้ากล้ามเนื้อ (IM)', 'SC': 'ฉีดใต้ผิวหนัง (SC)' };
  var routeSub = (routeMap[item.route] || item.route)
               + (item.rightRouteConfirmed ? ' · ยืนยันแล้ว' : ' · รอยืนยัน');

  // ── Right Time — show now + round time + Δ ──
  var roundStr = pad2(roundHr) + ':00';
  var timeSub;
  if (inWindow) {
    timeSub = 'ขณะนี้ ' + nowStr + ' · รอบ' + item.round + ' (' + roundStr + ') · ภายใน ±2 ชม.';
  } else {
    var sign = diffMin > 0 ? 'ช้ากว่า ' : 'เร็วกว่า ';
    var dh   = Math.floor(absDiff / 60);
    var dm   = absDiff % 60;
    timeSub  = '⚠ ' + sign + (dh ? dh + ' ชม. ' : '') + dm + ' นาที จากรอบ' + item.round;
  }

  // ── Right Patient — live patient name ──
  var patientSub = pt
    ? pt.name + ' · HN ' + pt.hn + ' · เตียง ' + pt.bed
    : 'รอ Wristband ยืนยัน';

  // ── Right Documentation — show timestamp when given ──
  var docSub;
  if (item.status === 'given' && item.givenAt) {
    docSub = '✓ บันทึก MAR เมื่อ ' + item.givenAt + ' โดย ' + (item.givenBy || '—');
  } else {
    docSub = 'จะบันทึกอัตโนมัติเมื่อกด "จ่ายแล้ว"';
  }

  return [
    { key:'patient', lbl:'Right Patient',                     sub:patientSub, ok:!!pt,                                  auto:true  },
    { key:'drug',    lbl:'Right Drug',                        sub:drugSub,    ok:drugScanned && !item.allergyMatch,     auto:true  },
    { key:'dose',    lbl:'Right Dose',                        sub:doseSub,    ok:item.scannedCount >= 1,                auto:true  },
    { key:'route',   lbl:'Right Route',                       sub:routeSub,   ok:!!item.rightRouteConfirmed,            auto:false },
    { key:'time',    lbl:'Right Time',                        sub:timeSub,    ok:inWindow,                              auto:true  },
    { key:'doc',     lbl:'Right Documentation',               sub:docSub,     ok:item.status === 'given',               auto:true  },
    { key:'reason',  lbl:'Right Reason / Right to Refuse',    sub:_daReasonText(item), ok:_daReasonOk(item),            auto:false }
  ];
}

/* ── Right Reason / Right to Refuse helpers ──
   ครอบคลุม:
   1) ยาเหมาะสมกับเหตุผลของการเจ็บป่วย (indication appropriateness)
   2) ไม่มี allergy match — ห้ามจ่ายเด็ดขาด
   3) ผู้ป่วยรับทราบและไม่ปฏิเสธ (Right to Refuse)
*/
function _daReasonText(item) {
  if (item.allergyMatch) return '⚠ ผู้ป่วยแพ้ ' + item.allergyMatch + ' — ห้ามจ่าย';
  if (item.rightReasonConfirmed) return '✓ เหมาะสมกับอาการ · ผู้ป่วยรับทราบและยินยอม';
  return 'ยืนยันว่าตรงกับเหตุผลการรักษา + ผู้ป่วยรับยา';
}
function _daReasonOk(item) {
  if (item.allergyMatch) return false;            // allergy = block forever
  return !!item.rightReasonConfirmed;
}

function _daRender7Rights() {
  var item   = _DA_QUEUE[_DA_INDEX];
  var listEl = document.getElementById('daRightsList');
  var metaEl = document.getElementById('daRightsMeta');
  if (!listEl) return;
  if (!item) { listEl.innerHTML = ''; return; }

  var rights = _da7Rights(item);
  var passed = rights.filter(function(r) { return r.ok; }).length;
  if (metaEl) metaEl.textContent = passed + ' / ' + rights.length + ' ✓';

  // Actor (the nurse/pharmacist doing the check)
  var u = getCurrentUser ? getCurrentUser() : null;
  var name = (u && u.name) || MC_STATE.currentUser || 'Nurse';
  var role = u ? roleLabel(u.role) : 'พยาบาล';
  var initials = name.split(' ').slice(0, 2).map(function(w) { return w.charAt(0); }).join('') || '?';
  var avEl   = document.getElementById('daRightsActorAvatar');
  var nameEl2 = document.getElementById('daRightsActorName');
  var sec2nd = document.getElementById('daRightsActor2nd');
  if (avEl)   avEl.textContent   = initials;
  if (nameEl2) nameEl2.textContent = name + ' · ' + role;
  if (sec2nd) {
    if (item.isHigh) {
      sec2nd.hidden = false;
      sec2nd.innerHTML = _DA_2ND_DONE
        ? '<span class="rights-2nd-ok">✓ ผู้ยืนยันที่ 2: ภก.วิภา · เภสัชกร</span>'
        : '<span class="rights-2nd-pending">รอผู้ยืนยันที่ 2 (HIGH ALERT)</span>';
    } else {
      sec2nd.hidden = true;
    }
  }

  listEl.innerHTML = rights.map(function(r, i) {
    var stateCls = r.ok ? 'ok' : (r.auto ? 'pending' : 'manual');
    var icon = r.ok
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : (r.auto
          ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>');
    var actionBtn = (!r.ok && !r.auto)
      ? '<button type="button" class="da-rights-confirm" onclick="event.stopPropagation();daConfirmRight(\'' + r.key + '\')">ยืนยัน</button>'
      : '';
    return '<div class="da-rights-row ' + stateCls + '">'
      + '<span class="da-rights-num">' + (i + 1) + '</span>'
      + '<span class="da-rights-icon">' + icon + '</span>'
      + '<div class="da-rights-info">'
      +   '<div class="da-rights-lbl">' + r.lbl + '</div>'
      +   '<div class="da-rights-sub">' + r.sub + '</div>'
      + '</div>'
      + actionBtn
      + '</div>';
  }).join('');
}

function daConfirmRight(key) {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item) return;
  if (key === 'route') item.rightRouteConfirmed = true;
  if (key === 'reason') {
    if (item.allergyMatch) {
      daShowAlert('ผู้ป่วยแพ้ยานี้',
        'ห้ามจ่าย — ผู้ป่วยมีประวัติแพ้ <b>' + item.allergyMatch + '</b><br>ติดต่อแพทย์ผู้สั่งยา');
      return;
    }
    item.rightReasonConfirmed = true;
  }
  _daRender7Rights();
  _daRenderDetail();
}

function _daFindNextPending() {
  for (var i = 0; i < _DA_QUEUE.length; i++) {
    if (_DA_QUEUE[i].status === 'pending') return i;
  }
  return _DA_QUEUE.length; // all done
}

function _daRenderHeader() {
  var p = (MC_STATE.patients || []).find(function(x) { return x.id === _DV_VERIFIED_PATIENT; });
  if (!p) return;
  var initials = p.name ? p.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';
  var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('daPtAvatar', initials);
  set('daPtName',   p.name);
  set('daPtHn',     'HN ' + p.hn);
  set('daPtBed',    'เตียง ' + p.bed);
  set('daPtWard',   p.ward);

  var allergyEl     = document.getElementById('daPtAllergy');
  var allergyListEl = document.getElementById('daPtAllergyList');
  if (allergyEl) {
    if (p.allergies && p.allergies.length) {
      allergyEl.hidden = false;
      if (allergyListEl) allergyListEl.textContent = p.allergies.join(', ');
    } else {
      allergyEl.hidden = true;
    }
  }
}

function _daRenderList() {
  var listEl  = document.getElementById('daList');
  var countEl = document.getElementById('daListCount');
  if (countEl) countEl.textContent = _DA_QUEUE.length + ' รายการ';
  if (!listEl) return;

  if (!_DA_QUEUE.length) {
    listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">ไม่มียาที่ต้องจ่าย</div>';
    return;
  }

  var svgPill = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  var svgIV   = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/></svg>';
  var svgCheck = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var svgX     = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var svgClock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

  listEl.innerHTML = _DA_QUEUE.map(function(item, i) {
    var isActive = (i === _DA_INDEX) && item.status === 'pending';
    var stage = item.stage || 'locked';
    var rowCls = 'da-list-row' + (isActive ? ' active' : '') + (item.status !== 'pending' ? ' ' + item.status : '');
    if (item.status === 'pending') rowCls += ' stage-' + stage;

    var ico = svgPill;
    if (item.status === 'given')   ico = svgCheck;
    else if (item.status === 'refused') ico = svgX;
    else if (item.status === 'held')    ico = svgClock;
    else if (item.drug.type === 'iv')   ico = svgIV;

    var meta = item.route + ' · ' + item.time;
    if (item.status === 'refused') meta = 'Refuse · ' + (item.reason || '—');
    else if (item.status === 'held') meta = 'Hold · ' + (item.reason || '—');
    else if (item.locations && item.locations[0]) {
      var L = item.locations[0];
      meta = 'ลิ้นชัก ' + L.drawerId.replace('D','') + ' · Cassette ' + L.slot;
    }

    // Per-cassette light + unlock button (only for pending pending items)
    var rowEnd = '';
    if (item.status === 'pending') {
      var stateLbl, lightDot;
      if (stage === 'unlocked' || stage === 'scanning') {
        stateLbl = 'ไฟเขียว · เปิดได้'; lightDot = '🟢';
      } else if (stage === 'unlocking') {
        stateLbl = 'กำลังปลดล็อก...'; lightDot = '🟡';
      } else if (stage === 'complete') {
        stateLbl = 'หยิบครบแล้ว'; lightDot = '✓';
      } else {
        stateLbl = 'ล็อคอยู่'; lightDot = '🔒';
      }
      rowEnd = '<div class="da-list-row-state">' + lightDot + ' ' + stateLbl + '</div>';
    }

    return '<div class="' + rowCls + '" onclick="daSelectIndex(' + i + ')">'
      + '<div class="da-list-row-icon">' + ico + '</div>'
      + '<div class="da-list-row-info">'
      +   '<div class="da-list-row-name">'
      +     item.drug.name + (item.drug.dose ? ' ' + item.drug.dose : '')
      +     (item.isHigh ? ' <span class="da-list-ha-mini">HA</span>' : '')
      +   '</div>'
      +   '<div class="da-list-row-meta">' + meta + '</div>'
      +   (rowEnd ? rowEnd : '')
      + '</div>'
      + '<div class="da-list-row-qty">×' + item.qty + '</div>'
      + '</div>';
  }).join('');
}

function _daRenderDetail() {
  var item = _DA_QUEUE[_DA_INDEX];
  var iconEl   = document.getElementById('daDetailIcon');
  var nameEl   = document.getElementById('daDetailName');
  var doseEl   = document.getElementById('daDetailDose');
  var qtyEl    = document.getElementById('daDetailQty');
  var routeEl  = document.getElementById('daDetailRoute');
  var roundEl  = document.getElementById('daDetailRound');
  var timeEl   = document.getElementById('daDetailTime');
  var stepNum  = document.querySelector('#daDetailStep .da-detail-step-num');
  var stepTot  = document.getElementById('daDetailStepTotal');
  var hiBan    = document.getElementById('daHighAlert');
  var alChk    = document.getElementById('daAllergyCheck');
  var alMatch  = document.getElementById('daAllergyMatch');
  var area     = document.getElementById('daScanArea');
  var line     = document.getElementById('daScanLine');
  var scanIco  = document.getElementById('daScanIcon');
  var scanOk   = document.getElementById('daScanSuccess');
  var hint     = document.getElementById('daScanHint');
  var counter  = document.getElementById('daScanCounter');
  var btnGive  = document.getElementById('daBtnGive');

  if (!item) {
    if (nameEl) nameEl.textContent = 'จ่ายยาครบทุกรายการแล้ว';
    if (doseEl) doseEl.textContent = '';
    if (qtyEl)  qtyEl.textContent  = '—';
    if (routeEl) routeEl.textContent = '—';
    if (roundEl) roundEl.textContent = '—';
    if (timeEl)  timeEl.textContent  = '—';
    if (stepNum) stepNum.textContent = _DA_QUEUE.length;
    if (stepTot) stepTot.textContent = _DA_QUEUE.length;
    if (hiBan) hiBan.hidden = true;
    if (alChk) alChk.hidden = true;
    if (area) { area.classList.add('scanned'); area.classList.remove('error'); }
    if (line) line.hidden = true;
    if (scanIco) scanIco.hidden = true;
    if (scanOk) scanOk.hidden = false;
    if (hint) hint.textContent = 'จ่ายครบทุกรายการ ✓';
    if (counter) counter.hidden = true;
    if (btnGive) btnGive.disabled = true;
    var pendingEl = document.getElementById('da2ndPending');
    if (pendingEl) pendingEl.hidden = true;
    daClose2ndModal();
    document.querySelectorAll('.da-btn').forEach(function(b) { b.disabled = true; });
    return;
  }

  // Re-enable buttons (if they were disabled in done state)
  document.querySelectorAll('.da-btn:not(#daBtnGive)').forEach(function(b) { b.disabled = false; });

  var d = item.drug;
  if (iconEl) {
    iconEl.className = 'da-detail-icon' + (item.isHigh ? ' high-alert' : (d.type === 'iv' ? ' iv' : ''));
  }
  if (nameEl) nameEl.textContent = d.name;
  if (doseEl) doseEl.textContent = d.dose ? (d.dose + ' · ' + (d.type === 'iv' ? 'ยาฉีด/IV' : 'ยากิน')) : '';
  if (qtyEl)  qtyEl.textContent  = '×' + item.qty + ' ' + (item.route === 'IV' ? 'ถุง' : 'เม็ด');
  if (routeEl) routeEl.textContent = item.route;
  if (roundEl) roundEl.textContent = 'รอบ' + item.round;
  if (timeEl)  timeEl.textContent  = item.time;
  if (stepNum) stepNum.textContent = (_DA_INDEX + 1);
  if (stepTot) stepTot.textContent = _DA_QUEUE.length;

  // High alert banner
  if (hiBan) hiBan.hidden = !item.isHigh;

  // Allergy check banner
  if (item.allergyMatch) {
    if (alChk)   alChk.hidden = false;
    if (alMatch) alMatch.textContent = item.allergyMatch;
  } else {
    if (alChk) alChk.hidden = true;
  }

  // ── New: render drawer location list + unlock state ──
  var locCard    = document.getElementById('daLocCard');
  var locCount   = document.getElementById('daLocCount');
  var locList    = document.getElementById('daLocList');
  var locLight   = document.getElementById('daLocLight');
  var locLightTx = document.getElementById('daLocLightTxt');
  var unlockBtn  = document.getElementById('daUnlockBtn');
  var unlockCnt  = document.getElementById('daUnlockCount');
  var qtyCard    = document.getElementById('daQtyCard');
  var qtyDone    = document.getElementById('daQtyDone');
  var qtyTotal   = document.getElementById('daQtyTotal');
  var qtyFill    = document.getElementById('daQtyFill');
  var qtyRemain  = document.getElementById('daQtyRemain');

  var locs    = item.locations || [];
  var unlocked = (item.stage === 'unlocked' || item.stage === 'scanning' || item.stage === 'complete');
  var unlocking = item.stage === 'unlocking';
  var oorOverride = !!_DV_OUT_OF_ROUND && _dvDualNurseOK();

  // Dual-nurse override badge — show on admin page when applicable
  var dnBadge      = document.getElementById('daDnBadge');
  var dnBadgeNames = document.getElementById('daDnBadgeNurses');
  if (dnBadge) dnBadge.hidden = !oorOverride;
  if (dnBadgeNames && oorOverride) {
    var n1 = _DV_DUAL_NURSE.n1, n2 = _DV_DUAL_NURSE.n2;
    dnBadgeNames.textContent = (n1 ? n1.name : '—') + ' · ' + (n2 ? n2.name : '—');
  }

  // Location count text
  if (locCount) {
    if (locs.length === 0) locCount.textContent = oorOverride ? 'จ่ายล่าช้า · ใช้ยาจากที่อื่น' : 'ไม่มีในรถเข็น';
    else if (locs.length === 1) locCount.textContent = '1 ตำแหน่ง';
    else locCount.textContent = locs.length + ' ตำแหน่ง · เปิดพร้อมกัน';
  }

  // Render location rows — each row gets its own light state
  if (locList) {
    if (!locs.length) {
      locList.innerHTML = oorOverride
        ? '<div class="da-loc-empty da-loc-empty-oor">'
          + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
          + ' ยานี้ไม่มีใน Cassette · จ่ายย้อนหลังโดยใช้ยาจากที่อื่น</div>'
        : '<div class="da-loc-empty">ยานี้ไม่มีใน Cassette ของรถเข็น</div>';
    } else {
      locList.innerHTML = locs.map(function(L, i) {
        var rowState = unlocked ? 'unlocked' : (unlocking ? 'unlocking' : 'locked');
        var stateLbl = unlocked ? '🟢 เปิดได้' : (unlocking ? '🟡 กำลังปลดล็อก' : '🔒 ล็อคอยู่');
        return '<div class="da-loc-item" data-state="' + rowState + '">'
          + '<span class="da-loc-item-num">' + (i + 1) + '</span>'
          + '<span class="da-loc-item-name">ลิ้นชัก ' + L.drawerId.replace('D','') + ' · Cassette ' + L.slot + '</span>'
          + '<span class="da-loc-item-light">' + stateLbl + '</span>'
          + '</div>';
      }).join('');
    }
  }

  // Lock state UI on the card + summary pill
  if (locCard) locCard.setAttribute('data-state', unlocked ? 'unlocked' : (unlocking ? 'unlocking' : 'locked'));
  if (locLight) {
    locLight.setAttribute('data-state', unlocked ? 'unlocked' : (unlocking ? 'unlocking' : 'locked'));
  }
  if (locLightTx) {
    locLightTx.textContent =
      unlocked ? (locs.length > 1 ? 'ไฟเขียว · ' + locs.length + ' ช่อง' : 'ไฟเขียว — เปิดได้')
      : unlocking ? 'กำลังปลดล็อก...' : (locs.length > 1 ? 'ล็อคอยู่ · ' + locs.length + ' ช่อง' : 'ล็อคอยู่');
  }
  if (unlockBtn) {
    // Out-of-round override: allow unlock even when no cassette is in cart (dispense from external stock)
    unlockBtn.disabled = item.stage !== 'locked' || (locs.length === 0 && !oorOverride);
    unlockBtn.style.display = (item.stage === 'locked' || item.stage === 'unlocking') ? '' : 'none';
  }
  if (unlockCnt) {
    unlockCnt.textContent = locs.length > 1 ? '(' + locs.length + ' ช่อง)' : '';
  }

  // Quantity progress card — 1 bag containing N pills/units
  if (qtyCard) {
    var showQty = item.stage === 'unlocked' || item.stage === 'scanning' || item.stage === 'complete';
    qtyCard.hidden = !showQty;
    qtyCard.classList.toggle('complete', item.scannedCount >= 1);
    var unitTxt = item.route === 'IV' ? 'ขวด' : 'เม็ด';
    if (qtyDone)  qtyDone.textContent  = item.scannedCount;
    if (qtyTotal) qtyTotal.textContent = '1';
    if (qtyFill)  qtyFill.style.width  = (item.scannedCount >= 1 ? 100 : 0) + '%';
    if (qtyRemain) {
      qtyRemain.textContent = item.scannedCount >= 1
        ? '✓ สแกนถุงยาแล้ว · ยา ' + item.qty + ' ' + unitTxt + ' · ' + (item.drug.dose || '')
        : 'หยิบ 1 ถุง (บรรจุ ' + item.qty + ' ' + unitTxt + ') แล้วสแกน Barcode';
    }
  }

  // Scan area visibility — only show when unlocked & bag not yet scanned
  var scanShouldShow = (item.stage === 'unlocked' || item.stage === 'scanning') && item.scannedCount < 1;
  if (area) area.style.display = scanShouldShow ? '' : 'none';

  // Reset scan UI
  if (area) { area.classList.remove('scanned'); area.classList.remove('error'); }
  if (line) line.hidden = false;
  if (scanIco) scanIco.hidden = false;
  if (scanOk) scanOk.hidden = true;
  if (hint) {
    if (item.allergyMatch)              hint.textContent = 'ห้ามจ่าย — ผู้ป่วยแพ้ยานี้';
    else if (item.scannedCount >= 1 && item.isHigh && !_DA_2ND_DONE)
                                        hint.textContent = '✓ สแกนถุงแล้ว — รอพยาบาลคนที่ 2 ยืนยัน';
    else if (item.scannedCount >= 1)    hint.textContent = '✓ สแกนแล้ว — กดปุ่ม "จ่ายแล้ว"';
    else if (item.isHigh)               hint.textContent = 'High Alert · แตะเพื่อสแกน Barcode บนถุงยา';
    else                                hint.textContent = 'แตะเพื่อสแกน Barcode บนถุงยา';
  }
  if (counter) counter.hidden = true;

  // 7 Rights checklist
  _daRender7Rights();

  // "จ่ายแล้ว" button — must pass all 7 Rights (+ HA: 2nd nurse verified)
  var rights = _da7Rights(item);
  // Right Documentation auto-✓ AFTER we mark given — exclude from pre-gate
  var preDocOk = rights.filter(function(r) { return r.key !== 'doc'; }).every(function(r) { return r.ok; });
  var haOk = !item.isHigh || _DA_2ND_DONE;
  if (btnGive) btnGive.disabled = !(preDocOk && haOk);

  // Inline pending pill — appears only if HA bag scanned but 2nd nurse not yet verified
  var pending = document.getElementById('da2ndPending');
  if (pending) pending.hidden = !(item.isHigh && item.scannedCount >= 1 && !_DA_2ND_DONE);
}

function _daUpdateBottomBar() {
  var done    = _DA_QUEUE.filter(function(x) { return x.status === 'given';   }).length;
  var refused = _DA_QUEUE.filter(function(x) { return x.status === 'refused'; }).length;
  var held    = _DA_QUEUE.filter(function(x) { return x.status === 'held';    }).length;
  var total   = _DA_QUEUE.length;
  var anyDone = (done + refused + held) > 0;            // ← partial submission OK
  var allDone = (done + refused + held) === total;

  var sum = document.getElementById('daConfirmSummary');
  var btn = document.getElementById('daConfirmBtn');
  var doneEl  = document.getElementById('daProgressDone');
  var totalEl = document.getElementById('daProgressTotal');

  if (sum) {
    if (!anyDone) {
      sum.textContent = 'ยังไม่ได้จ่ายยา · เลือกยาเริ่มจ่าย';
    } else if (allDone) {
      sum.textContent = 'จ่ายครบ ' + total + ' รายการ — กดยืนยันเพื่อบันทึก MAR';
    } else {
      var remain = total - (done + refused + held);
      sum.textContent = 'จ่ายแล้ว ' + done + (refused ? ' · Refuse ' + refused : '') + (held ? ' · Hold ' + held : '') + ' · เหลือ ' + remain + ' รายการ';
    }
  }
  // Allow partial confirm — เปิดปุ่มทันทีที่จ่าย/refuse/hold ยา 1 ตัว
  if (btn) {
    btn.disabled = !anyDone;
    btn.textContent = '';
    var label = allDone ? 'ดูสรุปการจ่าย' : 'บันทึกที่จ่ายไปก่อน → ค่อยกลับมา';
    btn.innerHTML = label + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  }
  if (doneEl)  doneEl.textContent  = done;
  if (totalEl) totalEl.textContent = total;
}

function daSelectIndex(i) {
  if (i < 0 || i >= _DA_QUEUE.length) return;
  if (_DA_QUEUE[i].status !== 'pending') return; // can't go back to completed ones
  _DA_INDEX = i;
  _DA_SCAN_COUNT = 0;
  _DA_2ND_DONE   = false;
  daClose2ndModal();
  _daRenderList();
  _daRenderDetail();
}

/* Step A: Press unlock — simulate hardware: blink yellow → green light */
function daUnlockDrawer() {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item || item.stage !== 'locked') return;
  if (item.allergyMatch) {
    daShowAlert('แพ้ยา (Drug Allergy)',
      'ผู้ป่วยมีประวัติแพ้ <b>' + item.allergyMatch + '</b><br>ห้ามให้ยาตัวนี้เด็ดขาด');
    return;
  }
  item.stage = 'unlocking';
  _daRenderDetail();
  // Simulate hardware unlock — 800ms then green
  setTimeout(function() {
    if (_DA_QUEUE[_DA_INDEX] === item) {
      item.stage = 'unlocked';
      _daRenderDetail();
    }
  }, 800);
}

/* Scan: 1 bag = 1 scan. HIGH ALERT additionally requires the 2nd-nurse modal. */
function daSimulateScan() {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item || item.status !== 'pending') return;
  if (item.stage === 'locked' || item.stage === 'unlocking') return;
  if (item.scannedCount >= 1) return;     // already scanned (1 bag per dose)

  // Single scan = 1 bag complete (whether HA or not)
  _DA_SCAN_COUNT     = 1;
  item.scannedCount  = 1;
  item.stage         = 'complete';

  var area = document.getElementById('daScanArea');
  if (area) {
    area.classList.add('scanned');
    setTimeout(function() {
      if (area) area.classList.remove('scanned');
      _daRenderDetail();
      // High alert → auto-open the 2nd-nurse badge scan modal
      if (item.isHigh && !_DA_2ND_DONE) daOpen2ndModal();
    }, 400);
  } else {
    _daRenderDetail();
    if (item.isHigh && !_DA_2ND_DONE) daOpen2ndModal();
  }
}

/* HIGH ALERT — open the 2nd-nurse badge scan modal */
function daOpen2ndModal() {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item || !item.isHigh || _DA_2ND_DONE) return;
  var modal = document.getElementById('da2ndModal');
  if (!modal) return;

  // Reset visuals each time it opens
  var area = document.getElementById('da2ndScanArea');
  var line = document.getElementById('da2ndScanLine');
  var ico  = document.getElementById('da2ndScanIcon');
  var ok   = document.getElementById('da2ndScanSuccess');
  var hint = document.getElementById('da2ndScanHint');
  var dn   = document.getElementById('da2ndDrugName');
  if (area) { area.classList.remove('scanning'); area.classList.remove('scanned'); }
  if (line) line.hidden = false;
  if (ico)  ico.hidden  = false;
  if (ok)   ok.hidden   = true;
  if (hint) hint.textContent = 'แตะเพื่อจำลองการสแกนบัตรพนักงาน';
  if (dn && item.drug) dn.textContent = item.drug.name + (item.drug.dose ? ' ' + item.drug.dose : '');

  modal.hidden = false;
}

function daClose2ndModal() {
  var modal = document.getElementById('da2ndModal');
  if (modal) modal.hidden = true;
}

/* HIGH ALERT 2nd-nurse verification — scan their employee badge */
function daScan2ndNurse() {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item || !item.isHigh) return;
  if (item.scannedCount < 1) return;   // bag must be scanned first
  if (_DA_2ND_DONE) return;

  var area = document.getElementById('da2ndScanArea');
  var line = document.getElementById('da2ndScanLine');
  var ico  = document.getElementById('da2ndScanIcon');
  var ok   = document.getElementById('da2ndScanSuccess');
  var hint = document.getElementById('da2ndScanHint');

  // Animate scan
  if (area) area.classList.add('scanning');
  if (hint) hint.textContent = 'กำลังอ่าน Barcode บัตรพนักงาน...';

  setTimeout(function() {
    if (area) { area.classList.remove('scanning'); area.classList.add('scanned'); }
    if (line) line.hidden = true;
    if (ico)  ico.hidden  = true;
    if (ok)   ok.hidden   = false;
    if (hint) hint.textContent = '✓ ภก.วิภา · เภสัชกร — ยืนยันแล้ว';

    _DA_2ND_DONE = true;

    setTimeout(function() {
      daClose2ndModal();
      var sHint = document.getElementById('daScanHint');
      if (sHint) sHint.textContent = 'พยาบาลคนที่ 2 ยืนยันแล้ว ✓ — กดปุ่ม "จ่ายแล้ว"';
      _daRenderDetail();
    }, 700);
  }, 700);
}

/* legacy alias — keep in case any old binding still calls it */
function daConfirm2ndNurse() { daScan2ndNurse(); }

function daMarkGiven() {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item) return;

  // Must unlock + scan all pills first
  if (item.stage === 'locked' || item.stage === 'unlocking') {
    daShowAlert('ยังไม่ได้ปลดล็อก', 'กดปุ่ม "ปลดล็อกลิ้นชัก" ก่อนหยิบยา');
    return;
  }
  if (item.scannedCount < 1) {
    daShowAlert('ยังไม่ได้สแกนยา', 'กรุณาสแกน Barcode บนถุงยา 1 ครั้งก่อนกดจ่าย');
    return;
  }
  // 7 Rights gate (excluding documentation which auto-✓ after this step)
  var rights = _da7Rights(item);
  var failed = rights.filter(function(r) { return r.key !== 'doc' && !r.ok; });
  if (failed.length) {
    daShowAlert('ยังไม่ผ่าน 7 Rights',
      'ยังขาด: <b>' + failed.map(function(r) { return r.lbl; }).join(', ') + '</b><br>กรุณาตรวจสอบและยืนยันให้ครบก่อนกดจ่ายยา');
    return;
  }
  // High alert: also needs 2nd nurse to scan their badge
  if (item.isHigh && !_DA_2ND_DONE) {
    daShowAlert('ขั้นตอนไม่ครบ',
      'ยา HIGH ALERT ต้องให้พยาบาลคนที่ 2 สแกนบัตรพนักงานยืนยันก่อน');
    daOpen2ndModal();
    return;
  }

  // Stamp the dispense event — feeds into Right Documentation sub-text
  var now = new Date();
  var pad2 = function(n) { return String(n).padStart(2, '0'); };
  item.status  = 'given';
  item.givenAt = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  var u = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  item.givenBy = (u && u.name) || MC_STATE.currentUser || 'พยาบาล';

  // Decrement cassette quantity — Drawer Map reflects "drug taken out" after dispense.
  // Spread item.qty across the picked locations (usually 1 cassette covers the dose).
  var remainingQty = item.qty || 1;
  (item.locations || []).forEach(function(L) {
    if (remainingQty <= 0) return;
    var c = (MC_STATE.cassettes || []).find(function(x) { return x.id === L.cassetteId; });
    if (!c) return;
    var take = Math.min(remainingQty, c.quantity || 0);
    c.quantity = Math.max(0, (c.quantity || 0) - take);
    remainingQty -= take;
    // When emptied, clear drugId so Drawer Map shows the slot as available again.
    if (c.quantity === 0) {
      c.drugId = null;
    }
  });

  var ord = (MC_STATE.orders || []).find(function(o) { return o.id === item.orderId; });
  if (ord) {
    ord.status = 'DONE';
    ord.dispensedQty = item.scannedCount;
    ord.dispensedAt  = now.getTime();
    ord.dispensedBy  = item.givenBy;
  }

  // Audit per-item (separate from MAR_SAVED)
  if (typeof addAudit === 'function') {
    try {
      addAudit({
        action:    'DRUG_GIVEN',
        user:      item.givenBy,
        patient:   ((MC_STATE.patients || []).find(function(p) { return p.id === _DV_VERIFIED_PATIENT; }) || {}).name,
        drugLabel: item.drug.name + ' ' + item.drug.dose + ' ×' + item.scannedCount + ' ' + (item.route === 'IV' ? 'ถุง' : 'ถุง')
      });
    } catch (e) {}
  }

  _daAdvance();
}

function _daAdvance() {
  _DA_SCAN_COUNT = 0;
  _DA_2ND_DONE   = false;
  _DA_INDEX = _daFindNextPending();
  _daRenderList();
  _daRenderDetail();
  _daUpdateBottomBar();
}

function daMarkRefused() {
  _DA_PENDING_ACTION = 'refused';
  daShowReason('Refuse — เหตุผลที่ผู้ป่วยปฏิเสธ', [
    'ผู้ป่วยปฏิเสธ',
    'ผู้ป่วยหลับ / ไม่รู้สึกตัว',
    'ผู้ป่วยไม่อยู่เตียง',
    'อาการแพ้ / ผลข้างเคียง',
    'ออกจากโรงพยาบาล',
    'อื่นๆ'
  ]);
}

function daMarkHeld() {
  _DA_PENDING_ACTION = 'held';
  daShowReason('Hold / Late — เหตุผลที่เลื่อนการให้ยา', [
    'รอผลตรวจ',
    'รอแพทย์อนุมัติ',
    'NPO (งดอาหาร)',
    'สัญญาณชีพไม่อยู่ในเกณฑ์',
    'ยาไม่พอ',
    'อื่นๆ'
  ]);
}

function daShowReason(title, reasons) {
  var overlay = document.getElementById('daReasonOverlay');
  var titleEl = document.getElementById('daReasonTitle');
  var listEl  = document.getElementById('daReasonList');
  if (!overlay || !titleEl || !listEl) return;
  titleEl.textContent = title;
  listEl.innerHTML = reasons.map(function(r) {
    return '<button type="button" class="da-reason-item" onclick="daApplyReason(\'' + r.replace(/'/g, "\\'") + '\')">' + r + '</button>';
  }).join('');
  overlay.hidden = false;
}

function daCloseReason(e) {
  if (e && e.target && e.target.id !== 'daReasonOverlay') return;
  var overlay = document.getElementById('daReasonOverlay');
  if (overlay) overlay.hidden = true;
  _DA_PENDING_ACTION = null;
}

function daApplyReason(reason) {
  var item = _DA_QUEUE[_DA_INDEX];
  if (!item || !_DA_PENDING_ACTION) { daCloseReason(); return; }
  item.status = _DA_PENDING_ACTION;
  item.reason = reason;
  daCloseReason();
  _daAdvance();
}

function daShowAlert(title, msgHtml) {
  var overlay = document.getElementById('daAlertOverlay');
  var titleEl = document.getElementById('daAlertTitle');
  var msgEl   = document.getElementById('daAlertMsg');
  var primary = document.getElementById('daAlertPrimary');
  var secondary = document.getElementById('daAlertSecondary');
  if (!overlay) return;
  if (titleEl) titleEl.textContent = title;
  if (msgEl)   msgEl.innerHTML     = msgHtml;
  // For allergy/critical alerts, only show "Acknowledge" (no continue)
  if (primary)  primary.style.display = 'none';
  if (secondary) secondary.textContent = 'รับทราบ';
  overlay.hidden = false;
}

function daCloseAlert(e) {
  if (e && e.target && e.target.id !== 'daAlertOverlay') return;
  var overlay = document.getElementById('daAlertOverlay');
  if (overlay) overlay.hidden = true;
}

function daFinishRound() {
  location.hash = '#pg-dispense-summary';
}


/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 5: Summary & Confirmation (MAR)
   ════════════════════════════════════════════════════════ */

function initDispenseSummary() {
  if (location.hash.replace('#','') !== 'pg-dispense-summary') return;
  seedMcData();

  if (!_DV_VERIFIED_PATIENT || !_DA_QUEUE.length) {
    location.hash = '#pg-dispense-verify';
    return;
  }

  _dsRenderHero();
  _dsRenderMeta();
  _dsRenderSections();
}

function _dsRenderHero() {
  var given   = _DA_QUEUE.filter(function(x) { return x.status === 'given';   }).length;
  var refused = _DA_QUEUE.filter(function(x) { return x.status === 'refused'; }).length;
  var held    = _DA_QUEUE.filter(function(x) { return x.status === 'held';    }).length;
  var total   = _DA_QUEUE.length;

  var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('dsStatGiven',   given);
  set('dsStatHeld',    held);
  set('dsStatRefused', refused);

  var titleEl = document.getElementById('dsHeroTitle');
  var subEl   = document.getElementById('dsHeroSub');
  if (refused === 0 && held === 0) {
    if (titleEl) titleEl.textContent = 'จ่ายยาครบทุกรายการ';
    if (subEl)   subEl.textContent   = total + ' รายการ ดำเนินการครบถ้วน · รอยืนยันบันทึก MAR';
  } else if (given === total) {
    if (titleEl) titleEl.textContent = 'จ่ายยาเสร็จสิ้น';
    if (subEl)   subEl.textContent   = 'ดำเนินการครบ ' + total + ' รายการ';
  } else {
    if (titleEl) titleEl.textContent = 'สรุปการจ่ายยา';
    if (subEl)   subEl.textContent   = 'จ่ายแล้ว ' + given + ' · Hold ' + held + ' · Refuse ' + refused + ' จาก ' + total + ' รายการ';
  }
}

function _dsRenderMeta() {
  var p = (MC_STATE.patients || []).find(function(x) { return x.id === _DV_VERIFIED_PATIENT; });
  if (!p) return;
  var initials = p.name ? p.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';
  var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('dsAvatar', initials);
  set('dsName',   p.name);
  set('dsPtLine', 'HN ' + p.hn + ' · เตียง ' + p.bed + ' · ' + p.ward);
  set('dsRound',  _DV_ROUND_LABEL[_DV_ROUND] || '—');
  set('dsNurse',  MC_STATE.currentUser || '—');

  // Current time HH:MM
  var now = new Date();
  var hh  = String(now.getHours()).padStart(2,'0');
  var mm  = String(now.getMinutes()).padStart(2,'0');
  set('dsTime', hh + ':' + mm);
}

function _dsRenderSections() {
  var given   = _DA_QUEUE.filter(function(x) { return x.status === 'given';   });
  var held    = _DA_QUEUE.filter(function(x) { return x.status === 'held';    });
  var refused = _DA_QUEUE.filter(function(x) { return x.status === 'refused'; });

  // Given section
  var secGiven = document.getElementById('dsSecGiven');
  var cntGiven = document.getElementById('dsCntGiven');
  var listGiven = document.getElementById('dsListGiven');
  if (cntGiven)  cntGiven.textContent = given.length + ' รายการ';
  if (secGiven)  secGiven.hidden = given.length === 0;
  if (listGiven) listGiven.innerHTML = _dsRenderRows(given, 'given');

  // Held section
  var secHeld = document.getElementById('dsSecHeld');
  var cntHeld = document.getElementById('dsCntHeld');
  var listHeld = document.getElementById('dsListHeld');
  if (cntHeld)  cntHeld.textContent = held.length + ' รายการ';
  if (secHeld)  secHeld.hidden = held.length === 0;
  if (listHeld) listHeld.innerHTML = _dsRenderRows(held, 'held');

  // Refused section
  var secRefused = document.getElementById('dsSecRefused');
  var cntRefused = document.getElementById('dsCntRefused');
  var listRefused = document.getElementById('dsListRefused');
  if (cntRefused)  cntRefused.textContent = refused.length + ' รายการ';
  if (secRefused)  secRefused.hidden = refused.length === 0;
  if (listRefused) listRefused.innerHTML = _dsRenderRows(refused, 'refused');
}

function _dsRenderRows(items, type) {
  if (!items.length) return '';
  var svgPill = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5a5 5 0 0 1 7.07 7.07L7.07 20.57A5 5 0 1 1 3.5 14 5 5 0 0 1 10.5 3.5z"/><line x1="9" y1="9" x2="15.5" y2="15.5"/></svg>';
  var svgIV   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 5H7z"/><path d="M7 8a5 5 0 0 0 10 0"/><line x1="12" y1="13" x2="12" y2="18"/></svg>';

  // Stagger times for "given" — base on _DV_ROUND start time
  var roundTime = { morning:'08:00', noon:'12:00', evening:'16:00', bedtime:'20:00' }[_DV_ROUND] || '08:00';
  var baseHr = parseInt(roundTime.split(':')[0], 10);
  var baseMin = parseInt(roundTime.split(':')[1], 10);

  return items.map(function(item, i) {
    var d = item.drug;
    var isIV   = d.type === 'iv';
    var iconCls = item.isHigh ? 'ha' : (isIV ? 'iv' : '');
    var unit    = isIV ? 'ถุง' : 'เม็ด';

    var meta;
    if (type === 'given') {
      var mins = baseMin + i * 2;
      var hh   = String(baseHr + Math.floor(mins/60)).padStart(2,'0');
      var mm   = String(mins % 60).padStart(2,'0');
      meta = item.route + ' · ×' + item.qty + ' ' + unit + (item.isHigh ? ' · ยืนยัน 2 พยาบาล' : '');
      var timeText = hh + ':' + mm;
      return '<div class="ds-sec-row">'
        + '<div class="ds-sec-row-icon ' + iconCls + '">' + (isIV ? svgIV : svgPill) + '</div>'
        + '<div class="ds-sec-row-info">'
        +   '<div class="ds-sec-row-name">' + d.name + (d.dose ? ' ' + d.dose : '')
        +     (item.isHigh ? ' <span class="ds-ha-pill">HA</span>' : '')
        +   '</div>'
        +   '<div class="ds-sec-row-meta">' + meta + '</div>'
        + '</div>'
        + '<div class="ds-sec-row-time">' + timeText + '</div>'
        + '</div>';
    }

    // held / refused — show reason instead of time
    meta = item.route + ' · ×' + item.qty + ' ' + unit;
    var reasonText = '<b style="color:' + (type === 'held' ? '#1d4ed8' : '#c2410c') + ';">เหตุผล:</b> ' + (item.reason || '—');
    return '<div class="ds-sec-row">'
      + '<div class="ds-sec-row-icon ' + iconCls + '">' + (isIV ? svgIV : svgPill) + '</div>'
      + '<div class="ds-sec-row-info">'
      +   '<div class="ds-sec-row-name">' + d.name + (d.dose ? ' ' + d.dose : '')
      +     (item.isHigh ? ' <span class="ds-ha-pill">HA</span>' : '')
      +   '</div>'
      +   '<div class="ds-sec-row-meta" style="font-size:11.5px;">' + reasonText + '</div>'
      + '</div>'
      + '<div class="ds-sec-row-time" style="background:' + (type === 'held' ? '#dbeafe;color:#1d4ed8;' : '#ffedd5;color:#c2410c;') + '">'
      +   (type === 'held' ? 'Hold' : 'Refuse')
      + '</div>'
      + '</div>';
  }).join('');
}

function dsConfirmAndSave() {
  var p = (MC_STATE.patients || []).find(function(x) { return x.id === _DV_VERIFIED_PATIENT; });
  var notes = (document.getElementById('dsNotes') || {}).value || '';
  var given   = _DA_QUEUE.filter(function(x) { return x.status === 'given';   }).length;
  var refused = _DA_QUEUE.filter(function(x) { return x.status === 'refused'; }).length;
  var held    = _DA_QUEUE.filter(function(x) { return x.status === 'held';    }).length;

  if (typeof addAudit === 'function' && p) {
    try {
      addAudit({
        action: 'MAR_SAVED',
        user:   MC_STATE.currentUser || 'Nurse',
        patient: p.name,
        drugLabel: 'จ่ายแล้ว ' + given + ' · Hold ' + held + ' · Refuse ' + refused + (notes ? ' · ' + notes : '')
      });
    } catch (e) {}
  }

  // ── Smart routing: check if more patients pending in this round ──
  var roundTh = _DV_ROUND_TH[_DV_ROUND] || 'เช้า';
  var stillPending = (MC_STATE.orders || []).some(function(o) {
    return isPatientInCurrentCart(o.patientId)
      && o.status === 'PENDING'
      && o.rounds && o.rounds.indexOf(roundTh) !== -1
      && o.patientId !== _DV_VERIFIED_PATIENT;
  });

  // Reset session state
  _DA_QUEUE = [];
  _DA_INDEX = 0;
  _DV_VERIFIED_PATIENT = null;

  if (stillPending) {
    showSmcToast('✓ บันทึก MAR สำเร็จ', (p ? p.name : '—') + ' · จ่าย ' + given + (held ? ' · Hold ' + held : '') + (refused ? ' · Refuse ' + refused : ''), 'success');
    location.hash = '#pg-dispense-queue';
  } else {
    var label = ({ morning:'รอบเช้า', noon:'รอบกลางวัน', evening:'รอบเย็น', bedtime:'รอบก่อนนอน' })[_DV_ROUND] || 'รอบนี้';
    showSmcToast('🎉 จบ' + label + 'แล้ว', 'จ่ายยาครบทุกผู้ป่วยใน ' + label + ' · เลือกรอบถัดไปได้เลย', 'success', 4000);
    location.hash = '#pg-dispense-rounds';
  }
}

/* ─── Generic toast (auto-dismiss) ───────────────────────────── */
function showSmcToast(title, sub, tone, durationMs) {
  tone = tone || 'success';
  durationMs = durationMs || 2800;

  var stack = document.getElementById('smcToastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'smcToastStack';
    stack.className = 'smc-toast-stack';
    document.body.appendChild(stack);
  }

  var t = document.createElement('div');
  t.className = 'smc-toast tone-' + tone;
  t.innerHTML =
    '<div class="smc-toast-icon">' +
      (tone === 'success'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>') +
    '</div>' +
    '<div class="smc-toast-body">' +
      '<div class="smc-toast-title">' + title + '</div>' +
      (sub ? '<div class="smc-toast-sub">' + sub + '</div>' : '') +
    '</div>';
  t.onclick = function() { dismissSmcToast(t); };
  stack.appendChild(t);

  setTimeout(function() { dismissSmcToast(t); }, durationMs);
}

function dismissSmcToast(t) {
  if (!t || !t.parentNode) return;
  t.classList.add('leaving');
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
}


/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 1: Round Selection
   ════════════════════════════════════════════════════════ */

function initDispenseRounds() {
  if (location.hash.replace('#','') !== 'pg-dispense-rounds') return;
  seedMcData();

  // Auto-detect current round
  var hr = new Date().getHours();
  var current;
  if      (hr < 10)  current = 'morning';
  else if (hr < 14)  current = 'noon';
  else if (hr < 18)  current = 'evening';
  else               current = 'bedtime';

  // Render date
  var now = new Date();
  var thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  var dateStr = now.getDate() + ' ' + thMonths[now.getMonth()] + ' ' + (now.getFullYear() + 543);
  var dateEl = document.getElementById('drDate');
  if (dateEl) dateEl.textContent = dateStr;

  // Compute stats per round (current ward)
  var orders = _wardOrders();
  var rounds = ['morning','noon','evening','bedtime'];
  var roundTh = { morning:'เช้า', noon:'กลางวัน', evening:'เย็น', bedtime:'ก่อนนอน' };
  var capName = { morning:'Morning', noon:'Noon', evening:'Evening', bedtime:'Bedtime' };

  // Hero stats — total ward
  var allPatients = (new Set(orders.map(function(o) { return o.patientId; }))).size;
  var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setText('drStatPatients', allPatients);
  setText('drStatOrders',   orders.length);

  // Per-round stats
  rounds.forEach(function(r) {
    var th = roundTh[r];
    var roundOrders = orders.filter(function(o) { return o.rounds && o.rounds.indexOf(th) !== -1; });
    var pCount = (new Set(roundOrders.map(function(o) { return o.patientId; }))).size;
    var oCount = roundOrders.length;
    var done   = roundOrders.filter(function(o) { return o.status === 'DONE'; }).length;

    setText('dr' + capName[r] + 'Patients', pCount);
    setText('dr' + capName[r] + 'Orders',   oCount);
    setText('dr' + capName[r] + 'Done',     done);
    setText('dr' + capName[r] + 'Total',    oCount);

    var fill = document.getElementById('dr' + capName[r] + 'Fill');
    if (fill) fill.style.width = (oCount > 0 ? Math.round(done / oCount * 100) : 0) + '%';
  });

  // Highlight current round
  document.querySelectorAll('.dr-round-card').forEach(function(card) {
    card.classList.remove('current');
  });
  var curCard  = document.querySelector('.dr-round-card[data-round="' + current + '"]');
  if (curCard) curCard.classList.add('current');
  ['Morning','Noon','Evening','Bedtime'].forEach(function(c) {
    var el = document.getElementById('drCur' + c); if (el) el.hidden = true;
  });
  var curBadge = document.getElementById('drCur' + capName[current]);
  if (curBadge) curBadge.hidden = false;

  // Hero sub
  var subEl = document.getElementById('drHeroSub');
  if (subEl) {
    subEl.innerHTML = 'ผู้ป่วยใน <span data-ward-name>' + (getCurrentWard() ? getCurrentWard().name : 'Ward') + '</span> ทั้งหมด ' + allPatients + ' คน · รายการยาทั้งวัน ' + orders.length + ' รายการ';
  }

  // STAT/PRN — for demo, count "high alert" pending orders as urgent
  var statCount = orders.filter(function(o) {
    return o.status === 'PENDING' && _DA_HIGH_ALERT.indexOf(o.drugId) !== -1;
  }).length;
  var statCard  = document.getElementById('drStatCard');
  var statSub   = document.getElementById('drStatSub');
  var statBadge = document.getElementById('drStatBadge');
  var statCnt   = document.getElementById('drStatCount');
  if (statCard) {
    if (statCount > 0) {
      statCard.classList.add('has-urgent');
      if (statSub)   statSub.textContent = 'มียา HIGH ALERT รอจ่าย — ต้องดำเนินการก่อน';
      if (statBadge) statBadge.hidden = false;
      if (statCnt)   statCnt.textContent = statCount;
    } else {
      statCard.classList.remove('has-urgent');
      if (statSub)   statSub.textContent = 'ไม่มีรายการยาด่วน';
      if (statBadge) statBadge.hidden = true;
    }
  }

  // Status bar (4 stats — across all rounds today)
  var pending = orders.filter(function(o) { return o.status === 'PENDING'; }).length;
  var given   = orders.filter(function(o) { return o.status === 'DONE';    }).length;
  var skipped = orders.filter(function(o) { return o.status === 'SKIPPED'; }).length;
  setText('drStatusPending', pending);
  setText('drStatusGiven',   given);
  setText('drStatusRefuse',  0);  // not tracked yet
  setText('drStatusLate',    skipped);
}

function drSelectRound(round) {
  _DV_ROUND = round;
  _DV_VERIFIED_PATIENT = null;  // reset patient verification
  location.hash = '#pg-dispense-queue';
}

function drSelectStat() {
  // Filter to only HIGH ALERT pending across all rounds
  _DV_ROUND = 'stat';
  _DV_VERIFIED_PATIENT = null;
  location.hash = '#pg-dispense-queue';
}


/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 2: Patient Queue
   ════════════════════════════════════════════════════════ */

var _DQ_FILTER = 'all';

function initDispenseQueue() {
  if (location.hash.replace('#','') !== 'pg-dispense-queue') return;
  seedMcData();
  _DQ_FILTER = 'all';

  // Reset filter UI
  document.querySelectorAll('.dq-filter-chip').forEach(function(b) {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  _renderDqHeader();
  _renderDqList();
}

function _renderDqHeader() {
  var labels = { morning:'รอบเช้า · 08:00', noon:'รอบกลางวัน · 12:00',
                 evening:'รอบเย็น · 16:00', bedtime:'รอบก่อนนอน · 20:00',
                 stat:'STAT / PRN — ยาด่วน' };
  var nameEl = document.getElementById('dqRoundName');
  var tagEl  = document.getElementById('dqRoundTag');
  if (nameEl) nameEl.textContent = labels[_DV_ROUND] || 'รอบเวลา';
  if (tagEl)  tagEl.textContent  = (_DV_ROUND === 'stat') ? 'ประเภทพิเศษ' : 'รอบเวลา';

  // Progress count
  var pts = _dqGetPatients();
  var done = pts.filter(function(p) { return p.allDone; }).length;
  var doneEl  = document.getElementById('dqDone');
  var totalEl = document.getElementById('dqTotal');
  if (doneEl)  doneEl.textContent  = done;
  if (totalEl) totalEl.textContent = pts.length;
}

function _dqGetPatients() {
  var orders;
  if (_DV_ROUND === 'stat') {
    orders = _wardOrders().filter(function(o) {
      return o.status === 'PENDING' && _DA_HIGH_ALERT.indexOf(o.drugId) !== -1;
    });
  } else {
    var th = { morning:'เช้า', noon:'กลางวัน', evening:'เย็น', bedtime:'ก่อนนอน' }[_DV_ROUND];
    orders = _wardOrders().filter(function(o) { return o.rounds && o.rounds.indexOf(th) !== -1; });
  }

  var byPt = {};
  orders.forEach(function(o) {
    if (!byPt[o.patientId]) byPt[o.patientId] = [];
    byPt[o.patientId].push(o);
  });

  var ptMap = {};
  (MC_STATE.patients || []).forEach(function(p) { ptMap[p.id] = p; });
  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  return Object.keys(byPt).map(function(pid) {
    var p     = ptMap[pid] || { id: pid, name: pid, bed: '—', ward: '—', allergies: [] };
    var ords  = byPt[pid];
    var done  = ords.filter(function(o) { return o.status === 'DONE'; }).length;
    var hasHA = ords.some(function(o) { return _DA_HIGH_ALERT.indexOf(o.drugId) !== -1; });
    return {
      patient:  p,
      orders:   ords,
      total:    ords.length,
      done:     done,
      allDone:  done === ords.length,
      partial:  done > 0 && done < ords.length,
      hasHA:    hasHA,
      hasAllergy: p.allergies && p.allergies.length > 0
    };
  }).sort(function(a, b) {
    // Sort by bed
    return (a.patient.bed || '').localeCompare(b.patient.bed || '');
  });
}

function _renderDqList() {
  var listEl = document.getElementById('dqList');
  if (!listEl) return;

  var pts = _dqGetPatients();
  var search = (document.getElementById('dqSearch') || {}).value || '';
  var sLow = search.toLowerCase().trim();

  var filtered = pts.filter(function(item) {
    var p = item.patient;
    // Filter
    if (_DQ_FILTER === 'pending' && item.allDone) return false;
    if (_DQ_FILTER === 'done'    && !item.allDone) return false;
    if (_DQ_FILTER === 'ha'      && !item.hasHA)   return false;
    // Search
    if (sLow) {
      var hay = (p.name + ' ' + p.hn + ' ' + p.bed).toLowerCase();
      if (hay.indexOf(sLow) === -1) return false;
    }
    return true;
  });

  // Out-of-round candidates — patients in current cart without orders for THIS round
  // but with pending orders elsewhere. Only computed when search is active.
  var inRoundIds = pts.map(function(it) { return it.patient.id; });
  var oorMatches = [];
  if (sLow) {
    var pendingLike = function(s) { return s === 'PENDING' || s === 'PAUSED'; };
    var allOrders = MC_STATE.orders || [];
    (MC_STATE.patients || []).forEach(function(p) {
      if (!p) return;
      if (!isPatientInCurrentCart(p.id)) return;
      if (inRoundIds.indexOf(p.id) !== -1) return;  // already shown
      var hay = (p.name + ' ' + (p.hn || '') + ' ' + (p.bed || '')).toLowerCase();
      if (hay.indexOf(sLow) === -1) return;
      var stillPending = allOrders.some(function(o) {
        return o.patientId === p.id && pendingLike(o.status);
      });
      if (!stillPending) return;
      oorMatches.push(p);
    });
  }

  if (!filtered.length && !oorMatches.length) {
    listEl.innerHTML = '<div class="dq-empty">ไม่พบผู้ป่วยที่ตรงเงื่อนไข</div>';
    return;
  }

  var svgAllergy = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var svgArrow   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  var inRoundHtml = filtered.map(function(item) {
    var p = item.patient;
    var initials = p.name ? p.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';
    var rowCls = 'dq-pt-row' + (item.allDone ? ' done' : '') + (item.hasHA ? ' has-ha' : '');
    var statusCls = item.allDone ? 'done' : (item.partial ? 'partial' : 'pending');
    var statusLbl = item.allDone ? 'จ่ายครบ' : (item.partial ? 'จัดบางส่วน' : 'รอจ่าย');

    var tagsHtml = '';
    if (item.hasHA) tagsHtml += '<span class="dq-pt-tag dq-pt-tag-ha">⚠ HIGH ALERT</span>';
    if (item.hasAllergy) tagsHtml += '<span class="dq-pt-tag dq-pt-tag-allergy">แพ้: ' + p.allergies.join(', ') + '</span>';

    return '<button type="button" class="' + rowCls + '" onclick="dqSelectPatient(\'' + p.id + '\')">'
      + '<div class="dq-pt-bed-tag">' + (p.bed || '—') + '</div>'
      + '<div class="dq-pt-avatar">' + initials + '</div>'
      + '<div class="dq-pt-info">'
      +   '<div class="dq-pt-name">' + p.name
      +     (item.hasAllergy ? ' <span class="dq-pt-allergy-icon">' + svgAllergy + '</span>' : '')
      +   '</div>'
      +   '<div class="dq-pt-meta">HN ' + p.hn + ' · ' + p.ward + ' · อายุ ' + (p.age || '—') + ' ปี</div>'
      +   (tagsHtml ? '<div class="dq-pt-tags">' + tagsHtml + '</div>' : '')
      + '</div>'
      + '<div class="dq-pt-status">'
      +   '<span class="dq-pt-status-pill ' + statusCls + '">' + statusLbl + '</span>'
      +   '<span class="dq-pt-count">' + item.done + ' / ' + item.total + ' รายการ</span>'
      + '</div>'
      + '<div class="dq-pt-arrow">' + svgArrow + '</div>'
      + '</button>';
  }).join('');

  var oorHtml = '';
  if (oorMatches.length) {
    oorHtml = '<div class="dq-oor-section">'
      + '<div class="dq-oor-section-title">'
      +   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
      +   ' พบผู้ป่วยที่มียา "เลยรอบกำหนด" ' + oorMatches.length + ' คน · ต้องยืนยันพยาบาล 2 คนก่อนจ่ายล่าช้า'
      + '</div>'
      + oorMatches.map(function(p) {
          var initials = p.name ? p.name.split(' ').slice(0,2).map(function(w) { return w.charAt(0); }).join('') : '?';
          var allergyHtml = (p.allergies && p.allergies.length) ? ' <span class="dq-pt-allergy-icon">' + svgAllergy + '</span>' : '';
          return '<button type="button" class="dq-pt-row dq-pt-row-oor" onclick="dqSelectPatient(\'' + p.id + '\')">'
            + '<div class="dq-pt-bed-tag">' + (p.bed || '—') + '</div>'
            + '<div class="dq-pt-avatar">' + initials + '</div>'
            + '<div class="dq-pt-info">'
            +   '<div class="dq-pt-name">' + p.name + allergyHtml + '</div>'
            +   '<div class="dq-pt-meta">HN ' + p.hn + ' · ' + p.ward + ' · อายุ ' + (p.age || '—') + ' ปี</div>'
            +   '<div class="dq-pt-tags"><span class="dq-pt-tag dq-pt-tag-oor">จ่ายล่าช้า</span></div>'
            + '</div>'
            + '<div class="dq-pt-status">'
            +   '<span class="dq-pt-status-pill pending">เลยรอบ</span>'
            + '</div>'
            + '<div class="dq-pt-arrow">' + svgArrow + '</div>'
            + '</button>';
        }).join('')
      + '</div>';
  }

  listEl.innerHTML = inRoundHtml + oorHtml;
}

function dqSetFilter(f) {
  _DQ_FILTER = f;
  document.querySelectorAll('.dq-filter-chip').forEach(function(b) {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  _renderDqList();
}

function dqApplyFilter() {
  _renderDqList();
}

function dqSelectPatient(pid) {
  // Pre-select expected patient — Page 3 will require wristband scan to verify
  _DV_EXPECTED_PATIENT = pid;
  _DV_VERIFIED_PATIENT = null;
  location.hash = '#pg-dispense-verify';
}


/* ════════════════════════════════════════════════════════
   DISPENSE FLOW — Page 6: MAR Dashboard (Overview)
   ════════════════════════════════════════════════════════ */

function initDispenseDashboard() {
  if (location.hash.replace('#','') !== 'pg-dispense-dashboard') return;
  seedMcData();

  // Date
  var now = new Date();
  var thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  var dateStr = now.getDate() + ' ' + thMonths[now.getMonth()] + ' ' + (now.getFullYear() + 543);
  var dateEl = document.getElementById('dmDate');
  if (dateEl) dateEl.textContent = dateStr;

  _renderDmStats();
  _renderDmRoundTable();
  _renderDmTimeline();
  _renderDmActivity();
  _renderDmIssues();
}

function _renderDmStats() {
  var orders = MC_STATE.orders || [];
  var pending = orders.filter(function(o) { return o.status === 'PENDING'; }).length;
  var done    = orders.filter(function(o) { return o.status === 'DONE';    }).length;
  var skipped = orders.filter(function(o) { return o.status === 'SKIPPED'; }).length;

  // "Currently dispensing" = patients with at least one DONE + at least one PENDING
  var byPt = {};
  orders.forEach(function(o) {
    if (!byPt[o.patientId]) byPt[o.patientId] = { done: 0, pend: 0 };
    if (o.status === 'DONE')    byPt[o.patientId].done++;
    if (o.status === 'PENDING') byPt[o.patientId].pend++;
  });
  var inProgress = Object.values(byPt).filter(function(x) { return x.done > 0 && x.pend > 0; }).length;

  // Issues count from audit log MAR_SAVED entries (mock: count skipped)
  var issues = skipped;

  var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setText('dmStatPending',  pending);
  setText('dmStatProgress', inProgress);
  setText('dmStatDone',     done);
  setText('dmStatIssue',    issues);

  // Hero sub
  var subEl = document.getElementById('dmHeroSub');
  if (subEl) {
    var totalOrd = orders.length;
    var pct = totalOrd > 0 ? Math.round(done / totalOrd * 100) : 0;
    subEl.textContent = 'จ่ายแล้ว ' + done + ' / ' + totalOrd + ' รายการ (' + pct + '%) · ติดตามแบบ realtime';
  }
}

function _renderDmRoundTable() {
  var tableEl = document.getElementById('dmRoundTable');
  if (!tableEl) return;

  var rounds = [
    { key:'morning', th:'เช้า' },
    { key:'noon',    th:'กลางวัน' },
    { key:'evening', th:'เย็น' },
    { key:'bedtime', th:'ก่อนนอน' }
  ];
  var wards = ['Ward A', 'Ward B'];

  // Build patient->ward map
  var patWard = {};
  (MC_STATE.patients || []).forEach(function(p) { patWard[p.id] = p.ward; });

  // Compute per ward × round: { done, total }
  var matrix = {};
  wards.forEach(function(w) { matrix[w] = {}; rounds.forEach(function(r) { matrix[w][r.key] = { done: 0, total: 0 }; }); });

  (MC_STATE.orders || []).forEach(function(o) {
    var w = patWard[o.patientId];
    if (!w) return;
    if (!matrix[w]) return;
    rounds.forEach(function(r) {
      if (o.rounds && o.rounds.indexOf(r.th) !== -1) {
        matrix[w][r.key].total++;
        if (o.status === 'DONE') matrix[w][r.key].done++;
      }
    });
  });

  // Build header
  var headerHtml = '<thead><tr><th>Ward</th>'
    + rounds.map(function(r) { return '<th>รอบ' + r.th + '</th>'; }).join('')
    + '<th>รวม</th></tr></thead>';

  // Build rows
  var grandDone = 0, grandTotal = 0;
  var rowsHtml = wards.map(function(w) {
    var rowDone = 0, rowTotal = 0;
    var cells = rounds.map(function(r) {
      var c = matrix[w][r.key];
      rowDone += c.done; rowTotal += c.total;
      var pct = c.total > 0 ? Math.round(c.done / c.total * 100) : 0;
      var fracCls = c.total === 0 ? 'empty' : (c.done === c.total ? 'full' : (c.done > 0 ? 'partial' : ''));
      return '<td><div class="dm-table-cell">'
        + '<span class="dm-table-frac ' + fracCls + '">' + c.done + ' / ' + c.total + '</span>'
        + (c.total > 0 ? '<div class="dm-table-bar"><div class="dm-table-bar-fill" style="width:' + pct + '%"></div></div>' : '')
        + '</div></td>';
    }).join('');
    grandDone += rowDone; grandTotal += rowTotal;
    var rowPct = rowTotal > 0 ? Math.round(rowDone / rowTotal * 100) : 0;
    var fracCls = rowTotal === 0 ? 'empty' : (rowDone === rowTotal ? 'full' : (rowDone > 0 ? 'partial' : ''));
    return '<tr><td>' + w + '</td>' + cells
      + '<td><div class="dm-table-cell">'
      +   '<span class="dm-table-frac ' + fracCls + '">' + rowDone + ' / ' + rowTotal + '</span>'
      +   '<div class="dm-table-bar"><div class="dm-table-bar-fill" style="width:' + rowPct + '%"></div></div>'
      + '</div></td></tr>';
  }).join('');

  // Grand total row
  var grandCells = rounds.map(function(r) {
    var sum = wards.reduce(function(s, w) { return { done: s.done + matrix[w][r.key].done, total: s.total + matrix[w][r.key].total }; }, { done: 0, total: 0 });
    var pct = sum.total > 0 ? Math.round(sum.done / sum.total * 100) : 0;
    var fracCls = sum.total === 0 ? 'empty' : (sum.done === sum.total ? 'full' : (sum.done > 0 ? 'partial' : ''));
    return '<td><span class="dm-table-frac ' + fracCls + '">' + sum.done + ' / ' + sum.total + '</span></td>';
  }).join('');
  var grandPct = grandTotal > 0 ? Math.round(grandDone / grandTotal * 100) : 0;
  var grandFracCls = grandDone === grandTotal && grandTotal > 0 ? 'full' : (grandDone > 0 ? 'partial' : 'empty');
  rowsHtml += '<tr class="dm-table-total"><td>รวมทั้งหมด</td>' + grandCells
    + '<td><span class="dm-table-frac ' + grandFracCls + '">' + grandDone + ' / ' + grandTotal + ' (' + grandPct + '%)</span></td></tr>';

  tableEl.innerHTML = headerHtml + '<tbody>' + rowsHtml + '</tbody>';

  var meta = document.getElementById('dmRoundCardMeta');
  if (meta) meta.textContent = 'รวม ' + grandTotal + ' รายการ · จ่ายแล้ว ' + grandPct + '%';
}

function _renderDmTimeline() {
  var tlEl = document.getElementById('dmTimeline');
  if (!tlEl) return;

  // Mock hourly counts — peaks at round times
  var hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  var roundHrs = [8, 12, 16, 20];
  var nowHr = new Date().getHours();

  // Build counts: peak at each round, ramp down
  var counts = hours.map(function(h) {
    if (h > nowHr) return 0; // future
    // Distance to nearest past round
    var minDist = Infinity;
    roundHrs.forEach(function(r) { if (r <= nowHr && Math.abs(h - r) < minDist) minDist = Math.abs(h - r); });
    if (minDist === 0) return 12 + (h % 3);  // round hour peak
    if (minDist === 1) return 4  + (h % 3);
    if (minDist === 2) return 1;
    return 0;
  });

  var maxCount = Math.max(1, Math.max.apply(null, counts));
  tlEl.innerHTML = hours.map(function(h, i) {
    var c = counts[i];
    var heightPct = (c / maxCount) * 100;
    var isCurrent = h === nowHr;
    var label = (h < 10 ? '0' : '') + h + ':00';
    return '<div class="dm-tl-bar' + (isCurrent ? ' current' : '') + '">'
      + (c > 0 ? '<span class="dm-tl-bar-num">' + c + '</span>' : '')
      + '<div class="dm-tl-bar-track">'
      +   '<div class="dm-tl-bar-fill" style="height:' + heightPct + '%"></div>'
      + '</div>'
      + '<div class="dm-tl-bar-label">' + label + '</div>'
      + '</div>';
  }).join('');
}

function _renderDmActivity() {
  var listEl = document.getElementById('dmActivityList');
  if (!listEl) return;

  var ptMap = {};
  (MC_STATE.patients || []).forEach(function(p) { ptMap[p.id] = p; });
  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  // Generate mock activity from DONE orders + recent audit
  var activities = [];

  // Real audit log entries (MAR + dispense events)
  (MC_STATE.auditLog || []).slice(-12).reverse().forEach(function(e) {
    if (e.action === 'MAR_SAVED' || e.action === 'PATIENT_PACKED') {
      var d = new Date(e.ts || Date.now());
      activities.push({
        time:  String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'),
        type:  'given',
        text:  '<b>' + (e.user || 'พยาบาล') + '</b> บันทึก MAR ของ <b>' + (e.patient || '—') + '</b>',
        meta:  e.drugLabel || ''
      });
    }
  });

  // Mock activity from DONE orders (simulate timestamps stagger from morning)
  var doneOrders = (MC_STATE.orders || []).filter(function(o) { return o.status === 'DONE'; }).slice(0, 8);
  doneOrders.forEach(function(o, i) {
    var p = ptMap[o.patientId] || { name: o.patientId, bed: '—' };
    var d = drugMap[o.drugId]  || { name: o.drugId, dose: '' };
    var hr = 8 + Math.floor(i / 3);
    var mn = (i * 17) % 60;
    activities.push({
      time:  String(hr).padStart(2,'0') + ':' + String(mn).padStart(2,'0'),
      type:  'given',
      text:  '<b>' + p.name + '</b> รับยา <b>' + d.name + '</b> ' + (d.dose || '') + ' × ' + (o.dispensedQty || o.qty || 1),
      meta:  'เตียง ' + p.bed + ' · ' + p.ward
    });
  });

  // Sort by time desc
  activities.sort(function(a, b) { return b.time.localeCompare(a.time); });
  activities = activities.slice(0, 10);

  if (!activities.length) {
    listEl.innerHTML = '<div class="dm-empty-msg">ยังไม่มีกิจกรรมการจ่ายยาในวันนี้</div>';
    return;
  }

  var icons = {
    given:   '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    refused: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    held:    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    alert:   '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  listEl.innerHTML = activities.map(function(a) {
    return '<div class="dm-activity-row">'
      + '<div class="dm-activity-time">' + a.time + '</div>'
      + '<div class="dm-activity-icon ' + a.type + '">' + (icons[a.type] || icons.given) + '</div>'
      + '<div>'
      +   '<div class="dm-activity-text">' + a.text + '</div>'
      +   (a.meta ? '<div class="dm-activity-meta">' + a.meta + '</div>' : '')
      + '</div>'
      + '</div>';
  }).join('');
}

function _renderDmIssues() {
  var listEl  = document.getElementById('dmIssueList');
  var countEl = document.getElementById('dmIssueCount');
  if (!listEl) return;

  var ptMap = {};
  (MC_STATE.patients || []).forEach(function(p) { ptMap[p.id] = p; });
  var drugMap = {};
  DRUG_LIST.forEach(function(d) { drugMap[d.id] = d; });

  // Mock issues: SKIPPED orders + High Alert pending in late rounds
  var issues = [];

  // Skipped → "Refuse" or "Hold" (alternating for demo)
  (MC_STATE.orders || []).filter(function(o) { return o.status === 'SKIPPED'; }).forEach(function(o, i) {
    var p = ptMap[o.patientId] || { name: o.patientId, bed: '—' };
    var d = drugMap[o.drugId]  || { name: o.drugId };
    var isHold = i % 2 === 0;
    issues.push({
      tag:   isHold ? 'hold' : 'refuse',
      tagLbl: isHold ? 'HOLD' : 'REFUSE',
      line:  d.name + ' — ' + p.name,
      meta:  'เตียง ' + p.bed + ' · ' + (isHold ? 'รอผลตรวจ' : 'ผู้ป่วยปฏิเสธ')
    });
  });

  // High Alert pending in evening/bedtime → flag
  (MC_STATE.orders || []).filter(function(o) {
    return o.status === 'PENDING'
      && _DA_HIGH_ALERT.indexOf(o.drugId) !== -1
      && o.rounds && (o.rounds.indexOf('เย็น') !== -1 || o.rounds.indexOf('ก่อนนอน') !== -1);
  }).forEach(function(o) {
    var p = ptMap[o.patientId] || { name: o.patientId, bed: '—' };
    var d = drugMap[o.drugId]  || { name: o.drugId };
    issues.push({
      tag:   'allergy',
      tagLbl: '⚠ HIGH ALERT',
      line:  d.name + ' — ' + p.name,
      meta:  'เตียง ' + p.bed + ' · รอจ่าย รอบ' + (o.rounds[o.rounds.length - 1])
    });
  });

  if (countEl) countEl.textContent = issues.length;
  if (!issues.length) {
    listEl.innerHTML = '<div class="dm-empty-msg">ไม่มีรายการที่ต้องตามผล ✓</div>';
    return;
  }
  listEl.innerHTML = issues.slice(0, 10).map(function(it) {
    return '<div class="dm-issue-row">'
      + '<span class="dm-issue-tag ' + it.tag + '">' + it.tagLbl + '</span>'
      + '<div class="dm-issue-info">'
      +   '<div class="dm-issue-line">' + it.line + '</div>'
      +   '<div class="dm-issue-meta">' + it.meta + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
}
