const fetch = require('node-fetch');
const fs = require('fs');
const config = require('./config.json');
const path = require('path');

const API_KEY = config.apiKey;
const GRAPHQL_URL = `https://production-sfo.browserless.io/chromium/bql?token=${API_KEY}`;
const DATA_PATH = path.join(__dirname, 'kullanicilar.json');
const LOG_PATH = path.join(__dirname, 'tikleap-cron.log');
const ARCHIVE_BASE = path.join(__dirname, 'logs');

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

async function runScraper() {
  fs.appendFileSync(LOG_PATH, `🕐 Başladı: ${nowTR()}\n`);

  const query = `
  mutation {
    goto(url: "https://www.tikleap.com/login", waitUntil: firstContentfulPaint) { status }
    typeEmail: type(selector: "input[name='email']", text: "destek.m8@gmail.com") { time }
    typePassword: type(selector: "input[name='password']", text: "11551155aA.") { time }
    clickLogin: click(selector: ".form-action button") { time }
    waitForNavigation(waitUntil: networkIdle) { status }
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

    const json = await res.json();

    if (json.errors) {
      const errMsg = `❌ GraphQL Hataları: ${JSON.stringify(json.errors, null, 2)}\n`;
      fs.appendFileSync(LOG_PATH, errMsg);
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

    fs.appendFileSync(LOG_PATH, `✅ ${users.length} kullanıcı kaydedildi -> ${archiveFile}\n`);
  } catch (err) {
    fs.appendFileSync(LOG_PATH, `❌ Hata: ${err.message} | ${nowTR()}\n`);
  }

  fs.appendFileSync(LOG_PATH, `✅ Bitti: ${nowTR()}\n`);
}

runScraper();