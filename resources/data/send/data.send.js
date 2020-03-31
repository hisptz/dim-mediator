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
	constructor() {}

	/**
	 *
	 */
	performDataMigrationAcrossSystems = async (
		payload,
		systemImportURL,
		systemAuth,
		activeSystem
	) => {
		const logger = new Logger();
		try {
			return await axios.post(systemImportURL, payload, systemAuth);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, activeSystem);
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
	getActiveSystemAlreadySentAPIURLs = (
		activeSystem,
		activeBatch,
		activeJob
	) => {
		const logger = new Logger();
		const utilities = new Utilities();
		if (activeJob) {
			const apiURLAlreadySentPathFile = utilities.getAlreadySentPayloadFilePath(
                activeSystem,
                activeBatch,
				activeJob
			);
			try {
				return utilities.getAlreadySentPayloadURL(
					apiURLAlreadySentPathFile
				);
			} catch (error) {
				logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		} else {
			const apiURLAlreadySentPathFile = utilities.getAlreadySentPayloadFilePath(
				activeSystem,
				dirName,
				activeJob
			);
			try {
				return utilities.getAlreadySentPayloadURL(
					apiURLAlreadySentPathFile
				);
			} catch (error) {
				logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
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

		const activeSystem = await systemInfo.getCurrentRunningSystem(
			mediatorConfig
		);
		const dirName = await process.cwd();
		const activeJob =
			(await systemInfo.getCurrentRunningJob(
				mediatorConfig,
				activeSystem
			)) !== undefined
				? systemInfo.getCurrentRunningJob(
						mediatorConfig,
						activeSystem
				  )
				: null;

		// console.log('SYSTEM NAME ID::: ' + activeSystem);
		// console.log('DIRNAME ID::: ' + dirName);
		// console.log('TABLE NAME ID::: ' + activeJob);

		const successfullyPayloadsFilePath = await utilities.getPayloadsFilePathForSuccessDataExchange(
			activeSystem,
			dirName,
			activeJob
		);

		const successfullyURLFilePath = await utilities.getURLFilePathForSuccessDataExchange(
			activeSystem,
			dirName,
			activeJob
		);

		const payloadURLComparatorStatus = await utilities.payloadURLComparator(
			analyticURL,
			alreadySentAnalyticURL
		);

		const systemImportURL = await systemInfo.getActiveSystemImportURL(
			mediatorConfig,
			activeSystem
		);

		const isUsingHIM = await systemInfo.isUsingHIMMediatorSystem(
			mediatorConfig,
			activeSystem
		);

		if (payloadURLComparatorStatus) {
			logger.printLogMessageInConsole(
				'info',
				`Data for this URL is already sent to ${activeSystem.toUpperCase()}`,
				activeSystem
			);
		} else {
			try {
				if (activeSystem === 'planrep') {
					const analyticsResults = await analytics.getAnalyticsResults(
						analyticURL,
						systemAuth
					);
					if ((await analyticsResults.rows.length) > 0) {
						const dataValueBlueprint = analytics.getDataValuesImportTemplates();
						dataValueBlueprint.period = await analyticsResults
							.metaData.dimensions.pe[0];
						const dxIndex = analytics.getHeaderPropIndex(
							analyticsResults,
							'dx'
						);
						const coIndex = analytics.getHeaderPropIndex(
							analyticsResults,
							'co'
						);
						const ouIndex = analytics.getHeaderPropIndex(
							analyticsResults,
							'ou'
						);
						const valueIndex = analytics.getHeaderPropIndex(
							analyticsResults,
							'value'
						);

						try {
							analyticsResults.rows.forEach(row => {
								const orgUnitId = row[ouIndex];
								dataValueBlueprint.dataValues.push(
									{
										orgUnit: MediatorInit.orgUnitPayload
											? MediatorInit
													.orgUnitPayload[
													orgUnitId
											  ].code
											: '',
										dataElement:
											row[dxIndex],
										categoryOptionCombo: row[
											coIndex
										]
											? row[coIndex]
											: systemInfo.getCurrentRunningSystemCOC(
													mediatorConfig,
													activeSystem
											  ),
										value: parseInt(
											row[
												valueIndex
											]
										),
										comment: '',
										dataSet: systemReceivingDatasetUid,
									}
								);
								SystemPayload.push({
									orgUnit: MediatorInit.orgUnitPayload
										? MediatorInit
												.orgUnitPayload[
												orgUnitId
										  ].code
										: '',
									dataElement: row[dxIndex],
									categoryOptionCombo: row[
										coIndex
									]
										? row[coIndex]
										: systemInfo.getCurrentRunningSystemCOC(
												mediatorConfig,
												activeSystem
										  ),
									value: parseInt(
										row[valueIndex]
									),
									comment: '',
									dataSet: systemReceivingDatasetUid,
								});
							});
							logger.printLogMessageInConsole(
								'info',
								`Data Loaded From DHIS2 HMIS - Sent To PlanREP::: ${dataValueBlueprint.dataValues.length} Data values`,
								activeSystem.toString()
							);
							const loadedDataSize =
								dataValueBlueprint.dataValues
									.length;
							const results = await this.performDataMigrationAcrossSystems(
								dataValueBlueprint,
								systemImportURL,
								systemAuth,
								activeSystem
							);

							// Walter here is the ending point where next time if you want to resume you are going to
							// start from here. Cheers.

							if (results.data.status == 200) {
								const alreadySentURLs = await this.getActiveSystemAlreadySentAPIURLs(
									activeSystem,
									dirName,
									activeJob
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
									activeSystem,
									dirName,
									activeJob
								);

								await utilities.savingAlreadySentURL(
									apiURLAlreadySentPathFile,
									analyticURL,
									activeSystem
								);
								await utilities.savingSuccessfullySentDataPayload(
									successfullyPayloadsFilePath,
									successfullyURLFilePath,
									activeSystem,
									dataValueBlueprint,
									analyticURL,
									results
								);
							} else {
								logger.printLogMessageInConsole(
									'error',
									`${results.data.Message}`,
									activeSystem.toString()
								);
							}
						} catch (error) {
							logger.printLogMessageInConsole(
								'error',
								error,
								activeSystem.toString()
							);
						}
					} else {
						logger.printLogMessageInConsole(
							'info',
							`Data for this URL return empty rows`,
							activeSystem.toString()
						);
						const emptyResURLs = _.uniq(
							utilities.getURLForEmptyData()
						);

						if (
							!_.includes(emptyResURLs, analyticURL)
						) {
							// ToDO: Save to the file URL with Empty Rows
							const apiURLForDataReturningEmptyRows = utilities.getPathForEmptyFetchedData(
								dirName,
								activeSystem
							);
							utilities.savingEmptyRowsDataURL(
								apiURLForDataReturningEmptyRows,
								activeSystem
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
