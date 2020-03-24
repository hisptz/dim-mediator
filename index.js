/***
 *  System Library(Dependencies) Import
 */
const os = require('os');
const date = require('date-and-time');
const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const MediatorService = require('./services/mediator.service');
const OrganizationUnit = require('./helpers/organization-unit');
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

/***
 *  Class Mediator Init
 */
class MediatorInit {
	/***
	 * Global declared variables
	 */
	globalURL = new Array();
	static alreadySentURLGlobal = new Array();
	static orgUnitPayload = new Object();
	static currentRunningSystem = '';
	static dataSetForCurrentRunningSystem = '';
	static currentOUMapping;
	static currentRunningTable;
	static currentDXMapping;
	static counter = 1;

	/***
	 * 
	 */
	constructor() {
		if (this.mediatorConfigLauncher().length > 0) {
			const systemInfo = new SystemInfo();
			const systemMapping = new SystemMapping();
			const utilities = new Utilities();
			MediatorInit.currentRunningSystem = systemInfo.getSystemUID(systemInfo.getCurrentRunningSystem(
				mediatorConfig
			));
			const systemNameId = systemInfo.getSystemUID(systemInfo.getCurrentRunningSystem(mediatorConfig));
			MediatorInit.dataSetForCurrentRunningSystem = systemInfo.getDatasetForCurrentRunningSystem(
				mediatorConfig,
				MediatorInit.currentRunningSystem
			);

			if (_.has(mediatorConfig[systemNameId], 'generic')) {
				MediatorInit.currentOUMapping = systemMapping.getOrgUnitMappingForCurrentRunningSystem(
					mediatorConfig,
					systemNameId
				);
				MediatorInit.currentDXMapping = systemMapping.getDataMappingForCurrentRunningSystem();
			}

			MediatorInit.currentRunningTable = systemInfo.getCurrentRunningTable(
				mediatorConfig,
				systemNameId
			) !== undefined
				? systemInfo.getCurrentRunningTable(mediatorConfig, systemNameId)
				: null;

			if (MediatorInit.currentRunningTable) {
				utilities.createFolderForSavingLogs(
					systemNameId,
					__dirname,
					MediatorInit.currentRunningTable
				);
				utilities.createFoldersForStoringPayloads(
					systemNameId,
					__dirname,
					MediatorInit.currentRunningTable
				);
			} else {
				utilities.createFolderForSavingLogs(
					systemNameId,
					__dirname,
					MediatorInit.currentRunningTable
				);
				utilities.createFoldersForStoringPayloads(
					systemNameId,
					__dirname,
					MediatorInit.currentRunningTable
				);
			}
		}
	}

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
	startMediator = async () => {
		// Mediator instantiation
		const organizationUnit = new OrganizationUnit();
		const utilities = new Utilities();
		const logger = new Logger();
		const appInfo = new AppInfo();
		const systemInfo = new SystemInfo();
		const systemId = MediatorInit.currentRunningSystem;

		try {
			// Printing Initial message and timestamp for the logs in the logs file
			appInfo.printingTimestampForSpecificLogOnStart(systemId, __dirname);
			appInfo.getWelcomeInfo(systemId);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemId);
		}

