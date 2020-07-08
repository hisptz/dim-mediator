/***
 *
 */
const date = require('date-and-time');
const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const _ = require('lodash');

/***
 *
 */
const Logger = require('../../logs/logger.log');
const SystemInfo = require('../system/details.system');
const Utilities = require('../../utils/utils');
const appGlobalConfig = require('../../config/metadata.config');

/***
 *
 */
class AppInfo {
	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	getWelcomeInfo = async (currentRunningSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'default',
			`-------------------------------------`,
			currentRunningSystem.toString()
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'default',
			`DHIS2 Generic Data Exchange Mediator`,
			currentRunningSystem.toString()
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'default',
			`-------------------------------------`,
			currentRunningSystem.toString()
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'default',
			`Mediator Initiated...  ${chalk.green(
				chalk.bold(new Date())
			)}`,
			currentRunningSystem.toString()
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'default',
			`Mediator RUN ON::: ${chalk.green(
				chalk.bold(os.platform().toUpperCase())
			)} Operating System(OS)`,
			currentRunningSystem.toString()
		);
	};

	/***
	 *
	 */
	getAlreadySentLogInfo = (globalURLs, alreadySentURLs, activeSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'sent',
			`Sent ${chalk.green.bold(
				alreadySentURLs.length + 1
			)} out of ${chalk.green.bold(
				globalURLs.length
			)} to ${chalk.green(activeSystem.toUpperCase())} System`,
			activeSystem
		);
	};

	/***
	 *
	 */
	getDataExchangeLogInfo = async (
		appGlobalConfig,
		globalUrl,
		alreadySentUrl,
		activeSystem
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
			logger.printLogMessageInConsole(
				'default',
				`-----------------------------------------------`,
				activeSystem
			);
			/***
			 *
			 */
			logger.printLogMessageInConsole(
				'info',
				`Total URLS Generated For Data Exchange::: ${chalk.yellow(
					chalk.bold(globalUrl.length)
				)}`,
				activeSystem
			);
			/***
			 *
			 */
			logger.printLogMessageInConsole(
				'info',
				`Data Sent ${chalk.green(
					chalk.bold(
						appGlobalConfig[
							activeSystem
						].systemInfo.from.name.toUpperCase()
					)
				)} to ${chalk.blue(
					chalk.bold(activeSystem.toUpperCase())
				)} ${chalk.yellow(
					chalk.bold(alreadySentUrl.length + 1)
				)} out of ${chalk.yellow(
					chalk.bold(globalUrl.length)
				)}`,
				activeSystem
			);
			/***
			 *
			 */
			logger.printLogMessageInConsole(
				'default',
				`***********************************************`,
				activeSystem
			);
		} catch (error) {
			/***
			 *
			 */
			logger.printLogMessageInConsole('error', error, activeSystem);
		}
	};

	/***
	 *
	 */
	getDefaultInfo = async (responseMessage, activeSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(responseMessage.description)}`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(
				responseMessage.responseType
			)}: Imported: ${chalk.green(
				chalk.bold(responseMessage.importCount.imported)
			)} - Updated: ${chalk.green(
				chalk.bold(responseMessage.importCount.updated)
			)} - Ignored: ${chalk.yellow(
				chalk.bold(responseMessage.importCount.ignored)
			)} - Deleted: ${chalk.red(
				chalk.bold(responseMessage.importCount.deleted)
			)}`,
			activeSystem
		);
		/***
		 *
		 */
		if (_.has(responseMessage, 'conflicts')) {
			/***
			 *
			 */
			for (const conflict of await responseMessage.conflicts) {
				/***
				 *
				 */
				logger.printLogMessageInConsole(
					'info',
					`Object: ${
						_.has(conflict, 'object')
							? chalk.bold(conflict.object)
							: null
					} - Reason: ${
						_.has(conflict, 'value')
							? chalk.red(conflict.value)
							: null
					}`,
					activeSystem
				);
			}
		}

		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------`,
			activeSystem
		);
	};

	/***
	 *
	 */
	getSuccessInfo = async (responseMessage, activeSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(responseMessage.description)}`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(
				responseMessage.responseType
			)}: Imported: ${chalk.green(
				chalk.bold(responseMessage.importCount.imported)
			)} - Updated: ${chalk.green(
				chalk.bold(responseMessage.importCount.updated)
			)} - Ignored: ${chalk.yellow(
				chalk.bold(responseMessage.importCount.ignored)
			)} - Deleted: ${chalk.red(
				chalk.bold(responseMessage.importCount.deleted)
			)}`,
			activeSystem
		);
		/***
		 *
		 */
		if (_.has(responseMessage, 'conflicts')) {
			/***
			 *
			 */
			for (const conflict of await responseMessage.conflicts) {
				/***
				 *
				 */
				logger.printLogMessageInConsole(
					'info',
					`Object: ${
						_.has(conflict, 'object')
							? chalk.bold(conflict.object)
							: null
					} - Reason: ${
						_.has(conflict, 'value')
							? chalk.red(conflict.value)
							: null
					}`,
					activeSystem
				);
			}
		}

		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------`,
			activeSystem
		);
	};

	/***
	 *
	 */
	getWarningInfo = async (responseMessage, activeSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------\n`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(responseMessage.description)}`,
			activeSystem
		);
		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`${chalk.green(
				responseMessage.responseType
			)}: Imported: ${chalk.green(
				chalk.bold(responseMessage.importCount.imported)
			)} - Updated: ${chalk.green(
				chalk.bold(responseMessage.importCount.updated)
			)} - Ignored: ${chalk.yellow(
				chalk.bold(responseMessage.importCount.ignored)
			)} - Deleted: ${chalk.red(
				chalk.bold(responseMessage.importCount.deleted)
			)}`,
			activeSystem
		);
		/***
		 *
		 */
		if (_.has(responseMessage, 'conflicts')) {
			/***
			 *
			 */
			for (const conflict of await responseMessage.conflicts) {
				/***
				 *
				 */
				logger.printLogMessageInConsole(
					'info',
					`Object: ${
						_.has(conflict, 'object')
							? chalk.bold(conflict.object)
							: null
					} - Reason: ${
						_.has(conflict, 'value')
							? chalk.red(conflict.value)
							: null
					}`,
					activeSystem
				);
			}
		}

		/***
		 *
		 */
		logger.printLogMessageInConsole(
			'info',
			`------------------------------------------------------------------------------\n`,
			activeSystem
		);
	};

	/***
	 *
	 */
	printingTimestampForEverySuccessMessageDataFromAPI = (
		dirName,
		activeSystem,
		isDataFromAPI
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		let initialMessage = ``;
		/***
		 *
		 */
		if (activeSystem && isDataFromAPI) {
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DIM Data Exchange Mediator LOGS By Date:  ${date.format(
				new Date(),
				'ddd, MMM. DD YYYY h:m:s A'
			)} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				'success.txt'
			);

			/***
			 *
			 */
			try {
				/***
				 *
				 */
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					/***
					 *
					 */
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem
						);
					fs.appendFile(
						dataSuccessLogFilePath,
						`${initialMessage}`,
						(err) => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									activeSystem
								);
						}
					);
				});
			} catch (error) {
				/***
				 *
				 */

				this.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		} else {
			/***
			 *
			 */
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DIM Data Exchange Mediator LOGS By Date:  ${date.format(
				new Date(),
				'ddd, MMM. DD YYYY h:m:s A'
			)} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				'success.txt'
			);

			/***
			 *
			 */
			try {
				/***
				 *
				 */
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					/***
					 *
					 */
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem
						);
					fs.appendFile(
						dataSuccessLogFilePath,
						`${initialMessage}`,
						(err) => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									activeSystem
								);
						}
					);
				});
			} catch (error) {
				/***
				 *
				 */

				this.printLogMessageInConsole(
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
	printingTimestampForEverySuccessMessage = (
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
		let initialMessage = ``;
		/***
		 *
		 */
		if (activeJob) {
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(
				new Date(),
				'ddd, MMM. DD YYYY h:m:s A'
			)} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
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
				/***
				 *
				 */
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					/***
					 *
					 */
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem
						);
					fs.appendFile(
						dataSuccessLogFilePath,
						`${initialMessage}`,
						(err) => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									activeSystem
								);
						}
					);
				});
			} catch (error) {
				/***
				 *
				 */

				this.printLogMessageInConsole(
					'error',
					error,
					activeSystem,
					activeJob
				);
			}
		} else {
			/***
			 *
			 */
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(
				new Date(),
				'ddd, MMM. DD YYYY h:m:s A'
			)} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
				dirName,
				'private',
				'log',
				activeSystem,
				'success.txt'
			);

			/***
			 *
			 */
			try {
				/***
				 *
				 */
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					/***
					 *
					 */
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							activeSystem
						);
					fs.appendFile(
						dataSuccessLogFilePath,
						`${initialMessage}`,
						(err) => {
							if (err)
								logger.printLogMessageInConsole(
									'error',
									err,
									activeSystem
								);
						}
					);
				});
			} catch (error) {
				/***
				 *
				 */

				this.printLogMessageInConsole(
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
	printingTimestampForSpecificLogOnStart = (activeSystem, dirName) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		let initialMessage = ``;
		/***
		 *
		 */
		initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
		initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(
			new Date(),
			'ddd, MMM. DD YYYY h:m:s A'
		)} - Developed By: UDSM DHIS2 Team\n`;
		initialMessage += `**********************************************************************************************************\n`;

		/***
		 *
		 */
		const consoleLogsFilePath = path.join(
			dirName,
			'logs',
			'res',
			activeSystem,
			'logs.txt'
		);

		/***
		 *
		 */
		try {
			fs.open(consoleLogsFilePath, 'a', (err, fd) => {
				/***
				 *
				 */
				if (err)
					logger.printLogMessageInConsole(
						'error',
						err,
						activeSystem
					);
				fs.appendFile(
					consoleLogsFilePath,
					`${initialMessage}`,
					(err) => {
						if (err)
							logger.printLogMessageInConsole(
								'error',
								err,
								activeSystem
							);
					}
				);
			});
		} catch (error) {
			/***
			 *
			 */
			this.printLogMessageInConsole('error', error, activeSystem);
		}
	};
}

/***
 *
 */
module.exports = AppInfo;