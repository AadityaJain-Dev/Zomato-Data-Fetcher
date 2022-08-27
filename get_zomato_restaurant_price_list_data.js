const fs = require('fs');
const cheerioFunctions = require('./services/cheerio');

const getRestaurantMenuData = async () => {
  try {
    const dir = './dist';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    if (!!!process.env.RESTAURANT_URL) {
      throw `env variable missing, please make sure you have renamed '.env.example' file to '.env'`;
    }

    const restaurant_url = `${Math.floor(Math.random() * 100 + 1)}_${
      process.env.RESTAURANT_URL.split('/')[4]
    }`;

    const menuForThisRestaurant =
      await cheerioFunctions.getRestaurantMenuData();
    fs.writeFile(
      `dist/${restaurant_url}.json`,
      JSON.stringify(menuForThisRestaurant),
      (err) => {
        if (err) {
          console.error('error while writing menu_restaurant_info file');
          return;
        }
        //file written successfully
      },
    );
  } catch (error) {
    console.error(
      'some error occurred with executing getRestaurantMenuData function: ',
      error,
    );
  }
};
getRestaurantMenuData();
