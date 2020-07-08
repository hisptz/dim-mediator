/***
 *
 */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

/***
 *
 */
const MediatorService = require('../../services/mediator.service');
const APIService = require('../../services/api.service');
const Utilities = require('../../utils/utils');
const Logger = require('../../logs/logger.log');
const appGlobalConfig = require('../../config/metadata.config.example');

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
                    appGlobalConfig[activeSystem][activeBatch][
                        activeJob
                    ].pe.periods,
                    (period) => {
                        return appGlobalConfig[activeSystem][
                                activeBatch
                            ][activeJob].pe.subPeriods.length > 0 ?
                            _.map(
                                appGlobalConfig[
                                    activeSystem
                                ][activeBatch][activeJob]
                                .pe.subPeriods,
                                (subPeriod) => {
                                    return (
                                        period +
                                        subPeriod
                                    );
                                }
                            ) :
                            _.has(period, 'id') ?
                            period.id :
                            period;
                    }
                )
            );
        } else {
            /***
             *
             */
            return await _.flatten(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][
                        activeJob
                    ].pe.periods,
                    (period) => {
                        return appGlobalConfig[activeSystem][
                                activeBatch
                            ][activeJob].pe.subPeriods.length > 0 ?
                            _.map(
                                appGlobalConfig[
                                    activeSystem
                                ][activeBatch][activeJob]
                                .pe.subPeriods,
                                (subPeriod) => {
                                    return (
                                        period +
                                        subPeriod
                                    );
                                }
                            ) :
                            _.has(period, 'id') ?
                            period.id :
                            period;
                    }
                )
            );
        }
    };

    /***
     *
     */
    getActiveSystemDataDimension = (appGlobalConfig, activeSystem, activeBatch, activeJob) => {
        /***
         *
         */
        if (activeBatch) {
            /***
             *
             */
            return _.chunk(
                _.map(
                    appGlobalConfig[activeSystem][activeBatch][
                        activeJob
                    ].dx.data,
                    (data) => {
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
                    appGlobalConfig[activeSystem][activeBatch][
                        activeJob
                    ].dx.data,
                    (data) => {
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
                    const formattedOU = utilities.joinBySymbol(
                        orgUnit,
                        ';'
                    );
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
                                fs.open(
                                    apiURLPathFile,
                                    'a',
                                    (err, fd) => {
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
                                                (
                                                    err
                                                ) => {
                                                    if (
                                                        err
                                                    )
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
                                    }
                                );
                            } catch (error) {
                                logger.printLogMessageInConsole(
                                    'error',
                                    error,
                                    activeSystem
                                );
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

        await _.forEach(formattedURLs, (formattedURL) => {
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
                            (err) => {
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
                logger.printLogMessageInConsole(
                    'error',
                    error,
                    activeSystem
                );
            }
        });
    };
}

/***
 *
 */
module.exports = MetadataManager;