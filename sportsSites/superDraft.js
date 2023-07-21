const dotenv = require('dotenv');
dotenv.config({ path: `./../config.env` });

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

    //Override the geolocation 
    await login(page)

    await page.goto('https://superdraft.io/lobby/', { waitUntil: 'networkidle0' })

    

    //await browser.close();

})()

async function login(page) {
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
    await page.goto('https://superdraft.io/lobby/', { waitUntil: 'networkidle0' });
    console.log(process.env.SD_EMAIL)
    await page.type('#exampleEmail', process.env.SD_EMAIL)
    await page.type('#examplePassword', process.env.SD_PASSWORD)
    console.log(await page.$(".recaptcha-checkbox-border"))
    await Promise.all([
        page.click('.loginCTAButton'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}




