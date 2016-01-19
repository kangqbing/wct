define(['app'], function (app) {
	// 显示简写单号
	app.filter("getSaasOrderNo", function () {
		var filterFn = function (t) {
			var l = _.isEmpty(t) ? 0 : t.length;
			return l == 0 ? '' : t.slice(-4);
		};
		return filterFn;
	});
	// 显示订单类型的label
	app.filter("getOrderSubTypeLabel", function () {
		IQ.ns('KO.TypeDef');
		var filterFn = function (t) {
			if (_.isEmpty(t)) return '';
			var orderSubTypes = KO.TypeDef.OrderSubTypes;
			var label = orderSubTypes[t]['label'];
			return label;
		};
		return filterFn;
	});

	// 格式化订单渠道的数据
	app.filter("mapOrderChannels", function () {
		var filterFn = function (channels) {
			var ret = _.map(channels, function (channel) {
				return _.extend(channel, {
					value : _.result(channel, 'channelCode', ''),
					label : _.result(channel, 'channelName', '')
				});
			});
			return ret;
		};
		return filterFn;
	});

	// 显示订单渠道label
	app.filter("getOrderChannelLabel", function () {
		var filterFn = function (v, channels) {
			// IQ.Debug.info("Run Count: ");
   //          IQ.Debug.info(window.count++);
			var ret = _.find(channels, function (channel) {
				return v == _.result(channel, 'channelCode');
			});
			return _.isUndefined(ret) ? '空' : _.result(ret, 'channelName');
		};
		return filterFn;
	});

	// 格式化时间显示
	app.filter("formatDateTimeStr", function () {
		var filterFn = function (v, format) {
			// IQ.Debug.info(v);
			// IQ.Debug.info(format);
			if (v == '0' || _.isEmpty(v)) return '';
			var dateStr = KO.Common.formatDateTimeValue(v),
				f = format || 'yyyy/MM/dd HH:mm:ss';

			return _.isEmpty(dateStr) ? '' : IQ.Date.getDateByFormat(dateStr, f);

		};
		return filterFn;
	});

	// 格式化至今时间间隔显示
	app.filter("formatTimeInterval", function () {
		var filterFn = function (v) {
			if (v == '0' || _.isEmpty(v)) return '';
			var dateStr = KO.Common.formatDateTimeValue(v),
				f = 'yyyy/MM/dd HH:mm:ss';
			var timeSec = IQ.Date.getTimeTickInSec(IQ.Date.getDateByFormat(dateStr, f));
			var curTime = (new Date()).getTime();
			var ret = IQ.Date.getDateText(timeSec, curTime / 1000);
			return ret;
		};
		return filterFn;
	});

	// 格式化货币显示
	app.filter("mycurrency", function () {
		var filterFn = function (v, format) {
			// IQ.Debug.info(v);
			// IQ.Debug.info(format);
			var dataStr = KO.Common.Math.prettyPrice(v),
				currencyPrefix = format || '$';

			return _.isEmpty(dataStr) ? '' : currencyPrefix + dataStr;

		};
		return filterFn;
	});

	// VIP会员卡状态
	app.filter("vipCardStatus", function () {
		IQ.ns("KO");
		var filterFn = function (v) {
			var items = KO.TypeDef.VIPCardStatus;
			var status = _.find(items, function (item) {
				return _.result(item, 'value') == v;
			});
			return _.result(status, 'label', '');
		};
		return filterFn;
	});

	// 用户性别显示
	app.filter("gender", function() {
		IQ.ns("KO");
		var filterFn = function (v) {
			var items = KO.TypeDef.GENDER;
			var gender = _.find(items, function (item) {
				return _.result(item, 'value') == v;
			});
			return _.result(gender, 'label', '');
		};
		return filterFn;
	});

	// 美化数字
	app.filter("prettyNum", function () {
		IQ.ns("KO");
		var filterFn = function (v) {
			var s = parseFloat(v);
			if (isNaN(s)) return v;
			var dataStr = KO.Common.Math.prettyNumeric(s);
			return dataStr.toString();
		};
		return filterFn;
	});
});