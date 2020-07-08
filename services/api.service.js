/***
 *
 */
const axios = require('axios');
const _ = require('lodash');

/***
 *
 */
const Logger = require('../logs/logger.log');
const Authenticate = require('../auth/system.auth');
const Utilities = require('../utils/utils');
const AuthConfig = require('../config/auth.config');
const APIConfig = require('../config/api.config');

/***
 *
 */
class APIService {
	/**
	 *
	 */
	constructor() {}

	/**
	 *
	 */
	getSystemPayloads = async (appGlobalConfig, activeSystem) => {
		const apiEndpoint = `${appGlobalConfig[activeSystem].dataFromURL}api/payloads`
		const logger = new Logger();
		const authenticator = new Authenticate();
		try {
			return await axios
				.get(apiEndpoint, authenticator.getAPIAuth(APIConfig))
				.catch((error) =>
					logger.printLogMessageInConsole('error', error, activeSystem)
				);
		} catch (error) {
			logger.printLogMessageInConsole('error', error);
		}
	};
}

/**
 *
 */
module.exports = APIService;