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
/*    await login(page)*/

    await page.goto('https://ca.betano.com/sport/football/canada/cfl/10116/?bt=2', { waitUntil: 'networkidle0' })

    await OverUnder(page);
    //const analytics = await page.$$(".events-tabs-container__tab__item__button")

    //for (let i = 2; i <= analytics.length; i++) {
    //    await page.$eval(`.events-tabs-container__tab > li:nth-child(${i})`, el => {console.log(el.textContent) })
    //    await Promise.all([
    //        await page.click(`.events-tabs-container__tab > li:nth-child(${i})`),
    //        await page.waitForNavigation()])

    //}
})()

async function OverUnder(page) {

    const teams = await page.$$(`[category="AMFO"]`)
    await page.waitForSelector('.league-block__header__title__name')
    const sport = await page.$eval('.league-block__header__title', el => el.textContent.trim())
    fs.writeFile(`${__dirname}/../excelFiles/Betano/betano${sport}.csv`, "", function (err) {
        if (err) throw err;

    })
    for (const team of teams) {
        const results = await page.evaluate(el => {
            const teamName = el.querySelector(`.event__header__title__link`).textContent.trim()
            const statArray = new Array()
            const stats = el.querySelectorAll(".markets__market")

            for (const stat of stats) {

                const marketTitle = stat.querySelector(".markets__market__header__title").textContent.trim()
                const overUnders = stat.querySelectorAll(".selections__selection")

                for (let i = 0; i < overUnders.length; i += 2) {

                    const over = overUnders[i]
                    const under = overUnders[i + 1]
                    const oddTypeOver = over.querySelectorAll("span")[0].innerText.replace(/(\r\n|\n|\r)/gm, " ");
                    const oddOver = over.querySelectorAll("span")[2].innerText;
                    const oddTypeUnder = under.querySelectorAll("span")[0].innerText.replace(/(\r\n|\n|\r)/gm, " ");
                    const oddUnder = under.querySelectorAll("span")[2].innerText;
                    let result = `Betano, ${teamName}, ${marketTitle}, ${oddTypeOver}, ${oddOver}, ${oddTypeUnder}, ${oddUnder}`
                    statArray.push(result);
                }
            
            }
            return statArray;
        }, team)

        for (const result of results) {
            fs.appendFile(`${__dirname}/../excelFiles/Betano/betano${sport}.csv`, `${result}\n`, function (err) {
                if (err) throw err;

            })
        }

    }
}