const fetch = require('node-fetch');
const fs = require('fs');
const config = require('./config.json');
const path = require('path');
const sendErrorMail = require('./sendErrorEmail');

const API_KEY = config.apiKey;
const GRAPHQL_URL = `https://production-sfo.browserless.io/chromium/bql?token=${API_KEY}`;
const DATA_PATH = path.join(__dirname, 'kullanicilar.json');
const LOG_PATH = path.join(__dirname, 'tikleap-cron.log');
const ARCHIVE_BASE = path.join(__dirname, 'logs');
const USAGE_LOG = path.join(__dirname, 'call-count.log');

function nowTR() {
  return new Date().toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

async function testAPI() {
  const testQuery = `
  query {
    version
  }
  `;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });

    if (!res.ok) {
      return false;
    }

    const responseText = await res.text();
    const json = JSON.parse(responseText);
    return !json.errors;
  } catch (err) {
    return false;
  }
}

async function runScraper() {
  fs.appendFileSync(LOG_PATH, `🕐 Başladı: ${nowTR()}\n`);

  // API bağlantısını test et
  const apiTest = await testAPI();
  if (!apiTest) {
    const errMsg = `❌ API Bağlantı Hatası: Browserless API'ye bağlanılamıyor. API anahtarını kontrol edin.\n`;
    fs.appendFileSync(LOG_PATH, errMsg);
    await sendErrorMail("❌ Tikleap Bot API Bağlantı Hatası", errMsg);
    return;
  }

  fs.appendFileSync(LOG_PATH, `✅ API Bağlantısı başarılı\n`);

  const query = `
  mutation {
    goto(url: "https://www.tikleap.com/login", waitUntil: firstContentfulPaint) { status }
    typeEmail: type(selector: "input[name='email']", text: "destek.m8@gmail.com") { time }
    typePassword: type(selector: "input[name='password']", text: "11551155aA.") { time }
    clickLogin: click(selector: ".form-action button") { time }
    waitForNavigation(waitUntil: domContentLoaded, timeout: 60000) { status }
    extractData: evaluate(content: """
      (async () => {
        const results = [];

        for (let i = 1; i <= 5; i++) {
          const res = await fetch('https://www.tikleap.com/country-load-more/tr/' + i, {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });

          const raw = await res.text();
          let html = "";

          try {
            const parsed = JSON.parse(raw);
            html = parsed.html || "";
          } catch (e) {
            html = raw;
          }

          const doc = new DOMParser().parseFromString(html, 'text/html');
          const rows = doc.querySelectorAll('a.ranklist-table-row');

          rows.forEach(row => {
            results.push({
              page: i,
              profil: row.getAttribute('href'),
              siralama: row.querySelector('.ranklist-place-wrapper span')?.textContent.trim(),
              kullaniciAdi: row.querySelector('.ranklist-username')?.textContent.trim(),
              kazanc: row.querySelector('.ranklist-earning-wrapper .price')?.textContent.trim()
            });
          });
        }

        return JSON.stringify(results);
      })()
    """) {
      value
    }
  }
  `;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const errorText = await res.text();
      const errMsg = `❌ API Yanıt Hatası: ${res.status} ${res.statusText}\nYanıt: ${errorText}\n`;
      fs.appendFileSync(LOG_PATH, errMsg);
      await sendErrorMail("❌ Tikleap Bot API Yanıt Hatası", errMsg);
      return;
    }

    const responseText = await res.text();
    let json;
    
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      const errMsg = `❌ JSON Parse Hatası: ${parseError.message}\nAPI Yanıtı: ${responseText.substring(0, 500)}...\n`;
      fs.appendFileSync(LOG_PATH, errMsg);
      await sendErrorMail("❌ Tikleap Bot JSON Parse Hatası", errMsg);
      return;
    }

    if (json.errors) {
      const errMsg = `❌ GraphQL Hataları: ${JSON.stringify(json.errors, null, 2)}\n`;
      fs.appendFileSync(LOG_PATH, errMsg);
      await sendErrorMail("❌ Tikleap Bot GraphQL Hatası", errMsg);
      return;
    }

    if (!json.data || !json.data.extractData || !json.data.extractData.value) {
      const errMsg = `❌ Veri Eksik: ${JSON.stringify(json, null, 2)}\n`;
      fs.appendFileSync(LOG_PATH, errMsg);
      await sendErrorMail("❌ Tikleap Bot Veri Eksik Hatası", errMsg);
      return;
    }

    const users = JSON.parse(json.data.extractData.value);

    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), 'utf-8');

    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10);
    const hourMin = timestamp.toTimeString().slice(0, 5).replace(':', '-');
    const archiveDir = path.join(ARCHIVE_BASE, dateStr);
    const archiveFile = path.join(archiveDir, `${hourMin}-kullanicilar.json`);

    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(archiveFile, JSON.stringify(users, null, 2), 'utf-8');

    fs.appendFileSync(USAGE_LOG, new Date().toISOString() + "\n");
    fs.appendFileSync(LOG_PATH, `✅ ${users.length} kullanıcı kaydedildi -> ${archiveFile}\n`);
  } catch (err) {
    const message = `❌ Hata: ${err.message} | ${nowTR()}`;
    fs.appendFileSync(LOG_PATH, message + '\n');
    await sendErrorMail("❌ Tikleap Bot Genel Hata", message);
  }

  fs.appendFileSync(LOG_PATH, `✅ Bitti: ${nowTR()}\n`);
}

runScraper();