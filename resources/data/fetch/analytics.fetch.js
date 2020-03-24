const async = require('async');
const Logger = require('../../../logs/logger.log');
const axios = require('axios');
const Authenticate = require('../../../auth/system.auth');
const DataExchange = require('../../data/send/data.send');

class Analytics {
    /**
     * 
     */
    constructor() { }

    /**
       *
       */
    getAnalytics = async (analyticsURLS, systemNameId) => {
        const dataExchange = new DataExchange();
        const logger = new Logger();
        if (analyticsURLS) {
            try {
                await new Promise((resolve, reject) => {
                    async.mapLimit(
                        analyticsURLS,
                        1,
                        async.reflect(dataExchange.migrateData),
                        (err, result) => {
                            resolve(result);
                        }
                    );
                });
            } catch (error) {
                logger.printLogMessageInConsole('error', error);
            }
        }
    };

}

module.exports = Analytics;
