const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const date = require('date-and-time');

// Custom Classes
const Logger = require('../logs/logger.log');

class Utilities {
	constructor() { }

	/**
		   *
		   */
	joinBySymbol = (data, symbol) => {
		return _.join(data, symbol);
	};

	/**
		   *
		   */
	isFileExist = path => {
		return fs.accessSync(path);
	};

	/**
		   *
		   */
	createFolderAndFilePath = (
		rootDir,
		folders,
		filepath,
		message,
		systemName
	) => {
		if (_.isArray(folders)) {
			const folderPath = folders.join('/').toString();
			this.createFile(rootDir, folderPath, filepath, message, systemName);
		} else if (_.isString(folders)) {
			this.createFile(rootDir, folders, filepath, message, systemName);
		} else {
			logger.printLogMessageInConsole(
				'info',
				'File path is not recognizable.',
				systemName.toString()
			);
		}
	};

	/**
		   *
		   */
	createFolder = (rootDir, folders, systemName) => {
		const logger = new Logger();
		const folderPath = folders.join('/').toString();
		const fullPath = path.join(rootDir, folderPath);
		if (fs.existsSync(fullPath)) {
			logger.printLogMessageInConsole(
				'default',
				`Folder for storing payload files ${systemName.toUpperCase()} is already created`,
				systemName
			);
		} else {
			try {
				fs.mkdir(fullPath, { recursive: true }, error => {
					if (error)
						logger.printLogMessageInConsole('error', error, systemName);
					logger.printLogMessageInConsole(
						'success',
						`Folder for storing payload files ${systemName} is successfully created`,
						systemName
					);
				});
			} catch (error) {
				logger.printLogMessageInConsole('error', error, systemName);
			}
		}
	};

	/**
		   *
		   */
	createFile = (rootDir, folderPath, filepath, message, systemName) => {
		const logger = new Logger();
		try {
			fs.mkdir(folderPath, { recursive: true }, error => {
				if (error) logger.printLogMessageInConsole('error', error);
				const fullPath = path.join(rootDir, folderPath, filepath);
				if (fs.existsSync(fullPath)) {
					logger.printLogMessageInConsole(
						'success',
						`File for storing ${message} is already created.`,
						systemName.toString()
					);
					return true;
				} else {
					fs.appendFile(fullPath, '', error => {
						if (error) logger.printLogMessageInConsole('error', error);
						logger.printLogMessageInConsole(
							'success',
							`File for storing ${message} is successfully created.`,
							systemName.toString()
						);
					});
				}
			});
		} catch (error) {
			logger.printLogMessageInConsole('error', error);
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
	isArray = () => {
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
	createFoldersForStoringPayloads = (systemNameId, dirName, tableName) => {
		if (tableName) {
			this.createFolder(
				dirName,
				[`files`, systemNameId.toString(), tableName],
				systemNameId.toString()
			);
		} else {
			this.createFolder(
				dirName,
				[`files`, systemNameId.toString()],
				systemNameId.toString()
			);
		}
	};

	/**
		   *
		   */
	getPayloadsFilePathForSuccessDataExchange = (
		systemNameId,
		dirName,
		tableName
	) => {
		const logger = new Logger();
		try {
			return path.join(
				dirName,
				'files',
				systemNameId,
				tableName,
				date.format(new Date(), 'ddd-YYYY-MM-DD:hh:mm:ss-A') + '.json'
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		   *
		   */
	getAlreadySentPayloadFilePath = (systemNameId, dirName, tableName) => {
		try {
			return path.join(
				dirName,
				'private',
				'log',
				systemNameId,
				tableName,
				'sent.txt'
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		   *
		   */
	getAlreadySentPayloadURL = alreadySentURLPath => {
		return alreadySentURLPath
			? fs
				.readFileSync(alreadySentURLPath)
				.toString()
				.split('\r\n')
				.filter(Boolean)
			: '';
	};

	/**
		   *
		   */
	payloadURLComparator = (comparedURL, urlList) => {
		return comparedURL && urlList ? _.includes(urlList, comparedURL) : false;
	};

	/**
		   *
		   */
	getURLFilePathForSuccessDataExchange = (systemNameId, dirName, tableName) => {
		try {
			return path.join(
				dirName,
				'private',
				'log',
				systemNameId,
				tableName,
				'success.txt'
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		   *
		   */
	createFolderForSavingLogs = async (systemNameId, dirName, tableName) => {
		const utilities = new Utilities();

		if (tableName) {
			// Create folder and file for storing success message
			await this.createFolderAndFilePath(
				dirName,
				[`logs`, `res`, systemNameId, tableName],
				`logs.txt`,
				`<All Console Messages>`,
				systemNameId
			);

			// Create folder and file for storing success message
			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId, tableName],
				`success.txt`,
				`<Data Sent Success logs>`,
				systemNameId
			);

			// Create folder for storing URL for API calls
			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId, tableName],
				`fetch.txt`,
				`<URL for fetching data>`,
				systemNameId
			);

			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId, tableName],
				`sent.txt`,
				`<URL for already sent data>`,
				systemNameId
			);

			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId, tableName],
				`empty.txt`,
				`<URL for Data returning empty rows>`,
				systemNameId
			);
		} else {
			// Create folder and file for storing success message
			await this.createFolderAndFilePath(
				dirName,
				[`logs`, `res`, systemNameId],
				`logs.txt`,
				`<All Console Messages>`,
				systemNameId
			);

			// Create folder and file for storing success message
			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId],
				`success.txt`,
				`<Data Sent Success logs>`,
				systemNameId
			);

			// Create folder for storing URL for API calls
			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId],
				`fetch.txt`,
				`<URL for fetching data>`,
				systemNameId
			);

			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId],
				`sent.txt`,
				`<URL for already sent data>`,
				systemNameId
			);

