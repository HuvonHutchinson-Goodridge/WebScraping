const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');

const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: executablePath(),
        defaultViewport: false,
        userDataDir: "./tmp"
    });

    //Opens page on the browser
    const page = await browser.newPage();

    //Goes to a website of your choosing
    await page.goto('https://sportsbook.draftkings.com/leagues/basketball/wnba?wpsrc=Organic%20Search&wpaffn=Google&wpkw=https://sportsbook.draftkings.com/leagues/basketball/wnba&wpcn=leagues&wpscn=basketball/wnba&category=player-points');

    //Wait for relevant elements to appear on screen
    await page.waitForSelector(".event-cell__name-text")
    await page.waitForSelector(".sportsbook-outcome-cell__label-line-container");

    const sportsBookTable = await page.$$(".sportsbook-table");

    //Iterate over each table 
    for (const book of sportsBookTable) {

        //Parse the date of the fight
        const fightDate = await page.evaluate((el) => el.querySelector("thead > tr > th.always-left.column-header > div > span > span").textContent, book)

        //Extract relevant data from every row
        const bookRows = await page.evaluate((el) => {
            const row = Array.from(el.querySelectorAll(".sportsbook-table__body > tr"));
            const rowText = new Array();
            for (let i = 0; i < row.length; i++) {
                const r = row[i]
                const time = r.querySelector(".event-cell__start-time").textContent
                const name = r.querySelector(".event-cell__name-text").textContent
                const odd = r.querySelector(".sportsbook-outcome-body-wrapper > div:nth-child(1)").textContent
                const oddNum = r.querySelector(".sportsbook-odds").textContent
                if (odd[0] === "O" || odd[0] === "U") {
                    rowText.push([time, name, odd, oddNum])
                }
            }
            return rowText;
        }, book)

        //Extract append revelant data to file;
        for (const [time, name, odd, oddNum] of bookRows) {
            fs.appendFile(`${__dirname}/../excelFiles/draftKings.csv`, `Draft Kings, ${fightDate}, ${time}, ${name}, ${odd}, ${oddNum}\n`, function (err) {
                if (err) throw err
            })
        }

    }
    /*await browser.close()*/
})()