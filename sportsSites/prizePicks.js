const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');

const fs = require('fs');

puppeteer.use(StealthPlugin());

(async function getData(){
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: executablePath(),
        defaultViewport: false,
        userDataDir: "./tmp"
    });

    
    //Opens page on the browser
    const page = await browser.newPage();
    await page.goto('https://app.prizepicks.com/?__cf_chl_tk=TgXGr1Bl4p4x_ts1aStS7mz3.qY1M73TddyjpXDwmFg-1686773123-0-gaNycGzNEFA');
    async function prizePicker() {
        //Goes to a website of your choosing
        
       
        //Get sport buttons
        const sportsButtons = await page.$$(`div.league`)

        //Iterate over all buttons to get length
        for (let i = 1; i <= sportsButtons.length; i++) {

            //Click on every button 
            await page.click(`.container div.league:nth-child(${i})`)

            //Get selected buttons to know what page you are on
            const selectedButton = await page.$(`.league.selected`)

            //Get name of page based on button
            const sport = await page.evaluate((el) => {
                const name = el.querySelector('.name').textContent
                return name;
            }, selectedButton);

            fs.writeFile(`${__dirname}/../excelFiles/PrizePicks/prizePicks${sport}.csv`, "BettingSite, Date, PlayerName, Score, ScoreType\n", function (err) {
                if (err) throw err;

            })
            //Make sure that the score is on page
            await page.waitForSelector(".score")

            //Get the buttons for different types of stats
            const statButtons = await page.$$(`.stat`)

            //Iterate over those buttons and click
            for (let i = 1; i <= statButtons.length; i++) {
                await page.click(`.stat-container div.stat:nth-child(${i})`)

                //Get all of the players on the page and iterate over them
                const playerNames = await page.$$(".proj-container")

                //Extract data
                for (const player of playerNames) {

                    let score = null
                    let playerName = null;
                    let typeScore = null;
                    let date = null;

                    try {
                        date = await page.evaluate(el => el.querySelector(".date").textContent.replace(/,/gi, ""), player)
                    } catch (err) {

                    }
                    if (date.startsWith("Start")) {
                        continue;
                    }
                    try {
                        playerName = await page.evaluate(el => el.querySelector(".player-container .player .name").textContent, player)

                    } catch (err) {

                    }

                    try {
                        score = await page.evaluate(el => el.querySelector(".projected-score .score .strike-red").textContent, player)
                    } catch (err) {

                    }

                    try {
                        typeScore = await page.evaluate(el => el.querySelector(".projected-score .text").textContent, player)
                    } catch (err) {

                    }

                   
                    fs.appendFile(`${__dirname}/../excelFiles/PrizePicks/prizePicks${sport}.csv`, `PrizePicks, ${date}, ${playerName}, ${score}, ${typeScore}\n`, function (err) {
                        if (err) throw err;

                    })

                }



            }
        }
        
    }

    setInterval(prizePicker, 30000)
    
    //Close the browser
    /*await browser.close()*/
})()



