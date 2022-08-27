const fs = require('fs');
const cheerioFunctions = require('./services/cheerio');

const getAllCitiesData = async () => {
  try {
    const dir = './dist';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    if (!!!process.env.CITIES_PAGE) {
      throw `env variable missing, please make sure you have renamed '.env.example' file to '.env'`;
    }

    const allCityData = await cheerioFunctions.getAllCitiesData();
    fs.writeFile(
      'dist/cities_info.json',
      JSON.stringify(allCityData),
      (err) => {
        if (err) {
          console.error('error while writing cities_info file');
          return;
        }
        //file written successfully
      },
    );
  } catch (error) {
    console.error(
      'some error occurred with executing getAllCitiesData function: ',
      error,
    );
  }
};
getAllCitiesData();
