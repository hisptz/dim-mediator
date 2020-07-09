/***
 *
 */
const os = require('os');
const date = require('date-and-time');
const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const chalk = require('chalk');
const axios = require('axios');
const fromPromise = require('rxjs').fromPromise;

const AuthConfig = require('./config/auth.config');
const APIConfig = require('./config/api.config');
const AppAuth = require('./auth/app.auth');

/***
 *
 */
const MediatorService = require('./services/mediator.service');
const OrganizationUnitManager = require('./helpers/organization-unit');
const Logger = require('./logs/logger.log');
const Utilities = require('./utils/utils');
const Authenticate = require('./auth/system.auth');
const AppInfo = require('./resources/info/app.info');
const SystemInfo = require('./resources/system/details.system');
const SystemMapping = require('./resources/system/mapping.system');
const DataValueManagement = require('./resources/data/fetch/datavalue.fetch');
const DataExchange = require('./resources/data/send/data.send');
const MetadatManager = require('./resources/system/metadata.system');
const ReportService = require('./miscellaneous/report.service');
const APIService = require('./services/api.service');
const UUIDService = require('./miscellaneous/uuid.service');

/***
 *
 */
class MediatorInit {
	/***
	 *
	 */
	globalURL = new Array();
	static alreadySentURLGlobal = new Array();
	static orgUnitPayload = new Object();
	static currentRunningSystem = '';
	static activeSystems = new Array();
	static dataSetForCurrentRunningSystem = '';
	static currentOUMapping;
	static currentRunningJob;
	static currentDXMapping;
	GlobalConfig;
	static counter = 1;

	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	mediatorConfigLauncher = () => {
		return _.filter(_.keys(_.clone(this.GlobalConfig)), (config) => {
			return _.clone(this.GlobalConfig)[config].isAllowed;
		});
	};

	/***
	 *
	 */
	static executeTest = () => {
		/***
		 *
		 */
		return true;
	};

	getMediatorConfiguration = async () => {
		const authenticator = new Authenticate();
		const utilities = new Utilities();
		const url = `https://play.dhis2.org/2.30/api/dataStore/DIM_INTEGRATION_METADATA`;
		const appConfig = [];
		try {
			const uids = await axios.get(url, AppAuth);
			if (uids) {
				for (const uid of await uids.data) {
					const subUrl = await `${url}/${uid}`;
					const config = await axios.get(subUrl, AppAuth);
					await appConfig.push(config.data);
				}
				return await utilities.convertArrayToObject(
					appConfig,
					'name'
				);
			}
		} catch (error) {
			console.log('ERROR::: ' + JSON.stringify(error, null, 4));
		}
	};

	/***
	 *
	 */
	startMediator = async () => {
		/***
		 *
		 */
		this.GlobalConfig = await this.getMediatorConfiguration();
		const organizationUnit = new OrganizationUnitManager();
		const metadataManager = new MetadatManager();
		const utilities = new Utilities();
		const logger = new Logger();
		const appInfo = new AppInfo();
		const systemInfo = new SystemInfo();

		/***
		 *
		 */
		for (const activeSystem of await systemInfo.getActiveSystem(
			_.clone(this.GlobalConfig)
		)) {
			if (_.clone(this.GlobalConfig)[activeSystem].isDataFromAPI) {
				// Data Received From API
				const isDataFromAPI = _.clone(this.GlobalConfig)[
					activeSystem
				].isDataFromAPI;
				try {
					await appInfo.printingTimestampForSpecificLogOnStart(
						activeSystem,
						__dirname
					);
					await appInfo.getWelcomeInfo(activeSystem);
				} catch (error) {
					await logger.printLogMessageInConsole(
						'error',
						error,
						activeSystem
					);
				}
				await logger.printLogMessageInConsole(
					'default',
					`${activeSystem.toUpperCase()} is successfully configured for Data Exchange`,
					activeSystem
				);
				await utilities.prepareLogEnvironmenDataFromAPI(
					__dirname,
					activeSystem,
					isDataFromAPI
				);

				/***
				 *
				 */
				await this.initiateAPICallForDataFromAPI(
					activeSystem,
					_.clone(this.GlobalConfig),
					isDataFromAPI
				);
			} else {
				try {
					await appInfo.printingTimestampForSpecificLogOnStart(
						activeSystem,
						__dirname
					);
					await appInfo.getWelcomeInfo(activeSystem);
				} catch (error) {
					await logger.printLogMessageInConsole(
						'error',
						error,
						activeSystem
					);
				}
				/***
				 *
				 */
				await logger.printLogMessageInConsole(
					'default',
					`${activeSystem.toUpperCase()} is successfully configured for Data Exchange`,
					activeSystem
				);

				/***
				 *
				 */
				for (const activeBatch of await _.keys(
					_.clone(this.GlobalConfig)[activeSystem]
				)) {
					/***
					 *
					 */
					if (
						(await activeBatch.startsWith('batch')) &&
						(await utilities.isObject(
							_.clone(this.GlobalConfig)[
								activeSystem
							][activeBatch]
						))
					) {
						/***
						 *
						 */
						for (const activeJob of await _.keys(
							_.clone(this.GlobalConfig)[
								activeSystem
							][activeBatch]
						)) {
							/***
							 *
							 */
							if (
								(await activeJob.startsWith(
									'job'
								)) &&
								(await utilities.isObject(
									_.clone(
										this.GlobalConfig
									)[activeSystem][
										activeBatch
									][activeJob]
								))
							) {
								/***
								 *
								 */
								await utilities.prepareLogEnvironment(
									__dirname,
									activeSystem,
									activeBatch,
									activeJob
								);

								/***
								 *
								 */
								const orgUnits = await organizationUnit.getOrgUnits(
									_.clone(
										this.GlobalConfig
									),
									activeSystem,
									activeBatch,
									activeJob
								);

								/**
								 * 
								 */
								await metadataManager.getDataset(_.clone(this.GlobalConfig), activeSystem, activeBatch, activeJob);
								await metadataManager.getDataDetail(_.clone(this.GlobalConfig), activeSystem, activeBatch, activeJob);

								/***
								 *
								 */
								await this.initiateAPICall(
									orgUnits,
									activeSystem,
									activeJob,
									activeBatch,
									_.clone(this.GlobalConfig)
								);
							}
						}
					}
				}
			}
		}
	};

