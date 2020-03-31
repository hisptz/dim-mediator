/***
 *
 */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const date = require('date-and-time');
const chalk = require('chalk');

/***
 *
 */
const Logger = require('../logs/logger.log');
const SystemInfo = require('../resources/system/details.system');

/***
 *
 */
class Utilities {
	/***
	 *
	 */
	constructor() {}

	/**
	 *
	 */
	joinBySymbol = (data, symbol) => {
		return _.join(data, symbol);
	};

	/**
	 *
	 */
	formatDataBasedOnCriteria = (data, symbol) => {
		console.log('DATA::: ', data);
	};

	/**
	 *
	 */
	isFileExist = path => {
		return fs.accessSync(path);
	};

	/***
	 *
	 */
	getIndexOfCustomCOC = analytics => {
		/***
		 *
		 */
		return _.compact(
			/***
			 *
			 */
			_.map(analytics.headers, header => {
				/***
				 *
				 */
				return /^\b[a-zA-Z0-9]{11}\b/.test(header.name)
					? _.indexOf(analytics.headers, header)
					: '';
			})
		);
	};

	/***
	 *
	 */
	getCategoryOptionCombo = (
		mediatorConfig,
		activeSystem,
		indexOfCO,
		coSpecialIndex,
		dataRow
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		if (
			mediatorConfig &&
			activeSystem &&
			indexOfCO &&
			coSpecialIndex &&
			dataRow
		) {
			if (indexOfCO === -1 && coSpecialIndex.length > 0) {
				/***
				 *
				 */
				return _.join(
					_.map(coSpecialIndex, cocIndex => {
						return dataRow[cocIndex];
					}),
					'_'
				);
			} else if (indexOfCO === -1 && coSpecialIndex.length <= 0) {
				/***
				 *
				 */
				return mediatorConfig[activeSystem].defaultCOC
					? mediatorConfig[activeSystem].defaultCOC
					: '';
			} else if (indexOfCO) {
				/***
				 *
				 */
				return dataRow[indexOfCO];
			}
		} else {
			/***
			 *
			 */
			logger.printLogMessageInConsole(
				'error',
				`Details for generating COC are not completed`,
				activeSystem
			);
		}
	};

	/***
	 *
	 */
	arrayToObject = orgUnits => {
		if (orgUnits) {
			return orgUnits.reduce((obj, item) => {
				obj[item.id] = item;
				return obj;
			}, {});
		}
	};

	/**
	 *
	 */
	createFolderAndFilePath = (
		rootDir,
		folders,
		filepath,
		message,
		activeSystem
	) => {
		if (_.isArray(folders)) {
			const folderPath = folders.join('/').toString();
			this.createFile(
				rootDir,
				folderPath,
				filepath,
				message,
				activeSystem
			);
		} else if (_.isString(folders)) {
			this.createFile(
				rootDir,
				folders,
				filepath,
				message,
				activeSystem
			);
		} else {
			logger.printLogMessageInConsole(
				'info',
				'File path is not recognizable.',
				activeSystem.toString()
			);
		}
	};

