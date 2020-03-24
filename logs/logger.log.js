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
	printLogMessageInConsole = (status, message, systemName) => {
		if (status === 'default') {
			if (message) {
				console.log(`${emoji.get('bookmark')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		} else if (status === 'error') {
			if (message) {
				console.log(`${emoji.get('x')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		} else if (status === 'success') {
			if (message) {
				console.log(`${emoji.get('heavy_check_mark')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		} else if (status === 'info') {
			if (message) {
				console.log(`${emoji.get('information_source')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		} else if (status === 'sent') {
			if (message) {
				console.log(`${emoji.get('pushpin')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		} else {
			if (message) {
				console.log(`${emoji.get('bookmark')}  ${message}`);
				this.storeConsoleLogsInFile(message, systemName);
			}
		}
	};

	/**
	   *
	   * @param {*} msg
	   */
	storeConsoleLogsInFile = (msg, systemName) => {
		if (typeof systemName === undefined) {
			if (msg) {
				const consoleLogsFilePath = path.join(
					__dirname,
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
									this.printLogMessageInConsole('error', err, systemName);
							}
						);
					});
				} catch (error) {
					this.printLogMessageInConsole('error', error, systemName);
				}
			}
		} else {
			if (msg) {
				const consoleLogsFilePath = path.join(
					__dirname,
					'res',
					systemName,
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
									this.printLogMessageInConsole('error', err, systemName);
							}
						);
					});
				} catch (error) {
					this.printLogMessageInConsole('error', error, systemName);
				}
			}
		}
	};
}

module.exports = Logger;
