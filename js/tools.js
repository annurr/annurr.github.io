/* tools.js - v4.0 Modal UX + Native API Fetch */

// -- Modals --
function openToolModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Add subtle scale entrance
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

// Close modals on outside click
window.addEventListener('click', (e) => {
    if(e.target.classList.contains('tool-modal')) closeToolModal(e.target.id);
});

// -- Clock & Timezone --
let trackedZones = [];

function initClock() {
    // Populate IANA datalist
    const dl = document.getElementById('tz-cities');
    if(dl && typeof Intl !== 'undefined') {
        const timezones = Intl.supportedValuesOf('timeZone');
        timezones.forEach(tz => {
            const opt = document.createElement('option');
            opt.value = tz;
            dl.appendChild(opt);
        });
    }

    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
        
        const elGrid = document.getElementById('digital-time-preview');
        const elModal = document.getElementById('digital-time');
        if(elGrid) elGrid.innerText = timeStr;
        if(elModal) elModal.innerText = timeStr;
        
        renderTimezones();
    }, 1000);
}

function addTimezone() {
    const tzStr = document.getElementById('tz-city-select').value;
    if(!tzStr) return;
    
    try {
        new Date().toLocaleTimeString('en-US', { timeZone: tzStr });
        if(!trackedZones.includes(tzStr)) trackedZones.push(tzStr);
        document.getElementById('tz-city-select').value = '';
        renderTimezones();
    } catch(e) {
        alert("Invalid Timezone String. Use a valid global format, e.g. 'America/New_York'.");
    }
}

function renderTimezones() {
    const list = document.getElementById('timezone-list');
    if(!list) return;
    if(trackedZones.length === 0) {
        list.innerHTML = '<span style="color:var(--text-muted)">No zones added yet. Filter generic names from the list!</span>';
        return;
    }
    let html = '';
    const now = new Date();
    trackedZones.forEach(z => {
        const time = now.toLocaleTimeString('en-US', { timeZone: z, hour12: true });
        const nameParts = z.split('/');
        const niceName = nameParts[nameParts.length-1].replace('_',' ');
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>${niceName} <span style="font-size:0.8rem; color:var(--text-muted);">(${z})</span></span>
                    <strong style="color:var(--accent); font-family:monospace; letter-spacing:1px;">${time}</strong>
                 </div>`;
    });
    list.innerHTML = html;
}

// -- Pomodoro --
let pomoInterval;
let pomoSeconds = 25 * 60;
let pomoActive = false;
let currentPomoMode = 25;

function setPomodoro(mins) {
    clearInterval(pomoInterval);
    pomoActive = false;
    currentPomoMode = mins;
    pomoSeconds = mins * 60;
    updatePomoDisplay();
    const btn = document.getElementById('timer-btn');
    if(btn) {
        btn.innerText = "Start";
        btn.className = "btn btn-primary";
    }
}

function updatePomoDisplay() {
    const m = Math.floor(pomoSeconds/60).toString().padStart(2, '0');
    const s = (pomoSeconds%60).toString().padStart(2, '0');
    const el = document.getElementById('task-timer-display');
    if(el) el.innerText = `${m}:${s}`;
}

function startPomodoro() {
    const btn = document.getElementById('timer-btn');
    if(pomoActive) {
        clearInterval(pomoInterval);
        pomoActive = false;
        btn.innerText = "Resume";
        btn.className = "btn btn-primary";
    } else {
        pomoActive = true;
        btn.innerText = "Pause";
        btn.className = "btn btn-danger";
        pomoInterval = setInterval(() => {
            if(pomoSeconds > 0) {
                pomoSeconds--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoInterval);
                pomoActive = false;
                btn.innerText = "Done!";
                btn.className = "btn btn-primary";
            }
        }, 1000);
    }
}
function resetPomodoro() { setPomodoro(currentPomoMode); }

// -- Prayer Times (Aladhan REST API) --
let prayLat = 23.8103;
let prayLng = 90.4125;
let locName = "Dhaka";
let nextPrayerInterval;

function fetchPrayerTimes() {
    const url = `https://api.aladhan.com/v1/timings?latitude=${prayLat}&longitude=${prayLng}&method=1&school=1`;
    document.getElementById('next-prayer-time-preview').innerText = 'Syncing...';
    document.getElementById('next-prayer-time').innerText = 'Syncing...';
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const t = data.data.timings;
            // format 24h to 12h natively
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
            
            // Hijri Date
            const d = data.data.date.hijri;
            document.getElementById('hijri-date').innerText = `${d.day} ${d.month.en} ${d.year} AH`;

            // Start countdown loop logic natively
            if(nextPrayerInterval) clearInterval(nextPrayerInterval);
            nextPrayerInterval = setInterval(() => calculateNextPrayer(t), 1000);
            calculateNextPrayer(t);
        })
        .catch(e => {
            document.getElementById('next-prayer-time-preview').innerText = 'API Error';
            document.getElementById('next-prayer-time').innerText = 'Failed to load';
        });
}

