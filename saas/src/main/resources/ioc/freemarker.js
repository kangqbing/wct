var ioc = {
	shiroTags : {
		type : "org.happy.base.shiro.freemarker.ShiroTags",
		singleton : true
	},
	permissionResolver : {
		type : "org.apache.shiro.authz.permission.WildcardPermissionResolver"
	},
	configuration : {
		type : "freemarker.template.Configuration"
	},
	freeMarkerConfigurer : {
		type : "org.happy.base.freemarker.NutzbookFreeMarkerConfigurer",
		events : {
			create : 'init'
		},
		fields : {
			tags : {
				'shiro' : {
					refer : 'shiroTags'
				}
			}
		},
		args : [ {
			refer : "configuration"
		}, {
			app : '$servlet'
		}, "WEB-INF", ".ftl", {
			refer : "freemarkerDirectiveFactory"
		} ]
	},
	permissionShiro : {
		type : "org.happy.base.freemarker.PermissionShiroFreemarker",
		args : [ {
			refer : "permissionResolver"
		}, {
			refer : "dao"
		} ]
	},
	permission : {
		type : "org.happy.base.freemarker.PermissionDirective"
	},
	currentTime : {
		type : "org.happy.base.freemarker.CurrentTimeDirective"
	},
	timeFormat : {
		type : "org.happy.base.freemarker.TimeFormatDirective"
	},
	permissionShiroDirective : {
		type : "org.nutz.plugins.view.freemarker.FreemarkerDirective",
		args : [ "perm_chow", {
			refer : "permissionShiro"
		} ]
	},
	permissionDirective : {
		type : "org.nutz.plugins.view.freemarker.FreemarkerDirective",
		args : [ "cms_perm", {
			refer : "permission"
		} ]
	},
	currentTimeDirective : {
		type : "org.nutz.plugins.view.freemarker.FreemarkerDirective",
		args : [ "currentTime", {
			refer : "currentTime"
		} ]
	},
	timeFormatDirective : {
		type : "org.nutz.plugins.view.freemarker.FreemarkerDirective",
		args : [ "timeFormat", {
			refer : "timeFormat"
		} ]
	},
	freemarkerDirectiveFactory : {
		type : "org.nutz.plugins.view.freemarker.FreemarkerDirectiveFactory",
		events : {
			create : 'init'
		},
		fields : {
			freemarker : 'custom/freemarker.properties',
		},
		args : [ {
			refer : "permissionDirective"
		}, {
			refer : "timeFormatDirective"
		}, {
			refer : "currentTimeDirective"
		}, {
			refer : "permissionShiroDirective"
		} ]
	}
};