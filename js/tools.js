/* tools.js - v5.0 Advanced Client-Side Utilities */

// -- Modals UX --
function openToolModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        const content = modal.querySelector('.tool-modal-content');
        if(content) {
            content.style.transform = 'scale(0.9)';
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }, 10);
        }
    }
}
function closeToolModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        const content = modal.querySelector('.tool-modal-content');
        if(content) {
            content.style.transform = 'scale(0.9)';
            content.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        } else {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}
window.addEventListener('click', (e) => {
    if(e.target.classList.contains('tool-modal')) closeToolModal(e.target.id);
});

// -- 1. World Clock (With Time Scrub) --
let trackedZones = [];
let isScrubbing = false;
let scrubMinutes = 0; // 0 to 1439
let clockPulse;

function initClock() {
    const dl = document.getElementById('tz-cities');
    if(dl && typeof Intl !== 'undefined') {
        const timezones = Intl.supportedValuesOf('timeZone');
        timezones.forEach(tz => {
            let offset = '';
            try {
                const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date());
                const tzPart = parts.find(p => p.type === 'timeZoneName');
                if(tzPart) offset = tzPart.value;
            } catch(e) {}
            const opt = document.createElement('option');
            opt.value = tz;
            opt.innerText = `(${offset}) ${tz}`;
            dl.appendChild(opt);
        });
    }
    clockPulse = setInterval(runClockTick, 1000);
}

function runClockTick() {
    if(isScrubbing) return;
    const now = new Date();
    updateAllClocks(now);
}

function updateScrubTime() {
    const scrubVal = parseInt(document.getElementById('time-scrub').value);
    isScrubbing = true;
    scrubMinutes = scrubVal;
    
    // Create a mock date representing today but with scrubbed hours/mins
    const mock = new Date();
    mock.setHours(Math.floor(scrubMinutes / 60), scrubMinutes % 60, 0, 0);
    
    document.getElementById('time-scrub-val').innerText = `${Math.floor(scrubMinutes / 60).toString().padStart(2,'0')}:${(scrubMinutes % 60).toString().padStart(2,'0')} System Time`;
    updateAllClocks(mock);
}

function resetScrubTime() {
    isScrubbing = false;
    document.getElementById('time-scrub').value = (new Date().getHours() * 60) + new Date().getMinutes();
    document.getElementById('time-scrub-val').innerText = 'Live';
    runClockTick();
}

