const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const DB_FILE = './keys.json';

// توليد 1000 كود تلقائياً إذا الملف مو موجود
if (!fs.existsSync(DB_FILE)) {
    const keys = {};
    for (let i = 0; i < 1000; i++) {
        // شكل الكود: BAX-XXXX-XXXX
        const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const key = `BAX-${part1}-${part2}`;
        keys[key] = null; // null معناها الكود لسا ما ارتبط بأي جهاز
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(keys, null, 2));
    console.log("Generated 1000 keys in keys.json!");
}

// نقطة التحقق للسكربت
app.post('/verify', (req, res) => {
    const { key, hwid } = req.body;
    if (!key || !hwid) return res.json({ status: 'error', message: 'Missing data' });

    const db = JSON.parse(fs.readFileSync(DB_FILE));

    // 1. التأكد إن الكود موجود أصلاً
    if (!(key in db)) {
        return res.json({ status: 'invalid', message: 'Invalid key' });
    }

    // 2. إذا الكود جديد، اربطه بهذا الجهاز واحفظه
    if (db[key] === null) {
        db[key] = hwid;
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        return res.json({ status: 'valid', message: 'Key activated & locked to PC' });
    }

    // 3. إذا الكود مستخدم، تأكد إنه نفس الجهاز
    if (db[key] === hwid) {
        return res.json({ status: 'valid', message: 'Welcome back' });
    } else {
        return res.json({ status: 'locked', message: 'Key already used on another PC!' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BAX Auth Server running on port ${PORT}`));