		if (mediatorConfig[systemId] && mediatorConfig[systemId].isAllowed) {
			const runningReport = systemInfo.getCurrentRunningReport(
				mediatorConfig,
				systemId
			);
			logger.printLogMessageInConsole(
				'default',
				`${systemId.toUpperCase()} is successfully configured for Data Exchange`,
				systemId.toString()
			);

			if (mediatorConfig[systemId][runningReport]) {
				const orgUnits = organizationUnit.getOrgunits(
					mediatorConfig[systemId][runningReport].orgUnitLevel,
					mediatorConfig[systemId].dataFromURL,
					mediatorConfig[systemId].isUsingLiveDhis2,
					systemId
				);

				await this.initiateAPICall(
					orgUnits,
					mediatorConfig[systemId].system,
					mediatorConfig[systemId]
				);
			}
		} else {
			logger.printLogMessageInConsole(
				'error',
				`No system is allowed for data exchange.`
			);
		}
	};

	/***
	 * 
	 */
	initiateAPICall = async (orgUnits, systemMediatorConfig) => {
		const logger = new Logger();
		const utilities = new Utilities();
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();

		const systemNameId = systemInfo.getCurrentRunningSystem(mediatorConfig);
		const alreadySentURLs = await this.getAlreadySentURL(systemNameId);

		if (systemNameId) {
			logger.printLogMessageInConsole(
				'default',
				`${systemNameId.toUpperCase()} System is recognized`,
				MediatorInit.currentRunningSystem.toString()
			);
			const tableName = systemInfo.getCurrentRunningTable(
				mediatorConfig,
				systemNameId
			);
			if (tableName === undefined) {
				logger.printLogMessageInConsole(
					'default',
					`There is no TABLE NAME activated to for execution. Please activate configuration.`,
					systemNameId
				);
			} else {
				orgUnits.then(async response => {
					await this.resetValuesForAPIURLToFetchDataInAFile();
					MediatorInit.orgUnitPayload = await this.arrayToObject(response);
					const chunkedOrgunits = await _.chunk(response, 20);
					const chunkedOrgunitsUID = await this.getOrgUnitUids(
						chunkedOrgunits
					);

					const report = systemInfo.getCurrentRunningReport(
						mediatorConfig,
						systemNameId
					);

					// Generate data API URLs
					const period = await this.constructAPIPEDimension(
						systemNameId,
						report
					);
					const data = await this.constructAPIDataDimension(
						systemNameId,
						report
					);
					await this.generateURL(chunkedOrgunitsUID, data, period);
					MediatorInit.alreadySentURLGlobal = await _.uniq([
						...MediatorInit.alreadySentURLGlobal,
						...alreadySentURLs,
					]);
					await appInfo.printingTimestampForEverySuccessMessage(
						systemNameId,
						__dirname,
						tableName
					);
					await appInfo.getDataExchangeLogInfo(
						this.globalURL,
						alreadySentURLs,
						systemNameId
					);
					await utilities.savingSuccessLogInfoInFile(
						this.globalURL,
						alreadySentURLs,
						__dirname,
						systemNameId,
						tableName
					);
					await this.getAnalytics(this.globalURL, systemNameId);
				});
			}
		}
	};

	/**
	 *
	 */
	getAnalytics = async (analyticsURLS, systemNameId) => {
		const logger = new Logger();
		const systemInfo = new SystemInfo();

		const systemImportURL = await systemInfo.getCurrentRunningSystemImportURL(
			mediatorConfig,
			systemNameId
		);
		if (analyticsURLS) {
			if (systemImportURL) {
				try {
					await new Promise((resolve, reject) => {
						async.mapLimit(
							analyticsURLS,
							1,
							async.reflect(this.migrateData),
							(err, result) => {
								resolve(result);
							}
						);
					});
				} catch (error) {
					logger.printLogMessageInConsole('error', error);
				}
			} else {
				logger.printLogMessageInConsole(
					'error',
					`There is no Data Import URL for the system ${systemNameId.toUpperCase()}`,
					systemNameId.toString()
				);
			}
		}
	};

	/**
					   * 
					   */
	migrateData = async (analyticURL, callback) => {
		const systemInfo = new SystemInfo();
		const appInfo = new AppInfo();
		const logger = new Logger();
		const utilities = new Utilities();
		const authenticator = new Authenticate();
		const dataExchange = new DataExchange();
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
			MediatorInit.alreadySentURLGlobal
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
			const dataValueManagement = new DataValueManagement();
			const systemImportURL = systemInfo.getCurrentRunningSystemImportURL(
				mediatorConfig,
				systemNameId
			);
			const isUsingHIMSystem = systemInfo.isUsingHIMMediatorSystem(
				mediatorConfig,
				systemNameId
			);

			try {
				if (systemNameId) {
					const analyticsResults = await dataValueManagement.getAnalyticsResults(
						analyticURL,
						authenticator.getSystemAuth(AuthConfig, systemNameId)
					);

					if ((await analyticsResults.rows.length) > 0) {
						// const dataValuesImportTemplate = await dataValueManagement.getDataValuesImportTemplates();
						const dataValuesImportTemplate = {
							completeDate: date.format(new Date(), 'YYYY-MM-DD'),
							period: '',
							dataValues: [],
						};

						dataValuesImportTemplate.period = await analyticsResults.metaData
							.dimensions.pe[0];

						const indexForDX = this.getDataPropertyIndex(
							analyticsResults,
							'dx'
						);

						const indexForCO = await this.getDataPropertyIndex(
							analyticsResults,
							'co'
						);

						const indexForOU = this.getDataPropertyIndex(
							analyticsResults,
							'ou'
						);
						const indexForValue = this.getDataPropertyIndex(
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
									dataSet: systemInfo.getDatasetForCurrentRunningSystem(
										mediatorConfig,
										systemNameId
									),
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
									dataSet: systemInfo.getDatasetForCurrentRunningSystem(
										mediatorConfig,
										systemNameId
									),
								});
							});
							logger.printLogMessageInConsole(
								'info',
								`Data Loaded From DHIS2 HMIS - Sent To ${systemNameId.toUpperCase()}::: ${dataValuesImportTemplate.dataValues.length} Data values`,
								systemNameId.toString()
							);

							const valueLength = dataValuesImportTemplate.dataValues.length;
							const results = await dataExchange.importDataToSystem(
								dataValuesImportTemplate,
								systemImportURL,
								authenticator.getSecondarySystemAuthForDataExchange(
									AuthConfig,
									systemNameId
								),
								systemNameId
							);

							// Walter here is the ending point where next time if you want to resume you are going to
							if (results.data.status == 200) {
								const alreadySentURLs = await dataExchange.getAlreadySentAPIURLs(
									systemNameId,
									dirName,
									tableName
								);
								const alreadySentAnalyticURL = await dataExchange.getUniqueAlreadySentURL(
									MediatorInit.alreadySentURLGlobal,
									alreadySentURLs
								);

								await appInfo.getAlreadySentLogInfo(
									this.globalURL,
									alreadySentAnalyticURL,
									systemNameId
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
									results,
									valueLength
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

	constructAPIGenericPEDimension = systemId => {
		const utilities = new Utilities();

		if (mediatorConfig) {
			return _.flattenDeep(
				_.keys(mediatorConfig[systemId]).map(key => {
					return utilities.isObject(mediatorConfig[systemId][key])
						? _.keys(mediatorConfig[systemId][key]).map(subkey => {
							return subkey.startsWith('job') &&
								mediatorConfig[systemId][key][subkey]['execute']
								? _.map(
									mediatorConfig[systemId][key][subkey].pe.periods,
									period => {
										return mediatorConfig[systemId][key][subkey].pe
											.subPeriods.length > 0
											? _.map(
												mediatorConfig[systemId][key][subkey][pe][
												subPeriods
												],
												subPeriod => {
													return period + subPeriod;
												}
											)
											: period;
									}
								)
								: null;
						})
						: null;
				})
			).filter(Boolean);
		}
	};

	constructAPIGenericDataDimension = () => { };

	getAlreadySentURL = systemName => {
		const logger = new Logger();
		if (MediatorInit.currentRunningTable) {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem,
				MediatorInit.currentRunningTable,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\r\n')
					.filter(Boolean);
			} catch (error) {
				logger.printLogMessageInConsole('error', error);
			}
		} else {
			const apiURLAlreadySentPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem,
				'sent.txt'
			);
			try {
				return fs
					.readFileSync(apiURLAlreadySentPathFile)
					.toString()
					.split('\r\n')
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
			MediatorInit.currentRunningSystem.toString(),
			'empty.txt'
		);
		try {
			return fs
				.readFileSync(apiURLAlreadySentPathFile)
				.toString()
				.split('\r\n')
				.filter(Boolean);
		} catch (error) {
			logger.printLogMessageInConsole(
				'error',
				error,
				MediatorInit.currentRunningSystem.toString()
			);
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

	constructAPIOrgUnitDimension = orgunitUids => {
		if (orgunitUids) {
			this.constructAPIPEDimension(orgunitUids, '');
		}
	};

	constructAPIPEDimension = async (system, report) => {
		const logger = new Logger();
		if (!report) {
			return await _.flatten(
				_.map(
					mediatorConfig[system].generic.genericTable.pe.periods,
					period => {
						return mediatorConfig[system].generic.genericTable.pe.subPeriods
							.length > 0
							? _.map(
								mediatorConfig[system].generic.genericTable.pe.subPeriods,
								subPeriod => {
									return period + subPeriod;
								}
							)
							: period;
					}
				)
			);
		} else {
			return await _.flatten(
				_.map(
					mediatorConfig[system][report][MediatorInit.currentRunningTable].pe
						.periods,
					period => {
						return mediatorConfig[system][report][
							MediatorInit.currentRunningTable
						].pe.subPeriods.length > 0
							? _.map(
								mediatorConfig[system][report][
									MediatorInit.currentRunningTable
								].pe.subPeriods,
								subPeriod => {
									return period + subPeriod;
								}
							)
							: period;
					}
				)
			);
		}
	};

	constructAPIDataDimension = (system, report) => {
		if (!report) {
			return _.chunk(
				_.map(mediatorConfig[system].generic.genericTable.dx.data, data => {
					return data.id;
				}),
				50
			);
		} else {
			return _.chunk(
				_.map(
					mediatorConfig[system][report][MediatorInit.currentRunningTable].dx
						.data,
					data => {
						return data.id;
					}
				),
				50
			);
		}
	};

	arrayToObject = orgUnits => {
		if (orgUnits) {
			return orgUnits.reduce((obj, item) => {
				obj[item.id] = item;
				return obj;
			}, {});
		}
	};

	resetValuesForAPIURLToFetchDataInAFile = () => {
		const logger = new Logger();
		if (MediatorInit.currentRunningTable) {
			const apiURLPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem.toString(),
				MediatorInit.currentRunningTable.toString(),
				'fetch.txt'
			);

			fs.truncate(apiURLPathFile, 0, () => {
				logger.printLogMessageInConsole(
					'info',
					`Successfully reset values of API URL for data fetching`,
					MediatorInit.currentRunningSystem.toString()
				);
			});
		} else {
			const apiURLPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem.toString(),
				'fetch.txt'
			);

			fs.truncate(apiURLPathFile, 0, () => {
				logger.printLogMessageInConsole(
					'info',
					`Successfully reset values of API URL for data fetching`,
					MediatorInit.currentRunningSystem.toString()
				);
			});
		}
	};

	generateURL = async (orgUnits, dataElements, periods) => {
		const mediatorService = new MediatorService();
		const utilities = new Utilities();
		const logger = new Logger();
		let apiURLPathFile = '';
		if (MediatorInit.currentRunningTable) {
			apiURLPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem.toString(),
				MediatorInit.currentRunningTable.toString(),
				'fetch.txt'
			);
		} else {
			apiURLPathFile = path.join(
				__dirname,
				'private',
				'log',
				MediatorInit.currentRunningSystem.toString(),
				'fetch.txt'
			);
		}

		if (orgUnits && dataElements && periods) {
			periods.forEach(pe => {
				orgUnits.forEach(orgUnit => {
					const ou = utilities.joinBySymbol(orgUnit, ';');
					dataElements.forEach(dataElement => {
						const dx = utilities.joinBySymbol(dataElement, ';');
						const url = mediatorService.generateGenericAnalyticsURLForSystems(
							ou,
							dx,
							pe,
							mediatorConfig[MediatorInit.currentRunningSystem].dataFromURL,
							MediatorInit.currentRunningSystem
						);
						try {
							fs.open(apiURLPathFile, 'a', (err, fd) => {
								if (err)
									logger.printLogMessageInConsole(
										'error',
										err,
										MediatorInit.currentRunningSystem.toString()
									);
								try {
									fs.appendFile(apiURLPathFile, `${url}\r\n`, err => {
										if (err)
											logger.printLogMessageInConsole(
												'error',
												err,
												MediatorInit.currentRunningSystem.toString()
											);
									});
								} catch (error) {
									logger.printLogMessageInConsole(
										'error',
										error,
										MediatorInit.currentRunningSystem.toString()
									);
								}
							});
						} catch (error) {
							logger.printLogMessageInConsole(
								'error',
								error,
								MediatorInit.currentRunningSystem.toString()
							);
						}
						this.globalURL.push(url);
					});
				});
			});
		}
	};

	/**
			 *
			 */
	getDataPropertyIndex = (analyticsResults, dataProp) => {
		return _.findIndex(analyticsResults.headers, data => {
			return data.name == dataProp;
		});
	};
}

const mediatorInit = new MediatorInit();
mediatorInit.startMediator();
