Package.describe({
	name: "mvtogt22:meteor-joins",
	summary: "Generic collection joins for Meteor",
	version: "1.2.0",
	git: "https://github.com/mvogttech/meteor-joins.git"
});

Package.onUse(function (api) {

	if(api.versionsFrom) {
		api.versionsFrom('METEOR@0.9.0');
	}

	api.add_files('lib/joins.js', ["client", "server"]);
});
