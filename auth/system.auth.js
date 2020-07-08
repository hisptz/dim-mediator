/***
 *
 */
class Authentication {
	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	getAPIAuth = (APConfig) => {
		/***
		 *
		 */
		return {
			auth: {
				username: APConfig.username,
				password: APConfig.password,
			},
		};
	};

	/***
	 *
	 */
	getSystemAuth = (AuthConfig, activeSystem) => {
		/***
		 *
		 */
		return {
			auth: {
				username: AuthConfig[activeSystem].username,
				password: AuthConfig[activeSystem].password,
			},
		};
	};

	getAPIAuth = (auth) => {
		return {
			auth: {
				username: auth.username,
				password: auth.password,
			},
		};
	};

	/***
	 *
	 */
	getSystemAuthForAPICall = (AuthConfig, activeSystem) => {
		/***
		 *
		 */
		return `${AuthConfig[activeSystem].username}:${AuthConfig[activeSystem].password}@`;
	};

	/***
	 *
	 */
	getSecondarySystemAuthForDataExchange = (AuthConfig, activeSystem) => {
		/***
		 *
		 */
		return {
			auth: {
				username: AuthConfig[activeSystem].authSecondarySystem
					.username,
				password: AuthConfig[activeSystem].authSecondarySystem
					.password,
			},
		};
	};
}

/***
 *
 */
module.exports = Authentication;