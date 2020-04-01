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
	getSystemAuth = (AuthConfig, systemNameId) => {
		/***
		 *
		 */
		return {
			auth: {
				username: AuthConfig[systemNameId].username,
				password: AuthConfig[systemNameId].password,
			},
		};
	};

	/***
	 *
	 */
	getSystemAuthForAPICall = (AuthConfig, systemNameId) => {
		/***
		 *
		 */
		return `${AuthConfig[systemNameId].username}:${AuthConfig[systemNameId].password}@`;
	};

	/***
	 *
	 */
	getSecondarySystemAuthForDataExchange = (AuthConfig, systemNameId) => {
		/***
		 *
		 */
		return {
			auth: {
				username:
					AuthConfig[systemNameId].authSecondarySystem
						.username,
				password:
					AuthConfig[systemNameId].authSecondarySystem
						.password,
			},
		};
	};
}

/***
 *
 */
module.exports = Authentication;
