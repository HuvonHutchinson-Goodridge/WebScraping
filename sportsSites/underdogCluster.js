const { addExtra } = require('puppeteer-extra');
const VanillaPuppeteer = require("puppeteer");
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');
const { Cluster } = require("puppeteer-cluster");
const proxyChain = require('proxy-chain');
const fs = require('fs');

//Use clusters to scrape multiple pages at once
(async () => {
    const puppeteer = addExtra(VanillaPuppeteer);
    puppeteer.use(StealthPlugin());

    //const oldProxyUrl = 'http://47.56.110.204:8989';

    //const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
    //console.log(newProxyUrl);
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 100,
        monitor: true,
        puppeteerOptions: {
            headless: false,
            defaultViewport: false,
            executablePath: executablePath(),
            userDataDir: "./tmp",
            //args: [
            //    `--proxy-server=${newProxyUrl}`
            //]
        }
    }
    )

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`)
    });



    await cluster.task(async ({ page, data: url }) => {
        await page.goto(`https://underdogfantasy.com/login`);
        await login(page);
        await page.goto(url);

        try {
            await page.waitForSelector(".styles__pickEmButton__OS_iW")


            const accordions = await page.$$(".styles__accordion__bInXb.styles__accordionWrapper__boe45")

            for (const accordion of accordions) {

                //Extract relevant data from every row
                const cards = await page.evaluate((el) => {
                    const players = Array.from(el.querySelectorAll(".styles__overUnderCell__KgzNn"));
                    const rowText = new Array();

                    const game = el.querySelector(".styles__titleContainer__vu4Qg").textContent;
                    console.log(game);

                    for (let i = 0; i < players.length; i++) {
                        const player = players[i];
                        const name = player.querySelector(".styles__playerName__jW6mb").textContent

                        const statRows = Array.from(player.querySelectorAll(".styles__statLineRow__ybjNF"));
                        let result = game + ', ' + name + ",";
                        for (const stat of statRows) {
                            result += ` ${stat.textContent}`
                        }
                        rowText.push(result)
                    }

                    return rowText;
                }, accordion)

                for (const card of cards) {
                    fs.appendFile(`${__dirname}/../excelFiles/underdogFantasyMLB.csv`, `Underdog Fantasy, ${card}\n`, function (err) {
                        if (err) throw err;

                    })
                }

            }
        } catch (err) {
            console.log(err);
        }
    }
    )

    const urls = [`https://underdogfantasy.com/pick-em/higher-lower/tennis`,
        `https://underdogfantasy.com/pick-em/higher-lower/basketball`,
        `https://underdogfantasy.com/pick-em/higher-lower/wnba`,
        `https://underdogfantasy.com/pick-em/higher-lower/pga`,
        `https://underdogfantasy.com/pick-em/higher-lower/kbo`,
        `https://underdogfantasy.com/pick-em/higher-lower/golf`,
        `https://underdogfantasy.com/pick-em/higher-lower/soccer`,
        `https://underdogfantasy.com/pick-em/higher-lower/esports`]

    for (const url of urls) {
        cluster.queue(url)
    }

    await cluster.idle();
    await cluster.close();

})();



async function login(page) {

    //Override the geolocation 
    await page.evaluateOnNewDocument(function () {
        navigator.geolocation.getCurrentPosition = function (cb) {
            setTimeout(() => {
                cb({
                    'coords': {
                        accuracy: 21,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        latitude: 40.712776,
                        longitude: -74.005974,
                        speed: null
                    }
                })
            }, 1000)
        }
    });

    //Goes to a website of your choosing
    await page.waitForSelector('[data-testid="email_input"]')
    await page.type('[data-testid="email_input"]', process.env.UD_EMAIL)
    await page.type('[data-testid="password_input"]', process.env.UD_PASSWORD)

    await Promise.all([
        page.click('[data-testid="sign-in-button"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}