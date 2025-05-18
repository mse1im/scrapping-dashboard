const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'kullanicilar.json');
const ARCHIVE_DIR = path.join(__dirname, 'logs');

app.use(cors());
app.use(express.json());

// 🟢 Test endpoint
app.get('/test', (req, res) => {
  res.send('✅ API aktif - Express çalışıyor!');
});

// 🔐 Login (dummy auth)
app.post('/login', (req, res) => {
  const { user, password } = req.body;
  if (user === 'lucky7' && password === 'omer.lucky123') {
    return res.json({ success: true, token: uuidv4() });
  }
  return res.status(401).json({ success: false, message: 'Geçersiz giriş' });
});

// 📄 Güncel kullanıcı listesi
app.get('/kullanicilar', (req, res) => {
  fs.readFile(DATA_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('❌ JSON okuma hatası:', err.message);
      return res.status(500).json({ error: 'Veri alınamadı.' });
    }

    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'JSON parse hatası.' });
    }
  });
});

// 📁 Tüm tarih klasörlerini listele
app.get('/arsiv', (req, res) => {
  fs.readdir(ARCHIVE_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: 'Arşiv klasörü okunamadı.' });
    }

    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
      .reverse();

    res.json(folders);
  });
});

// 📂 Tarihe ait JSON dosyalarını listele
app.get('/arsiv/:tarih', (req, res) => {
  const dateFolder = path.join(ARCHIVE_DIR, req.params.tarih);

  fs.readdir(dateFolder, (err, files) => {
    if (err) {
      return res.status(404).json({ error: 'Tarih bulunamadı.' });
    }

    const list = files
      .filter(f => f.endsWith('.json'))
      .map(name => ({
        name,
        url: `/arsiv/${req.params.tarih}/${name}`
      }));

    res.json(list);
  });
});

// 📄 Belirli arşiv dosyasının içeriğini getir
app.get('/arsiv/:tarih/:dosya', (req, res) => {
  const filePath = path.join(ARCHIVE_DIR, req.params.tarih, req.params.dosya);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'JSON parse hatası.' });
    }
  });
});

// logs endpointini düzeltiyoruz
app.get('/logs/:file', (req, res) => {
  const filePath = path.join(__dirname, req.params.file); // ✅ çünkü log dosyası aynı klasörde
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(404).send('Log dosyası bulunamadı.');
    }
    res.send(data);
  });
});
// 🔑 API Key güncelleme
app.post('/api-key', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Geçerli bir API key gönderin.' });
  }

  const configPath = path.join(__dirname, 'config.json');

  fs.readFile(configPath, 'utf-8', (err, content) => {
    if (err) {
      return res.status(500).json({ error: 'config.json okunamadı.' });
    }

    let config;
    try {
      config = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: 'config.json parse edilemedi.' });
    }

    config.apiKey = apiKey;

    fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'config.json güncellenemedi.' });
      }
      return res.json({ success: true });
    });
  });
});

// 🚀 Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`✅ Express API aktif: http://localhost:${PORT}`);
});