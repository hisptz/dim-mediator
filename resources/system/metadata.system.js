/***
 *
 */
const _ = require('lodash');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');

/***
 *
 */
const MediatorService = require('../../services/mediator.service');
const APIService = require('../../services/api.service');
const Utilities = require('../../utils/utils');
const Logger = require('../../logs/logger.log');
const Authenticate = require('../../auth/system.auth');
const AuthConfig = require('../../config/auth.config');
const APIAuthConfig = require('../../config/api-auth.config');

/***
 *
 */
class MetadataManager {
    /***
     *
     */
    constructor() {}

    /***
     *
     */
    getActiveSystemPeriodDimension = async (
        appGlobalConfig,
        activeSystem,
        activeBatch,
        activeJob
    ) => {
        /***
         *
         */
        if (!activeBatch) {
            /***
             *
             */
            return await _.flatten(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][activeJob].pe.periods,
                    period => {
                        return appGlobalConfig[activeSystem][activeBatch][activeJob].pe
                            .subPeriods.length > 0 ?
                            _.map(
                                appGlobalConfig[activeSystem][activeBatch][activeJob].pe
                                .subPeriods,
                                subPeriod => {
                                    return period + subPeriod;
                                }
                            ) :
                            _.has(period, 'id') ? period.id : period;
                    }
                )
            );
        } else {
            /***
             *
             */
            return await _.flatten(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][activeJob].pe.periods,
                    period => {
                        return appGlobalConfig[activeSystem][activeBatch][activeJob].pe
                            .subPeriods.length > 0 ?
                            _.map(
                                appGlobalConfig[activeSystem][activeBatch][activeJob].pe
                                .subPeriods,
                                subPeriod => {
                                    return period + subPeriod;
                                }
                            ) :
                            _.has(period, 'id') ? period.id : period;
                    }
                )
            );
        }
    };

    /***
     *
     */
    getActiveSystemDataDimension = (
        appGlobalConfig,
        activeSystem,
        activeBatch,
        activeJob
    ) => {
        /***
         *
         */
        if (activeBatch) {
            /***
             *
             */
            return _.chunk(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][activeJob].dx.data,
                    data => {
                        return data;
                    }
                ),
                50
            );
        } else {
            /***
             *
             */
            return _.chunk(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][activeJob].dx.data,
                    data => {
                        return data;
                    }
                ),
                50
            );
        }
    };

    /***
     *
     */
    prepareAnalyticsURLForDataFetch = async (
        activeSystem,
        activeBatch,
        activeJob,
        orgUnits,
        data,
        periods,
        apiFromURL
    ) => {
        /***
         *
         */
        const mediatorService = new MediatorService();
        const utilities = new Utilities();
        const logger = new Logger();
        let apiURLPathFile = '';
        /***
         *
         */
        if (activeJob) {
            apiURLPathFile = path.join(
                process.cwd(),
                'private',
                'log',
                activeSystem,
                activeBatch,
                activeJob,
                'fetch.txt'
            );
        } else {
            /***
             *
             */
            apiURLPathFile = path.join(
                __dirname,
                'private',
                'log',
                activeSystem,
                'fetch.txt'
            );
        }

        /***
         *
         */
        if ((await activeSystem) && (await orgUnits) && (await periods)) {
            /***
             *
             */
            for (const period of await periods) {
                /***
                 *
                 */
                for (const orgUnit of await orgUnits) {
                    const formattedOU = utilities.joinBySymbol(orgUnit, ';');
                    /***
                     *
                     */
                    for (const elements of await data) {
                        /***
                         *
                         */
                        for (const dxProps of await elements) {
                            /***
                             *
                             */
                            const formattedURL = await mediatorService.generateAnalyticsURL(
                                activeSystem,
                                apiFromURL,
                                period,
                                formattedOU,
                                dxProps
                            );

                            /***
                             *
                             */
                            try {
                                fs.open(apiURLPathFile, 'a', (err, fd) => {
                                    if (err)
                                        logger.printLogMessageInConsole(
                                            'error',
                                            err,
                                            activeSystem
                                        );
                                    try {
                                        fs.appendFile(
                                            apiURLPathFile,
                                            `${formattedURL}\r\n`,
                                            err => {
                                                if (err)
                                                    logger.printLogMessageInConsole(
                                                        'error',
                                                        err,
                                                        activeSystem
                                                    );
                                            }
                                        );
                                    } catch (error) {
                                        logger.printLogMessageInConsole(
                                            'error',
                                            error,
                                            activeSystem
                                        );
                                    }
                                });
                            } catch (error) {
                                logger.printLogMessageInConsole('error', error, activeSystem);
                            }
                        }
                    }
                }
            }
        }
    };

    prepareAnalyticsURLForDataFetchDataFromAPI = async (
        activeSystem,
        appGlobalConfig
    ) => {
        const apiService = new APIService();

        /***
         *
         */
        const mediatorService = new MediatorService();
        const logger = new Logger();
        let apiURLPathFile = '';
        /***
         *
         */
        if (activeSystem) {
            apiURLPathFile = path.join(
                process.cwd(),
                'private',
                'log',
                activeSystem,
                'fetch.txt'
            );
        }

        const APIResults = await apiService.getSystemPayloads(
            appGlobalConfig,
            activeSystem
        );

        const pageDetails = (await _.has(APIResults.data, 'pager')) ?
            APIResults.data.pager :
            {};

        const formattedURLs = await mediatorService.generateAnalyticsURLDataFromAPI(
            appGlobalConfig,
            activeSystem,
            pageDetails
        );

        await _.forEach(formattedURLs, formattedURL => {
            try {
                fs.open(apiURLPathFile, 'a', (err, fd) => {
                    if (err) logger.printLogMessageInConsole('error', err, activeSystem);
                    try {
                        fs.appendFile(apiURLPathFile, `${formattedURL}\r\n`, err => {
                            if (err)
                                logger.printLogMessageInConsole('error', err, activeSystem);
                        });
                    } catch (error) {
                        logger.printLogMessageInConsole('error', error, activeSystem);
                    }
                });
            } catch (error) {
                logger.printLogMessageInConsole('error', error, activeSystem);
            }
        });
    };

    getDataset = async (
        appGlobalConfig,
        activeSystem,
        activeBatch,
        activeJob
    ) => {
        const authenticator = new Authenticate();
        const logger = new Logger();
        const systemSourceURL = await appGlobalConfig[activeSystem].dataToURL;
        const dataSet = await appGlobalConfig[activeSystem][activeBatch][activeJob]
            .dataSet;
        const auth = authenticator.getAPIAuth(APIAuthConfig);

        const payloadURL = `${_.endsWith(systemSourceURL, '/') ? systemSourceURL : `${systemSourceURL}/`}api/identifiableObjects/${dataSet.id}.json`;
        const response = await axios.get(
            payloadURL,
            authenticator.getSecondarySystemAuthForDataExchange(
                AuthConfig,
                activeSystem
            )
        );
        if (response.data) {
            const dataSet = {
                name: response.data.name,
                id: response.data.id,
            };
            let url = '';
            if (_.has(APIAuthConfig, 'url')) {
                if (_.endsWith(APIAuthConfig.url, '/')) {
                    url = `${APIAuthConfig.url}api/dataSets`;
                } else {
                    url = `${APIAuthConfig.url}/api/dataSets`;
                }
            }
            const axiosResponse = await axios
                .post(url, dataSet, auth)
                .catch(err => err);
            if (_.has(axiosResponse.data, 'message')) {
                logger.printLogMessageInConsole(
                    'success',
                    `${chalk.green('Message: ')} - ${chalk.bold(axiosResponse.data.message)}`,
                    activeSystem
                );
            } else {
                logger.printLogMessageInConsole(
                    'success',
                    `Dataset <${chalk.bold(chalk.green(axiosResponse.data.name))}> with id <${chalk.bold(chalk.green(axiosResponse.data.id))}> is successfully created in system`,
                    activeSystem
                );
            }
        }
    };
}

/***
 *
 */
module.exports = MetadataManager;