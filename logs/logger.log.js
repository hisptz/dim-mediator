const emoji = require('node-emoji');
const fs = require('fs');
const path = require('path');
const date = require('date-and-time');

class Logger {
	constructor() { }

	/**
	   *
	   * @param {*} status
	   * @param {*} message
	   */
	printLogMessageInConsole = (status, message, activeSystem) => {
		if (status === 'default') {
			if (message) {
				console.log(`${emoji.get('bookmark')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		} else if (status === 'error') {
			if (message) {
				console.log(`${emoji.get('x')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		} else if (status === 'success') {
			if (message) {
				console.log(`${emoji.get('heavy_check_mark')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		} else if (status === 'info') {
			if (message) {
				console.log(`${emoji.get('information_source')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		} else if (status === 'sent') {
			if (message) {
				console.log(`${emoji.get('pushpin')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		} else {
			if (message) {
				console.log(`${emoji.get('bookmark')}  ${message}`);
				this.storeConsoleLogsInFile(message, activeSystem);
			}
		}
	};

	/**
	   *
	   * @param {*} msg
	   */
	storeConsoleLogsInFile = (msg, activeSystem) => {
		if (typeof activeSystem === undefined) {
			if (msg) {
				const consoleLogsFilePath = path.join(
					process.cwd(),
					'res',
					'logs.txt'
				);

				try {
					fs.open(consoleLogsFilePath, 'a', (err, fd) => {
						if (err) throw err;
						fs.appendFile(
							consoleLogsFilePath,
							`${date.format(new Date(), '(ddd) YYYY-MM-DD hh:mm:ssA')}: ${msg}\n`,
							err => {
								if (err)
									this.printLogMessageInConsole('error', err, activeSystem);
							}
						);
					});
				} catch (error) {
					this.printLogMessageInConsole('error', error, activeSystem);
				}
			}
		} else {
			if (msg) {
				const consoleLogsFilePath = path.join(
					process.cwd(),
					'res',
					activeSystem,
					'logs.txt'
				);

				try {
					fs.open(consoleLogsFilePath, 'a', (err, fd) => {
						try {
							fs.appendFile(
								consoleLogsFilePath,
								`${date.format(new Date(), '(ddd) YYYY-MM-DD hh:mm:ssA')}: ${msg}\n`,
								err => {
									if (err) {
										// console.log("CAINAMIST::: ", err);
										// this.printLogMessageInConsole('error', err, activeSystem);
									}
								}
							);
						} catch (error) {
							// this.printLogMessageInConsole('error', error, activeSystem);
						}
					});
				} catch (error) {
					// this.printLogMessageInConsole('error', error, activeSystem);
				}
			}
		}
	};
}

module.exports = Logger;