	/***
	 *
	 */
	initiateAPICall = async (
		orgUnits,
		activeSystem,
		activeJob,
		activeBatch,
		appGlobalConfig
	) => {
		const logger = new Logger();
		const utilities = new Utilities();
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();
		const metadataManager = new MetadatManager();

		const alreadySentURLs = await this.getAlreadySentURL(
			activeSystem,
			activeBatch,
			activeJob
		);

		if (
			await _.clone(this.GlobalConfig)[activeSystem][activeBatch][
				activeJob
			]['isExecuted']
		) {
			/***
			 *
			 */
			const batchFilePath = await utilities.getFilePathForBatches(
				__dirname,
				activeSystem,
				activeBatch,
				activeJob
			);

			/***
			 *
			 */
			const batches = await utilities.getScheduledJobURLs(
				batchFilePath,
				activeBatch
			);

			/***
			 *
			 */
			if ((await batches) !== undefined) {
				if ((await batches.length) >= 0) {
					MediatorInit.currentRunningSystem = await activeSystem;
					MediatorInit.getCurrentRunningJob = await activeJob;
					const sid = activeSystem;

					/***
					 *
					 */
					await utilities.resetValuesForAPIURLToFetchDataInAFile(
						activeSystem,
						activeBatch,
						activeJob
					);
					/***
					 *
					 */
					if (
						await _.clone(this.GlobalConfig)[
							activeSystem
						][activeBatch]
					) {
						if (
							(await activeSystem) &&
							!_.clone(this.GlobalConfig)[
								activeSystem
							].isDataFromAPI
						) {
							let sentURLGlobal = [];
							const URLToBeSent = await utilities.getAllURLForDataToBeSent(
								__dirname,
								activeSystem,
								activeBatch,
								activeJob
							);
							logger.printLogMessageInConsole(
								'default',
								`${chalk.green(
									chalk.bold(
										activeSystem.toUpperCase()
									)
								)} System is recognized`,
								activeSystem
							);

							MediatorInit.orgUnitPayload;
							const orgUnitObject = await utilities.arrayToObject(
								orgUnits
							);

							const chunkedOrgunits = await _.chunk(
								orgUnits,
								20
							);

							const chunkedOrgunitsUID = await this.getOrgUnitUids(
								chunkedOrgunits
							);

							const period = await metadataManager.getActiveSystemPeriodDimension(
								_.clone(this.GlobalConfig),
								activeSystem,
								activeBatch,
								activeJob
							);

							const apiFromURL = _.clone(
								this.GlobalConfig
							)[activeSystem].dataFromURL;

							const data = await metadataManager.getActiveSystemDataDimension(
								_.clone(this.GlobalConfig),
								activeSystem,
								activeBatch,
								activeJob
							);

							await metadataManager.prepareAnalyticsURLForDataFetch(
								activeSystem,
								activeBatch,
								activeJob,
								chunkedOrgunitsUID,
								data,
								period,
								apiFromURL
							);

							sentURLGlobal = await _.uniq([
								...sentURLGlobal,
								...alreadySentURLs,
							]);

							await appInfo.printingTimestampForEverySuccessMessage(
								__dirname,
								activeSystem,
								activeBatch,
								activeJob
							);

							await appInfo.getDataExchangeLogInfo(
								_.clone(this.GlobalConfig),
								URLToBeSent,
								alreadySentURLs,
								activeSystem
							);

							await utilities.savingSuccessLogInfoInFile(
								URLToBeSent,
								alreadySentURLs,
								__dirname,
								activeSystem,
								activeBatch,
								activeJob
							);

							await this.getAPIResult(
								URLToBeSent,
								activeSystem,
								activeBatch,
								activeJob,
								sentURLGlobal,
								orgUnitObject
							);
						} else {
							console.log('CAINAMIST IS AMAZING');
						}
					} else {
						/***
						 *
						 */
						// ToDo: Find the best way of implementing log for this part
						logger.printLogMessageInConsole(
							'error',
							`No system is allowed for data exchange.`,
							`default`
						);
					}
				} else {
					/***
					 *
					 */
					// logger.printLogMessageInConsole(
					// 	'success',
					// 	`${chalk.green(
					// 		chalk.bold('DONE')
					// 	)} Batch(${_.clone(this.GlobalConfig)[activeSystem][
					// 		activeBatch
					// 	][
					// 		'batchName'
					// 	].toUpperCase()}) and JOB(${_.clone(this.GlobalConfig)[
					// 		activeSystem
					// 	][activeBatch][
					// 		activeJob
					// 	].toUpperCase()}) for system ${activeSystem.toUpperCase()} has finished`,
					// 	activeSystem
					// );

					logger.printLogMessageInConsole(
						'default',
						`\n`,
						activeSystem
					);
				}
			} else {
				logger.printLogMessageInConsole(
					'info',
					`Fail to resolve folder path for system ${chalk.green(
						chalk.bold(activeSystem)
					)}`,
					activeSystem
				);
			}
		}
	};

