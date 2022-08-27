const axios = require('axios').default;

// const headers = {
//   'user-agent': '',
// };
const headers = {};

/**
 *
 * @param {String} destUrl - Make a get request to this URL
 * @returns {String} - GET request response
 */

exports.simpleGetReq = async (destUrl) => {
  try {
    return (await axios.get(destUrl)).data;
  } catch (error) {
    console.error(`Stuff went wrong with simpleGetReq, error: ${error}`);
  }
};
