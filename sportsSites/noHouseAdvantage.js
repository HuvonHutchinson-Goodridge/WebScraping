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
        executablePath: executablePath(),
        defaultViewport: false,
        userDataDir: "./tmp"
    });
    
    //Opens page on the browser
    const page = await browser.newPage();

    //Override the geolocation 
    await login(page)

    await page.goto('https://web.nohouseadvantage.com/vs-the-house', { waitUntil: 'networkidle0' })

    await page.waitForSelector(".nameBox");
    const sports = await page.$$(".pickem-filters__btn.league.ng-star-inserted")

    for (let i = 1; i <= sports.length; i++) {
        await page.click(`.pickem-filters__btn.league.isSelected.ng-star-inserted:nth-child(${i})`)
        const sport = await page.$eval(`.pickem-filters__btn.league.isSelected.ng-star-inserted:nth-child(${i})`, el => {
            return el.textContent.replace(/[0-9]/gi, "")
        })

        const players = await page.$$("div > app-player-card")
        
        playerloop: for (const player of players) {

            const cards = await page.evaluate((el) => {
                const rowText = new Array();
                const name = el.querySelector(".nameBox").textContent
                const team = el.querySelector(".teamLabel.labelAway.hometeam.ng-star-inserted").textContent
                const time = el.querySelector(".timeSpan").textContent
                
                el.querySelector(".flex-col.alignCenter.justifyStart.cardContainer").click()

                const stats = el.querySelectorAll("app-player-prop-button");
                
                let result = `${name}, ${team}, ${time}`.trim()
                for (const stat of stats) {
                    result += `, ${stat.textContent}`
                }

                el.querySelector(".mat-icon.notranslate.material-icons.mat-icon-no-color").click();
                rowText.push(result)
                console.log(result)
                return rowText;
            }, player)

            for (const card of cards) {
                fs.appendFile(`${__dirname}/../excelFiles/NoHouseAdvantage/NoHouseAdvantage${sport}.csv`, `No House Advantage, ${card}\n`, function (err) {
                    if (err) throw err
                })
            }
        }

        

    }
    
    await browser.close();
   

})()

async function login(page) {
    //await page.evaluateOnNewDocument(function () {
    //    navigator.geolocation.getCurrentPosition = function (cb) {
    //        setTimeout(() => {
    //            cb({
    //                'coords': {
    //                    accuracy: 21,
    //                    altitude: null,
    //                    altitudeAccuracy: null,
    //                    heading: null,
    //                    latitude: 40.712776,
    //                    longitude: -74.005974,
    //                    speed: null
    //                }
    //            })
    //        }, 1000)
    //    }
    //});

    //Goes to a website of your choosing
    if (false) {
        await page.goto('https://web.nohouseadvantage.com/login', { waitUntil: 'networkidle0' });

        await page.waitForSelector(".mat-form-field-flex")

        await page.type('.mat-input-element.mat-form-field-autofill-control.ng-untouched.ng-pristine.ng-invalid.cdk-text-field-autofill-monitored.ng-star-inserted', process.env.NHA_USERNAME)
        await page.type(".mat-input-element.mat-form-field-autofill-control.ng-tns-c58-1.ng-untouched.ng-pristine.ng-invalid.cdk-text-field-autofill-monitored", process.env.NHA_PASSWORD)

        await Promise.all([
            page.click('.btn-send-success.btn-signin.ng-star-inserted'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    }
}