	/**
	 *
	 */
	createFolder = (rootDir, folders, activeSystem) => {
		const logger = new Logger();
		const folderPath = folders.join('/').toString();
		const fullPath = path.join(rootDir, folderPath);
		if (fs.existsSync(fullPath)) {
			logger.printLogMessageInConsole(
				'default',
				`Folder for storing payload files ${activeSystem.toUpperCase()} is already created`,
				activeSystem
			);
		} else {
			try {
				fs.mkdir(
					fullPath,
					{
						recursive: true,
					},
					error => {
						if (error)
							logger.printLogMessageInConsole(
								'error',
								error,
								activeSystem
							);
						logger.printLogMessageInConsole(
							'success',
							`Folder for storing payload files ${activeSystem} is successfully created`,
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
	};

	/**
	 *
	 */
	createFile = (rootDir, folderPath, filepath, message, activeSystem) => {
		const logger = new Logger();
		try {
			fs.mkdir(
				folderPath,
				{
					recursive: true,
				},
				error => {
					if (error)
						logger.printLogMessageInConsole(
							'error',
							error
						);
					const fullPath = path.join(
						rootDir,
						folderPath,
						filepath
					);
					if (fs.existsSync(fullPath)) {
						logger.printLogMessageInConsole(
							'success',
							`File for storing ${message} is already created.`,
							activeSystem.toString()
						);
						return true;
					} else {
						fs.appendFile(fullPath, '', error => {
							if (error)
								logger.printLogMessageInConsole(
									'error',
									error
								);
							logger.printLogMessageInConsole(
								'success',
								`File for storing ${message} is successfully created.`,
								activeSystem.toString()
							);
						});
					}
				}
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	isObject = dataObject => {
		return dataObject.constructor.name === 'Object'
			? dataObject.constructor.name === 'Object'
			: false;
	};

	/**
	 *
	 */
	isArray = dataObject => {
		return dataObject.constructor.name === 'Array'
			? dataObject.constructor.name === 'Array'
			: false;
	};

	/**
	 *
	 */
	URLSanitizer = url => {
		return url.replace(/(^\w+:|^)\/\//, '');
	};

	/**
	 *
	 */
	createFoldersForStoringPayloads = (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		if (activeJob) {
			this.createFolder(
				dirName,
				[`files`, activeSystem, activeBatch, activeJob],
				activeSystem
			);
		} else {
			this.createFolder(
				dirName,
				[`files`, activeSystem.toString()],
				activeSystem.toString()
			);
		}
	};

	/**
	 *
	 */
	getPayloadsFilePathForSuccessDataExchange = (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 * 
		 */
		const logger = new Logger();
		/***
		 * 
		 */
		try {
			/***
			 * 
			 */
			return path.join(
				dirName,
				'files',
				activeSystem,
				activeBatch,
				activeJob,
				date.format(new Date(), 'ddd-YYYY-MM-DD:hh:mm:ss-A') +
					'.json'
			);
		} catch (error) {
			/***
			 * 
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	getAlreadySentPayloadFilePath = (
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		try {
			/***
			 *
			 */
			return path.join(
				process.cwd(),
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'sent.txt'
			);
		} catch (error) {
			/***
			 *
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	getAlreadySentPayloadURL = urlPath => {
		/***
		 *
		 */
		return this.isPathExist(urlPath)
			? fs
					.readFileSync(urlPath)
					.toString()
					.split('\n')
					.filter(Boolean)
			: [];
	};

	/**
	 *
	 */
	getAllURLForDataToBeSent = async (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		const urlPath = await this.getAllURLForDataToBeSentFilePath(
			dirName,
			activeSystem,
			activeBatch,
			activeJob
		);
		/***
		 *
		 */
		return (await urlPath)
			? await fs
					.readFileSync(urlPath)
					.toString()
					.split('\r\n')
					.filter(Boolean)
			: '';
	};

	/***
	 *
	 */
	getAllURLForDataToBeSentFilePath = (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		try {
			/***
			 *
			 */
			return path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'fetch.txt'
			);
		} catch (error) {
			/***
			 *
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	payloadURLComparator = (comparedURL, urlList) => {
		return comparedURL && urlList
			? _.includes(urlList, comparedURL)
			: false;
	};

	/***
	 *
	 */
	prepareLogEnvironment = (
		dirName,
		activeSystem,
		activeBatch,
		activeJOB
	) => {
		/***
		 *
		 */
		this.createFolderForSavingLogs(
			dirName,
			activeSystem,
			activeBatch,
			activeJOB
		);
		/***
		 *
		 */
		this.createFoldersForStoringPayloads(
			dirName,
			activeSystem,
			activeBatch,
			activeJOB
		);
	};

	/**
	 *
	 */
	getFilePathForBatches = async (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */

		const filePath = await path.join(
			dirName,
			'batch',
			activeSystem,
			activeBatch,
			activeJob,
			'watcher.txt'
		);

		if (this.isPathExist(filePath)) {
			try {
				return await path.join(
					dirName,
					'batch',
					activeSystem,
					activeBatch,
					activeJob,
					'watcher.txt'
				);
			} catch (error) {
				await logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		} else {
			try {
				const createResponse = await this.implementFolderAndFileFromPath(
					filePath
				);
				if (createResponse) {
					return await path.join(
						dirName,
						'batch',
						activeSystem,
						activeBatch,
						activeJob,
						'watcher.txt'
					);
				}
			} catch (error) {
				await logger.printLogMessageInConsole(
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
	getActiveAndRunningSystem = async mediatorConfig => {
		const systemInfo = new SystemInfo();
		const utilities = new Utilities();
		const activeSystems = await systemInfo.getActiveSystem(
			mediatorConfig
		);

		const nanga = _.filter(activeSystems, activeSystem => {
			return activeSystem
				? _.filter(
						systemInfo.getCurrentRunningJob(
							mediatorConfig,
							activeSystem,
							utilities
						),
						async job => {
							return job
								? (await utilities.getScheduledJobURLs(
										await utilities.getFilePathForBatches(
											activeSystem,
											process.cwd(),
											job
										),
										job
								  )) > 0
									? activeSystem
									: ''
								: [];
						}
				  )
				: [];
		});
	};

	/**
	 *
	 */
	getScheduledJobURLs = async (watcherPath, activeJob) => {
		const logger = new Logger();
		if (await this.isPathExist(watcherPath)) {
			try {
				return watcherPath
					? fs
							.readFileSync(watcherPath)
							.toString()
							.split('\n')
							.filter(Boolean)
					: [];
			} catch (error) {
				logger.printLogMessageInConsole(
					'error',
					error,
					activeJob
				);
			}
		} else {
			const creatResponse = await this.implementFolderAndFileFromPath(
				watcherPath
			);
			try {
				return creatResponse
					? await fs
							.readFileSync(watcherPath)
							.toString()
							.split('\n')
							.filter(Boolean)
					: [];
			} catch (error) {
				logger.printLogMessageInConsole(
					'error',
					error,
					activeJob
				);
			}
		}
	};

	/***
	 *
	 */
	isPathExist = path => {
		/***
		 *
		 */
		return fs.existsSync(path);
	};

	/***
	 *
	 */
	implementFolderAndFileFromPath = async filePath => {
		if (filePath) {
			const foldersPATH = await path.dirname(filePath);
			const filePATH = await path.basename(filePath);
			if (foldersPATH && filePATH) {
				await this.createFolderFromPathRecursively(foldersPATH);
				return true;
			} else {
				return false;
			}
		}
	};

	/***
	 *
	 */
	createFolderFromPathRecursively = async (folderPath, activeSystem) => {
		const logger = new Logger();
		if (folderPath) {
			try {
				await fs.mkdirSync(folderPath, {
					recursive: true,
				});
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
	getURLFilePathForSuccessDataExchange = (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		try {
			return path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'success.txt'
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	createFolderForSavingLogs = (
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		if (activeSystem) {
			/***
			 *  Folder and file for storing logs
			 */
			this.createFolderAndFilePath(
				dirName,
				[`logs`, `res`, activeSystem, activeBatch, activeJob],
				`logs.txt`,
				`<All Console Messages>`,
				activeSystem
			);

			/***
			 * Folder and file for storing successfully operations
			 */
			this.createFolderAndFilePath(
				dirName,
				[
					`private`,
					`log`,
					activeSystem,
					activeBatch,
					activeJob,
				],
				`success.txt`,
				`<Data Sent Success logs>`,
				activeSystem
			);

			/***
			 * Folder and file for storing data to be fetched from systems
			 */
			this.createFolderAndFilePath(
				dirName,
				[
					`private`,
					`log`,
					activeSystem,
					activeBatch,
					activeJob,
				],
				`fetch.txt`,
				`<URL for fetching data>`,
				activeSystem
			);

			/***
			 * Folder and file for storing already sent data
			 */
			this.createFolderAndFilePath(
				dirName,
				[
					`private`,
					`log`,
					activeSystem,
					activeBatch,
					activeJob,
				],
				`sent.txt`,
				`<URL for already sent data>`,
				activeSystem
			);

			/***
			 * Folder and file for storing empty returned data
			 */
			this.createFolderAndFilePath(
				dirName,
				[
					`private`,
					`log`,
					activeSystem,
					activeBatch,
					activeJob,
				],
				`empty.txt`,
				`<URL for Data returning empty rows>`,
				activeSystem
			);

			/***
			 *  Folder and file for watching system batch execution
			 */
			this.createFolderAndFilePath(
				dirName,
				[`batch`, activeSystem, activeBatch, activeJob],
				`watcher.txt`,
				`<All watcher information>`,
				activeSystem
			);
		}
	};

	/**
	 *
	 */
	resettingDataValuesImportTemplate = dataValueBlueprint => {
		dataValueBlueprint.completeDate = '';
		dataValueBlueprint.dataValues = [];
		dataValueBlueprint.period = '';
	};

	/***
	 *
	 */
	resetValuesForAPIURLToFetchDataInAFile = (
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		if (activeJob) {
			/***
			 *
			 */
			const apiURLPathFile = path.join(
				process.cwd(),
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'fetch.txt'
			);

			/***
			 *
			 */
			fs.truncate(apiURLPathFile, 0, () => {
				logger.printLogMessageInConsole(
					'info',
					`Successfully reset values of API URL for data fetching`,
					activeSystem
				);
			});
		} else {
			/***
			 *
			 */
			const apiURLPathFile = path.join(
				process.cwd(),
				'private',
				'log',
				activeSystem,
				'fetch.txt'
			);

			/***
			 *
			 */
			fs.truncate(apiURLPathFile, 0, () => {
				logger.printLogMessageInConsole(
					'info',
					`Successfully reset values of API URL for data fetching`,
					activeSystem
				);
			});
		}
	};

	/**
	 *
	 */
	getURLForEmptyData = (dirName, activeSystem, activeBatch, activeJob) => {
		/**
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		const apiURLAlreadySentPathFile = path.join(
			dirName,
			'private',
			'log',
			activeSystem,
			activeBatch,
			activeJob,
			'empty.txt'
		);
		/***
		 *
		 */
		try {
			/***
			 *
			 */
			return fs
				.readFileSync(apiURLAlreadySentPathFile)
				.toString()
				.split('\n')
				.filter(Boolean);
		} catch (error) {
			/***
			 *
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	getPathForEmptyFetchedData = (dirName, activeSystem, activeBatch, activeJob) => {
		/***
		 * 
		 */
		return path.join(
			dirName,
			'private',
			'log',
			activeSystem,
			activeBatch,
			activeJob,
			'empty.txt'
		);
	};

	/**
	 *
	 */
	savingEmptyRowsDataURL = (emptyRowsURLPath, activeSystem, analyticURL) => {
		/***
		 * 
		 */
		const logger = new Logger();
		/***
		 * 
		 */
		try {
			/***
			 * 
			 */
			fs.open(emptyRowsURLPath, 'a', (err, fd) => {
				if (err)
					logger.printLogMessageInConsole(
						'error',
						err,
						activeSystem
					);
				try {
					fs.appendFile(
						emptyRowsURLPath,
						`${analyticURL}\r\n`,
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
					/***
					 * 
					 */
					logger.printLogMessageInConsole(
						'error',
						error,
						activeSystem
					);
				}
			});
		} catch (error) {
			/***
			 * 
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/**
	 *
	 */
	savingSuccessfullySentDataPayload = (
		payloadFilePath,
		successURLFilePath,
		activeSystem,
		dataValueBlueprint,
		analyticURL,
		dataMigrationResponse,
		loadedDataSize
	) => {
		const logger = new Logger();
		try {
			fs.writeFile(
				payloadFilePath,
				JSON.stringify(dataValueBlueprint),
				err => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem
						);
					try {
						fs.open(
							successURLFilePath,
							'a',
							(err, fd) => {
								if (err)
									logger.printLogMessageInConsole(
										'error',
										err,
										activeSystem
									);
								fs.appendFile(
									successURLFilePath,
									`() - [${date.format(
										new Date(),
										'ddd, YYYY-MM DD:hh:mm:ssA'
									)}] - [Total Data Sent: ${loadedDataSize}] --> ${analyticURL}\r\n`,
									error => {
										if (error)
											logger.printLogMessageInConsole(
												'error',
												error,
												activeSystem
											);
									}
								);
							}
						);
						this.resettingDataValuesImportTemplate(
							dataValueBlueprint
						);
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
				activeSystem.toString()
			);
		}
	};

	/**
	 *
	 */
	savingAlreadySentURL = (
		apiURLAlreadySentPathFile,
		analyticURL,
		activeSystem
	) => {
		const logger = new Logger();
		try {
			fs.open(apiURLAlreadySentPathFile, 'a', (err, fd) => {
				if (err)
					logger.printLogMessageInConsole(
						'error',
						err,
						activeSystem
					);
				try {
					fs.appendFile(
						apiURLAlreadySentPathFile,
						`${analyticURL}\n`,
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
	};

	/**
	 *
	 */
	savingSuccessLogInfoInFile = (
		globalURL,
		alreadySentURL,
		dirName,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		try {
			/***
			 *
			 */
			const logsPathFile = path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				activeBatch,
				activeJob,
				'success.txt'
			);

			/***
			 *
			 */
			try {
				fs.open(logsPathFile, 'a', (err, fd) => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem,
							activeJob
						);
					fs.appendFile(
						logsPathFile,
						`Total Number Of Data Remained To Be Sent::: ${globalURL.length -
							alreadySentURL.length}\r\n`,
						err => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									activeSystem,
									activeJob
								);
						}
					);
				});
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
		} catch (error) {
			/***
			 *
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};
}

/***
 *
 */
module.exports = Utilities;
