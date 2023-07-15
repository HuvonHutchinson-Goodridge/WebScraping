const dotenv = require('dotenv');
dotenv.config({ path: `./config.env` });

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

    await page.goto('https://underdogfantasy.com/pick-em/higher-lower', { waitUntil: 'networkidle0' })

    await page.waitForSelector(".styles__sportButton__f6DxK")
    const sports = await page.$$("div.styles__sportSelectorContainer__KE2Y5.styles__vertical__IdVDd > div > button.styles__sportButton__f6DxK.styles__vertical__uBih0")

    for (let i = 2; i <= sports.length; i++) {

        const is_disabled = await page.$eval(`.styles__sportButton__f6DxK:nth-child(${i})`, el => {
            return el.disabled
        })

        if (is_disabled) {
            continue;
        }

        await page.click(`.styles__sportButton__f6DxK:nth-child(${i})`)
        const currentSport = await page.$eval(`.styles__sportButton__f6DxK.styles__active__LLHaR`, (el) => {
            return el.textContent;
        });
        const accordions = await page.$$(".styles__accordion__bInXb.styles__accordionWrapper__boe45")
        if (accordions.length !== 0) {
            await accordionPicks(accordions, currentSport, page)
        } else {
            await picks(currentSport, page);
        }
        
        

    }

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
    await page.goto('https://underdogfantasy.com/lobby/pga/d674a90a-64bc-45a3-afc4-9f5294041b83', { waitUntil: 'networkidle0' });

    await page.type('[data-testid="email_input"]', process.env.UD_EMAIL)
    await page.type('[data-testid="password_input"]', process.env.UD_PASSWORD)

    await Promise.all([
        page.click('[data-testid="sign-in-button"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}
async function accordionPicks(accordions, currentSport, page) {
    try {
        for (const accordion of accordions) {

            //Extract relevant data from every row
            const cards = await page.evaluate((el) => {
                const players = Array.from(el.querySelectorAll(".styles__overUnderCell__KgzNn"));
                const rowText = new Array();
                const game = el.querySelector(".styles__titleContainer__vu4Qg").textContent;

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
                console.log(currentSport)
                fs.appendFile(`${__dirname}/../excelFiles/UnderdogFantasy/underdogFantasy${currentSport}.csv`, `Underdog Fantasy, ${card}\n`, function (err) {
                    if (err) throw err;

                })
            }

        }
    } catch (err) {
        console.log(err);
    }
}

async function picks(currentSport, page) {
    try {
        //await page.waitForSelector(".styles__pickEmButton__OS_iW", {
        //    timeout: 100
        //})
        const allPicks = await page.$$eval(".styles__overUnderCell__KgzNn", allPicks => {
            const rowText = new Array();

            for (const pick of allPicks) {
                const name = pick.querySelector(".styles__playerName__jW6mb").textContent
                
                const statRows = Array.from(pick.querySelectorAll(".styles__statLineRow__ybjNF"));
                let result = name + ",";
                for (const stat of statRows) {
                    result += ` ${stat.textContent}`
                }
                rowText.push(result)
            }
            return rowText;
        });

        for (const pick of allPicks) {
            fs.appendFile(`${__dirname}/../excelFiles/UnderdogFantasy/underdogFantasy${currentSport}.csv`, `Underdog Fantasy, ${pick}\n`, function (err) {
                if (err) throw err;

            })
        }
    } catch (err) {
        console.log(err);
    }
}



