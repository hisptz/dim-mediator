const date = require('date-and-time');
const _ = require('lodash');

const axios = require('axios');
const MediatorService = require('../../../services/mediator.service');
const Logger = require('../../../logs/logger.log');
const Analytics = require('../../data/fetch/analytics.fetch');
const DataValueManagement = require('../../data/fetch/datavalue.fetch');
const SystemInfo = require('../../system/details.system');
const Utilities = require('../../../utils/utils');
const mediatorConfig = require('../../../config/metadata.config');

class DataExchange {
    constructor() { }

    /**
     *
     */
    importDataToSystem = async (
        payload,
        systemImportURL,
        systemAuth,
        systemNameId
    ) => {
        const logger = new Logger();
        try {
            return await axios.post(systemImportURL, payload, systemAuth);
        } catch (error) {
            logger.printLogMessageInConsole('error', error, systemNameId);
        }
    };

    /**
             * 
             */
    getUniqueAlreadySentURL = (url, urls) => {
        return _.uniq([...url, ...urls]);
    };

    /**
             *
             */
    getAlreadySentAPIURLs = (systemNameId, dirName, tableName) => {
        const logger = new Logger();
        const utilities = new Utilities();
        if (tableName) {
            const apiURLAlreadySentPathFile = utilities.getAlreadySentPayloadFilePath(
                systemNameId,
                dirName,
                tableName
            );
            try {
                return utilities.getAlreadySentPayloadURL(apiURLAlreadySentPathFile);
            } catch (error) {
                logger.printLogMessageInConsole('error', error, systemNameId);
            }
        } else {
            const apiURLAlreadySentPathFile = utilities.getAlreadySentPayloadFilePath(
                systemNameId,
                dirName,
                tableName
            );
            try {
                return utilities.getAlreadySentPayloadURL(apiURLAlreadySentPathFile);
            } catch (error) {
                logger.printLogMessageInConsole('error', error, systemNameId);
            }
        }
    };

