const axios = require('axios');
const Logger = require('../logs/logger.log');
const Authenticate = require('../auth/system.auth');
const Utilities = require('../utils/utils');
const AuthConfig = require('../config/auth.config');

class MediatorService {
	APIURLS = [];

	/**
	 * 
	 */
	constructor() { }

	/**
	 * 
	 */
	generateGenericAnalyticsURLForSystems = (
		ou,
		dx,
		pe,
		systemURL,
		systemNameId
	) => {
		const utilities = new Utilities();
		if (systemNameId) {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getSystemAuthForAPICall(AuthConfig, systemNameId)}${utilities.URLSanitizer(systemURL)}`;
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		}
	};

	/**
	 * 
	 */
	generateImportURL = () => {
		const ouAttr = 'hu3ccByV59Z';
		const coAttr = 'unQ3vGsnP1w';
		const deAttr = 'hu3ccByV59Z';
		const authenticator = new Authenticate();
		const hostname = `https://${authenticator.getAuthCredForImport()}41.59.1.89:8080/api/31/dataValueSets`;
		const orgUnitCodeScheme = `orgUnitIdScheme=ATTRIBUTE:${ouAttr}`;
		const dataElementIdScheme = `dataElementIdScheme=ATTRIBUTE:${deAttr}`;
		const categoryOptionComboIdScheme = `categoryOptionComboIdScheme=ATTRIBUTE:${coAttr}`;
		const APIUrl = `${hostname}?${orgUnitCodeScheme}&${dataElementIdScheme}&${categoryOptionComboIdScheme}`;
		return APIUrl;
	};

	/**
	 * 
	 */
	generateImportForHIM() {
		const HIMAddressInTestEnvironment = `https://him-dev.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const HIMAddressLiveEnvironment = `https://him.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const muunganoGatewayAddr = `http://41.59.1.83:5001/hmis-to-imes`; //Muungano Address
		const authenticator = new Authenticate();
		return HIMAddressInTestEnvironment;
		// return muunganoGatewayAddr;
	}

	/**
	 * 
	 */
	getData = async url => {
		const logger = new Logger();
		const authenticator = new Authenticate();
		try {
			return await axios
				.get(url, authenticator.getHMISPortalSuperAuth())
				.catch(error => logger.printLogMessageInConsole('error', error));
		} catch (error) {
			logger.printLogMessageInConsole('error', error);
		}
	};
}

/**
 * 
 */
module.exports = MediatorService;
