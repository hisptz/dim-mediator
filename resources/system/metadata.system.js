/***
 *
 */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

/***
 *
 */
const mediatorConfig = require('../../config/metadata.config');
const MediatorService = require('../../services/mediator.service');
const Utilities = require('../../utils/utils');
const Logger = require('../../logs/logger.log');

/***
 *
 */
class MetadataManager {
	/***
	 *
	 */
    constructor() { }

	/***
	 *
	 */
    getActiveSystemPeriodDimension = async (
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
                    mediatorConfig[activeSystem][activeBatch][
                        activeJob
                    ].pe.periods,
                    (period) => {
                        return mediatorConfig[activeSystem][
                            activeBatch
                        ][activeJob].pe.subPeriods.length > 0
                            ? _.map(
                                mediatorConfig[
                                    activeSystem
                                ][activeBatch][activeJob]
                                    .pe.subPeriods,
                                (subPeriod) => {
                                    return (
                                        period +
                                        subPeriod
                                    );
                                }
                            )
                            : _.has(period, 'id')
                                ? period.id
                                : period;
                    }
                )
            );
        } else {
			/***
			 *
			 */
            return await _.flatten(
                _.map(
                    mediatorConfig[activeSystem][activeBatch][
                        activeJob
                    ].pe.periods,
                    (period) => {
                        return mediatorConfig[activeSystem][
                            activeBatch
                        ][activeJob].pe.subPeriods.length > 0
                            ? _.map(
                                mediatorConfig[
                                    activeSystem
                                ][activeBatch][activeJob]
                                    .pe.subPeriods,
                                (subPeriod) => {
                                    return (
                                        period +
                                        subPeriod
                                    );
                                }
                            )
                            : _.has(period, 'id')
                                ? period.id
                                : period;
                    }
                )
            );
        }
    };

	/***
	 *
	 */
    getActiveSystemDataDimension = (activeSystem, activeBatch, activeJob) => {
		/***
		 *
		 */
        if (activeBatch) {
			/***
			 *
			 */
            return _.chunk(
                _.map(
                    mediatorConfig[activeSystem][activeBatch][
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
                    mediatorConfig[activeSystem][activeBatch][
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
}

/***
 *
 */
module.exports = MetadataManager;
