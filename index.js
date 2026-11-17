const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const KEYS_FILE = './keys.json';
const HWID_FILE = './hwid.json';

function generateKeys() {
    if (!fs.existsSync(KEYS_FILE)) {
        const keys = [];
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 1000; i++) {
            let key = 'BAX-';
            for (let j = 0; j < 8; j++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            keys.push(key);
        }
        keys.push('BAX123');
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    }
}

function getKeys() {
    return JSON.parse(fs.readFileSync(KEYS_FILE));
}

function getHwidData() {
    if (!fs.existsSync(HWID_FILE)) {
        fs.writeFileSync(HWID_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(HWID_FILE));
}

function saveHwidData(data) {
    fs.writeFileSync(HWID_FILE, JSON.stringify(data, null, 2));
}

generateKeys();

// صفحة عرض جميع المفاتيح
app.get('/keys', (req, res) => {
    const keys = getKeys();
    res.send(`
        <html>
            <head><title>BAX - Keys</title></head>
            <body style="background:#0c0c0f; color:#ff3333; font-family:monospace; padding:20px;">
                <h1>BAX COMMUNITY | All Keys (${keys.length})</h1>
                <div>${keys.map(k => `<div style="background:#1a1a20; padding:8px; margin:4px 0; border:1px solid #500; color:#fff;">${k}</div>`).join('')}</div>
            </body>
        </html>
    `);
});

// صفحة جديدة لعرض المفاتيح المستخدمة وأجهزة اللاعبين (HWID)
app.get('/used', (req, res) => {
    const hwidData = getHwidData();
    res.send(`
        <html>
            <head><title>BAX - Used Keys & HWID</title></head>
            <body style="background:#0c0c0f; color:#33ff66; font-family:monospace; padding:20px;">
                <h1>BAX COMMUNITY | Used Keys & HWID Log</h1>
                <p>Total Used: ${Object.keys(hwidData).length}</p>
                <div>
                    ${Object.entries(hwidData).map(([hwid, key]) => `
                        <div style="background:#1a201a; padding:10px; margin:6px 0; border:1px solid #050; color:#fff;">
                            <b>Key:</b> <span style="color:#ff3333;">${key}</span><br>
                            <b>HWID (PC):</b> <span style="color:#33aaff;">${hwid}</span>
                        </div>
                    `).join('')}
                </div>
            </body>
        </html>
    `);
});

app.post('/verify', (req, res) => {
    const { key, hwid } = req.body;
    const keys = getKeys();
    const hwidData = getHwidData();

    if (!keys.includes(key)) {
        return res.json({ success: false, message: "INVALID KEY!" });
    }

    for (const [savedHwid, savedKey] of Object.entries(hwidData)) {
        if (savedHwid === hwid && savedKey !== key) {
            return res.json({ success: false, message: "HWID LOCKED TO ANOTHER KEY!" });
        }
        if (savedKey === key && savedHwid !== hwid) {
            return res.json({ success: false, message: "KEY ALREADY USED ON ANOTHER PC!" });
        }
    }

    hwidData[hwid] = key;
    saveHwidData(hwidData);

    return res.json({ success: true, message: "ACCESS GRANTED!" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