	initiateAPICallForDataFromAPI = async (
		activeSystem,
		appGlobalConfig,
		isDataFromAPI
	) => {
		const logger = new Logger();
		const utilities = new Utilities();
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();
		const metadataManager = new MetadatManager();
		const apiService = new APIService();

		const alreadySentURLs = await this.getAlreadySentURLDataFromAPI(
			activeSystem,
			isDataFromAPI
		);

		if (await _.clone(this.GlobalConfig)[activeSystem].isAllowed) {
			/***
			 *
			 */
			const batchFilePath = await utilities.getFilePathForWatcherConfig(
				__dirname,
				activeSystem
			);

			/***
			 *
			 */
			const batches = await utilities.getScheduledJobURLsDataFromAPI(
				batchFilePath
			);

			await utilities.resetValuesForAPIURLToFetchDataInAFileDataFromAPI(
				activeSystem
			);

			let sentURLGlobal = [];
			const URLToBeSent = await utilities.getAllURLForDataToBeSentDataFromAPI(
				__dirname,
				activeSystem,
				isDataFromAPI
			);

			logger.printLogMessageInConsole(
				'default',
				`${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)} System is recognized`,
				activeSystem
			);

			await metadataManager.prepareAnalyticsURLForDataFetchDataFromAPI(
				activeSystem,
				_.clone(this.GlobalConfig)
			);

			logger.printLogMessageInConsole(
				'default',
				`${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)} System is recognized`,
				activeSystem
			);

			sentURLGlobal = await _.uniq([
				...sentURLGlobal,
				...alreadySentURLs,
			]);

			await appInfo.printingTimestampForEverySuccessMessageDataFromAPI(
				__dirname,
				activeSystem,
				isDataFromAPI
			);

			await appInfo.getDataExchangeLogInfo(
				_.clone(this.GlobalConfig),
				URLToBeSent,
				alreadySentURLs,
				activeSystem
			);

			await utilities.savingSuccessLogInfoInFileDataFromAPI(
				URLToBeSent,
				alreadySentURLs,
				__dirname,
				activeSystem,
				isDataFromAPI
			);

			await this.getAPIResultDataFromAPI(
				URLToBeSent,
				activeSystem,
				sentURLGlobal
			);

			// -----------------------------------------------------------------------------------------

			/***
			 *
			 */
			// if ((await batches) !== undefined) {
			// 	if ((await batches.length) >= 0) {
			// 		MediatorInit.currentRunningSystem = await activeSystem;
			// 		MediatorInit.getCurrentRunningJob = await activeJob;
			// 		const sid = activeSystem;

			// 		/***
			// 		 *
			// 		 */
			// 		await utilities.resetValuesForAPIURLToFetchDataInAFile(
			// 			activeSystem,
			// 			activeBatch,
			// 			activeJob
			// 		);
			// 		/***
			// 		 *
			// 		 */
			// 		if (
			// 			await _.clone(this.GlobalConfig)[activeSystem][
			// 				activeBatch
			// 			]
			// 		) {
			// 			if (
			// 				(await activeSystem)

			// 			) {
			// 				let sentURLGlobal = [];
			// 				const URLToBeSent = await utilities.getAllURLForDataToBeSent(
			// 					__dirname,
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob
			// 				);
			// 				logger.printLogMessageInConsole(
			// 					'default',
			// 					`${chalk.green(
			// 						chalk.bold(
			// 							activeSystem.toUpperCase()
			// 						)
			// 					)} System is recognized`,
			// 					activeSystem
			// 				);

			// 				MediatorInit.orgUnitPayload;
			// 				const orgUnitObject = await utilities.arrayToObject(
			// 					orgUnits
			// 				);

			// 				const chunkedOrgunits = await _.chunk(
			// 					orgUnits,
			// 					20
			// 				);

			// 				const chunkedOrgunitsUID = await this.getOrgUnitUids(
			// 					chunkedOrgunits
			// 				);

			// 				const period = await metadataManager.getActiveSystemPeriodDimension(
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob
			// 				);

			// 				const apiFromURL =
			// 					_.clone(this.GlobalConfig)[activeSystem]
			// 						.dataFromURL;

			// 				const data = await metadataManager.getActiveSystemDataDimension(
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob
			// 				);

			// 				await metadataManager.prepareAnalyticsURLForDataFetch(
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob,
			// 					chunkedOrgunitsUID,
			// 					data,
			// 					period,
			// 					apiFromURL
			// 				);

			// sentURLGlobal = await _.uniq([
			// 	...sentURLGlobal,
			// 	...alreadySentURLs,
			// ]);

			// 				await appInfo.printingTimestampForEverySuccessMessage(
			// 					__dirname,
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob
			// 				);

			// 				await appInfo.getDataExchangeLogInfo(
			// 					_.clone(this.GlobalConfig),
			// 					URLToBeSent,
			// 					alreadySentURLs,
			// 					activeSystem
			// 				);

			// 				await utilities.savingSuccessLogInfoInFile(
			// 					URLToBeSent,
			// 					alreadySentURLs,
			// 					__dirname,
			// 					activeSystem,
			// 					activeBatch,
			// 					activeJob
			// 				);

			// await this.getAPIResult(
			// 	URLToBeSent,
			// 	activeSystem,
			// 	activeBatch,
			// 	activeJob,
			// 	sentURLGlobal,
			// 	orgUnitObject
			// );
			// 			}
			// 		} else {
			// 			/***
			// 			 *
			// 			 */
			// 			// ToDo: Find the best way of implementing log for this part
			// 			logger.printLogMessageInConsole(
			// 				'error',
			// 				`No system is allowed for data exchange.`,
			// 				`default`
			// 			);
			// 		}
			// 	} else {
			// 		/***
			// 		 *
			// 		 */
			// 		// logger.printLogMessageInConsole(
			// 		// 	'success',
			// 		// 	`${chalk.green(
			// 		// 		chalk.bold('DONE')
			// 		// 	)} Batch(${_.clone(this.GlobalConfig)[activeSystem][
			// 		// 		activeBatch
			// 		// 	][
			// 		// 		'batchName'
			// 		// 	].toUpperCase()}) and JOB(${_.clone(this.GlobalConfig)[
			// 		// 		activeSystem
			// 		// 	][activeBatch][
			// 		// 		activeJob
			// 		// 	].toUpperCase()}) for system ${activeSystem.toUpperCase()} has finished`,
			// 		// 	activeSystem
			// 		// );

			// 		logger.printLogMessageInConsole(
			// 			'default',
			// 			`\n`,
			// 			activeSystem
			// 		);
			// 	}
			// } else {
			// 	logger.printLogMessageInConsole(
			// 		'info',
			// 		`Fail to resolve folder path for system ${chalk.green(
			// 			chalk.bold(activeSystem)
			// 		)}`,
			// 		activeSystem
			// 	);
			// }
		}
	};

	/**
	 *
	 */
	getAPIResult = async (
		analyticsURLS,
		activeSystem,
		activeBatch,
		activeJob,
		sentURLGlobal,
		orgUnitObject
	) => {
		const logger = new Logger();
		const systemInfo = new SystemInfo();

		const systemImportURL = await systemInfo.getActiveSystemImportURL(
			_.clone(this.GlobalConfig),
			activeSystem
		);

		if (analyticsURLS) {
			if (systemImportURL) {
				try {
					for (const analyticsURL of await analyticsURLS) {
						await this.migrateData(
							analyticsURL,
							activeSystem,
							activeBatch,
							activeJob,
							sentURLGlobal,
							orgUnitObject
						);
					}
				} catch (error) {
					logger.printLogMessageInConsole('error', error);
				}
			} else {
				logger.printLogMessageInConsole(
					'error',
					`There is no Data Import URL for the system ${activeSystem.toUpperCase()}`,
					activeSystem
				);
			}
		} else {
			logger.printLogMessageInConsole(
				'error',
				`There is no URL to fetch data for system ${activeSystem.toUpperCase()}`,
				activeSystem
			);
		}
	};

