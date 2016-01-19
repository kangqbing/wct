require.config({
	appDir : './js',
	paths : {
		'angular' : 'vendor/angular/angular',
		'angular-route' : 'vendor/angular-route/angular-route',
		'angular-resource' : 'vendor/angular-resource/angular-resource',
		'angular-cookies' : 'vendor/angular-cookies/angular-cookies',
		'angular-sanitize' : 'vendor/angular-sanitize/angular-sanitize',
		'angular-mocks' : 'vendor/angular-mocks/angular-mocks',
		'angular-socket-io' : 'vendor/angular-socket-io/socket.js',
		'ui.bootstrap' : 'vendor/angular-bootstrap/ui-bootstrap-tpls',
		'bootstrap' : 'vendor/bootstrap/bootstrap',
		'bootstrap-datetimepicker' : 'vendor/bootstrap-datetimepicker/bootstrap-datetimepicker.min',
		'bootstrap-datetimepicker.zh-CN' : 'vendor/bootstrap-datetimepicker/locales/bootstrap-datetimepicker.zh-CN',
		'jquery' : 'vendor/jquery/jquery',
		'underscore' : 'vendor/underscore/underscore',
		'angularLocalStorage' : 'vendor/angularLocalStorage/angularLocalStorage',
		'socket.io-client' : 'vendor/socket.io-client/socket.io',
		'uuid' : 'vendor/node-uuid/uuid',
		'qrcode' : 'vendor/jquery.qrcode/jquery.qrcode',
		
		
		
		'api' : 'api/api',
		'IQ' : 'utils/ixutils',
		'commonFn' : 'utils/commonFn',
		'datatype' : 'utils/datatype',
		'pubsub' : 'utils/pubsub',
		'global-const' : 'api/global-const',
		'global-url' : 'api/global-url',
		'pymatch' : 'utils/pymatch',
		'matcher' : 'utils/matcher'

	},
	shim : {
		'angular' : {
			deps : ['jquery']
		},
		'app' : {
			deps : ['angular', 'angular-route', 'angular-resource',
					'bootstrap', 'bootstrap-datetimepicker',
					'bootstrap-datetimepicker.zh-CN', 'ui.bootstrap',
					'angularLocalStorage', 'angular-cookies',
					'angular-sanitize']
		},
		'angular-route' : {
			deps : ['angular']
		},
		'angular-resource' : {
			deps : ['angular']
		},
		'angular-sanitize' : {
			deps : ['angular']
		},
		'angular-socket-io' : {
			deps : ['angular-mocks', 'socket.io-client']
		},
		'bootstrap' : {
			deps : ['jquery']
		},
		'bootstrap-datetimepicker' : {
			deps : ['jquery', 'bootstrap']
		},
		'bootstrap-datetimepicker.zh-CN' : {
			deps : ['jquery', 'bootstrap', 'bootstrap-datetimepicker']
		},
		'underscore' : {
			exports : '_'
		},
		'IQ' : {
			exports : 'IQ'
		},
		'commonFn' : {
			exports : 'commonFn',
			deps : ['IQ', 'jquery', "global-const", "datatype","socket.io-client"]
		},
		'pubsub' : {
			exports : 'pubsub',
			deps : ['IQ']
		},
		'matcher' : {
			deps : ['IQ', 'pymatch']
		},
		'datatype' : {
			exports : 'datatype',
			deps : ['IQ']
		},
		'ui.bootstrap' : {
			deps : ['angular']
		},
		'angularLocalStorage' : {
			deps : ['angular']
		},
		'angular-cookies' : {
			deps : ['angular']
		},
		'qrcode' : {
			deps : ['jquery']
		}
	}
});

require(['app', 'underscore',"socket.io-client", 'IQ', 'global-const', 'global-url', 'api',
				'datatype', 'commonFn', 'pubsub', 'matcher', 'uuid', 'qrcode'],
		function(app, _,io) {
			IQ.ns("KO");
			KO.io=io;
			if (window.KooWorkMode == 'dev') {
				require(['global-url', 'api'], function() {
							KO.G.AJAX_DOMAIN = 'http://127.0.0.1:8080';
							angular.bootstrap(document, ['app']);
						});
			} else {
				require(['global-url', 'api'], function() {
							angular.bootstrap(document, ['app']);
						});
			}
			var ua = window.navigator.userAgent;
			// 全局禁止鼠标右键菜单
			$(document).bind('contextmenu', function(e) {
						if (window.IXDEBUG)
							return true;
						if (!KO.Common.isTagName(e, ['INPUT', 'TEXTAREA'])) {
							e.preventDefault();
							return false;
						}
						return true;
					});

			// 选择性全局屏蔽双击触发选中事件
			$(':not(input, select, textarea)').disableSelection().on(
					'doubleclick', function(e) {
						if (window.IXDEBUG)
							return true;
						if (!KO.Common.isTagName(e, ['INPUT', 'TEXTAREA'])) {
							e.preventDefault();
							return false;
						}
						return true;
					});
			// 屏蔽Backspace键让路由回退的功能
			$('body').on('keydown', function($event) {
				var keyCode = $event.keyCode || $event.which;
				var $tar = $($event.target || $event.srcElement);
				var isTextEl = $tar
						.is(':text, :password, textarea, input[type=number]');
				var readOnly = $tar.attr('readonly');
				readOnly = !readOnly ? false : true;
				if (keyCode == KO.TypeDef.HotKeys['Backspace']
						&& (!isTextEl || readOnly)) {
					IQ.Debug
							.info('Ignore route jump by press Backspace Keyboard!');
					return false;
				}
			});
			if (ua.indexOf("Windows NT 5.0") > -1
					|| ua.indexOf("Windows NT 5.1") > -1
					|| ua.indexOf("Windows NT 5.2") > -1
					|| ua.indexOf("Windows 2000") > -1
					|| ua.indexOf("Windows 2000") > -1
					|| ua.indexOf("Windows XP") > -1
					|| ua.indexOf("Windows 2003") > -1) {
				$('body').trimTextInput();
			}

		});