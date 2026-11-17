const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const KEYS_FILE = './keys.json';
const HWID_FILE = './hwid.json';

// دالة لتوليد 1000 مفتاح عشوائي إذا لم تكن موجودة
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
        // إضافة المفتاح الأساسي للتجربة
        keys.push('BAX123');
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
        console.log('Generated 1000 keys in keys.json');
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

// مسار عرض جميع المفاتيح على المتصفح (عشان يشتغل رابط /keys بدون أخطاء)
app.get('/keys', (req, res) => {
    const keys = getKeys();
    res.send(`
        <html>
            <head>
                <title>BAX COMMUNITY - Keys List</title>
                <style>
                    body { background-color: #0c0c0f; color: #ff3333; font-family: monospace; padding: 20px; }
                    h1 { color: #fff; text-shadow: 0 0 10px #ff0000; }
                    .key-box { background: #1a1a20; padding: 10px; margin: 5px 0; border: 1px solid #500; border-radius: 4px; color: #fff; }
                </style>
            </head>
            <body>
                <h1>BAX COMMUNITY | BXA - All Keys (1000+)</h1>
                <p>Total Keys Available: ${keys.length}</p>
                <div>
                    ${keys.map(k => `<div class="key-box">${k}</div>`).join('')}
                </div>
            </body>
        </html>
    `);
});

// مسار التحقق من المفتاح والـ HWID
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
    console.log(`BAX Auth Server running on port ${PORT}`);
});
