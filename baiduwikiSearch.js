import plugin from '../../lib/plugins/plugin.js'
import puppeteer from 'puppeteer';


export class baidu extends plugin {
  constructor() {
    super({
      name: '百度百科',
      dsc: '搜索选项',
      event: 'message',
      priority: 5000,
      rule: [
        /** 命令正则匹配 */
        {
          reg: "^#搜索(.*)$",  //匹配消息正则，命令正则
          fnc: "baiDuSearch" //【命令】功能说明
        }
      ]
    })
    this.cookie = new Map()
  }


  async baiDuSearch(e) {

    //初始化操作

    const browser = await puppeteer.launch({
      // 是否为无头浏览器模式，默认为无头浏览器模式
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();
    await page.goto(`https://baike.baidu.com/item/${encodeURI(e.msg.split("搜索")[1])}?fromModule=lemma_search-box`)


    try {
      const botAnswer = await page.$eval('body>.body-wrapper>.content-wrapper>.content>.main-content>.lemma-summary', el => el.innerText);
      e.reply(botAnswer);
      await browser.close();
      return;
    } catch (e) {

    }

    try {
      const botAnswer = await page.$eval('body>.body-wrapper>.feature_poster>.poster>.con>.desc', el => el.innerText);
      e.reply(botAnswer);
      await browser.close();
      return;
    } catch (e) {

    }

    try {
      const botAnswer = await page.$eval('body>.body-wrapper>.feature-poster>.feature-poster-bg>.layout>.poster-top>.lemmaWgt-lemmaSummary', el => el.innerText);
      e.reply(botAnswer);
      await browser.close();
      return;
    } catch (e) {

    }

    try {
      const botAnswer = await page.$eval('body>.body-wrapper>.content-wrapper>.content>.main-content >ul', el => {
        var ans = '';
        var tags = el.getElementsByTagName("li");
        for (var i = 0; i < tags.length; i++) {
          ans += `[${i}]`
          ans += tags[i].innerText
          ans += "\n"
        }
        return ans
      });


      await e.reply(botAnswer)
      await redis.set("lyl::baiduSearch::" + e.user_id, `https://baike.baidu.com/item/${encodeURI(e.msg.split("搜索")[1])}?fromModule=lemma_search-box`)
      await this.setContext('delAgain')
      await e.reply('共有多项搜索结果,请回答序号(数字)跳转搜索', false, { at: true })
      await browser.close();
      return;
    } catch (error) {
      logger.mark(error)
    }



    e.reply("可能是出BUG了,也可能是百度百科没有这个词条，还有可能是比较特殊的关键词，诶嘿😋")
    await browser.close();
  }



  async delAgain() {

    var oldUrl = await redis.get("lyl::baiduSearch::" + this.e.user_id)
    const browser = await puppeteer.launch({
      // 是否为无头浏览器模式，默认为无头浏览器模式
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
      ]
    });
    const page = await browser.newPage();
    await page.goto(oldUrl)
    var newNumber = Number(this.e.message[0].text)
    var newUrl = await page.$eval('body>.body-wrapper>.content-wrapper>.content>.main-content >ul', (el) => {
      var ans = '';
      var newTages = el.getElementsByTagName("a");
      for (var i = 0; i < newTages.length; i++) {
        ans += "lyl"
        ans += el.getElementsByTagName("a")[i].href;
      }
      ans += "lyl"

      return ans
    });
    newUrl = newUrl.split("lyl")[newNumber + 1]
    await page.goto(newUrl)
    const botAnswer = await page.$eval('body>.body-wrapper>.content-wrapper>.content>.main-content>.lemma-summary', el => el.innerText);
    await this.reply(botAnswer);
    await browser.close();
    await this.finish("delAgain");
    return;

  }
}