    /**
           * 
           */
    migrateData = async (analyticURL, callback) => {
        const dataValueManagement = new DataValueManagement();
        const systemInfo = new SystemInfo();
        const logger = new Logger();
        const utilities = new Utilities();
        const SystemPayload = [];

        const systemNameId = await systemInfo.getCurrentRunningSystem(
            mediatorConfig
        );
        const dirName = await process.cwd();
        const tableName = (await systemInfo.getCurrentRunningTable(
            mediatorConfig,
            systemNameId
        )) !== undefined
            ? systemInfo.getCurrentRunningTable(mediatorConfig, systemNameId)
            : null;

        // console.log('SYSTEM NAME ID::: ' + systemNameId);
        // console.log('DIRNAME ID::: ' + dirName);
        // console.log('TABLE NAME ID::: ' + tableName);

        const successfullyPayloadsFilePath = await utilities.getPayloadsFilePathForSuccessDataExchange(
            systemNameId,
            dirName,
            tableName
        );

        const successfullyURLFilePath = await utilities.getURLFilePathForSuccessDataExchange(
            systemNameId,
            dirName,
            tableName
        );

        const payloadURLComparatorStatus = await utilities.payloadURLComparator(
            analyticURL,
            alreadySentAnalyticURL
        );

        console.log('CAINAMIST::: ' + JSON.stringify(payloadURLComparatorStatus));

        const systemImportURL = await systemInfo.getCurrentRunningSystemImportURL(
            mediatorConfig,
            systemNameId
        );

        const isUsingHIM = await systemInfo.isUsingHIMMediatorSystem(
            mediatorConfig,
            systemNameId
        );

        if (payloadURLComparatorStatus) {
            logger.printLogMessageInConsole(
                'info',
                `Data for this URL is already sent to ${systemNameId.toUpperCase()}`,
                systemNameId
            );
        } else {
            try {
                if (systemNameId === 'planrep') {
                    const analyticsResults = await analytics.getAnalyticsResults(
                        analyticURL,
                        systemAuth
                    );
                    if ((await analyticsResults.rows.length) > 0) {
                        const dataValuesImportTemplate = analytics.getDataValuesImportTemplates();
                        dataValuesImportTemplate.period = await analyticsResults.metaData
                            .dimensions.pe[0];
                        const indexForDX = analytics.getDataPropertyIndex(
                            analyticsResults,
                            'dx'
                        );
                        const indexForCO = analytics.getDataPropertyIndex(
                            analyticsResults,
                            'co'
                        );
                        const indexForOU = analytics.getDataPropertyIndex(
                            analyticsResults,
                            'ou'
                        );
                        const indexForValue = analytics.getDataPropertyIndex(
                            analyticsResults,
                            'value'
                        );

                        try {
                            analyticsResults.rows.forEach(row => {
                                const orgUnitId = row[indexForOU];
                                dataValuesImportTemplate.dataValues.push({
                                    orgUnit: MediatorInit.orgUnitPayload
                                        ? MediatorInit.orgUnitPayload[orgUnitId].code
                                        : '',
                                    dataElement: row[indexForDX],
                                    categoryOptionCombo: row[indexForCO]
                                        ? row[indexForCO]
                                        : systemInfo.getCurrentRunningSystemCOC(
                                            mediatorConfig,
                                            systemNameId
                                        ),
                                    value: parseInt(row[indexForValue]),
                                    comment: '',
                                    dataSet: systemReceivingDatasetUid,
                                });
                                SystemPayload.push({
                                    orgUnit: MediatorInit.orgUnitPayload
                                        ? MediatorInit.orgUnitPayload[orgUnitId].code
                                        : '',
                                    dataElement: row[indexForDX],
                                    categoryOptionCombo: row[indexForCO]
                                        ? row[indexForCO]
                                        : systemInfo.getCurrentRunningSystemCOC(
                                            mediatorConfig,
                                            systemNameId
                                        ),
                                    value: parseInt(row[indexForValue]),
                                    comment: '',
                                    dataSet: systemReceivingDatasetUid,
                                });
                            });
                            logger.printLogMessageInConsole(
                                'info',
                                `Data Loaded From DHIS2 HMIS - Sent To PlanREP::: ${dataValuesImportTemplate.dataValues.length} Data values`,
                                systemNameId.toString()
                            );
                            const valueLength = dataValuesImportTemplate.dataValues.length;
                            const results = await this.importDataToSystem(
                                dataValuesImportTemplate,
                                systemImportURL,
                                systemAuth,
                                systemNameId
                            );

                            // Walter here is the ending point where next time if you want to resume you are going to
                            // start from here. Cheers.

                            if (results.data.status == 200) {
                                const alreadySentURLs = await this.getAlreadySentAPIURLs(
                                    systemNameId,
                                    dirName,
                                    tableName
                                );
                                alreadySentAnalyticURL = await this.getUniqueAlreadySentURL(
                                    alreadySentAnalyticURL,
                                    alreadySentURLs
                                );
                                systemInfo.getAlreadySentLogInfo(
                                    this.globalURL,
                                    alreadySentAnalyticURL
                                );
                                const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePath(
                                    systemNameId,
                                    dirName,
                                    tableName
                                );

                                await utilities.savingAlreadySentURL(
                                    apiURLAlreadySentPathFile,
                                    analyticURL,
                                    systemNameId
                                );
                                await utilities.savingSuccessfullySentDataPayload(
                                    successfullyPayloadsFilePath,
                                    successfullyURLFilePath,
                                    systemNameId,
                                    dataValuesImportTemplate,
                                    analyticURL,
                                    results
                                );
                            } else {
                                logger.printLogMessageInConsole(
                                    'error',
                                    `${results.data.Message}`,
                                    systemNameId.toString()
                                );
                            }
                        } catch (error) {
                            logger.printLogMessageInConsole(
                                'error',
                                error,
                                systemNameId.toString()
                            );
                        }
                    } else {
                        logger.printLogMessageInConsole(
                            'info',
                            `Data for this URL return empty rows`,
                            systemNameId.toString()
                        );
                        const emptyResURLs = _.uniq(utilities.getURLForEmptyData());

                        if (!_.includes(emptyResURLs, analyticURL)) {
                            // ToDO: Save to the file URL with Empty Rows
                            const apiURLForDataReturningEmptyRows = utilities.getPathForEmptyFetchedData(
                                dirName,
                                systemNameId
                            );
                            utilities.savingEmptyRowsDataURL(
                                apiURLForDataReturningEmptyRows,
                                systemNameId
                            );
                        }
                    }
                }
            } catch (e) {
                callback(e, null);
            }
        }
    };
}

module.exports = DataExchange;