function calculateNextPrayer(timings) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const getTime = (str) => {
        const [h,m] = str.split(':');
        return parseInt(h)*60 + parseInt(m);
    };

    const schedule = [
        {name: 'Fajr', time: getTime(timings.Fajr)},
        {name: 'Sunrise', time: getTime(timings.Sunrise)},
        {name: 'Dhuhr', time: getTime(timings.Dhuhr)},
        {name: 'Asr', time: getTime(timings.Asr)},
        {name: 'Maghrib', time: getTime(timings.Maghrib)},
        {name: 'Isha', time: getTime(timings.Isha)}
    ];

    let next = schedule.find(p => p.time > currentMins);
    let diffMins = 0;
    
    if(next) {
        diffMins = next.time - currentMins;
    } else {
        next = schedule[0]; // Next Day Fajr
        diffMins = (24*60 - currentMins) + next.time;
    }
    
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    
    const displayStr = `Starts in ${h}h ${String(m).padStart(2,'0')}m`;
    const finalName = next.name === 'Sunrise' ? 'Sunrise' : next.name; 
    
    document.getElementById('next-prayer-name').innerText = finalName;
    document.getElementById('next-prayer-time').innerText = displayStr;
    document.getElementById('next-prayer-name-preview').innerText = finalName;
    document.getElementById('next-prayer-time-preview').innerText = displayStr;
}

function geolocatePrayer() {
    if(navigator.geolocation) {
        document.getElementById('pr-location').innerText = "Locating...";
        document.getElementById('pr-location-preview').innerText = "Locating...";
        navigator.geolocation.getCurrentPosition((position) => {
            prayLat = position.coords.latitude;
            prayLng = position.coords.longitude;
            locName = "Local GPS";
            document.getElementById('pr-location').innerText = locName;
            document.getElementById('pr-location-preview').innerText = locName;
            fetchPrayerTimes();
        }, () => {
            document.getElementById('pr-location').innerText = "Access Denied";
            document.getElementById('pr-location-preview').innerText = "Access Denied";
        });
    }
}

// -- Scientific Calculator (GZ30eee Port + Memory) --
let calcMemory = 0;
function calcAction(op) {
    let display = document.getElementById('calc-display');
    if (display.value === "Syntax Error" || display.value === "undefined" || display.value === "NaN") display.value = "";
    op = op.toLowerCase();
    
    if (['0','1','2','3','4','5','6','7','8','9','.'].includes(op)) {
        if(display.value === '0') display.value = op;
        else display.value += op;
    } 
    else if (op === 'clear') display.value = '0';
    else if (op === 'backspace') {
        display.value = display.value.substring(0, display.value.length - 1);
        if(display.value === "") display.value = "0";
    }
    else if (op === '*') display.value += '*';
    else if (op === '/') display.value += '/';
    else if (op === '+') display.value += '+';
    else if (op === '-') display.value += '-';
    else if (op === 'plusminus') {
        if (display.value.charAt(0) === "-") display.value = display.value.slice(1);
        else display.value = "-" + display.value;
    }
    else if (op === 'mc') calcMemory = 0;
    else if (op === 'mr') display.value = calcMemory.toString();
    else if (op === 'm+') { try { calcMemory += eval(display.value || 0); } catch(e){} }
    else if (op === 'm-') { try { calcMemory -= eval(display.value || 0); } catch(e){} }
    else if (op === '%') { try { display.value = (eval(display.value) / 100).toString(); } catch(e){} }
    else if (op === 'pi') display.value = (eval(display.value || 0) || 1) * Math.PI;
    else if (op === 'e') display.value = Math.exp(eval(display.value));
    else if (op === 'sqrt') display.value = Math.sqrt(eval(display.value));
    else if (op === 'sin') display.value = Math.sin(eval(display.value));
    else if (op === 'cos') display.value = Math.cos(eval(display.value));
    else if (op === 'tan') display.value = Math.tan(eval(display.value));
    else if (op === 'log') display.value = Math.log10(eval(display.value));
    else if (op === 'ln') display.value = Math.log(eval(display.value));
    else if (op === 'pow') display.value += "^";
    else if (op === 'factorial') {
        let number = 1;
        try {
            let val = eval(display.value);
            if (val === 0) display.value = "1";
            else if (val < 0) display.value = "undefined";
            else {
                for (let i = val; i > 0; i--) number *= i;
                display.value = number.toString();
            }
        } catch(e) { display.value = "Syntax Error"; }
    }
}
function calcEvaluate() {
    let display = document.getElementById('calc-display');
    try {
        if ((display.value).indexOf("^") > -1) {
            var base = (display.value).slice(0, (display.value).indexOf("^"));
            var exponent = (display.value).slice((display.value).indexOf("^") + 1);
            display.value = eval("Math.pow(" + eval(base) + "," + eval(exponent) + ")");
        } else {
            display.value = eval(display.value);
            if (display.value === undefined || display.value === "NaN" || isNaN(display.value)) throw new Error();
        }
    } catch(e) {
        display.value = "Syntax Error";
    }
}
document.addEventListener('keydown', (e) => {
    const calcPane = document.getElementById('calc-modal');
    if(!calcPane || calcPane.style.display !== 'flex') return;
    if(e.target.tagName === 'INPUT' && e.target.id !== 'calc-display') return;
    
    const key = e.key;
    if(/[0-9.]/.test(key)) calcAction(key);
    else if(key === 'Enter' || key === '=') { e.preventDefault(); calcEvaluate(); }
    else if(key === 'Backspace') calcAction('backspace');
    else if(key === 'Escape') calcAction('clear');
    else if(['+','-','*','/','%'].includes(key)) calcAction(key);
});


