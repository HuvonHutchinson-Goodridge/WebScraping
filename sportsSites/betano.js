const { addExtra } = require('puppeteer-extra');
const VanillaPuppeteer = require("puppeteer");
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');
const { Cluster } = require("puppeteer-cluster");
const fs = require('fs');

//Use clusters to scrape multiple pages at once
(async () => {
    const puppeteer = addExtra(VanillaPuppeteer);
    puppeteer.use(StealthPlugin());

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 100,
        monitor: true,
        puppeteerOptions: {
            headless: false,
            defaultViewport: false,
            executablePath: executablePath(),
            userDataDir: "./tmp",
        },
        timeout: 100000,
    }
    )

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`)
    });



    await cluster.task(async ({ page, data: url }) => {
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await getData(page);
    }
    )

    const URLS = ['https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=2',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=3',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=4',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=5',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=6',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=7',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=8',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=9',
        'https://ca.betano.com/sport/tennis/competitions/atp/11307/?bt=10',
        'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=2',
        'https://ca.betano.com/sport/esports/competitions/league-of-legends/189377/?bt=1',
        'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=3',
        'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=4',
        'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=5',
        'https://ca.betano.com/sport/football/canada/cfl/10116/?bt=6',
        "https://ca.betano.com/sport/football/canada/cfl/10116/?bt=1",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=2",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=3",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=4",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=5",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=6",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=7",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=8",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=9",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=10",
        "https://ca.betano.com/sport/tennis/competitions/wta/10003/?bt=11"]

    for (const url of URLS) {
        cluster.queue(url)
    }

    await cluster.idle();
    await cluster.close();

})();

async function getData(page) {
    try {
        await page.waitForSelector('.events-overview-header__info', {timeout: 100000})
    } catch (err) {

    }
    const sport = await page.$eval('.events-overview-header__info', el => el.textContent.trim())
    const leagueBlocks = await page.$$(".league-block");
    const eventTab = await page.$eval(".events-tabs-container__tab__item__button.events-tabs-container__tab__item__button--active", el => el.textContent.trim());

    fs.writeFile(`${__dirname}/../excelFiles/Betano/betano${sport}${eventTab.replace(/\//gi, '').replace(" ", "")}.csv`, "BettingSite, Event Tab, League, Event, Market, Stats\n", function (err) {
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
                    const marketName = market.querySelector(".markets__market__header__title").textContent.trim();
                    const selections = market.querySelectorAll(".selections")

                    for (const select of selections) {
                        const stats = select.querySelectorAll(".selections__selection")
                        

                        for (const stat of stats) {
                            let result = `${leagueName.replace(/,/gi, "")}, ${eventName.replace(/,/gi, "")}, ${marketName.replace(/,/gi, "") },`
                            const title = stat.querySelector(".selections__selection__title").textContent.trim()
                            const odd = stat.querySelector(".selections__selection__odd").textContent.trim()
                            result += ` ${title} ${odd}`.replace(/,/gi, "")
                            statsArray.push(result);
                        }

                        
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