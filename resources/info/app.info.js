const Logger = require('../../logs/logger.log');
const date = require('date-and-time');
const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');


class AppInfo {
	constructor() {}

	getWelcomeInfo = currentRunningSystem => {
		const logger = new Logger();
		logger.printLogMessageInConsole(
			'default',
			`-------------------------------------`,
			currentRunningSystem.toString()
		);
		logger.printLogMessageInConsole(
			'default',
			`DHIS2 Generic Data Exchange Mediator`,
			currentRunningSystem.toString()
		);
		logger.printLogMessageInConsole(
			'default',
			`-------------------------------------`,
			currentRunningSystem.toString()
		);
		logger.printLogMessageInConsole(
			'default',
			`Mediator Initiated...  ${new Date()}`,
			currentRunningSystem.toString()
		);
		logger.printLogMessageInConsole(
			'default',
			`Mediator RUN ON::: ${os.platform()} Operating System(OS)`,
			currentRunningSystem.toString()
		);
	};

	getAlreadySentLogInfo = (globalURLs, alreadySentURLs, systemNameId) => {
		const logger = new Logger();
		logger.printLogMessageInConsole(
			'sent',
			`Sent ${chalk.green.bold(alreadySentURLs.length + 1)} out of ${chalk.green.bold(globalURLs.length)} to ${chalk.green(systemNameId.toUpperCase())} System`,
			systemNameId
		);
	};

	getDataExchangeLogInfo = (globalUrl, alreadySentUrl, systemNameId) => {
		const logger = new Logger();
		try {
			logger.printLogMessageInConsole(
				'default',
				`-----------------------------------------------`,
				systemNameId
			);
			logger.printLogMessageInConsole(
				'info',
				`Total URLS Generated For Data Exchange::: ${globalUrl.length}`,
				systemNameId
			);
			logger.printLogMessageInConsole(
				'info',
				`Data Sent DHIS2 HMIS to ${systemNameId.toUpperCase()} ${
					alreadySentUrl.length + 1
				} out of ${globalUrl.length}`,
				systemNameId
			);
			logger.printLogMessageInConsole(
				'default',
				`***********************************************`,
				systemNameId
			);
		} catch (error) {
			logger.printLogMessageInConsole('error', error, systemNameId);
		}
	};

	printingTimestampForEverySuccessMessage = (systemNameId, dirName, tableName) => {
		const logger = new Logger();
		let initialMessage = ``;
		if (tableName) {
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(new Date(), 'ddd, MMM. DD YYYY h:m:s A')} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
				dirName,
				'private',
				'log',
				systemNameId,
				tableName,
				'success.txt'
			);

			try {
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							systemNameId
						);
					fs.appendFile(dataSuccessLogFilePath, `${initialMessage}`, err => {
						if (err)
							logger.printLogMessageInConsole(
								'error',
								err,
								systemNameId
							);
					});
				});
			} catch (error) {
				this.printLogMessageInConsole(
					'error',
					error,
					systemNameId,
					tableName
				);
			}
		} else {
			initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
			initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(new Date(), 'ddd, MMM. DD YYYY h:m:s A')} - Developed By: UDSM DHIS2 Team\n`;
			initialMessage += `**********************************************************************************************************\n`;
			const dataSuccessLogFilePath = path.join(
				dirName,
				'private',
				'log',
				systemNameId,
				'success.txt'
			);

			try {
				fs.open(dataSuccessLogFilePath, 'a', (err, fd) => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							systemNameId
						);
					fs.appendFile(dataSuccessLogFilePath, `${initialMessage}`, err => {
						if (err)
							logger.printLogMessageInConsole(
								'error',
								err,
								systemNameId
							);
					});
				});
			} catch (error) {
				this.printLogMessageInConsole(
					'error',
					error,
					systemNameId
				);
			}
		}
	};

	printingTimestampForSpecificLogOnStart = (systemNameId, dirName) => {
		const logger = new Logger();
		let initialMessage = ``;
		initialMessage += `\r\n\n----------------------------------------------------------------------------------------------------------\n`;
		initialMessage += `DHIS2 Generic Data Exchange Mediator LOGS By Date:  ${date.format(new Date(), 'ddd, MMM. DD YYYY h:m:s A')} - Developed By: UDSM DHIS2 Team\n`;
		initialMessage += `**********************************************************************************************************\n`;

		const consoleLogsFilePath = path.join(
			dirName,
			'logs',
			'res',
			systemNameId,
			'logs.txt'
		);

		try {
			fs.open(consoleLogsFilePath, 'a', (err, fd) => {
				if (err)
					logger.printLogMessageInConsole(
						'error',
						err,
						systemNameId
					);
				fs.appendFile(consoleLogsFilePath, `${initialMessage}`, err => {
					if (err)
						logger.printLogMessageInConsole(
							'error',
							err,
							systemNameId
						);
				});
			});
		} catch (error) {
			this.printLogMessageInConsole(
				'error',
				error,
				systemNameId
			);
		}
	};
}

module.exports = AppInfo;
