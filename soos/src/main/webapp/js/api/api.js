define(['app'], function(app) {
	IQ.ns("KO.G");
	var ajaxEngine = KO.ajaxEngine;
	var AjaxMappingURLs = KO.G.AjaxMappingURLs;
	var pendingRequests = {};
	var storePendingRequest = function(name, pdata, apiCfg) {
		pendingRequests[name] = {
			pdata : pdata,
			apiCfg : apiCfg
		};
	};
	// 接口配置注册
	ajaxEngine.mappingUrls(AjaxMappingURLs);
	/**
	 * 生成ajax接口服务
	 * 
	 * @return {undefined}
	 */
	function initServiceRoutes() {
		var ajaxAPICfgs = ajaxEngine.getAll();
		app.factory('CommonCallServer', ['$http', '$location',
				'AppProgressbar', function($http, $location, AppProgressbar) {
					var ret = {};
					var parseParam = function(param, key) {
						var paramStr = "";
						if (param instanceof String || param instanceof Number
								|| param instanceof Boolean) {
							paramStr += "&" + key + "="
									+ encodeURIComponent(param);
						} else {
							$.each(param, function(i) {
										var k = key == null ? i : key
												+ (param instanceof Array ? "["
														+ i + "]" : "." + i);
										paramStr += '&' + parseParam(this, k);
									});
						}
						return paramStr.substr(1);
					};
					var doRequest = function(pdata, apiCfg) {
						var AjaxDomain = KO.G.AJAX_DOMAIN;
						var name = apiCfg.name, url = apiCfg.url, urlType = apiCfg.urlType
								|| 'ajax', type = apiCfg.type;
						var ajaxUrl = AjaxDomain + url;
						var params = !pdata ? {} : pdata;
						$.extend(params, {
									callback : 'JSON_CALLBACK'
								});
						params = parseParam(params);
						ajaxUrl = ajaxUrl + "?" + params;
						log(ajaxUrl);
						// 由于Angular采用postJSON方式发送数据到后台，所以form-data字段会变成json字符串
						// 处理方法就是Angular中使用transformRequest，进行转换，利用jQuery的$.param将postJOSN解析成paras
						// 防止重复ajax请求
						
						if (IQ.isEmpty(pendingRequests[name])) {
							storePendingRequest(name, pdata, apiCfg);
						} else {
							return null;
						}
						return $http({
							method : 'jsonp',
							url : ajaxUrl,
							headers : {
								"Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
								"Accept" : "*/*"
							},
							withCredentials : true
						}).success(function(data) {
									var code = _.result(data, 'code');
									pendingRequests[name] = null;
									if (code == 'CS002') {
										$location.path('/signin');
									}
									AppProgressbar.clear();
								}).error(function(data) {
									pendingRequests[name] = null;
									AppProgressbar.clear();
								});
					};
					$.each(ajaxAPICfgs, function(i,apiCfg) {
								ret[apiCfg.name] = (function(_apiCfg) {
									return function(pdata) {
										return doRequest(pdata, _apiCfg);
									};
								})(apiCfg);
							});
					return ret;
				}]);
	}

	initServiceRoutes();
});