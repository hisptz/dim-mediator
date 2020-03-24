
const axios = require('axios');
class DataValueManagement {
    constructor() { }

    /**
         *
         */
    getAnalyticsResults = async (analyticsURL, systemAuth) => {
        return await new Promise(async (resolve, reject) => {
            const results = await axios.get(analyticsURL, systemAuth);
            if (results) {
                resolve(results.data);
            } else {
                reject(results.data);
            }
        });
    };

    /**
         *
         */
    getDataValuesImportTemplates = () => {
        console.log("I'M HERE");
        return {
            completeDate: date.format(new Date(), 'YYYY-MM-DD'),
            period: '',
            dataValues: [],
        };
    };
}

module.exports = DataValueManagement;