function updateAllClocks(dateObj) {
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: true });
    
    // Grid Main
    const elGrid = document.getElementById('digital-time-preview');
    if(elGrid && !isScrubbing) elGrid.innerText = timeStr; // Keep grid live always
    
    // Modal Main
    const elModal = document.getElementById('digital-time');
    if(elModal) elModal.innerText = isScrubbing ? dateObj.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute:'2-digit' }) : timeStr;
    
    // Tracked list
    const list = document.getElementById('timezone-list');
    if(!list) return;
    if(trackedZones.length === 0) {
        list.innerHTML = '<span style="color:var(--text-muted)">No zones added yet!</span>';
        return;
    }
    
    let html = '';
    trackedZones.forEach(z => {
        const time = dateObj.toLocaleTimeString('en-US', { timeZone: z, hour12: true, hour: '2-digit', minute:'2-digit' });
        const nameParts = z.split('/');
        const niceName = nameParts[nameParts.length-1].replace('_',' ');
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>${niceName}</span>
                    <strong style="color:var(--accent); font-family:monospace; letter-spacing:1px;">${time}</strong>
                 </div>`;
    });
    list.innerHTML = html;
}

function addTimezone() {
    const tzStr = document.getElementById('tz-city-select').value;
    if(!tzStr) return;
    try {
        new Date().toLocaleTimeString('en-US', { timeZone: tzStr });
        if(!trackedZones.includes(tzStr)) trackedZones.push(tzStr);
        document.getElementById('tz-city-select').value = '';
        runClockTick(); // instant update
    } catch(e) {
        alert("Invalid Timezone Selection.");
    }
}

// -- 2. Prayer Times (Aladhan REST API) --
let prayLat = 23.8103, prayLng = 90.4125, locName = "Dhaka";
let nextPrayerInterval;

function fetchPrayerTimes() {
    const url = `https://api.aladhan.com/v1/timings?latitude=${prayLat}&longitude=${prayLng}&method=1&school=1`;
    fetch(url).then(res => res.json()).then(data => {
        const t = data.data.timings;
        const f12 = (str) => {
            const parts = str.split(':');
            let h = parseInt(parts[0]);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return `${String(h).padStart(2,'0')}:${parts[1]} ${ampm}`;
        };
        document.getElementById('pr-fajr').innerText = f12(t.Fajr);
        document.getElementById('pr-sunrise').innerText = f12(t.Sunrise);
        document.getElementById('pr-dhuhr').innerText = f12(t.Dhuhr);
        document.getElementById('pr-asr').innerText = f12(t.Asr);
        document.getElementById('pr-maghrib').innerText = f12(t.Maghrib);
        document.getElementById('pr-isha').innerText = f12(t.Isha);
        
        const d = data.data.date.hijri;
        document.getElementById('hijri-date').innerText = `${d.day} ${d.month.en} ${d.year} AH`;

        if(nextPrayerInterval) clearInterval(nextPrayerInterval);
        nextPrayerInterval = setInterval(() => calculateNextPrayer(t), 1000);
        calculateNextPrayer(t);
    }).catch(e => {
        document.getElementById('next-prayer-time-preview').innerText = 'API Error';
    });
}

function calculateNextPrayer(timings) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const getTime = (str) => parseInt(str.split(':')[0])*60 + parseInt(str.split(':')[1]);

    const schedule = [
        {name: 'Fajr', time: getTime(timings.Fajr)},
        {name: 'Sunrise', time: getTime(timings.Sunrise)},
        {name: 'Dhuhr', time: getTime(timings.Dhuhr)},
        {name: 'Asr', time: getTime(timings.Asr)},
        {name: 'Maghrib', time: getTime(timings.Maghrib)},
        {name: 'Isha', time: getTime(timings.Isha)}
    ];

    let next = schedule.find(p => p.time > currentMins);
    let diffMins = next ? next.time - currentMins : (24*60 - currentMins) + schedule[0].time;
    next = next || schedule[0];
    
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const s = `Starts in ${h}h ${String(m).padStart(2,'0')}m`;
    const finalName = next.name === 'Sunrise' ? 'Sunrise' : next.name; 
    
    document.getElementById('next-prayer-name').innerText = finalName;
    document.getElementById('next-prayer-time').innerText = s;
    document.getElementById('next-prayer-name-preview').innerText = finalName;
    document.getElementById('next-prayer-time-preview').innerText = s;
}

function geolocatePrayer() {
    if(navigator.geolocation) {
        document.getElementById('pr-location').innerText = "Locating...";
        navigator.geolocation.getCurrentPosition((position) => {
            prayLat = position.coords.latitude;
            prayLng = position.coords.longitude;
            locName = "Local GPS";
            document.getElementById('pr-location').innerText = locName;
            document.getElementById('pr-location-preview').innerText = locName;
            fetchPrayerTimes();
        });
    }
}

// -- 3. Scientific Calculator --
let calcMemory = 0;

// Safe expression evaluator to replace vulnerable eval()
function safeEval(expr) {
    if (typeof expr !== 'string') return Number(expr);
    expr = String(expr).replace(/\s+/g, '');
    if (expr === '') return 0;
    // Strictly allow only numbers and basic math operators
    if (/^[-+*/.%()0-9]+$/.test(expr)) {
        return Function(`'use strict'; return (${expr})`)();
    }
    throw new Error('Syntax Error');
}

