const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        userDataDir: "./tmp"
    });
    const page = await browser.newPage();

    await page.goto('https://www.amazon.com/s?k=samsung+galaxy+s22+ultra+waterproof+case&page=20&crid=2HV3OVJZRI6EO&qid=1685732679&sprefix=%2Caps%2C65&ref=sr_pg_20',
        {waitUntil: "load"}
    );

    const is_disabled = await page.$('.s-pagination-next.s-pagination-disabled') !== null

    console.log(is_disabled)
    /*await browser.close();*/
})();