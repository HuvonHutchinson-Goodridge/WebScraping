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

    const URLS = ['https://ca.betano.com/sport/football/canada/cfl/10116/?bt=2', 'https://ca.betano.com/sport/esports/competitions/league-of-legends/189377/?bt=1', 'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=3', 'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=4', 'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=5', 'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=6', "https://ca.betano.com/sport/football/canada/cfl/10116/?bt=1"]
    
    for (const URL of URLS) {
        await getData(page, URL);
    }

    
    await browser.close();
    
})()
async function getData(page, URL) {

    await page.goto(URL, { waitUntil: 'networkidle0' })
    const sport = await page.$eval('.events-overview-header__info', el => el.textContent.trim())
    const leagueBlocks = await page.$$(".league-block");
    const eventTab = await page.$eval(".events-tabs-container__tab__item__button.events-tabs-container__tab__item__button--active", el => el.textContent.trim());

    fs.writeFile(`${__dirname}/../excelFiles/Betano/betano${sport}${eventTab.replace(/\//gi, '').replace(" ", "") }.csv`, "", function (err) {
        if (err) throw err;

    })

    for (const block of leagueBlocks) {

        const results = await page.evaluate(el => {
            
            const statsArray = new Array()
            const leagueName = el.querySelector(".league-block__header__title__name").textContent.trim();
            const leagueBlockEvents = el.querySelectorAll(`.league-block__events > div`)
            for (const event of leagueBlockEvents) {

                const eventName = event.querySelector(".event__header__title__link").textContent.trim();
                const eventMarkets = event.querySelectorAll(".markets__market")

                for (const market of eventMarkets) {
                    console.log(market);
                    const marketName = market.querySelector(".markets__market__header__title").textContent.trim();
                    const selections = market.querySelectorAll(".selections")
                
                    for (const select of selections) {
                        const stats = select.querySelectorAll(".selections__selection")
                        let result = `${leagueName}, ${eventName}, ${marketName}`
                        
                        for (const stat of stats) {
                            const title = stat.querySelector(".selections__selection__title").textContent.trim()
                            const odd = stat.querySelector(".selections__selection__odd").textContent.trim()
                            result += `, ${title}, ${odd}`
                            
                        }
                        
                        statsArray.push(result);
                    }
                }
            }

            return statsArray;
        }, block)

        for (const result of results) {
            fs.appendFile(`${__dirname}/../excelFiles/Betano/betano${sport}${eventTab.replace(/\//gi, '').replace(" ", "")}.csv`, `Betano, ${eventTab}, ${result}\n`, function (err) {
                if (err) throw err;

            })
        }
    }
}