function calcAction(op) {
    let display = document.getElementById('calc-display');
    if (["Syntax Error", "undefined", "NaN"].includes(display.value)) display.value = "";
    op = op.toLowerCase();
    
    if (['0','1','2','3','4','5','6','7','8','9','.'].includes(op)) {
        display.value = display.value === '0' ? op : display.value + op;
    } 
    else if (op === 'clear') display.value = '0';
    else if (op === 'backspace') { display.value = display.value.slice(0, -1) || '0'; }
    else if (['*','/','+','-'].includes(op)) display.value += op;
    else if (op === 'plusminus') display.value = display.value.startsWith('-') ? display.value.slice(1) : '-' + display.value;
    else if (op === 'mc') calcMemory = 0;
    else if (op === 'mr') display.value = calcMemory.toString();
    else if (op === 'm+') { try { calcMemory += safeEval(display.value || '0'); } catch(e){} }
    else if (op === 'm-') { try { calcMemory -= safeEval(display.value || '0'); } catch(e){} }
    else if (op === '%') { try { display.value = (safeEval(display.value) / 100).toString(); } catch(e){} }
    else if (op === 'pi') { try { display.value = (safeEval(display.value || '0') || 1) * Math.PI; } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'e') { try { display.value = Math.exp(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'sqrt') { try { display.value = Math.sqrt(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'sin') { try { display.value = Math.sin(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'cos') { try { display.value = Math.cos(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'tan') { try { display.value = Math.tan(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'log') { try { display.value = Math.log10(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'ln') { try { display.value = Math.log(safeEval(display.value)); } catch(e) { display.value = "Syntax Error"; } }
    else if (op === 'pow') display.value += "^";
    else if (op === 'factorial') {
        try {
            let val = safeEval(display.value);
            if(val === 0) display.value = "1";
            else if(val < 0) display.value = "undefined";
            else { let num = 1; for(let i=val; i>0; i--) num*=i; display.value = num.toString(); }
        } catch(e) { display.value = "Syntax Error"; }
    }
}
function calcEvaluate() {
    let d = document.getElementById('calc-display');
    try {
        if (String(d.value).includes("^")) {
            const [base, exp] = String(d.value).split("^");
            d.value = Math.pow(safeEval(base), safeEval(exp));
        } else {
            d.value = safeEval(d.value);
            if (isNaN(d.value)) throw new Error();
        }
    } catch(e) { d.value = "Syntax Error"; }
}
document.addEventListener('keydown', (e) => {
    const m = document.getElementById('calc-modal');
    if(!m || m.style.display !== 'flex') return;
    if(e.target.tagName === 'INPUT' && e.target.id !== 'calc-display') return;
    const key = e.key;
    if(/[0-9.]/.test(key)) calcAction(key);
    else if(key === 'Enter' || key === '=') { e.preventDefault(); calcEvaluate(); }
    else if(key === 'Backspace') calcAction('backspace');
    else if(key === 'Escape') calcAction('clear');
    else if(['+','-','*','/','%'].includes(key)) calcAction(key);
});


// -- 4. Password Gen with Entropy --
function generatePassword() {
    const len = parseInt(document.getElementById('pass-length').value);
    const u = document.getElementById('pass-upper').checked;
    const l = document.getElementById('pass-lower').checked;
    const n = document.getElementById('pass-num').checked;
    const s = document.getElementById('pass-sym').checked;
    const strict = document.getElementById('pass-strict').checked;
    
    let chars = "";
    if(u) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(l) chars += "abcdefghijklmnopqrstuvwxyz";
    if(n) chars += "0123456789";
    if(s) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    if(chars === "") { document.getElementById('pass-lower').checked = true; chars = "abcdefghijklmnopqrstuvwxyz"; }
    
    let pass = "";
    const arr = new Uint32Array(len);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) pass += chars[arr[i] % chars.length];
    
    if(strict && s) {
        // Ensure no symbol at start/end
        const noSym = chars.replace(/[!@#$%^&*()_+~`|}{\[\]:;?><,.\/-=]/g, '');
        if(noSym.length > 0) {
            if(/[!@#$%^&*()_+~`|}{\[\]:;?><,.\/-=]/.test(pass[0])) pass = noSym[new Uint32Array(1)[0] % noSym.length] + pass.slice(1);
            if(/[!@#$%^&*()_+~`|}{\[\]:;?><,.\/-=]/.test(pass[len-1])) pass = pass.slice(0,-1) + noSym[new Uint32Array(1)[0] % noSym.length];
        }
    }
    
    document.getElementById('gen-password-display').value = pass;
    updateEntropyMeter();
}

function updateEntropyMeter() {
    const pass = document.getElementById('gen-password-display').value;
    if(pass === "Click Generate" || !pass) return;
    
    // Calculate pool size based on chars present
    let pool = 0;
    if(/[a-z]/.test(pass)) pool += 26;
    if(/[A-Z]/.test(pass)) pool += 26;
    if(/[0-9]/.test(pass)) pool += 10;
    if(/[^a-zA-Z0-9]/.test(pass)) pool += 30; // approx symbols
    
    const entropy = pass.length * Math.log2(pool || 1);
    
    const bar = document.getElementById('entropy-bar');
    const lbl = document.getElementById('entropy-label');
    let percent = Math.min((entropy / 120) * 100, 100);
    
    bar.style.width = percent + '%';
    if(entropy < 40) { bar.style.background = '#ef4444'; lbl.innerText = 'Weak'; lbl.style.color = '#ef4444'; }
    else if(entropy < 60) { bar.style.background = '#f59e0b'; lbl.innerText = 'Fair'; lbl.style.color = '#f59e0b'; }
    else if(entropy < 80) { bar.style.background = '#10b981'; lbl.innerText = 'Good'; lbl.style.color = '#10b981'; }
    else { bar.style.background = '#8b5cf6'; lbl.innerText = 'Strong'; lbl.style.color = '#8b5cf6'; }
}

function copyPassword() {
    const el = document.getElementById('gen-password-display');
    if(el.value === "Click Generate" || el.value === "") return;
    el.select(); document.execCommand('copy');
    const orig = el.value;
    el.value = "Copied!";
    setTimeout(() => { if(el.value === "Copied!") el.value = orig; }, 1000);
}


// -- 5. Pomodoro Tracker --
let pomoInterval, pomoSeconds = 25 * 60, pomoActive = false, currentPomoMode = 25;
const POMO_CIRCUMFERENCE = 628; // 2 * pi * 100

function setPomodoro(mins) {
    clearInterval(pomoInterval);
    pomoActive = false;
    currentPomoMode = mins;
    pomoSeconds = mins * 60;
    updatePomoUI();
    document.getElementById('pomo-btn').innerText = "Start";
}
function updatePomoUI() {
    const m = Math.floor(pomoSeconds/60).toString().padStart(2, '0');
    const s = (pomoSeconds%60).toString().padStart(2, '0');
    document.getElementById('pomo-main-display').innerText = `${m}:${s}`;
    document.getElementById('pomo-preview').innerText = `${m}:${s}`;
    
    const total = currentPomoMode * 60;
    const offset = POMO_CIRCUMFERENCE - (pomoSeconds / total) * POMO_CIRCUMFERENCE;
    document.getElementById('pomo-ring').style.strokeDashoffset = offset;
}
function startPomodoro() {
    const btn = document.getElementById('pomo-btn');
    if(pomoActive) {
        clearInterval(pomoInterval); pomoActive = false;
        btn.innerText = "Resume";
    } else {
        pomoActive = true; btn.innerText = "Pause";
        pomoInterval = setInterval(() => {
            if(pomoSeconds > 0) { pomoSeconds--; updatePomoUI(); }
            else { clearInterval(pomoInterval); pomoActive = false; btn.innerText = "Done!"; }
        }, 1000);
    }
}
function resetPomodoro() { setPomodoro(currentPomoMode); }


// -- 6. Subnet Calculator --
function initSubnet() {
    const s = document.getElementById('subnet-cidr');
    if(!s) return;
    for(let i=1; i<=32; i++) {
        let opt = document.createElement('option');
        opt.value = i; opt.innerText = `/${i}`;
        if(i===24) opt.selected = true;
        s.appendChild(opt);
    }
}
function calculateSubnet() {
    const ipStr = document.getElementById('subnet-ip').value;
    const cidr = parseInt(document.getElementById('subnet-cidr').value);
    const errBox = document.getElementById('subnet-error');
    errBox.style.display = 'none';
    
    // reset UI
    ['network','mask','first','gateway','last','broadcast','hosts'].forEach(id => {
        document.getElementById(`sub-${id}`).innerText = '--';
    });

    if(!ipStr.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        if(ipStr !== "") { errBox.innerText = 'Invalid IP Address format.'; errBox.style.display = 'block'; }
        return;
    }
    const parts = ipStr.split('.').map(Number);
    if(parts.some(n => isNaN(n) || n<0 || n>255)) {
        errBox.innerText = 'Octets must be 0-255.'; errBox.style.display = 'block'; return;
    }
    
    let ipLong = (parts[0]*16777216) + (parts[1]*65536) + (parts[2]*256) + parts[3];
    let maskLong = ~((1 << (32 - cidr)) - 1) >>> 0;
    let netLong = (ipLong & maskLong) >>> 0;
    let broadLong = (netLong | ~maskLong) >>> 0;
    
    const toIP = (num) => [ (num>>>24)&255, (num>>>16)&255, (num>>>8)&255, num&255 ].join('.');
    
    let hosts = Math.pow(2, 32-cidr) - 2;
    if(hosts < 0) hosts = 0;
    
    document.getElementById('sub-network').innerText = toIP(netLong);
    document.getElementById('sub-mask').innerText = toIP(maskLong);
    document.getElementById('sub-first').innerText = cidr >= 31 ? 'N/A' : toIP(netLong + 1);
    document.getElementById('sub-gateway').innerText = cidr >= 31 ? 'N/A' : toIP(netLong + 1); // standard gateway
    document.getElementById('sub-last').innerText = cidr >= 31 ? 'N/A' : toIP(broadLong - 1);
    document.getElementById('sub-broadcast').innerText = toIP(broadLong);
    document.getElementById('sub-hosts').innerText = hosts.toLocaleString();
}


// -- 7. Text Diff Tool --
function runDiff() {
    const oLines = document.getElementById('diff-original').value.split('\n');
    const mLines = document.getElementById('diff-modified').value.split('\n');
    const out = document.getElementById('diff-output');
    out.innerHTML = '';
    
    const max = Math.max(oLines.length, mLines.length);
    for(let i=0; i<max; i++) {
        let o = oLines[i] || "";
        let m = mLines[i] || "";
        
        if(o === m) {
            out.innerHTML += `<div style="color:var(--text-muted); opacity:0.7;">  ${escapeHTML(o)}</div>`;
        } else {
            if(o !== "") out.innerHTML += `<div style="color:#ef4444; background:rgba(239, 68, 68, 0.1); padding-left:5px;">- ${escapeHTML(o)}</div>`;
            if(m !== "") out.innerHTML += `<div style="color:#10b981; background:rgba(16, 185, 129, 0.1); padding-left:5px;">+ ${escapeHTML(m)}</div>`;
        }
    }
}
function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}


// -- 8. Unit Converter --
const unitRef = {
    length: { base: 'meter', units: { 'meter':1, 'kilometer':1000, 'centimeter':0.01, 'millimeter':0.001, 'mile':1609.34, 'yard':0.9144, 'foot':0.3048, 'inch':0.0254 } },
    weight: { base: 'gram', units: { 'gram':1, 'kilogram':1000, 'milligram':0.001, 'pound':453.592, 'ounce':28.3495, 'ton':1000000 } },
    data: { base: 'byte', units: { 'byte':1, 'kilobyte':1024, 'megabyte':1048576, 'gigabyte':1073741824, 'terabyte':1099511627776, 'bit':0.125 } }
};
let currentUnitTab = 'length';

function switchUnitTab(tab) {
    currentUnitTab = tab;
    ['length','weight','data'].forEach(id => {
        document.getElementById(`tab-${id}`).className = tab === id ? 'btn btn-primary' : 'btn btn-outline';
    });
    const s1 = document.getElementById('unit-input-type');
    const s2 = document.getElementById('unit-output-type');
    s1.innerHTML = ''; s2.innerHTML = '';
    
    Object.keys(unitRef[tab].units).forEach(u => {
        s1.innerHTML += `<option value="${u}">${u.charAt(0).toUpperCase() + u.slice(1)}</option>`;
        s2.innerHTML += `<option value="${u}">${u.charAt(0).toUpperCase() + u.slice(1)}</option>`;
    });
    // set defaults
    if(tab==='length') { s1.value='meter'; s2.value='foot'; }
    if(tab==='weight') { s1.value='kilogram'; s2.value='pound'; }
    if(tab==='data') { s1.value='gigabyte'; s2.value='megabyte'; }
    
    calculateUnit();
}
function calculateUnit() {
    let val = parseFloat(document.getElementById('unit-input-val').value);
    if(isNaN(val)) val = 0;
    const t1 = document.getElementById('unit-input-type').value;
    const t2 = document.getElementById('unit-output-type').value;
    
    // convert to base, then to target
    const obj = unitRef[currentUnitTab].units;
    const baseVal = val * obj[t1];
    const finalVal = baseVal / obj[t2];
    
    // format to max 6 decimals intelligently
    document.getElementById('unit-output-val').value = parseFloat(finalVal.toFixed(6));
}


// -- 9. Epoch Converter --
function initEpoch() {
    setInterval(() => {
        const el = document.getElementById('live-epoch');
        if(el) el.innerText = Math.floor(Date.now() / 1000).toString();
    }, 1000);
}
function convertEpoch(mode) {
    if(mode === 'to_date') {
        const val = document.getElementById('epoch-input').value;
        const out = document.getElementById('epoch-date-output');
        if(!val) { out.innerText = 'Enter seconds...'; return; }
        const d = new Date(parseInt(val)*1000);
        out.innerText = isNaN(d) ? 'Invalid Input' : d.toLocaleString() + ' ' + (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } else {
        const val = document.getElementById('date-input').value;
        const out = document.getElementById('epoch-num-output');
        if(!val) { out.innerText = 'Select date...'; return; }
        const d = new Date(val);
        out.innerText = isNaN(d) ? 'Invalid Date' : Math.floor(d.getTime() / 1000).toString() + " seconds";
    }
}

let premiumBrowserUrl = 'about:blank';

// -- Auth Init --
async function checkSession() {
    try {
        if(window.SupabaseClient) {
            const session = await window.SupabaseClient.getSession();
            if(session) unlockPremium();
        }
    } catch(e) {}
}

async function executeLogin() {
    const user = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    const errBox = document.getElementById('login-error');

    errBox.style.display = 'none';

    if (!user || !pass) {
        errBox.innerText = "Please enter both email and password.";
        errBox.style.display = 'block';
        return;
    }

    const result = await window.SupabaseClient.login(user, pass);

    if (result.success) {
        closeLoginModal();
        unlockPremium();
    } else {
        errBox.innerText = result.error || "Wrong username/password.";
        errBox.style.display = 'block';
    }
}

async function unlockPremium() {
    const overlay = document.getElementById('premium-overlay');
    if(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
        document.querySelector('.premium-content').style.opacity = '1';
        document.querySelector('.premium-content').style.pointerEvents = 'auto';
    }
    
    // Fetch secure premium url if logged in
    try {
        const url = await window.SupabaseClient.fetchSecret('premium_browser_url');
        if (url) {
            premiumBrowserUrl = url;
        }
    } catch(e) { console.error('Error fetching secret URL'); }
}

function openRenderApp() {
    if (premiumBrowserUrl && premiumBrowserUrl !== 'about:blank') {
        window.open(premiumBrowserUrl, '_blank');
    } else {
        alert("Secure URL is not loaded yet or you are not logged in.");
    }
}

function showLoginModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'flex'; 
}
function closeLoginModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'none'; 
}

// ==========================================
// VIRTUAL MACHINES SUITE (PREMIUM TOOL)
// ==========================================
let currentVM = null;

async function fetchWithProgress(url, onProgress, onText) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const contentLength = response.headers.get('content-length');
    let total = 0;
    if (contentLength) total = parseInt(contentLength, 10);
    
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    if (onText) onText(`Downloading... 0%`);

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;

        if (total && onProgress) {
            const pct = (loaded / total) * 100;
            onProgress(pct);
            if (onText) onText(`Downloading... ${Math.round(pct)}%`);
        } else {
            const mb = (loaded / (1024 * 1024)).toFixed(2);
            if (onText) onText(`Downloading... ${mb}MB`);
        }
    }
    
    return new Blob(chunks);
}

async function startVM(tierKey) {
    const session = await window.SupabaseClient.getSession();
    if (!session) {
        alert("Unauthorized! Administrator access is required.");
        return;
    }

    const configData = await window.SupabaseClient.getHomepageConfig();
    const vmConfig = configData?.vm_config;
    if (!vmConfig || !vmConfig.tiers[tierKey]) {
        alert("Failed to load Virtual Machine hardware configuration dynamically.");
        return;
    }
    
    const tier = vmConfig.tiers[tierKey];
    const monitor = document.getElementById('vm-monitor');
    const overlay = document.getElementById('vm-progress-overlay');
    const progBar = document.getElementById('vm-progress-bar');
    const progText = document.getElementById('vm-progress-text');
    const controls = document.getElementById('vm-controls');

    // Clean up
    if (currentVM) {
        currentVM.destroy();
        currentVM = null;
    }
    const oldScreens = monitor.querySelectorAll('.vm-screen');
    oldScreens.forEach(el => el.remove());

    // Create v86 target
    const screenContainer = document.createElement('div');
    screenContainer.className = 'vm-screen';
    screenContainer.style.width = '100%';
    screenContainer.style.height = '100%';
    screenContainer.style.display = 'flex';
    screenContainer.style.alignItems = 'center';
    screenContainer.style.justifyContent = 'center';
    screenContainer.style.overflow = 'hidden';
    
    const innerDiv = document.createElement('div');
    innerDiv.style.whiteSpace = 'pre';
    innerDiv.style.fontFamily = 'monospace';
    innerDiv.style.fontSize = '14px';
    innerDiv.style.lineHeight = '14px';
    
    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    innerDiv.appendChild(canvas);
    screenContainer.appendChild(innerDiv);
    monitor.appendChild(screenContainer);

    // Initial View setup
    controls.style.display = 'none';
    const vmStatusReady = document.getElementById('vm-status-ready');
    if (vmStatusReady) vmStatusReady.style.display = 'none';
    overlay.style.display = 'flex';
    progBar.style.width = '0%';
    progText.innerText = 'Communicating with Cloud Server...';

    try {
        const bucket = 'system-assets';
        progText.innerText = `Authorizing resources via Secure Channels...`;
        
        const [biosUrl, vgaUrl] = await Promise.all([
            window.SupabaseClient.getSignedUrl(bucket, vmConfig.bios, 300),
            window.SupabaseClient.getSignedUrl(bucket, vmConfig.vga_bios, 300)
        ]);
        
        let isoUrl;
        if (tier.src === 'supabase') {
            isoUrl = await window.SupabaseClient.getSignedUrl(bucket, tier.path, 600);
        } else if (tier.src === 'local') {
            isoUrl = tier.path;
        } else if (tier.src === 'url') {
            isoUrl = tier.path;
        }
        
        if (!biosUrl || !vgaUrl || !isoUrl) throw new Error("Could not authorize OS Images.");

        progText.innerText = `Downloading ${tier.name}... 0%`;
        const blob = await fetchWithProgress(isoUrl, (pct) => {
            progBar.style.width = `${pct}%`;
        }, (txt) => {
            progText.innerText = txt.replace('Downloading...', `Downloading ${tier.name}...`);
        });

        const isoBlobUrl = URL.createObjectURL(blob);
        
        overlay.style.display = 'none';

        const vgaMem = (tierKey === 't3_sl' || tierKey === 't5_pu') ? 8 * 1024 * 1024 : 2 * 1024 * 1024;
        
        const v86config = {
            wasm_path: "assets/vms/v86.wasm",
            memory_size: tier.mem * 1024 * 1024,
            vga_memory_size: vgaMem,
            screen_container: innerDiv,
            bios: { url: biosUrl },
            vga_bios: { url: vgaUrl },
            disable_speaker: true, // optimization
            network_relay_url: "wss://relay.widgetry.org/" // smooth networking
        };

        if (tier.type === 'iso') {
            v86config.cdrom = { url: isoBlobUrl };
        } else {
            v86config.hda = { url: isoBlobUrl };
        }
        
        v86config.autostart = true;
        currentVM = new window.V86(v86config);

        controls.style.display = 'flex';
        const powerOffBtn = document.querySelector('#vm-controls button.btn-primary');
        const fullscreenBtn = document.getElementById('vm-fullscreen-btn');
        const bootBtns = document.querySelectorAll('#vm-controls button.btn-outline:not(#vm-fullscreen-btn)');
        if (powerOffBtn) powerOffBtn.style.display = 'inline-block';
        if (fullscreenBtn) fullscreenBtn.style.display = 'inline-block';
        bootBtns.forEach(b => b.style.display = 'none');

    } catch (e) {
        console.error("VM Exception:", e);
        if (e.message.includes("Could not authorize OS Images")) {
            sessionStorage.removeItem('homepage_config');
            alert("Configuration cache refreshed to fix broken paths! Please click the Boot button again.");
        } else {
            alert("Fatal runtime exception: " + e.message);
        }
        powerOffVM();
    }
}

function powerOffVM() {
    if (currentVM) {
        currentVM.destroy();
        currentVM = null;
    }
    const monitor = document.getElementById('vm-monitor');
    if(monitor) {
        monitor.querySelectorAll('.vm-screen').forEach(el => el.remove());
    }
    const overlay = document.getElementById('vm-progress-overlay');
    if(overlay) overlay.style.display = 'none';
    
    const controls = document.getElementById('vm-controls');
    if(controls) controls.style.display = 'flex';
    
    document.querySelectorAll('#vm-controls button.btn-outline:not(#vm-fullscreen-btn)').forEach(b => b.style.display = 'inline-block');
    const powerOffBtn = document.querySelector('#vm-controls button.btn-primary');
    if (powerOffBtn) powerOffBtn.style.display = 'none';
    const fullscreenBtn = document.getElementById('vm-fullscreen-btn');
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
    
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.error(e));
    }
    const vmStatusReady = document.getElementById('vm-status-ready');
    if (vmStatusReady) vmStatusReady.style.display = 'flex';
}

function toggleVMFullscreen() {
    const monitor = document.getElementById('vm-monitor');
    if (!document.fullscreenElement) {
        if (monitor.requestFullscreen) {
            monitor.requestFullscreen();
        } else if (monitor.webkitRequestFullscreen) {
            monitor.webkitRequestFullscreen();
        } else if (monitor.msRequestFullscreen) {
            monitor.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// -- Init All --
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    fetchPrayerTimes();
    initSubnet();
    switchUnitTab('length');
    initEpoch();
    checkSession();
});
