const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUA = require('modern-random-ua');

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('chrome.runtime')
stealth.enabledEvasions.delete('iframe.contentWindow')

puppeteer.use(stealth);

const VIEWPORT = { width: 1200, height: 900 };
const BET365 = 'https://www.bet365.com/#/AS/B92/';

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

const escapeXpathString = str => {
    const splitedQuotes = str.replace(/'/g, `', "'", '`);
    return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
    const escapedText = escapeXpathString(text);
    const linkHandlers = await page.$x(`//span[contains(text(), ${escapedText})]`);

    if (linkHandlers.length > 0) {
        await linkHandlers[0].click();
    } else {
        throw new Error(`Link not found: ${text}`);
    }
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--disable-infobars",
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
        ignoreDefaultArgs: ["--enable-automation"],
    });

    const page = (await browser.pages())[0];
    await page.evaluateOnNewDocument(() => {
        delete navigator.__proto__.webdriver;
        Object.defineProperty(navigator, 'maxTouchPoints', {
            get() {
                return 1;
            },
        });
        navigator.permissions.query = i => ({ then: f => f({ state: "prompt", onchange: null }) });

    });

    await page.viewport(VIEWPORT);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36');
    // await page.setUserAgent(randomUA.generate());

    const client = await page.target().createCDPSession()
    await client.send('Network.clearBrowserCookies')

    await page.goto(BET365, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);

    await clickByText(page, `Setka Cup`);
    await page.waitForTimeout(2230);

    await page.screenshot({ path: '1.png' });
    console.log("screenshot 1");


})()