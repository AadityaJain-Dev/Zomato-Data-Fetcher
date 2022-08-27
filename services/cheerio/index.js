require('dotenv').config();
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const axiosFunctions = require('../axios/');

/**
 * This function fetches html page which contain all cities names from zomato.
 * get to the script tag which will contain all cities JSON.
 * @returns {Array} citiesList
 */

exports.getAllCitiesData = async () => {
  try {
    const sourceURL = process.env.CITIES_PAGE;
    const html = await axiosFunctions.simpleGetReq(sourceURL);
    const $ = cheerio.load(html);
    const scriptTagContents = $('script').contents();
    let citiesList = [];

    scriptTagContents.each(function () {
      if ($(this).text().length > 5000) {
        citiesList = $(this)
          .text()
          .replaceAll('\n', '')
          .trim()
          .replace('window.__PRELOADED_STATE__ = JSON.parse(', '')
          .replace(');', '');
      }
    });
    citiesList = JSON.parse(JSON.parse(citiesList));
    return citiesList.pages.deliverycities.allO2Cities;
  } catch (error) {
    console.error(
      `Stuff went wrong with getAllCitiesData, error:', error: ${error}`,
    );
  }
};

/**
 * This function open a city page in browser
 * scroll until all restaurants are loaded
 * compile an array with all restaurants data
 * @returns {Array} restaurantsList
 */

exports.getRestaurantListData = async () => {
  try {
    const CITY_URL = process.env.CITY_URL;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setDefaultNavigationTimeout(0);
    await page.setDefaultTimeout(0);
    await page.setExtraHTTPHeaders({
      'sec-ch-ua': '"Chromium";v="105", "Not)A;Brand";v="8"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
    });

    await page.goto(CITY_URL, { waitUntil: 'networkidle0' });

    console.log('fetching restaurants, please be patient, it may take awhile');

    // scroll to Popular localities and wait until request finish
    await page.evaluate(() => {
      const loadingEnded = () => {
        if (document.querySelectorAll('h3').length) {
          return (
            document.querySelectorAll('h3')[
              document.querySelectorAll('h3').length - 1
            ].innerText == 'End of search results'
          );
        }
      };

      const scrollToView = () => {
        document.querySelector('span.city-name').scrollIntoView(false);
        setTimeout(() => {
          loadingEnded() ? '' : scrollToView();
        }, 5000);
        return 'exec finished';
      };
      return scrollToView();
    });

    await page.waitForFunction(
      "document.querySelectorAll('h3').length ? document.querySelectorAll('h3')[((document.querySelectorAll('h3').length) - 1)].innerText == 'End of search results' : ''",
      {},
    );

    const htmlAfterLoadComplete = await page.evaluate(
      () => document.querySelector('*').outerHTML,
    );

    const $ = cheerio.load(htmlAfterLoadComplete);
    const scriptTagContents = $(
      'script[type="application/ld+json"]',
    ).contents();
    let restaurantsList = [];

    const restaurantsListJsonData = scriptTagContents.filter(function () {
      return JSON.parse($(this).text())['@type'] !== 'WebSite';
    });

    if (restaurantsListJsonData.length !== 2) {
      throw `restaurantsListJsonData length is wrong, length: ${restaurantsListJsonData.length}`;
    }

    restaurantsListJsonData.each(function () {
      restaurantsList.push(JSON.parse($(this).text()));
    });

    restaurantsList[0].itemListElement.forEach((listItem) => {
      listItem.name = restaurantsList[1].item[listItem.position - 1].name;
      delete listItem['@type'];
      delete listItem.position;
    });

    await browser.close();
    return restaurantsList[0].itemListElement;
  } catch (error) {
    console.error(
      `Stuff went wrong with getRestaurantListData, error:', error: ${error}`,
    );
  }
};

/**
 * This function fetches html page which contain all menu data of this restaurant.
 * get to the script tag which will contain all menu JSON.
 * extract all necessary details from menu Object
 * @returns {Array} compiledRestaurantData
 */

exports.getRestaurantMenuData = async () => {
  try {
    const RESTAURANT_URL = process.env.RESTAURANT_URL;
    const html = await axiosFunctions.simpleGetReq(RESTAURANT_URL);
    const $ = cheerio.load(html);
    const scriptTagContents = $('script').contents();
    let rawMenuData = { error: 'menu empty' };

    scriptTagContents.each(function () {
      if ($(this).text().length > 5000) {
        rawMenuData = $(this)
          .text()
          .replaceAll('\n', '')
          .trim()
          .replace('window.__PRELOADED_STATE__ = JSON.parse(', '')
          .replace(');', '');
      }
    });

    rawMenuData = JSON.parse(JSON.parse(rawMenuData));

    const restaurant_name = rawMenuData.pages.current.pageTitle.replace(
      ' order online - Zomato',
      '',
    );
    const restaurant_id = rawMenuData.pages.current.resId;

    const restaurant_details = {
      ...rawMenuData.pages.restaurant[restaurant_id].sections
        .SECTION_RES_CONTACT,
    };

    restaurant_details.name = restaurant_name;
    restaurant_details.uuid = restaurant_id;

    const restaurant_menu_sections = rawMenuData.pages.restaurant[
      restaurant_id
    ].navbarSection.filter((navbarSectionItem) => navbarSectionItem.children)[0]
      .children;

    const tempItemsData = [
      ...rawMenuData.pages.restaurant[restaurant_id].order.menuList.menus,
    ];
    const itemsData = [];

    tempItemsData.forEach((itemData) => {
      const categoryDetails = {};
      categoryDetails.name = itemData.menu.name;
      categoryDetails.items = [];
      const tempCategoryItems = itemData.menu.categories[0].category.items;
      tempCategoryItems.forEach((tempCategoryItem) => {
        categoryDetails.items.push(tempCategoryItem.item);
      });

      itemsData.push(categoryDetails);
    });

    const compiledRestaurantData = {};
    compiledRestaurantData.itemsData = itemsData;
    compiledRestaurantData.menuSections = restaurant_menu_sections;
    compiledRestaurantData.details = restaurant_details;

    return compiledRestaurantData;
  } catch (error) {
    console.error(
      `Stuff went wrong with getRestaurantMenuData, error: ${error}`,
    );
  }
};