			await this.createFolderAndFilePath(
				dirName,
				[`private`, `log`, systemNameId],
				`empty.txt`,
				`<URL for Data returning empty rows>`,
				systemNameId
			);
		}
	};

	/**
		   *
		   */
	resettingDataValuesImportTemplate = dataValuesImportTemplate => {
		dataValuesImportTemplate.completeDate = '';
		dataValuesImportTemplate.dataValues = [];
		dataValuesImportTemplate.period = '';
	};

	/**
		   * 
		   */
	getURLForEmptyData = (systemNameId, dirName) => {
		const logger = new Logger();
		const apiURLAlreadySentPathFile = path.join(
			dirName,
			'private',
			'log',
			systemNameId,
			'empty.txt'
		);
		try {
			return fs
				.readFileSync(apiURLAlreadySentPathFile)
				.toString()
				.split('\r\n')
				.filter(Boolean);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		 * 
		 */
	getPathForEmptyFetchedData = (dirName, systemNameId) => {
		return path.join(
			dirName,
			'private',
			'log',
			systemNameId,
			'empty.txt'
		);
	};

	/**
	   * 
	   */
	savingEmptyRowsDataURL = (emptyRowsURLPath, systemNameId) => {
		try {
			fs.open(emptyRowsURLPath, 'a', (err, fd) => {
				if (err) logger.printLogMessageInConsole('error', err, systemNameId);
				try {
					fs.appendFile(emptyRowsURLPath, `${analyticURL}\r\n`, err => {
						if (err)
							logger.printLogMessageInConsole('error', err, systemNameId);
					});
				} catch (error) {
					logger.printLogMessageInConsole('error', error, systemNameId);
				}
			});
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		   *
		   */
	savingSuccessfullySentDataPayload = (
		payloadFilePath,
		successURLFilePath,
		systemNameId,
		dataValuesImportTemplate,
		analyticURL,
		results,
		valueLength
	) => {
		const logger = new Logger();
		try {
			fs.writeFile(
				payloadFilePath,
				JSON.stringify(dataValuesImportTemplate),
				err => {
					if (err) logger.printLogMessageInConsole('error', err, systemNameId);
					try {
						fs.open(successURLFilePath, 'a', (err, fd) => {
							if (err)
								logger.printLogMessageInConsole('error', err, systemNameId);
							fs.appendFile(
								successURLFilePath,
								`() - [${date.format(new Date(), 'ddd, YYYY-MM DD:hh:mm:ssA')}] - [Total Data Sent: ${valueLength}] --> ${analyticURL}\r\n`,
								error => {
									if (error)
										logger.printLogMessageInConsole(
											'error',
											error,
											systemNameId
										);
								}
							);
						});
						this.resettingDataValuesImportTemplate(
							dataValuesImportTemplate
						);
						logger.printLogMessageInConsole(
							'success',
							results.data.Message,
							systemNameId
						);
					} catch (error) {
						logger.printLogMessageInConsole('error', error, systemNameId);
					}
				}
			);
		} catch (error) {
			logger.printLogMessageInConsole(
				'error',
				error,
				systemNameId.toString()
			);
		}
	};

	/**
		   *
		   */
	savingAlreadySentURL = (
		apiURLAlreadySentPathFile,
		analyticURL,
		systemNameId
	) => {
		const logger = new Logger();
		try {
			fs.open(apiURLAlreadySentPathFile, 'a', (err, fd) => {
				if (err) logger.printLogMessageInConsole('error', err, systemNameId);
				try {
					fs.appendFile(
						apiURLAlreadySentPathFile,
						`${analyticURL}\r\n`,
						err => {
							if (err)
								logger.printLogMessageInConsole('error', err, systemNameId);
						}
					);
				} catch (error) {
					logger.printLogMessageInConsole('error', error, systemNameId);
				}
			});
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	/**
		   *
		   */
	savingSuccessLogInfoInFile = (
		globalURL,
		alreadySentURL,
		dirName,
		systemNameId,
		tableName
	) => {
		const logger = new Logger();
		try {
			const logsPathFile = path.join(
				dirName,
				'private',
				'log',
				systemNameId,
				tableName,
				'success.txt'
			);

			try {
				fs.open(logsPathFile, 'a', (err, fd) => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							systemNameId,
							tableName
						);
					fs.appendFile(
						logsPathFile,
						`Total Number Of Data Remained To Be Sent::: ${globalURL.length - alreadySentURL.length}\r\n`,
						err => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									systemNameId,
									tableName
								);
						}
					);
				});
			} catch (error) {
				logger.printLogMessageInConsole('error', error, systemNameId);
			}
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};
}

module.exports = Utilities;
