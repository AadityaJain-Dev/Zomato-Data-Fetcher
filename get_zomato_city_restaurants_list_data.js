const fs = require('fs');
require('dotenv').config();
const cheerioFunctions = require('./services/cheerio');

const getRestaurantListData = async () => {
  try {
    const dir = './dist';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    if (!!!process.env.CITY_URL) {
      throw `env variable missing, please make sure you have renamed '.env.example' file to '.env'`;
    }

    const current_city_name = process.env.CITY_URL.split('/')[3];

    const allRestaurantsListOfThisCity =
      await cheerioFunctions.getRestaurantListData();

    fs.writeFile(
      `dist/${current_city_name}_restaurants_info.json`,
      JSON.stringify(allRestaurantsListOfThisCity),
      (err) => {
        if (err) {
          console.error('error while writing restaurant_info file', err);
          return;
        }
        //file written successfully
      },
    );
  } catch (error) {
    console.error(
      'some error occurred with executing getRestaurantListData function: ',
      error,
    );
  }
};
getRestaurantListData();
