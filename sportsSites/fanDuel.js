const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config({ path: `./../config.env` });

const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
    });

    //Opens page on the browser
    const page = await browser.newPage();

    //Override the geolocation 
    /*await login(page)*/

    await page.goto('https://account.sportsbook.fanduel.com/login', { waitUntil: 'networkidle0' })

    await page.click(`[data-test-id="state-selection--AZ"]`)

    await login(page)
    await dismissLocation(page);
    await boxing(page)
})()

async function boxing(page) {

    await page.goto('https://sportsbook.fanduel.com/boxing', { waitUntil: 'networkidle0' })
    await dismissLocation(page);

    const duels = await page.$$(".am.aq.ao.ap.bl.bm.af.dg.s.ez.fg.fh.cc.h.i.j.ah.ai.m.aj.o.ak.q.al");
    console.log(duels);
    const results = new Array();
    for (const duel of duels) {
        const result = await page.evaluate((el) => {
            const name1 = el.querySelector("div > a > div:nth-child(1)").textContent;
            const name2 = el.querySelector("div > a > div:nth-child(3)").textContent
            const odds1 = el.querySelector("div > div > div > div:nth-child(2) > div:nth-child(1)").textContent
            const odds2 = el.querySelector("div > div > div > div:nth-child(2) > div:nth-child(2)").textContent
            const date = el.querySelector("time").textContent
            return `Boxing, ${date}, ${name1}, ${odds1}, ${name2}, ${odds2}`
            
        }, duel)
        results.push(result);
    }

    for (const result of results) {
        fs.appendFile(`${__dirname}/../excelFiles/FanDuel/fanDuelBoxing.csv`, `${result}\n`, function (err) {
            if (err) throw err;

        })
    }
}
async function login(page) {
    /*await page.goto('https://web.nohouseadvantage.com/login', { waitUntil: 'networkidle0' });*/

    await page.waitForSelector(`[data-test-id="login-link-create"]`)


    await page.type('#login-email', process.env.FD_EMAIL)
    await page.type("#login-password", process.env.FD_PASSWORD)

    await Promise.all([
        page.click('[data-test-id="button-submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}

async function dismissLocation(page) {
    await page.waitForSelector("[aria-label='Dismiss modal'] > div");
    await page.click("[aria-label='Dismiss modal'] > div")
}