const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');

//Use clusters to scrape multiple pages at once
(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 100,
        monitor: true,
        puppeteerOptions: {
            headless: false,
            defaultViewport: false,

            userDataDir: "./tmp"
        }
    }
    )
    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`)
    });

    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url);

        let isBtnDisabled = false;
        while (isBtnDisabled === false) {
            await page.waitForSelector(".a-section.a-spacing-base", { visible: true })
            const productHandles = await page.$$('div.s-main-slot.s-result-list.s-search-results.sg-row > .s-result-item')

            for (const productHandle of productHandles) {

                if (!isBtnDisabled) {
                    let title = null;
                    let price = null
                    let image = null
                    try {
                        image = await page.evaluate(el => el.querySelector('.s-image').getAttribute('src'), productHandle)
                    } catch (err) { }
                    try {
                        title = await page.evaluate(el => el.querySelector('h2 > a > span').textContent, productHandle)
                    } catch (err) { }
                    try {
                        price = await page.evaluate(el => el.querySelector('.a-price > span.a-offscreen').textContent, productHandle);
                    } catch (err) { }
                    if (!title || !price) continue;
                    fs.appendFile('results.csv', `${title.replace(/,/g, ".")}, ${price}, ${image}\n`, function (err) {
                        if (err) throw err;
                        console.log('saved')
                    })
                }
            }
            await page.waitForSelector(".s-pagination-item.s-pagination-next", { visible: true })
            const is_disabled = await page.$('.s-pagination-next.s-pagination-disabled') !== null

            isBtnDisabled = is_disabled;

            if (!is_disabled) {
                await Promise.all([
                    page.click(".s-pagination-item.s-pagination-next"),
                    page.waitForNavigation({ waitUntil: "networkidle2" })
                ])
            }

        }
    })

    for (const url of urls) {
        cluster.queue(url)
    }

    //await cluster.idle();
    //await cluster.close();
})();

const urls = [`https://www.amazon.com/s?k=hell+cat+pro+holster+joy&crid=2GGMX4DVZXTM8&sprefix=hell+cat+pro+holster+joy+%2Caps%2C64&ref=nb_sb_noss`, `https://www.amazon.com/s?k=gun+holster+for+sniper&crid=144PLHDDF6AD3&sprefix=gun+holster+for+sniper%2Caps%2C77&ref=nb_sb_noss_2`]