	getAPIResultDataFromAPI = async (
		analyticsURLS,
		activeSystem,
		sentURLGlobal
	) => {
		const logger = new Logger();
		const systemInfo = new SystemInfo();

		const systemImportURL = await systemInfo.getActiveSystemImportURL(
			_.clone(this.GlobalConfig),
			activeSystem
		);

		if (analyticsURLS) {
			if (systemImportURL) {
				try {
					for (const analyticsURL of await analyticsURLS) {
						await this.migrateDataDataFromAPI(
							analyticsURL,
							activeSystem,
							sentURLGlobal
						);
					}
				} catch (error) {
					logger.printLogMessageInConsole('error', error);
				}
			} else {
				logger.printLogMessageInConsole(
					'error',
					`There is no Data Import URL for the system ${activeSystem.toUpperCase()}`,
					activeSystem
				);
			}
		} else {
			logger.printLogMessageInConsole(
				'error',
				`There is no URL to fetch data for system ${activeSystem.toUpperCase()}`,
				activeSystem
			);
		}
	};

	/**
	 *
	 */
	migrateData = async (
		analyticURL,
		activeSystem,
		activeBatch,
		activeJob,
		sentURLGlobal,
		orgUnitObject
	) => {
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();
		const logger = new Logger();
		const utilities = new Utilities();
		const authenticator = new Authenticate();
		const dataExchange = new DataExchange();
		const systemMapping = new SystemMapping();
		const reportService = new ReportService();
		const SystemPayload = [];

		const dirName = await process.cwd();

		const successfullyPayloadsFilePath = await utilities.getPayloadsFilePathForSuccessDataExchange(
			dirName,
			activeSystem,
			activeBatch,
			activeJob
		);

		const successfullyURLFilePath = await utilities.getURLFilePathForSuccessDataExchange(
			dirName,
			activeSystem,
			activeBatch,
			activeJob
		);

		const payloadURLComparatorStatus = await utilities.payloadURLComparator(
			analyticURL,
			sentURLGlobal
		);

		const isUsingHIM = await systemInfo.isUsingHIMMediatorSystem(
			_.clone(this.GlobalConfig),
			activeSystem
		);

		const orgUnitsMapping = await systemMapping.getActiveSystemOrgUnitMapping(
			_.clone(this.GlobalConfig),
			activeSystem,
			activeBatch,
			activeJob
		);

		const dataElementsMapping = await systemMapping.getActiveSystemDXMapping(
			_.clone(this.GlobalConfig),
			activeSystem,
			activeBatch,
			activeJob
		);

		if (payloadURLComparatorStatus) {
			logger.printLogMessageInConsole(
				'info',
				`Data for this URL is already sent to ${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)}`,
				activeSystem
			);
		} else {
			const dataValueManagement = new DataValueManagement();
			const systemImportURL = systemInfo.getActiveSystemImportURL(
				_.clone(this.GlobalConfig),
				activeSystem
			);

			try {
				if (activeSystem) {
					const analyticsResults = await dataValueManagement.getAnalyticsResults(
						analyticURL,
						authenticator.getSystemAuth(
							AuthConfig,
							activeSystem
						)
					);

					if ((await analyticsResults.rows.length) > 0) {
						// const dataValueBlueprint = await dataValueManagement.getDataValuesImportTemplates();
						const dataValueBlueprint = await {
							completeDate: date.format(
								new Date(),
								'YYYY-MM-DD'
							),
							period: '',
							dataValues: [],
						};

						const fromSystemPayloadDetails = {
							completeDate: date.format(
								new Date(),
								'YYYY-MM-DD'
							),
							period: '',
							dataValues: [],
						};

						dataValueBlueprint.period = await analyticsResults
							.metaData.dimensions.pe[0];

						fromSystemPayloadDetails.period = await analyticsResults
							.metaData.dimensions.pe[0];

						const dxIndex = await this.getHeaderPropIndex(
							analyticsResults,
							'dx'
						);

						const coIndex = await this.getHeaderPropIndex(
							analyticsResults,
							'co'
						);

						const coSpecialIndex = await utilities.getIndexOfCustomCOC(
							analyticsResults
						);

						const ouIndex = await this.getHeaderPropIndex(
							analyticsResults,
							'ou'
						);
						const valueIndex = await this.getHeaderPropIndex(
							analyticsResults,
							'value'
						);

						try {
							for (const analyticsResult of await analyticsResults.rows) {
								const orgUnitId = await analyticsResult[
									ouIndex
								];
								const dataId = await analyticsResult[
									dxIndex
								];
								await fromSystemPayloadDetails.dataValues.push(
									{
										orgUnit: orgUnitId,
										dataElement: dataId,
										value: await utilities.getDataValue(
											analyticsResult,
											valueIndex
										),
									}
								);
								await dataValueBlueprint.dataValues.push(
									{
										orgUnit: await systemMapping.getOrgUnitUid(
											_.clone(
												this
													.GlobalConfig
											),
											activeSystem,
											activeBatch,
											activeJob,
											orgUnitsMapping,
											orgUnitId,
											orgUnitObject
										),
										dataElement: await systemMapping.getDataElementUid(
											_.clone(
												this
													.GlobalConfig
											),
											activeSystem,
											activeBatch,
											activeJob,
											dataElementsMapping,
											dataId
										),

										categoryOptionCombo: await utilities.getCategoryOptionCombo(
											_.clone(
												this
													.GlobalConfig
											),
											activeSystem,
											coIndex,
											coSpecialIndex,
											analyticsResult
										),
										value: await utilities.getDataValue(
											analyticsResult,
											valueIndex
										),
										comment: '',
										dataSet: await systemInfo.getDataSetUidForCurrentJob(
											_.clone(
												this
													.GlobalConfig
											),
											activeSystem,
											activeBatch,
											activeJob
										),
									}
								);
							}

							logger.printLogMessageInConsole(
								'info',
								`Data Loaded From ${chalk.green(
									chalk.bold(
										_.clone(
											this
												.GlobalConfig
										)[
											activeSystem
										].systemInfo.from.name.toUpperCase()
									)
								)} - Prepared to be sent to ${chalk.blue(
									chalk.bold(
										activeSystem.toUpperCase()
									)
								)}::: ${chalk.yellow(
									chalk.bold(
										dataValueBlueprint
											.dataValues
											.length
									)
								)} Data values`,
								activeSystem
							);

							const loadedDataSize = await dataValueBlueprint
								.dataValues.length;
							const secondarySystemAuth = await authenticator.getSecondarySystemAuthForDataExchange(
								AuthConfig,
								activeSystem
							);

							const dataMigrationResponse = await dataExchange.performDataMigrationAcrossSystems(
								dataValueBlueprint,
								systemImportURL,
								secondarySystemAuth,
								activeSystem
							);

							if (
								await _.clone(
									this.GlobalConfig
								)[activeSystem].isUsingHIM
							) {
								if (
									dataMigrationResponse.data
										.status === 200
								) {
									const alreadySentURLs = await dataExchange.getActiveSystemAlreadySentAPIURLs(
										activeSystem,
										activeBatch,
										activeJob
									);

									const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
										MediatorInit.alreadySentURLGlobal,
										alreadySentURLs
									);

									const URLToBeSent = await utilities.getAllURLForDataToBeSent(
										__dirname,
										activeSystem,
										activeBatch,
										activeJob
									);

									await appInfo.getAlreadySentLogInfo(
										URLToBeSent,
										alreadySentAnalyticURL,
										activeSystem
									);
									const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePath(
										activeSystem,
										activeBatch,
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
										dataMigrationResponse,
										loadedDataSize
									);
								} else {
									logger.printLogMessageInConsole(
										'info',
										`Response Message: ${chalk.gray(
											chalk.bold(
												_.has(
													dataMigrationResponse.data,
													'Message'
												)
													? dataMigrationResponse
															.data
															.Message
													: _.has(
															dataMigrationResponse.data,
															'description'
													  )
													? dataMigrationResponse
															.data
															.description
													: ''
											)
										)} Code: ${chalk.yellow(
											chalk.bold(
												dataMigrationResponse
													.data
													.status
											)
										)}`,
										activeSystem
									);
								}
							} else {
								if (
									dataMigrationResponse.data &&
									dataMigrationResponse.data
								) {
									const uuidService = new UUIDService();
									const responseMessage = await dataMigrationResponse.data;
									const sourceDetails = await reportService.getReportMetadata(
										_.clone(
											this
												.GlobalConfig
										),
										fromSystemPayloadDetails,
										activeSystem,
										'source'
									);
									const destinationDetails = await reportService.getReportMetadata(
										_.clone(
											this
												.GlobalConfig
										),
										dataValueBlueprint,
										activeSystem,
										'destination'
									);

									const messages = _.has(
										responseMessage,
										'conflicts'
									)
										? await responseMessage.conflicts
										: [];
									const respMessage = _.map(
										messages,
										(message) => {
											return _.mapKeys(
												message,
												(
													value,
													key
												) => {
													if (
														key ===
														'value'
													) {
														return 'message';
													} else if (
														key ===
														'object'
													) {
														return 'objectId';
													} else {
														return key;
													}
												}
											);
										}
									);
									/***
									 *
									 */
									const payload = await reportService.getMergedPaylaod(
										sourceDetails,
										destinationDetails
									);

									// console.log('MERGED PAYLOAD::: ' + JSON.stringify(payload, null, 4));

									if (
										responseMessage.status ===
										'WARNING'
									) {
										await reportService.createReportDetail(
											payload,
											activeSystem,
											respMessage,
											'failure'
										);
										/**
										 *
										 */
										await appInfo.getWarningInfo(
											responseMessage,
											activeSystem
										);
									} else if (
										responseMessage.status ===
										'SUCCESS'
									) {
										await reportService.createReportDetail(
											payload,
											activeSystem,
											respMessage,
											'success'
										);

										const alreadySentURLs = await dataExchange.getActiveSystemAlreadySentAPIURLs(
											activeSystem,
											activeBatch,
											activeJob
										);

										const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
											MediatorInit.alreadySentURLGlobal,
											alreadySentURLs
										);

										const URLToBeSent = await utilities.getAllURLForDataToBeSent(
											__dirname,
											activeSystem,
											activeBatch,
											activeJob
										);

										await appInfo.getAlreadySentLogInfo(
											URLToBeSent,
											alreadySentAnalyticURL,
											activeSystem
										);
										const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePath(
											activeSystem,
											activeBatch,
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
											dataMigrationResponse,
											loadedDataSize
										);
										/***
										 *
										 */
										await appInfo.getSuccessInfo(
											responseMessage,
											activeSystem
										);
									} else {
										/***
										 *
										 */
										await appInfo.getDefaultInfo(
											responseMessage,
											activeSystem
										);
									}
								} else {
									console.log(
										'RESPONSE ERROR::: ' +
											JSON.stringify(
												responseMessage
											)
									);
								}
							}
						} catch (error) {
							logger.printLogMessageInConsole(
								'error',
								error,
								activeSystem
							);
						}
					} else {
						logger.printLogMessageInConsole(
							'info',
							`Data for this URL return empty rows`,
							activeSystem
						);
						const emptyResURLs = await _.uniq(
							utilities.getURLForEmptyData(
								__dirname,
								activeSystem,
								activeBatch,
								activeJob
							)
						);

						if (
							!_.includes(emptyResURLs, analyticURL)
						) {
							// ToDO: Save to the file URL with Empty Rows
							const apiURLForDataReturningEmptyRows = await utilities.getPathForEmptyFetchedData(
								dirName,
								activeSystem,
								activeBatch,
								activeJob
							);
							await utilities.savingEmptyRowsDataURL(
								apiURLForDataReturningEmptyRows,
								activeSystem,
								analyticURL
							);
						}
					}
				}
			} catch (error) {
				/***
				 *
				 */
				logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		}
	};

	migrateDataDataFromAPI = async (
		analyticURL,
		activeSystem,
		sentURLGlobal
	) => {
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();
		const logger = new Logger();
		const utilities = new Utilities();
		const authenticator = new Authenticate();
		const dataExchange = new DataExchange();
		const systemMapping = new SystemMapping();
		const reportService = new ReportService();
		const isDataFromAPI = _.clone(this.GlobalConfig)[activeSystem]
			.isDataFromAPI;
		const SystemPayload = [];

		const dirName = await process.cwd();

		const successfullyPayloadsFilePath = await utilities.getPayloadsFilePathForSuccessDataExchangeDataFromAPI(
			dirName,
			activeSystem
		);

		const successfullyURLFilePath = await utilities.getURLFilePathForSuccessDataExchangeDataFromAPI(
			dirName,
			activeSystem
		);

		const payloadURLComparatorStatus = await utilities.payloadURLComparator(
			analyticURL,
			sentURLGlobal
		);

		if (payloadURLComparatorStatus) {
			logger.printLogMessageInConsole(
				'info',
				`Data for this URL is already sent to ${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)}`,
				activeSystem
			);
		} else {
			const dataValueManagement = new DataValueManagement();
			const systemImportURL = systemInfo.getActiveSystemImportURL(
				_.clone(this.GlobalConfig),
				activeSystem
			);

			try {
				if (activeSystem) {
					const analyticsResults = await dataValueManagement.getAnalyticsResultsDataFromAPI(
						analyticURL,
						authenticator.getAPIAuth(APIConfig)
					);
					if (
						(await analyticsResults.data) &&
						_.has(analyticsResults.data, 'payloads')
					) {
						for (const payload of await analyticsResults
							.data.payloads) {
							logger.printLogMessageInConsole(
								'info',
								`Data Loaded From ${chalk.green(
									chalk.bold(
										_.clone(
											this
												.GlobalConfig
										)[
											activeSystem
										].systemInfo.from.name.toUpperCase()
									)
								)} - Prepared to be sent to ${chalk.blue(
									chalk.bold(
										activeSystem.toUpperCase()
									)
								)}::: ${chalk.yellow(
									chalk.bold(
										payload.dataValues
											.length
									)
								)} Data values`,
								activeSystem
							);

							const secondarySystemAuth = await authenticator.getSecondarySystemAuthForDataExchange(
								AuthConfig,
								activeSystem
							);

							const dataMigrationResponse = await dataExchange.performDataMigrationAcrossSystemsDataFromAPI(
								payload,
								systemImportURL,
								secondarySystemAuth,
								activeSystem
							);

							if (isDataFromAPI) {
								if (
									dataMigrationResponse.data &&
									dataMigrationResponse.data
								) {
									const uuidService = new UUIDService();
									const responseMessage = await dataMigrationResponse.data;
									// const sourceDetails = await reportService.getReportMetadata(
									// 	fromSystemPayloadDetails,
									// 	activeSystem,
									// 	'source'
									// );
									// const destinationDetails = await reportService.getReportMetadata(
									// 	dataValueBlueprint,
									// 	activeSystem,
									// 	'destination'
									// );

									const messages = _.has(
										responseMessage,
										'conflicts'
									)
										? await responseMessage.conflicts
										: [];
									const respMessage = _.map(
										messages,
										(message) => {
											return _.mapKeys(
												message,
												(
													value,
													key
												) => {
													if (
														key ===
														'value'
													) {
														return 'message';
													} else if (
														key ===
														'object'
													) {
														return 'objectId';
													} else {
														return key;
													}
												}
											);
										}
									);
									/***
									 *
									 */
									// const payload = await reportService.getMergedPaylaod(
									// 	sourceDetails,
									// 	destinationDetails
									// );

									if (
										responseMessage.status ===
										'WARNING'
									) {
										await reportService.createReportDetail(
											payload,
											activeSystem,
											respMessage,
											'failure'
										);
										/**
										 *
										 */
										await appInfo.getWarningInfo(
											responseMessage,
											activeSystem
										);
									} else if (
										responseMessage.status ===
										'SUCCESS'
									) {
										// await reportService.createReportDetail(
										// 	payload,
										// 	activeSystem,
										// 	respMessage,
										// 	'success'
										// );

										const alreadySentURLs = await dataExchange.getActiveSystemAlreadySentAPIURLsDataFromAPI(
											activeSystem,
											isDataFromAPI
										);

										const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
											MediatorInit.alreadySentURLGlobal,
											alreadySentURLs
										);

										const URLToBeSent = await utilities.getAllURLForDataToBeSentDataFromAPI(
											__dirname,
											activeSystem,
											isDataFromAPI
										);

										await appInfo.getAlreadySentLogInfo(
											URLToBeSent,
											alreadySentAnalyticURL,
											activeSystem
										);
										const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePathDataFromAPI(
											activeSystem,
											isDataFromAPI
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
											payload,
											analyticURL,
											dataMigrationResponse,
											payload
												.dataValues
												.length
										);
										/***
										 *
										 */
										await appInfo.getSuccessInfo(
											responseMessage,
											activeSystem
										);
									} else {
										/***
										 *
										 */
										await appInfo.getDefaultInfo(
											responseMessage,
											activeSystem
										);
									}
								} else {
									console.log(
										'RESPONSE ERROR::: ' +
											JSON.stringify(
												responseMessage
											)
									);
								}
							}
						}
						// console.log('SECONDARY AUTH::: ' + JSON.stringify(dataMigrationResponse.data, null, 4));
					}
				}

				// console.log('ANALYTICS RESULT::: ' + JSON.stringify(analyticsResults.data));
				// if ((await analyticsResults.rows.length) > 0) {
				// 	// const dataValueBlueprint = await dataValueManagement.getDataValuesImportTemplates();
				// 	const dataValueBlueprint = await {
				// 		completeDate: date.format(
				// 			new Date(),
				// 			'YYYY-MM-DD'
				// 		),
				// 		period: '',
				// 		dataValues: [],
				// 	};

				// 	const fromSystemPayloadDetails = {
				// 		completeDate: date.format(
				// 			new Date(),
				// 			'YYYY-MM-DD'
				// 		),
				// 		period: '',
				// 		dataValues: [],
				// 	};

				// 	dataValueBlueprint.period = await analyticsResults
				// 		.metaData.dimensions.pe[0];

				// 	fromSystemPayloadDetails.period = await analyticsResults
				// 		.metaData.dimensions.pe[0];

				// 	const dxIndex = await this.getHeaderPropIndex(
				// 		analyticsResults,
				// 		'dx'
				// 	);

				// 	const coIndex = await this.getHeaderPropIndex(
				// 		analyticsResults,
				// 		'co'
				// 	);

				// 	const coSpecialIndex = await utilities.getIndexOfCustomCOC(
				// 		analyticsResults
				// 	);

				// 	const ouIndex = await this.getHeaderPropIndex(
				// 		analyticsResults,
				// 		'ou'
				// 	);
				// 	const valueIndex = await this.getHeaderPropIndex(
				// 		analyticsResults,
				// 		'value'
				// 	);

				// 	try {
				// 		for (const analyticsResult of await analyticsResults.rows) {
				// 			const orgUnitId = await analyticsResult[
				// 				ouIndex
				// 			];
				// 			const dataId = await analyticsResult[
				// 				dxIndex
				// 			];
				// 			await fromSystemPayloadDetails.dataValues.push(
				// 				{
				// 					orgUnit: orgUnitId,
				// 					dataElement: dataId,
				// 					value: await utilities.getDataValue(
				// 						analyticsResult,
				// 						valueIndex
				// 					),
				// 				}
				// 			);
				// 			await dataValueBlueprint.dataValues.push(
				// 				{
				// 					orgUnit: await systemMapping.getOrgUnitUid(
				// 						_.clone(this.GlobalConfig),
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob,
				// 						orgUnitsMapping,
				// 						orgUnitId,
				// 						orgUnitObject
				// 					),
				// 					dataElement: await systemMapping.getDataElementUid(
				// 						_.clone(this.GlobalConfig),
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob,
				// 						dataElementsMapping,
				// 						dataId
				// 					),

				// 					categoryOptionCombo: await utilities.getCategoryOptionCombo(
				// 						_.clone(this.GlobalConfig),
				// 						activeSystem,
				// 						coIndex,
				// 						coSpecialIndex,
				// 						analyticsResult
				// 					),
				// 					value: await utilities.getDataValue(
				// 						analyticsResult,
				// 						valueIndex
				// 					),
				// 					comment: '',
				// 					dataSet: await systemInfo.getDataSetUidForCurrentJob(
				// 						_.clone(this.GlobalConfig),
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob
				// 					),
				// 				}
				// 			);
				// 		}

				// 		logger.printLogMessageInConsole(
				// 			'info',
				// 			`Data Loaded From ${chalk.green(
				// 				chalk.bold(
				// 					_.clone(this.GlobalConfig)[
				// 						activeSystem
				// 					].systemInfo.from.name.toUpperCase()
				// 				)
				// 			)} - Prepared to be sent to ${chalk.blue(
				// 				chalk.bold(
				// 					activeSystem.toUpperCase()
				// 				)
				// 			)}::: ${chalk.yellow(
				// 				chalk.bold(
				// 					dataValueBlueprint
				// 						.dataValues
				// 						.length
				// 				)
				// 			)} Data values`,
				// 			activeSystem
				// 		);

				// 		const loadedDataSize = await dataValueBlueprint
				// 			.dataValues.length;
				// const secondarySystemAuth = await authenticator.getSecondarySystemAuthForDataExchange(
				// 	AuthConfig,
				// 	activeSystem
				// );

				// 		const dataMigrationResponse = await dataExchange.performDataMigrationAcrossSystems(
				// 			dataValueBlueprint,
				// 			systemImportURL,
				// 			secondarySystemAuth,
				// 			activeSystem
				// 		);

				// 		if (
				// 			await _.clone(this.GlobalConfig)[
				// 				activeSystem
				// 			].isUsingHIM
				// 		) {
				// 			if (
				// 				dataMigrationResponse.data
				// 					.status === 200
				// 			) {
				// 				const alreadySentURLs = await dataExchange.getActiveSystemAlreadySentAPIURLs(
				// 					activeSystem,
				// 					activeBatch,
				// 					activeJob
				// 				);

				// 				const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
				// 					MediatorInit.alreadySentURLGlobal,
				// 					alreadySentURLs
				// 				);

				// 				const URLToBeSent = await utilities.getAllURLForDataToBeSent(
				// 					__dirname,
				// 					activeSystem,
				// 					activeBatch,
				// 					activeJob
				// 				);

				// 				await appInfo.getAlreadySentLogInfo(
				// 					URLToBeSent,
				// 					alreadySentAnalyticURL,
				// 					activeSystem
				// 				);
				// 				const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePath(
				// 					activeSystem,
				// 					activeBatch,
				// 					activeJob
				// 				);

				// 				await utilities.savingAlreadySentURL(
				// 					apiURLAlreadySentPathFile,
				// 					analyticURL,
				// 					activeSystem
				// 				);
				// 				await utilities.savingSuccessfullySentDataPayload(
				// 					successfullyPayloadsFilePath,
				// 					successfullyURLFilePath,
				// 					activeSystem,
				// 					dataValueBlueprint,
				// 					analyticURL,
				// 					dataMigrationResponse,
				// 					loadedDataSize
				// 				);
				// 			} else {
				// 				logger.printLogMessageInConsole(
				// 					'info',
				// 					`Response Message: ${chalk.gray(
				// 						chalk.bold(
				// 							_.has(
				// 								dataMigrationResponse.data,
				// 								'Message'
				// 							)
				// 								? dataMigrationResponse
				// 										.data
				// 										.Message
				// 								: _.has(
				// 										dataMigrationResponse.data,
				// 										'description'
				// 								  )
				// 								? dataMigrationResponse
				// 										.data
				// 										.description
				// 								: ''
				// 						)
				// 					)} Code: ${chalk.yellow(
				// 						chalk.bold(
				// 							dataMigrationResponse
				// 								.data
				// 								.status
				// 						)
				// 					)}`,
				// 					activeSystem
				// 				);
				// 			}
				// 		} else {
				// 			if (
				// 				dataMigrationResponse.data &&
				// 				dataMigrationResponse.data
				// 			) {
				// 				const uuidService = new UUIDService();
				// 				const responseMessage = await dataMigrationResponse.data;
				// 				const sourceDetails = await reportService.getReportMetadata(
				// 					fromSystemPayloadDetails,
				// 					activeSystem,
				// 					'source'
				// 				);
				// 				const destinationDetails = await reportService.getReportMetadata(
				// 					dataValueBlueprint,
				// 					activeSystem,
				// 					'destination'
				// 				);

				// 				const messages = _.has(
				// 					responseMessage,
				// 					'conflicts'
				// 				)
				// 					? await responseMessage.conflicts
				// 					: [];
				// 				const respMessage = _.map(
				// 					messages,
				// 					(message) => {
				// 						return _.mapKeys(
				// 							message,
				// 							(
				// 								value,
				// 								key
				// 							) => {
				// 								if (
				// 									key ===
				// 									'value'
				// 								) {
				// 									return 'message';
				// 								} else if (
				// 									key ===
				// 									'object'
				// 								) {
				// 									return 'objectId';
				// 								} else {
				// 									return key;
				// 								}
				// 							}
				// 						);
				// 					}
				// 				);
				// 				/***
				// 				 *
				// 				 */
				// 				const payload = await reportService.getMergedPaylaod(
				// 					sourceDetails,
				// 					destinationDetails
				// 				);

				// 				if (
				// 					responseMessage.status ===
				// 					'WARNING'
				// 				) {
				// 					await reportService.createReportDetail(
				// 						payload,
				// 						activeSystem,
				// 						respMessage,
				// 						'failure'
				// 					);
				// 					/**
				// 					 *
				// 					 */
				// 					await appInfo.getWarningInfo(
				// 						responseMessage,
				// 						activeSystem
				// 					);
				// 				} else if (
				// 					responseMessage.status ===
				// 					'SUCCESS'
				// 				) {
				// 					await reportService.createReportDetail(
				// 						payload,
				// 						activeSystem,
				// 						respMessage,
				// 						'success'
				// 					);

				// 					const alreadySentURLs = await dataExchange.getActiveSystemAlreadySentAPIURLs(
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob
				// 					);

				// 					const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
				// 						MediatorInit.alreadySentURLGlobal,
				// 						alreadySentURLs
				// 					);

				// 					const URLToBeSent = await utilities.getAllURLForDataToBeSent(
				// 						__dirname,
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob
				// 					);

				// 					await appInfo.getAlreadySentLogInfo(
				// 						URLToBeSent,
				// 						alreadySentAnalyticURL,
				// 						activeSystem
				// 					);
				// 					const apiURLAlreadySentPathFile = await utilities.getAlreadySentPayloadFilePath(
				// 						activeSystem,
				// 						activeBatch,
				// 						activeJob
				// 					);

				// 					await utilities.savingAlreadySentURL(
				// 						apiURLAlreadySentPathFile,
				// 						analyticURL,
				// 						activeSystem
				// 					);
				// 					await utilities.savingSuccessfullySentDataPayload(
				// 						successfullyPayloadsFilePath,
				// 						successfullyURLFilePath,
				// 						activeSystem,
				// 						dataValueBlueprint,
				// 						analyticURL,
				// 						dataMigrationResponse,
				// 						loadedDataSize
				// 					);
				// 					/***
				// 					 *
				// 					 */
				// 					await appInfo.getSuccessInfo(
				// 						responseMessage,
				// 						activeSystem
				// 					);
				// 				} else {
				// 					/***
				// 					 *
				// 					 */
				// 					await appInfo.getDefaultInfo(
				// 						responseMessage,
				// 						activeSystem
				// 					);
				// 				}
				// 			} else {
				// 				console.log(
				// 					'RESPONSE ERROR::: ' +
				// 						JSON.stringify(
				// 							responseMessage
				// 						)
				// 				);
				// 			}
				// 		}
				// 	} catch (error) {
				// 		logger.printLogMessageInConsole(
				// 			'error',
				// 			error,
				// 			activeSystem
				// 		);
				// 	}
				// } else {
				// 	logger.printLogMessageInConsole(
				// 		'info',
				// 		`Data for this URL return empty rows`,
				// 		activeSystem
				// 	);
				// 	const emptyResURLs = await _.uniq(
				// 		utilities.getURLForEmptyData(
				// 			__dirname,
				// 			activeSystem,
				// 			activeBatch,
				// 			activeJob
				// 		)
				// 	);

				// 	if (
				// 		!_.includes(emptyResURLs, analyticURL)
				// 	) {
				// 		// ToDO: Save to the file URL with Empty Rows
				// 		const apiURLForDataReturningEmptyRows = await utilities.getPathForEmptyFetchedData(
				// 			dirName,
				// 			activeSystem,
				// 			activeBatch,
				// 			activeJob
				// 		);
				// 		await utilities.savingEmptyRowsDataURL(
				// 			apiURLForDataReturningEmptyRows,
				// 			activeSystem,
				// 			analyticURL
				// 		);
				// 	}
				// }
				// }
			} catch (error) {
				/***
				 *
				 */
				logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		}
	};

	/***
	 *
	 */
	getAlreadySentURL = (activeSystem, activeBatch, activeJob) => {
		/***
		 *
		 */
		const logger = new Logger();

		/***
		 *
		 */
		if (activeJob) {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\n')
					.filter(Boolean);
			} catch (error) {
				logger.printLogMessageInConsole('error', error);
			}
		} else {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				activeSystem,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\n')
					.filter(Boolean);
			} catch (error) {
				logger.printLogMessageInConsole('error', error);
			}
		}
	};

	/***
	 *
	 */
	getAlreadySentURLDataFromAPI = (activeSystem, isDataFromAPI) => {
		/***
		 *
		 */
		const logger = new Logger();

		/***
		 *
		 */
		if (isDataFromAPI) {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				activeSystem,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\n')
					.filter(Boolean);
			} catch (error) {
				logger.printLogMessageInConsole('error', error);
			}
		} else {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				activeSystem,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\n')
					.filter(Boolean);
			} catch (error) {
				logger.printLogMessageInConsole('error', error);
			}
		}
	};

	getURLForEmptyData = () => {
		const logger = new Logger();
		const apiURLAlreadySentPathFile = path.join(
			__dirname,
			'private',
			'log',
			activeSystem,
			'empty.txt'
		);
		try {
			return fs
				.readFileSync(apiURLAlreadySentPathFile)
				.toString()
				.split('\n')
				.filter(Boolean);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	getOrgUnitUids = async (chunkedOrgunits) => {
		if (chunkedOrgunits) {
			return await _.map(chunkedOrgunits, (chunkedOrgunit) => {
				return _.map(chunkedOrgunit, (orgObj) => {
					return orgObj.id;
				});
			});
		}
	};

	/**
	 *
	 */
	getHeaderPropIndex = (analyticsResults, dataProp) => {
		return _.findIndex(analyticsResults.headers, (data) => {
			return data.name == dataProp;
		});
	};
}

const mediatorInit = new MediatorInit();
mediatorInit.startMediator();
