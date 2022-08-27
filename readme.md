# Zomato Data Fetcher

These scripts can be used to fetch various types of data from zomato website.

## Prerequisite

- npm / yarn

## Installation for npm users

```bash
npm install
```

## Installation for yarn users

```bash
yarn install
```

## Usage

Fetch the list of all the cities in which zomato delivers. The output will be available inside the `dist` folder

```bash
node get_zomato_all_cities_data
```

Fetch the list of all the restaurants which are registered with zomato in the city you defined inside the `.env` file. The output will be available inside the `dist` folder.

```bash
node get_zomato_city_restaurants_list_data
```

Fetch the menu of the restaurant you defined inside the `.env` file. The output will be available inside the `dist` folder.

```bash
node get_zomato_restaurant_price_list_data
```

## Contributions

Pull requests are welcome.

## License

[MIT](https://choosealicense.com/licenses/mit/)