// -- Password Generator --
function generatePassword() {
    const length = parseInt(document.getElementById('pass-length').value);
    const hasUpper = document.getElementById('pass-upper').checked;
    const hasLower = document.getElementById('pass-lower').checked;
    const hasNum = document.getElementById('pass-num').checked;
    const hasSym = document.getElementById('pass-sym').checked;
    
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    let chars = "";
    if(hasUpper) chars += upper;
    if(hasLower) chars += lower;
    if(hasNum) chars += nums;
    if(hasSym) chars += syms;
    if(chars === "") { document.getElementById('pass-lower').checked = true; chars = lower; }
    
    let pass = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        pass += chars[array[i] % chars.length];
    }
    document.getElementById('gen-password-display').value = pass;
}
function copyPassword() {
    const el = document.getElementById('gen-password-display');
    if(el.value === "Click Generate" || el.value === "") return;
    el.select();
    document.execCommand('copy');
    const original = el.value;
    el.value = "Copied!";
    setTimeout(() => { if(el.value === "Copied!") el.value = original; }, 1000);
}

// -- JSON Formatter --
function formatJSON(spaces) {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');
    const status = document.getElementById('json-status');
    status.style.color = 'var(--accent)';
    
    if(!input.trim()) {
        output.value = '';
        status.innerText = 'Output:';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        output.value = JSON.stringify(parsed, null, spaces);
        status.innerText = 'Valid JSON ✓';
        status.style.color = '#10b981'; // Success Green
    } catch(e) {
        output.value = e.toString();
        status.innerText = 'Invalid JSON ✗';
        status.style.color = '#ef4444'; // Error Red
    }
}

function minifyJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');
    const status = document.getElementById('json-status');
    
    if(!input.trim()) return;
    try {
        const parsed = JSON.parse(input);
        output.value = JSON.stringify(parsed);
        status.innerText = 'Valid JSON (Minified) ✓';
        status.style.color = '#10b981';
    } catch(e) {
        output.value = e.toString();
        status.innerText = 'Invalid JSON ✗';
        status.style.color = '#ef4444';
    }
}

function copyJSON() {
    const el = document.getElementById('json-output');
    if(!el.value) return;
    el.select();
    document.execCommand('copy');
    
    const status = document.getElementById('json-status');
    const original = status.innerText;
    status.innerText = 'Copied to Clipboard!';
    setTimeout(() => { status.innerText = original; }, 1500);
}


// -- Base64 Encoder / Decoder --
function processBase64(mode) {
    const input = document.getElementById('base64-input').value;
    const output = document.getElementById('base64-output');
    const errBox = document.getElementById('base64-error');
    errBox.style.display = 'none';
    output.value = '';
    
    if(!input.trim()) return;
    
    try {
        if(mode === 'encode') {
            output.value = btoa(unescape(encodeURIComponent(input)));
        } else if(mode === 'decode') {
            output.value = decodeURIComponent(escape(atob(input)));
        }
    } catch(e) {
        errBox.innerText = 'Error: Invalid string or Base64 data.';
        errBox.style.display = 'block';
    }
}

function copyBase64() {
    const el = document.getElementById('base64-output');
    if(!el.value) return;
    el.select();
    document.execCommand('copy');
    
    const original = el.value;
    el.value = 'Copied to clipboard!';
    setTimeout(() => { el.value = original; }, 1000);
}

// -- Auth Logic --
async function checkSession() {
    try {
        if(window.SupabaseClient) {
            const session = await window.SupabaseClient.getSession();
            if(session) unlockPremium();
        }
    } catch(e) {}
}
function unlockPremium() {
    const overlay = document.getElementById('premium-overlay');
    if(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
        document.querySelector('.premium-content').style.opacity = '1';
        document.querySelector('.premium-content').style.pointerEvents = 'auto';
    }
}
function showLoginModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'flex'; 
}
function closeLoginModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'none'; 
    const err = document.getElementById('login-error');
    if(err) err.style.display = 'none'; 
}
async function executeLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const errBox = document.getElementById('login-error');
    if (errBox) errBox.style.display = 'none';
    const result = await window.SupabaseClient.login(email, pass);
    if(result.success) { closeLoginModal(); unlockPremium(); }
    else { 
        if (errBox) {
            errBox.innerText = result.error || "Login failed."; 
            errBox.style.display = 'block'; 
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    fetchPrayerTimes(); 
    checkSession();
});
