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

/***
 *
 */
const MediatorService = require('./services/mediator.service');
const OrganizationUnitManager = require('./helpers/organization-unit');
const mediatorConfig = require('./config/metadata.config');
const AuthConfig = require('./config/auth.config');
const Logger = require('./logs/logger.log');
const Utilities = require('./utils/utils');
const Authenticate = require('./auth/system.auth');
const AppInfo = require('./resources/info/app.info');
const SystemInfo = require('./resources/system/details.system');
const SystemMapping = require('./resources/system/mapping.system');
const DataValueManagement = require('./resources/data/fetch/datavalue.fetch');
const DataExchange = require('./resources/data/send/data.send');
const MetadatManager = require('./resources/system/metadata.system');

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
	static counter = 1;

	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	mediatorConfigLauncher = () => {
		return _.filter(_.keys(mediatorConfig), config => {
			return mediatorConfig[config].isAllowed;
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
	}

	/***
	 *
	 */
	startMediator = async () => {
		/***
		 *
		 */
		const organizationUnit = new OrganizationUnitManager();
		const utilities = new Utilities();
		const logger = new Logger();
		const appInfo = new AppInfo();
		const systemInfo = new SystemInfo();

		/***
		 *
		 */
		for (const activeSystem of await systemInfo.getActiveSystem(
			mediatorConfig
		)) {
			/***
			 *
			 */
			try {
				/***
				 *
				 */
				await appInfo.printingTimestampForSpecificLogOnStart(
					activeSystem,
					__dirname
				);
				/***
				 *
				 */
				await appInfo.getWelcomeInfo(activeSystem);
			} catch (error) {
				/***
				 *
				 */
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
				mediatorConfig[activeSystem]
			)) {
				/***
				 *
				 */
				if (
					(await activeBatch.startsWith('batch')) &&
					(await utilities.isObject(
						mediatorConfig[activeSystem][activeBatch]
					))
				) {
					/***
					 *
					 */
					for (const activeJob of await _.keys(
						mediatorConfig[activeSystem][activeBatch]
					)) {
						/***
						 *
						 */
						if (
							(await activeJob.startsWith('job')) &&
							(await utilities.isObject(
								mediatorConfig[activeSystem][
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
								mediatorConfig,
								activeSystem,
								activeBatch,
								activeJob
							);

							/***
							 *
							 */
							await this.initiateAPICall(
								orgUnits,
								activeSystem,
								activeJob,
								activeBatch,
								mediatorConfig
							);
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
		mediatorConfig
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
			await mediatorConfig[activeSystem][activeBatch][activeJob][
				'isExecuted'
			]
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
				if ((await batches.length) > 0) {
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
						await mediatorConfig[activeSystem][
							activeBatch
						]
					) {
						if (await activeSystem) {
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
								activeSystem,
								activeBatch,
								activeJob
							);

							const apiFromURL =
								mediatorConfig[activeSystem]
									.dataFromURL;

							const data = await metadataManager.getActiveSystemDataDimension(
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
								mediatorConfig,
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
					logger.printLogMessageInConsole(
						'success',
						`${chalk.green(
							chalk.bold('DONE')
						)} Batch(${mediatorConfig[activeSystem][
							activeBatch
						][
							'batchName'
						].toUpperCase()}) and JOB(${mediatorConfig[
							activeSystem
						][activeBatch][
							activeJob
						].toUpperCase()}) for system ${activeSystem.toUpperCase()} has finished`,
						activeSystem
					);
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
			mediatorConfig,
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
					activeSystem.toString()
				);
			}
		} else {
			logger.printLogMessageInConsole(
				'error',
				`There is no URL to fetch data for system ${activeSystem.toUpperCase()}`,
				activeSystem.toString()
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
			mediatorConfig,
			activeSystem
		);

		const orgUnitsMapping = await systemMapping.getActiveSystemOrgUnitMapping(
			mediatorConfig,
			activeSystem,
			activeBatch,
			activeJob
		);

		const dataElementsMapping = await systemMapping.getActiveSystemDXMapping(
			mediatorConfig,
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
				mediatorConfig,
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

						dataValueBlueprint.period = await analyticsResults
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

								await dataValueBlueprint.dataValues.push(
									{
										orgUnit: await systemMapping.getOrgUnitUid(
											mediatorConfig,
											activeSystem,
											activeBatch,
											activeJob,
											orgUnitsMapping,
											orgUnitId,
											orgUnitObject
										),
										dataElement: await systemMapping.getDataElementUid(
											mediatorConfig,
											activeSystem,
											activeBatch,
											activeJob,
											dataElementsMapping,
											dataId
										),

										categoryOptionCombo: await utilities.getCategoryOptionCombo(
											mediatorConfig,
											activeSystem,
											coIndex,
											coSpecialIndex,
											analyticsResult
										),
										comment: '',
										dataSet: await systemInfo.getDataSetUidForCurrentJob(
											mediatorConfig,
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
										mediatorConfig[
											activeSystem
										].systemInfo.from.toUpperCase()
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
								activeSystem.toString()
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
								await mediatorConfig[
									activeSystem
								].isUsingHIM
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
										'error',
										`Response Message: ${chalk.red(
											chalk.bold(
												dataMigrationResponse
													.data
													.Message
											)
										)} Error Code: ${chalk.yellow(
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
								// ToDO: Implement data exchange not through HIM
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

	getOrgUnitUids = async chunkedOrgunits => {
		if (chunkedOrgunits) {
			return await _.map(chunkedOrgunits, chunkedOrgunit => {
				return _.map(chunkedOrgunit, orgObj => {
					return orgObj.id;
				});
			});
		}
	};

	/**
	 *
	 */
	getHeaderPropIndex = (analyticsResults, dataProp) => {
		return _.findIndex(analyticsResults.headers, data => {
			return data.name == dataProp;
		});
	};
}

const mediatorInit = new MediatorInit();
mediatorInit.startMediator();
