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
      `วัน${DAYS[now.getDay()]}ที่ ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
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

  const cart = getCart(MC_STATE.currentCartId);
  const shortId = cart ? cart.name.replace('รถเข็น ', '') : '—';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('cartInfoAvatar',       shortId);
  set('cartInfoName',         cart ? cart.name : '—');
  set('cartInfoHwId',         'รหัส ' + MC_STATE.hardwareId);
  set('cartInfoStatName',     cart ? cart.name : '—');
  set('cartInfoStatHw',       MC_STATE.hardwareId);
  set('cartInfoDrawerCount',  MC_STATE.drawers.length || '—');
  set('cartInfoCassetteCount', MC_STATE.cassettes.length || '—');
  set('cartNavHwId',          MC_STATE.hardwareId || '—');
  set('cartNavName',          cart ? cart.name : '—');

  const tbody = document.getElementById('drawerTable');
  if (tbody) {
    tbody.innerHTML = '';
    DRAWERS.forEach(d => {
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td><div class="drawer-id">${d.id}</div><div class="drawer-sub">${d.dc} Cassette</div></td>
          <td class="temp-val">${d.dt}</td>
          <td class="rh-val">${d.dr}</td>
          <td class="temp-val">${d.ct}</td>
          <td class="rh-val">${d.cr}</td>
          <td><span class="status-pill">ปกติ</span></td>
        </tr>`);
    });
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
  const shortId = cart ? cart.name.replace('รถเข็น ', '') : 'A-1';
  const cartName = cart ? cart.name : 'Med Cart A-1';
  const hwId = MC_STATE.hardwareId;
  document.querySelectorAll('[data-cart-shortid]').forEach(el => el.textContent = shortId);
  document.querySelectorAll('[data-cart-name]').forEach(el => el.textContent = cartName);
  document.querySelectorAll('[data-hw-id]').forEach(el => el.textContent = hwId);
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
    name: 'มาตรฐาน 6 ลิ้นชัก',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'ยาสามัญ',     zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:2, label:'ยาเฉพาะ',     zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:3, label:'ยาฉีด',        zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:4, label:'ยาเด็ก',       zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:5, label:'ยาเฉพาะทาง',  zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:6, label:'จัดยาผู้ป่วย', zone:'ZONE2', patientSlots:9, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
    ],
  },
  {
    id: 'T2',
    name: 'รถเข็น ICU (4 ลิ้นชัก)',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'ยา IV',            zone:'ZONE1', rows:2, cols:3, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:2, label:'ยา IV สำรอง',     zone:'ZONE1', rows:2, cols:3, hasLock:true, allowedRoles:['PHARMACIST'] },
      { drawerNumber:3, label:'ยากิน',            zone:'ZONE1', rows:2, cols:2, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:4, label:'จัดยาผู้ป่วย ICU', zone:'ZONE2', patientSlots:6, hasLock:true, allowedRoles:['PHARMACIST','NURSE'] },
    ],
  },
  {
    id: 'T3',
    name: 'รถเข็นขนาดเล็ก (3 ลิ้นชัก)',
    createdBy: 'u0',
    drawers: [
      { drawerNumber:1, label:'ยาสามัญ',      zone:'ZONE1', rows:1, cols:3, hasLock:true,  allowedRoles:['PHARMACIST','NURSE'] },
      { drawerNumber:2, label:'ยาเฉพาะ',      zone:'ZONE1', rows:1, cols:3, hasLock:true,  allowedRoles:['PHARMACIST'] },
      { drawerNumber:3, label:'จัดยาผู้ป่วย', zone:'ZONE2', patientSlots:4, hasLock:false, allowedRoles:['PHARMACIST','NURSE'] },
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

function seedMcData() {
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

  /* ───── Patients (10 — 5 Ward A + 5 Ward B/ICU) ────────── */
  MC_STATE.patients = [
    // Ward A — general
    { id:'P1',  name:'นภา ใจดี',            ward:'Ward A', bed:'1',  age:65, condition:'เบาหวาน + ความดันสูง',         allergies:[] },
    { id:'P2',  name:'วิชัย มานะ',          ward:'Ward A', bed:'5',  age:54, condition:'ปวดศีรษะเรื้อรัง',             allergies:['Aspirin'] },
    { id:'P3',  name:'สมหญิง รักดี',        ward:'Ward A', bed:'8',  age:72, condition:'GERD + ปวดหลัง',               allergies:[] },
    { id:'P7',  name:'อรุณ พิทักษ์',        ward:'Ward A', bed:'3',  age:48, condition:'ภูมิแพ้ + อักเสบ',             allergies:['Penicillin'] },
    { id:'P8',  name:'ชลธี ศรีวรรณ',        ward:'Ward A', bed:'6',  age:60, condition:'ไขมันในเลือดสูง',              allergies:[] },
    { id:'P11', name:'สุภาพร วงศ์ทอง',      ward:'Ward A', bed:'10', age:55, condition:'ความดันสูง + ไขมันในเลือด',    allergies:[] },
    { id:'P12', name:'ธนวัฒน์ พิมพ์ทอง',   ward:'Ward A', bed:'11', age:42, condition:'ปอดอักเสบ + เจ็บคอ',           allergies:['Sulfa'] },
    { id:'P13', name:'วรรณา สุขสม',          ward:'Ward A', bed:'12', age:68, condition:'เบาหวาน Type 2 + ความดัน',    allergies:[] },
    { id:'P14', name:'ปิยะ ศรีสงคราม',       ward:'Ward A', bed:'15', age:51, condition:'หัวใจวาย + บวมน้ำ',           allergies:['Aspirin','Ibuprofen'] },
    // Ward B — ICU / critical
    { id:'P4',  name:'ประสิทธิ์ เก่งกล้า',  ward:'Ward B', bed:'2',      age:60, condition:'ติดเชื้อรุนแรง',       allergies:[] },
    { id:'P5',  name:'มานี แก้ว',            ward:'Ward B', bed:'4',      age:58, condition:'หัวใจขาดเลือด + DM',  allergies:['Sulfa'] },
    { id:'P6',  name:'สุรชัย ดีงาม',         ward:'Ward B', bed:'7',      age:67, condition:'หลังผ่าตัด',          allergies:[] },
    { id:'P9',  name:'พิมพา ราตรี',           ward:'Ward B', bed:'ICU-1', age:71, condition:'ภาวะช็อก',            allergies:[] },
    { id:'P10', name:'ชาติชาย กล้าหาญ',      ward:'Ward B', bed:'ICU-2', age:53, condition:'หลอดเลือดสมอง',       allergies:[] },
  ];

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
    // P14 ปิยะ (หัวใจวาย + บวมน้ำ) — all pending
    { id:'O38', patientId:'P14', drugId:'OMEP20',  rounds:['เช้า','เย็น'],           qty:1, status:'PENDING' },
    { id:'O39', patientId:'P14', drugId:'ATO20',   rounds:['ก่อนนอน'],              qty:1, status:'PENDING' },
    { id:'O40', patientId:'P14', drugId:'MET500',  rounds:['เช้า'],                  qty:1, status:'PENDING' },
    { id:'O41', patientId:'P14', drugId:'PARA500', rounds:['เช้า','กลางวัน','เย็น'], qty:1, status:'PENDING' },
    { id:'O42', patientId:'P14', drugId:'AMLO5',   rounds:['เช้า'],                  qty:1, status:'PENDING' },
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

  // ─── Order progress: P1+P2+P11 fully done, P3+P8+P12 partial ──
  const _done = (id, qty) => {
    const o = MC_STATE.orders.find(x => x.id === id);
    if (o) { o.status = 'DONE'; o.dispensedQty = qty; }
  };
  const _skip = id => {
    const o = MC_STATE.orders.find(x => x.id === id);
    if (o) { o.status = 'SKIPPED'; }
  };
  _done('O01', 2); _done('O02', 1); _done('O03', 1);           // P1 done
  _done('O04', 3); _done('O05', 1);                            // P2 done
  _done('O07', 1);                                             // P3 partial
  _done('O19', 1);                                             // P8 partial
  _done('O26', 1); _done('O27', 2); _done('O28', 1);          // P11 done
  _skip('O29');                                                // P11 PARA skipped (PRN)
  _done('O30', 3);                                             // P12 partial (amox done)

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
    { ts:_m(28), cassetteId:null,  drugLabel:'',                   drawerId:'D2', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 2 · ยาเฉพาะ',    userRole:'PHARMACIST', reason:'MANUAL' },
    { ts:_m(34), cassetteId:'C19', drugLabel:'Loratadine 10 mg',   drawerId:'D5', action:'RETURNED',          user:'ภก.สมชาย' },
    { ts:_m(35), cassetteId:'C07', drugLabel:'Prednisolone 5 mg',  drawerId:'D2', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(39), cassetteId:'C19', drugLabel:'Loratadine 10 mg',   drawerId:'D5', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(45), cassetteId:null,  drugLabel:'',                   drawerId:'D5', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 5 · ยาเฉพาะทาง', userRole:'PHARMACIST', reason:'MANUAL' },
    { ts:_m(54), cassetteId:null,  drugLabel:'HIS Sync สำเร็จ',   drawerId:'—',  action:'HIS_SYNCED',        user:'ระบบ',      note:'38 orders · ONLINE' },
    { ts:_m(61), cassetteId:'C04', drugLabel:'Loratadine 10 mg',   drawerId:'D1', action:'REFILLED',          user:'ภก.สมชาย', added:15 },
    { ts:_m(68), cassetteId:'C03', drugLabel:'Ibuprofen 400 mg',   drawerId:'D1', action:'REMOVED',           user:'ภก.สมชาย' },
    { ts:_m(76), cassetteId:null,  drugLabel:'',                   drawerId:'D1', action:'DRAWER_UNLOCKED',   user:'ภก.สมชาย', drawerName:'ลิ้นชัก 1 · ยาสามัญ',    userRole:'PHARMACIST', reason:'MANUAL' },
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
      { id:'D1', name:'ลิ้นชัก 1 · ยาสามัญ',     zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D2', name:'ลิ้นชัก 2 · ยาเฉพาะ',    zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D3', name:'ลิ้นชัก 3 · ยาฉีด',       zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D4', name:'ลิ้นชัก 4 · ยาเด็ก',      zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D5', name:'ลิ้นชัก 5 · ยาเฉพาะทาง', zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D6', name:'ลิ้นชัก 6 · จัดยาผู้ป่วย', zone:2, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
    ],
    cassettes: [
      // D1 ยาสามัญ (20 cassettes)
      { id:'C01', drugId:'PARA500', drawerId:'D1', slotNumber:1,  quantity:24, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C02', drugId:'PARA500', drawerId:'D1', slotNumber:2,  quantity:28, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C03', drugId:'IBU400',  drawerId:'D1', slotNumber:3,  quantity:12, maxQty:30, status:'OUT', removedAt: now, removedBy:'ภก.สมชาย', hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C04', drugId:'LOR10',   drawerId:'D1', slotNumber:4,  quantity:20, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C05', drugId:'AMOX250', drawerId:'D1', slotNumber:5,  quantity:15, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C06', drugId:'AMOX250', drawerId:'D1', slotNumber:6,  quantity:10, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C07', drugId:'MET500',  drawerId:'D1', slotNumber:7,  quantity:8,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C08', drugId:'MET500',  drawerId:'D1', slotNumber:8,  quantity:22, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C09', drugId:'AMLO5',   drawerId:'D1', slotNumber:9,  quantity:18, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C10', drugId:'AMLO5',   drawerId:'D1', slotNumber:10, quantity:5,  maxQty:30, status:'OUT_ALERT', removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C11', drugId:'PRED5',   drawerId:'D1', slotNumber:11, quantity:26, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C12', drugId:'PRED5',   drawerId:'D1', slotNumber:12, quantity:14, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C13', drugId:'SIM10',   drawerId:'D1', slotNumber:13, quantity:19, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C14', drugId:'SIM10',   drawerId:'D1', slotNumber:14, quantity:11, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C15', drugId:'ATO20',   drawerId:'D1', slotNumber:15, quantity:7,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C16', drugId:'ATO20',   drawerId:'D1', slotNumber:16, quantity:25, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C17', drugId:'OMEP20',  drawerId:'D1', slotNumber:17, quantity:16, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C18', drugId:'OMEP20',  drawerId:'D1', slotNumber:18, quantity:9,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C19', drugId:'LOR10',   drawerId:'D1', slotNumber:19, quantity:13, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'D1C20', drugId:'IBU400',  drawerId:'D1', slotNumber:20, quantity:3,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D2 ยาเฉพาะ
      { id:'C05', drugId:'AMOX250', drawerId:'D2', slotNumber:1, quantity:20, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C06', drugId:'AMOX250', drawerId:'D2', slotNumber:2, quantity:22, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C07', drugId:'PRED5',   drawerId:'D2', slotNumber:3, quantity:8,  maxQty:30, status:'OUT', removedAt: now - 35 * 60 * 1000, removedBy:'ภก.สมชาย', hasElectricLock:true, cassetteLockStatus:'LOCKED' },
      { id:'C08', drugId:'PRED5',   drawerId:'D2', slotNumber:4, quantity:26, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D3 ยาฉีด (mix oral + few IV)
      { id:'C09', drugId:'MET500',  drawerId:'D3', slotNumber:1, quantity:4,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C10', drugId:'MET500',  drawerId:'D3', slotNumber:2, quantity:3,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C11', drugId:'AMLO5',   drawerId:'D3', slotNumber:3, quantity:24, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C12', drugId:'AMLO5',   drawerId:'D3', slotNumber:4, quantity:20, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D4 ยาเด็ก
      { id:'C13', drugId:'ATO20',   drawerId:'D4', slotNumber:1, quantity:16, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C14', drugId:'ATO20',   drawerId:'D4', slotNumber:2, quantity:14, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C15', drugId:'SIM10',   drawerId:'D4', slotNumber:3, quantity:18, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C16', drugId:'SIM10',   drawerId:'D4', slotNumber:4, quantity:22, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D5 ยาเฉพาะทาง
      { id:'C17', drugId:'OMEP20',  drawerId:'D5', slotNumber:1, quantity:5,  maxQty:30, status:'IN',  removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C18', drugId:'OMEP20',  drawerId:'D5', slotNumber:2, quantity:20, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C19', drugId:'LOR10',   drawerId:'D5', slotNumber:3, quantity:18, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C20', drugId:'IBU400',  drawerId:'D5', slotNumber:4, quantity:15, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
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
    initialOutCassettes: ['C03', 'C07'],
  };
}

function buildCartB01Data(now) {
  // Template 2 ICU: 3 Zone 1 drawers + 1 Zone 2 (D1 6 cass, D2 6 cass, D3 4 cass, D4 6 slots)
  return {
    drawers: [
      { id:'D1', name:'ลิ้นชัก 1 · ยา IV',           zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D2', name:'ลิ้นชัก 2 · ยา IV สำรอง',     zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D3', name:'ลิ้นชัก 3 · ยากิน',           zone:1, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
      { id:'D4', name:'ลิ้นชัก 4 · จัดยาผู้ป่วย ICU',zone:2, lockStatus:'LOCKED', unlockedBy:null, unlockedAt:null, autoLockAfter:30 },
    ],
    cassettes: [
      // D1 ยา IV
      { id:'C01', drugId:'NSS1000', drawerId:'D1', slotNumber:1, quantity:8,  maxQty:12, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C02', drugId:'NSS1000', drawerId:'D1', slotNumber:2, quantity:10, maxQty:12, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C03', drugId:'D5W1000', drawerId:'D1', slotNumber:3, quantity:6,  maxQty:12, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C04', drugId:'D5W1000', drawerId:'D1', slotNumber:4, quantity:9,  maxQty:12, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C05', drugId:'RL500',   drawerId:'D1', slotNumber:5, quantity:5,  maxQty:12, status:'OUT', removedAt: now, removedBy:'ภก.สมชาย', hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C06', drugId:'RL500',   drawerId:'D1', slotNumber:6, quantity:11, maxQty:12, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D2 ยา IV สำรอง
      { id:'C07', drugId:'KCL10',   drawerId:'D2', slotNumber:1, quantity:14, maxQty:20, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C08', drugId:'NAHCO3',  drawerId:'D2', slotNumber:2, quantity:9,  maxQty:15, status:'IN',  removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C09', drugId:'HEP5K',   drawerId:'D2', slotNumber:3, quantity:8,  maxQty:20, status:'OUT', removedAt: now - 35 * 60 * 1000, removedBy:'ภก.สมชาย', hasElectricLock:true, cassetteLockStatus:'LOCKED' },
      { id:'C10', drugId:'HEP5K',   drawerId:'D2', slotNumber:4, quantity:15, maxQty:20, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C11', drugId:'INSREG',  drawerId:'D2', slotNumber:5, quantity:6,  maxQty:10, status:'IN',  removedAt:null, hasElectricLock:true,  cassetteLockStatus:'LOCKED' },
      { id:'C12', drugId:'CEF1G',   drawerId:'D2', slotNumber:6, quantity:10, maxQty:15, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      // D3 ยากิน
      { id:'C13', drugId:'PARA500', drawerId:'D3', slotNumber:1, quantity:18, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C14', drugId:'OMEP20',  drawerId:'D3', slotNumber:2, quantity:14, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C15', drugId:'AMLO5',   drawerId:'D3', slotNumber:3, quantity:20, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
      { id:'C16', drugId:'MET500',  drawerId:'D3', slotNumber:4, quantity:16, maxQty:30, status:'IN',  removedAt:null, hasElectricLock:false, cassetteLockStatus:'UNLOCKED' },
    ],
    patientSlots: [
      { id:'S-01', slotNumber:1, patientId:'P4',  status:'ASSIGNED', packedItems:null },
      { id:'S-02', slotNumber:2, patientId:'P5',  status:'ASSIGNED', packedItems:null },
      { id:'S-03', slotNumber:3, patientId:'P6',  status:'ASSIGNED', packedItems:null },
      { id:'S-04', slotNumber:4, patientId:'P9',  status:'ASSIGNED', packedItems:null },
      { id:'S-05', slotNumber:5, patientId:'P10', status:'ASSIGNED', packedItems:null },
      { id:'S-06', slotNumber:6, patientId:null,  status:'EMPTY',    packedItems:null },
    ],
    initialOutCassettes: ['C05', 'C09'],
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
  location.hash = '#pg-login';
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
  if (MC_STATE.session.user) {
    // already authenticated this session
    location.hash = '#pg-load-mode';
    return;
  }
  openSessionAuthModal(() => {
    location.hash = '#pg-load-mode';
  });
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
}

function renderTmplList() {
  const list = document.getElementById('tmplList');
  if (!list) return;
  list.innerHTML = CART_TEMPLATES.map(t => {
    const z1 = t.drawers.filter(d => d.zone === 'ZONE1').length;
    const z2 = t.drawers.filter(d => d.zone === 'ZONE2').length;
    const used = CARTS.filter(c => c.templateId === t.id).length;
    const drawerChips = t.drawers.map(d =>
      `<span class="tmpl-drawer-chip ${d.zone === 'ZONE1' ? 'chip-z1' : 'chip-z2'}">${d.label}</span>`
    ).join('');
    return `
      <div class="tmpl-card">
        <div class="tmpl-card-top">
          <div>
            <div class="tmpl-card-name">${t.name}</div>
            <div class="tmpl-card-meta">${t.drawers.length} ลิ้นชัก · ลิ้นชักยา ${z1} · ช่องผู้ป่วย ${z2} · ใช้กับรถ <b>${used}</b> คัน</div>
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
    const tmpl = getCartTemplate(c.templateId);
    const z1 = tmpl ? tmpl.drawers.filter(d => d.zone === 'ZONE1').length : 0;
    const z2 = tmpl ? tmpl.drawers.filter(d => d.zone === 'ZONE2').length : 0;
    const isCurrent   = c.id === MC_STATE.currentCartId;
    const pairedOther = c.pairedHwId && c.pairedHwId !== hwId;
    const stateClass  = !c.isActive ? 'cart-card-off' : pairedOther ? 'cart-card-paired' : isCurrent ? 'cart-current' : '';
    return `
      <div class="cart-card ${stateClass}" id="cc-${c.id}">
        <div class="cart-card-header">
          <div>
            <div class="cart-card-name">${c.name}</div>
            <div class="cart-card-ward">
              <span class="cart-card-id">${c.id}</span>
            </div>
          </div>
          ${isCurrent   ? '<span class="cart-badge cart-badge-current">ใช้อยู่</span>' : ''}
          ${pairedOther ? `<span class="cart-badge cart-badge-paired">จับคู่กับ ${c.pairedHwId}</span>` : ''}
        </div>

        <div class="cart-field-row">
          <label class="cart-field-label">Template</label>
          <select class="cart-tmpl-select" onchange="setCartTemplate('${c.id}', this.value)">
            ${CART_TEMPLATES.map(t => `<option value="${t.id}" ${c.templateId===t.id?'selected':''}>${t.name}</option>`).join('')}
          </select>
        </div>

        <div class="cart-tmpl-info">
          <span class="cart-tmpl-chip chip-z1">ลิ้นชักยา ${z1}</span>
          <span class="cart-tmpl-chip chip-z2">ช่องผู้ป่วย ${z2}</span>
        </div>

        <div class="cart-card-footer">
          <label class="cart-toggle-wrap" title="${c.isActive?'คลิกเพื่อปิดใช้งาน':'คลิกเพื่อเปิดใช้งาน'}">
            <input type="checkbox" class="cart-toggle-input" ${c.isActive?'checked':''}
              onchange="toggleCartActive('${c.id}')">
            <span class="cart-toggle-track">
              <span class="cart-toggle-thumb"></span>
            </span>
            <span class="cart-toggle-label">${c.isActive?'เปิดใช้งาน':'ปิดใช้งาน'}</span>
          </label>
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

function newCart() {
  const newId = 'CART-' + (CARTS.length + 1).toString().padStart(3, '0');
  const c = { id:newId, name:`รถเข็นใหม่ ${newId}`, templateId:CART_TEMPLATES[0].id, isActive:true };
  CARTS.push(c);
  editCart(newId);
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
          ${CART_TEMPLATES.map(t => `<option value="${t.id}" ${c.templateId===t.id?'selected':''}>${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="cfg-field">
        <button type="button" class="mc-btn mc-btn-outline" onclick="editTemplate('${c.templateId}')">แก้ไข Template นี้</button>
      </div>
    </div>
    ${renderTemplatePreview(getCartTemplate(c.templateId))}
  `;
}

function updateCartField(field, val) {
  const c = getCart(MC_STATE.editingCartId);
  if (c) c[field] = val;
}

/* ─── CFG-3 Template Editor ────────────────────────────────── */
function editTemplate(id) {
  MC_STATE.editingTemplateId = id;
  location.hash = '#pg-admin-template';
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
  root.innerHTML = `
    <div class="tmpl-edit-grid">
      <div class="tmpl-edit-form">
        <div class="form-card">
          <div class="form-card-title">ข้อมูล Template</div>
          <div class="cfg-field">
            <label>ชื่อ Template</label>
            <input type="text" value="${t.name}" oninput="updateTemplateName(this.value)" />
          </div>
        </div>
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
          <button type="button" class="mc-btn mc-btn-outline" onclick="location.hash='#pg-admin-carts'">ยกเลิก</button>
          <button type="button" class="mc-btn mc-btn-primary" onclick="saveTemplate()">บันทึก Template</button>
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
  return `
    <div class="tmpl-preview">
      <div class="tmpl-preview-name">${t.name}</div>
      <div class="tmpl-preview-stack">
        ${t.drawers.map(d => {
          const rows = d.rows || 1;
          const cols = d.cols || d.cassetteSlots || 4;
          const total = rows * cols;
          const chips = Array.from({length: total}, (_, i) =>
            `<span class="tmpl-prev-chip">C${i + 1}</span>`
          ).join('');
          const lockIcon = d.hasLock
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`
            : '';
          return `
          <div class="tmpl-prev-drawer tmpl-prev-zone1">
            <div class="tmpl-prev-head">
              <span class="tmpl-prev-num">D${d.drawerNumber}</span>
              <span class="tmpl-prev-label">${d.label}</span>
              <span class="tmpl-prev-slots">${rows}×${cols} = ${total} ช่อง</span>
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
  // Validation
  if (t.drawers.length === 0) { alert('Template ต้องมีลิ้นชักอย่างน้อย 1 อัน'); return; }
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
      cells.push(`
        <div class="cass-cell cass-cell-empty">
          <span class="cass-cell-num">${i}</span>
          <span class="cass-cell-drug">ว่าง</span>
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

/* ─── Reset demo ────────────────────────────────────────────── */
function resetDemo() {
  localStorage.removeItem('mc_ward_id');
  localStorage.removeItem('mc_user');
  _selectedWard = null;
  // Clear session for next demo run
  if (MC_STATE.session) MC_STATE.session.user = null;
  if (location.hash === '#pg-cart' || location.hash === '') {
    location.reload();
  } else {
    location.hash = '#pg-cart';
  }
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
  const cart = getCart(MC_STATE.currentCartId);
  const total = (MC_STATE.orders || []).filter(o => isPatientInCurrentCart(o.patientId)).length;
  const done = (MC_STATE.orders || []).filter(o => isPatientInCurrentCart(o.patientId) && (o.status === 'DONE' || o.status === 'SKIPPED')).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const statAlerts = (MC_STATE.cassettes||[]).filter(c=>c.status==='OUT_ALERT').length;
  el.innerHTML = `
    <div class="hero-left">
      <div class="hero-tag-row">
        <div class="hero-tag">
          <span class="hero-tag-dot"></span>
          Ward 3A · หอผู้ป่วยอายุรกรรม
        </div>
        <div class="hero-tag hero-tag-role">${roleLabel(user.role)}</div>
      </div>
      <div class="hero-greet">สวัสดี, ${user.name}</div>
      <div class="hero-sub">ยา ${total} รายการ · จ่ายแล้ว ${pct}%${statAlerts > 0 ? ` · <span style="color:#dc2626;font-weight:700;background:#fde8e8;padding:2px 8px;border-radius:6px;font-size:12px;">⚠ HA ${statAlerts}</span>` : ''}</div>
    </div>
    <div class="hero-right">
      <div class="hero-cart-block">
        <div class="hero-cart-block-name">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="2"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="13" x2="19" y2="13"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/></svg>
          ${cart ? cart.name : 'Med Cart'}
        </div>
        <div class="hero-cart-block-divider"></div>
        <div class="hero-cart-block-badges">
          <span class="hero-cart-badge"><span class="hero-badge-dot"></span> Online</span>
          <span class="hero-cart-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>
            85%
          </span>
          <span class="hero-cart-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
            Wi-Fi
          </span>
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
    <span class="dash-chip dash-chip-red">
      <span class="chip-icon">⏱</span> STAT ยาด่วน <b>${stat}</b>
    </span>
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

  if (statAlerts > 0) {
    variant   = 'focus-urgent';
    eyebrow   = 'ต้องดำเนินการทันที';
    title     = `มียาด่วน (STAT) ${statAlerts} รายการ`;
    sub       = 'ยาด่วนต้องจัดการก่อนทุกอย่าง';
    btnLabel  = 'จัดการยาด่วน';
    btnAction = 'startNormalFlow()';
  } else if (pending > 0) {
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
  el.innerHTML = `
    <button type="button" class="action-card action-card-orange" onclick="startNormalFlow()">
      ${refillCount > 0 ? `<span class="action-badge">${refillCount} รอจัด</span>` : ''}
      <div class="action-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </div>
      <div class="action-text">
        <div class="action-name">จัดยาเข้ารถเข็น</div>
        <div class="action-eng">Medication Preparation</div>
        <div class="action-cta">เริ่มจัดยา <span>›</span></div>
      </div>
    </button>

    <button type="button" class="action-card action-card-red" onclick="alert('Dispense — ดู flow ที่ Mode A/B')">
      ${dispCount > 0 ? `<span class="action-badge action-badge-red">${dispCount} รอจ่าย</span>` : ''}
      <div class="action-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </div>
      <div class="action-text">
        <div class="action-name">จ่ายยาให้ผู้ป่วย</div>
        <div class="action-eng">Medication Administration</div>
        <div class="action-cta">เริ่มจ่ายยา <span>›</span></div>
      </div>
    </button>

    <button type="button" class="action-card action-card-pink" onclick="alert('PRN — coming soon')">
      <div class="action-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </div>
      <div class="action-text">
        <div class="action-name">เติมยาสำรอง (PRN)</div>
        <div class="action-eng">PRN Stock Preparation</div>
        <div class="action-cta">เริ่มเติมยา <span>›</span></div>
      </div>
    </button>

    `;
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
      return `<div class="inv-cell inv-cell-empty" title="ช่อง ${slotNum} · ว่าง">
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
    <div class="dash-stat dash-stat-indigo">
      <div class="dash-stat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">ผู้ป่วย</div>
        <div class="dash-stat-sub">Ward 3A ทั้งหมด</div>
      </div>
      <div class="dash-stat-val">${patients}</div>
    </div>
    <div class="dash-stat dash-stat-teal">
      <div class="dash-stat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">รายการยา</div>
        <div class="dash-stat-sub">HIS + Manual</div>
      </div>
      <div class="dash-stat-val">${total}</div>
    </div>
    <div class="dash-stat dash-stat-blue">
      <div class="dash-stat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">จ่ายแล้ว</div>
        <div class="dash-stat-sub">${donePct}% ของทั้งหมด</div>
      </div>
      <div class="dash-stat-val">${done}</div>
    </div>
    <div class="dash-stat dash-stat-orange">
      <div class="dash-stat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">รอจ่าย</div>
        <div class="dash-stat-sub">${pendingPct}% ของทั้งหมด</div>
      </div>
      <div class="dash-stat-val">${pending}</div>
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
                     'editingCartId','editingTemplateId','session','currentDrawerId'];

function saveNavState() {
  const snap = {};
  _STATE_KEYS.forEach(k => { if (MC_STATE[k] !== undefined) snap[k] = MC_STATE[k]; });
  try { sessionStorage.setItem('mc_nav', JSON.stringify(snap)); } catch {}
}

function restoreNavState() {
  try {
    const snap = JSON.parse(sessionStorage.getItem('mc_nav') || '{}');
    _STATE_KEYS.forEach(k => { if (snap[k] !== undefined) MC_STATE[k] = snap[k]; });
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
}
