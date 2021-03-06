define(['app', 'diandan/OrderHeaderSetController'], function (app) {
	// 桌台控制器
	app.controller('TableViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'OrderService', 'TableService', 'OrderChannel', 'OrderNoteService', 'AppAlert', 'AppAuthEMP', 'AppProgressbar',
		function ($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, OrderService, TableService, OrderChannel, OrderNoteService, AppAlert, AppAuthEMP, AppProgressbar) {
			IQ.ns("KO");
			var HC = KO.Common;
			// HC.TopTip.reset($rootScope);
			var shopInfo = storage.get("SHOPINFO"),
				operationMode = _.result(shopInfo, 'operationMode'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var allTableLstPromise = TableService.loadTableStatusLst();
			// 加载渠道数据
			OrderChannel.loadOrderChannels({}, function (data) {
				$scope.OrderChannels = OrderChannel.getAll();
				IQ.Debug.info("Order Channels: ");
				IQ.Debug.info($scope.OrderChannels);
			}, function (data) {
				// HC.TopTip.addTopTips($rootScope, data);
				AppAlert.add('danger', _.result(data, 'msg', ''));
			});

			$scope.OrderItemHandle = [
				{name : "addFood", clz : "addfood", active : true, label : "点菜"},
				{name : "cashPayOrder", clz : "checkout", active : false, label : "结账"},
				{name : "payOrder", clz : "hidden", active : false, label : "二维码结账"},
				{name : "urgeFood", active : false, label : "催叫"},
				// {name : "splitFood", active : false, label : "拆分"},
				{name : "changeFood", active : false, label : "转菜"},
				{name : "changeOrder", active : false, label : "换台"},
				{name : "mergeOrder", active : false, label : "并台"},
				{name : "unionOrder", active : false, label : "联台"}
				// {name : "selectAll", active : true, label : "全选"},
				// {name : "selectNone", active : true, label : "取消选择"}
			];
			// 当前选中的订单条目
			$scope.curSelectedOrderItems = [];

			// 重置订单数据
			$scope.resetOrderInfo = function () {
				$scope.orderHeader = OrderService.getOrderHeaderData();
				$scope.curOrderItems = (OrderService.getOrderFoodItemsHT()).getAll();
				$scope.curOrderRemark = OrderService.getOrderRemark();
				$scope.curOrderRemark = _.isEmpty($scope.curOrderRemark) ? '单注' : $scope.curOrderRemark;
				// 重置当前选中订单条目
				$scope.curSelectedOrderItems = [];
				IQ.Debug.info("Order List Info:");
				IQ.Debug.info($scope.curOrderItems);
			};
			// 计算订单列表中的菜品小计金额
			$scope.calcFoodAmount = function (item) {
				var math = KO.Common.Math;
				var foodPayPrice = _.result(item, 'foodPayPrice', 0),
					foodProPrice = _.result(item, 'foodProPrice', 0),
					foodNumber = _.result(item, 'foodNumber', 0),
					foodSendNumber = _.result(item, 'foodSendNumber', 0),
					foodCancelNumber = _.result(item, 'foodCancelNumber', 0);
				var v = math.multi(foodPayPrice, math.sub(foodNumber, foodSendNumber, foodCancelNumber));
				var str = parseFloat(v) == 0 ? '' : math.standardPrice(v);
				return str;
			};
			// 计算订单金额总计
			$scope.calcOrderAmount = function () {
				var math = KO.Common.Math;
				var orderItems = $scope.curOrderItems,
					amount = 0;
				_.each(orderItems, function (item) {
					amount = math.add(amount, $scope.calcFoodAmount(item));
				});
				return math.standardPrice(amount);
			};
			// 更新单头信息
			$scope.updateOrderHeader = function (data) {
				$scope.orderHeader = data;
				OrderService.updateOrderHeader($scope.orderHeader);
			};

			// 桌台名称搜索关键字
			$scope.qTblName = '';
			// 桌台状态过滤字段
			$scope.qTblStatus = '-1';
			
			// 当前选中桌台区域名
			$scope.curAreaName = '';
			// 桌台区域数据
			$scope.TableAreas = [];
			// 格式化区域选项的渲染数据
			var mapTableAreaRenderData = function (areas) {
				// areas.unshift({
				// 	__ID__ : 'all_tables',
				// 	areaName : '',
				// 	tblLst : null
				// });
				var ret = _.map(areas, function (area) {
					return _.extend(area, {
						value : _.result(area, 'areaName'),
						label : _.result(area, '__ID__') == 'all_tables' ? '全部' : _.result(area, 'areaName')
					});
				});
				return ret;
			};
			// 获取当前的桌台信息
			var getCurTables = function () {
				// 获取所有桌台数据
				var tables = TableService.filterTableLst($scope.qTblStatus, $scope.curAreaName);
				$scope.curTables = tables;
			};
			allTableLstPromise.success(function (data) {
				var areas = TableService.getTableAreas();
				getCurTables();
				$scope.TableAreas = mapTableAreaRenderData(areas);
				
			});

			$scope.refresh = function (dstTable, actionType) {
				var callServer = $scope.selectTableArea($scope.curAreaName);
				callServer.success(function (data) {
					var _tbl = TableService.getTableByItemID($scope.curTableID),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
					if (actionType == 'HT') {
						OrderService.clear();
						$scope.resetOrderInfo();
					} else {
						OrderService.getOrderByOrderKey({
							saasOrderKey : saasOrderKey,
							hisFlag : hisFlag
						}, function (data) {
							$scope.resetOrderInfo();
						}, function (data) {
							// HC.TopTip.addTopTips($rootScope, data);
							AppAlert.add('danger', _.result(data, 'msg', ''));
						});
					}
				});
				
				// $scope.curTableName = null;
			};
			/**
			 * 选择桌台区域
			 * @param  {[type]} v areaName
			 * @return {[type]}   [description]
			 */
			$scope.selectTableArea = function (v) {
				var progressbar = AppProgressbar.add('warning', '加载中...');
				$scope.curAreaName = v;
				// 获取指定区域桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					// var areas = TableService.getTableAreas();
					getCurTables();
					// $scope.TableAreas = mapTableAreaRenderData(areas);
					AppProgressbar.close(progressbar);
				});
				return callServer;
			};

			/*创建开台配置窗口*/
			var initOpenTableModal = function () {
				$scope.fmels = {
					person : '2',
					saasOrderRemark : '',
					tableName : $scope.curTableName
				};
                KO.ModalCom.openModal($rootScope, $modal, {
                	windowClass : webAppPageAnimationIsActive,
                    size : 'lg',
                    controller : "OpenTableSetController",
                    // templateUrl : "js/diandan/opentableset.html",
                    templateUrl : "js/diandan/orderheaderset.html",
                    resolve : {
                        _scope : function () {
                            return $scope;
                        }
                    }
                });
                
                OrderService.clear();
				$scope.resetOrderInfo();
			};

			/**
			 * 选择桌台动作
			 * @param  {[type]} v [description]
			 * @return {[type]}   [description]
			 */
			$scope.selectTableName = function ($event, table) {
				// var evtType = $event.type;
				// IQ.Debug.info("Table name event type: " + evtType);
				// var tableKey = _.result(table, 'itemID');
				// $scope.curTableID = _.result(table, 'itemID');
				// $scope.curTableName = _.result(table, 'tableName', '');
				// // 获取当前选中桌台状态数据
				// var callServer = TableService.loadTableStatusLst({
				// 	areaName : $scope.curAreaName,
				// 	tableName : $scope.curTableName
				// });
				// callServer.success(function (data) {
				// 	getCurTables();
				// 	var _tbl = TableService.getTableByItemID(tableKey),
				// 		tableStatus = _.result(_tbl, 'tableStatus'),
				// 		saasOrderKey = _.result(_tbl, 'saasOrderKey'),
				// 		hisFlag = _.result(_tbl, 'his', 0);
				// 	var activeBtns = ['addFood', 'changeOrder', 'mergeOrder', 'unionOrder', 'cashPayOrder', 'payOrder'];
				// 	// 如果桌台为占用状态并且订单号不为空，加载选中桌台的订单
				// 	if (tableStatus == 1 && !_.isEmpty(saasOrderKey)) {
				// 		OrderService.getOrderByOrderKey({
				// 			saasOrderKey : saasOrderKey,
				// 			hisFlag : hisFlag
				// 		}, function (data) {
				// 			$scope.resetOrderInfo();
				// 			$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
				// 				var n = _.result(btn, 'name'),
				// 					i = _.indexOf(activeBtns, n);
				// 				btn['active'] = i >= 0 ? true : false;
				// 				return btn;
				// 			});
				// 		}, function (data) {
				// 			// HC.TopTip.addTopTips($rootScope, data);
				// 			AppAlert.add('danger', _.result(data, 'msg', ''));
				// 		});
				// 	} else if (tableStatus == 0) {
				// 		// 弹出单头配置窗口，确认后发送开台请求，待成功开台后跳转点菜页面
				// 		activeBtns = ['addFood'];
				// 		initOpenTableModal();
				// 		$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
				// 			var n = _.result(btn, 'name'),
				// 				i = _.indexOf(activeBtns, n);
				// 			btn['active'] = i >= 0 ? true : false;
				// 			return btn;
				// 		});
				// 	}
				// });
				var evtType = $event.type,
					timeout = evtType == 'click' ? 500 : 200;
				$timeout(function () {
					IQ.Debug.info("Table name event type: " + evtType);
					if (table.evtType == 'dblclick' && evtType == 'click') {
						return false;
					}
					if (evtType == 'dblclick') {
						_.extend(table, {evtType : evtType});
					}
					IQ.Debug.info("table.evtType is " + table.evtType);
					$scope.enterTable($event, table);
				}, timeout); 
			};

			$scope.enterTable = function ($event, table) {
				var evtType = table.evtType;
				
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = tableKey;
				$scope.curTableName = _.result(table, 'tableName', '');
				// 获取桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var _tbl = TableService.getTableByItemID(tableKey),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
					var activeBtns = ['addFood', 'changeOrder', 'mergeOrder', 'unionOrder', 'cashPayOrder', 'payOrder'];
					// 如果桌台为占用状态并且订单号不为空，加载选中桌台的订单
					if (tableStatus == 1 && !_.isEmpty(saasOrderKey)) {
						if (evtType == 'dblclick') {
							// 如果是双击桌台按钮，跳转到点菜页面
							$scope.jumpToDinnerPage(saasOrderKey);
						} else {
							// 获取订单信息，展示菜桌台页面左侧的订单列表中
							OrderService.getOrderByOrderKey({
								saasOrderKey : saasOrderKey,
								hisFlag : hisFlag
							}, function (data) {
								$scope.resetOrderInfo();
								$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
									var n = _.result(btn, 'name'),
										i = _.indexOf(activeBtns, n);
									btn['active'] = i >= 0 ? true : false;
									return btn;
								});
							}, function (data) {
								AppAlert.add('danger', _.result(data, 'msg', ''));
							});
						}
					} else if (tableStatus == 0) {
						// 弹出单头配置窗口，确认后发送开台请求，待成功开台后跳转点菜页面
						activeBtns = ['addFood'];
						initOpenTableModal();
						$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
							var n = _.result(btn, 'name'),
								i = _.indexOf(activeBtns, n);
							btn['active'] = i >= 0 ? true : false;
							return btn;
						});
					}
				});
			};

			/**
			 * 快捷选择桌台
			 * @return {[type]} [description]
			 */
			$scope.quickSelectTable = function ($event, tableName) {
				var evtType = $event.type, keyCode = $event.keyCode;
				if (evtType == 'keypress' && keyCode != 13) {return false;}
				var tables = TableService.getTablesByTableName(tableName),
					table = tables[0];
				if (_.isEmpty(table)) {
					// HC.TopTip.addTopTips($rootScope, {
					// 	code : '111',
					// 	msg : "桌台不存在"
					// });
					AppAlert.add('danger', '桌台不存在');
					return;
				}
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = _.result(table, 'itemID');
				$scope.curTableName = _.result(table, 'tableName', '');
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var _tbl = TableService.getTableByItemID(tableKey),
						tableStatus = _.result(_tbl, 'tableStatus'),
						saasOrderKey = _.result(_tbl, 'saasOrderKey'),
						hisFlag = _.result(_tbl, 'his', 0);
						if (tableStatus == 0) {
							// 空闲桌台，进行开台操作
							initOpenTableModal();
						} else {
							// 进入点菜
							OrderService.getOrderByOrderKey({
								saasOrderKey : saasOrderKey,
								hisFlag : hisFlag
							}, function (data) {
								$scope.resetOrderInfo();
								$scope.jumpToDinnerPage();
							}, function (data) {
								// HC.TopTip.addTopTips($rootScope, data);
								AppAlert.add('danger', _.result(data, 'msg', ''));
							});
						}
				});
				
			};

			/**
			 * 跳转点菜页面
			 * @return {[type]} [description]
			 */
			$scope.jumpToDinnerPage = function (saasOrderKey) {
				var saasOrderKey = saasOrderKey || _.result($scope.orderHeader, 'saasOrderKey'),
					// tableName = _.result($scope.orderHeader, 'tableName');
					tableName = $scope.curTableName;
				console.info($scope.orderHeader);
				if (_.isEmpty(saasOrderKey)) return;
				var path = "/dinner/" + tableName;
				$location.path(path).search({saasOrderKey : saasOrderKey});
			};

			/**
			 * 菜品催叫动作
			 * @return {[type]} [description]
			 */
			$scope.urgeFoodAction = function () {
				var orderItems = $scope.curSelectedOrderItems;
				// 使用已落单菜品操作服务进行催叫菜操作
				var callServer = OrderService.urgeOrderFood(orderItems);
				var successCallBack = function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						// HC.TopTip.addTopTips($rootScope, _.extend(data, {msg : "催叫成功"}));
						AppAlert.add('success', '催叫成功');
					} else if (code == 'CS005') {
						AppAuthEMP.add({
							yesFn : function (empInfo) {
								callServer = OrderService.urgeOrderFood(orderItems, empInfo);
								callServer.success(successCallBack);
							},
							noFn : function () {

							}
						});
					} else {
						// HC.TopTip.addTopTips($rootScope, data);
						AppAlert.add('danger', _.result(data, 'msg', ''));
					}
				};
				callServer.success(function (data) {
					successCallBack(data);
				});
			};

			/**
			 * 根据桌台状态过滤桌台
			 * @param  {[type]} s [description]
			 * @return {[type]}   [description]
			 */
			$scope.queryTablesByStatus = function (s) {
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					getCurTables();
				});
			};

			/**
			 * 通过选择的订单条目数据判断可以使用哪些操作按钮
			 * @param  {string} itemKey 订单条目itemKey 
			 * 如果选多个菜品，催叫、转菜按钮可以使用，否则催叫、转菜按钮不可使用
			 * @return {[type]}         [description]
			 */
			$scope.selectOrderItem = function (itemKey) {
				// $scope.curSelectedOrderItems
				var idx = _.indexOf($scope.curSelectedOrderItems, itemKey),
					activeBtns = '';
				// 如果当前选择itemKey在队列中，则删除该条记录
				// 否则压入队列
				if (idx == -1) {
					$scope.curSelectedOrderItems.push(itemKey);
				} else {
					$scope.curSelectedOrderItems = $scope.curSelectedOrderItems.slice(0, idx).concat($scope.curSelectedOrderItems.slice(idx + 1));
				}
				IQ.Debug.info("Current Selected Order Items: ");
				IQ.Debug.info($scope.curSelectedOrderItems);
				if ($scope.curSelectedOrderItems.length > 0) {
					activeBtns = ['addFood', 'urgeFood', 'changeFood', 'changeOrder', 'mergeOrder', 'unionOrder'];
				} else {
					activeBtns = ['addFood', 'changeOrder', 'mergeOrder', 'unionOrder'];
				}
				$scope.OrderItemHandle = _.map($scope.OrderItemHandle, function (btn) {
					var n = _.result(btn, 'name'),
						i = _.indexOf(activeBtns, n);
					btn['active'] = i >= 0 ? true : false;
					return btn;
				});


			};

			/**
			 * 判断桌台被锁定
			 * @param  {[type]} lockedBy [description]
			 * @return {[type]}          [description]
			 */
			$scope.tableIsLocked = function (lockedBy) {
				return !_.isEmpty(lockedBy);
			};

			/**
			 * 判断桌台被并台
			 * @param  {[type]} unionTableGroupName [description]
			 * @return {[type]}                     [description]
			 */
			$scope.tableIsUnion = function (unionTableGroupName) {
				return !_.isEmpty(unionTableGroupName);
			};

			/**
			 * 判断桌台被预定
			 * @param  {[type]} bookOrderNo [description]
			 * @return {[type]}             [description]
			 */
			$scope.tableIsBooked = function (bookOrderNo) {
				return !_.isEmpty(bookOrderNo);	
			};

			/**
			 * 打印账单消费明细
			 * @return {[type]} [description]
			 */
			$scope.printOrderDetailBill = function () {
				if (_.isEmpty($scope.curTableName)) return;
				var orderData = OrderService.getOrderData();
				var foods = OrderService.getOrderFoodHT().getAll();

				if (foods.length == 0) {
					AppAlert.add('danger', '订单没有菜品，不能打印！');
				} else {
					KO.DevCom.exeCmd("PrintOrderDetailBill", JSON.stringify(orderData));
				}
			};

			/**
			 * 根据状态获取桌台数量
			 * @param  {[type]} status [description]
			 * @return {[type]}        [description]
			 */
			$scope.getTablesCountByStatus = function (status) {
				var tables = TableService.filterTableLst(status, $scope.curAreaName);
				return !tables ? 0 : tables.length;
			};

			/**
			 * 刷新桌台状态
			 * @return {[type]} [description]
			 */
			$scope.refreshTable = function ($event) {
				var progressbar = AppProgressbar.add('warning', '加载中...');
				var btn = $($event.target);
				btn.button('loading');
				btn.attr('loading', true);
				var resetBtn = function () {
					AppProgressbar.close(progressbar);
					btn.button('reset');
					$timeout(function () {
						btn.attr('loading', false);
					}, 5000);
				};
				// 获取指定区域桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					getCurTables();
					resetBtn();
				}).error(function(data) {
					resetBtn();
				});;
				return callServer;
			};


		}
	]);

	// 换台操作控制器
	app.controller('ChangeTableController', [
		'$scope', '$rootScope', '$modalInstance', '$location', '$filter', '_scope', 'CommonCallServer', 'OrderService', 'TableService', 'AppAlert', 'AppConfirm', 'AppAuthEMP',
		function ($scope, $rootScope, $modalInstance, $location, $filter, _scope, CommonCallServer, OrderService, TableService, AppAlert, AppConfirm, AppAuthEMP) {
			IQ.ns("KO");
			var HC = KO.Common;
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };
			var allTableLstPromise = TableService.loadTableStatusLst();
			var action = _scope.curOrderAction;
			IQ.Debug.info("Current Order Action: ");
			IQ.Debug.info(action);
			// 桌台名称搜索关键字
			$scope.qTblName = '';
			// 桌台状态过滤字段
			$scope.qTblStatus = (action == 'changeFood' || action == 'unionOrder' || action == 'mergeOrder') ? '1' : (action == 'changeOrder' ? '0' : '-1');
			
			// 当前选中桌台区域名
			$scope.curAreaName = '';
			// 桌台区域数据
			$scope.TableAreas = [];
			// 格式化区域选项的渲染数据
			var mapTableAreaRenderData = function (areas) {
				var ret = _.map(areas, function (area) {
					return _.extend(area, {
						value : _.result(area, 'areaName'),
						label : _.result(area, '__ID__') == 'all_tables' ? '全部' : _.result(area, 'areaName')
					});
				});
				return ret;
			};
			// 获取当前的桌台信息
			var getCurTables = function () {
				// 获取所有桌台数据
				var tables = TableService.filterTableLst($scope.qTblStatus, $scope.curAreaName);
				$scope.curTables = tables;
			};
			allTableLstPromise.success(function (data) {
				var areas = TableService.getTableAreas();
				getCurTables();
				$scope.TableAreas = mapTableAreaRenderData(areas);
				
			});
			/**
			 * 选择桌台区域
			 * @param  {[type]} v areaName
			 * @return {[type]}   [description]
			 */
			$scope.selectTableArea = function (v) {
				$scope.curAreaName = v;
				// 获取指定区域桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					// var areas = TableService.getTableAreas();
					getCurTables();
					// $scope.TableAreas = mapTableAreaRenderData(areas);
				});
				
			};
			/**
			 * 根据桌台状态过滤桌台
			 * @param  {[type]} s [description]
			 * @return {[type]}   [description]
			 */
			$scope.queryTablesByStatus = function (s) {
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					getCurTables();
				});
			};
			/**
			 * 选择桌台动作
			 * @param  {[type]} v [description]
			 * @return {[type]}   [description]
			 */
			$scope.selectTableName = function ($event, table) {
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = tableKey;
				$scope.curTableName = _.result(table, 'tableName', '');
				// 获取当前选中桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var orderHeader = _scope.orderHeader,
						fromTableName = _.result(orderHeader, 'tableName', ''),
						foodItemKeyLst = _scope.curSelectedOrderItems || [];
					var actionType = action == 'changeFood' ? 'CPHT' : (action == 'changeOrder' ? 'HT' : (action == 'mergeOrder' ? 'BT' : 'LT'));
					if (fromTableName != _scope.curTableName) {
						fromTableName = _scope.curTableName;
					}
					// var con = window.confirm("是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？');
					// if (con) {
					// 	var callServer = OrderService.tableOperation(actionType, {
					// 		fromTableName : fromTableName,
					// 		toTableName : $scope.curTableName,
					// 		foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})

					// 	});
					// 	callServer.success(function (data) {
					// 		var code = _.result(data, 'code');
					// 		if (code == '000') {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('success', _.result(data, 'msg', ''));
					// 			_scope.refresh(table, actionType);
					// 			$modalInstance.close();
					// 		} else {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('danger', _.result(data, 'msg', ''));
					// 		}
					// 	});
					// } else {
					// 	$modalInstance.close();
					// }

					AppConfirm.add({
						title : (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : (actionType == 'BT' ? '并台' : '联台'))) + '操作',
						msg : "是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : (actionType == 'BT' ? '并台' : '联台'))) + '操作？',
						yesFn : function () {
							var postParams = {
								fromTableName : fromTableName,
								toTableName : $scope.curTableName,
								foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})

							};
							var successCallBack = function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('success', _.result(data, 'msg', ''));
									_scope.refresh(table, actionType);
									$modalInstance.close();
								} else if (code == 'CS005') {
									AppAuthEMP.add({
										yesFn : function (empInfo) {
											callServer = OrderService.tableOperation(actionType, IQ.extend(postParams, empInfo));
											callServer.success(successCallBack);
										},
										noFn : function () {

										}
									});
								} else {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							};
							var callServer = OrderService.tableOperation(actionType, postParams);
							callServer.success(function (data) {
								successCallBack(data);
							});
						},
						noFn : function () {
							$modalInstance.close();
						}
					});
					
				});
			};
			/**
			 * 快捷选择桌台
			 * @return {[type]} [description]
			 */
			$scope.quickSelectTable = function ($event, tableName) {
				var evtType = $event.type, keyCode = $event.keyCode;
				if (evtType == 'keypress' && keyCode != 13) {return false;}
				var table = TableService.getTablesByTableName(tableName);
				table = table[0];
				if (_.isEmpty(table)) {
					// HC.TopTip.addTopTips($rootScope, {
					// 	code : '111',
					// 	msg : "桌台不存在"
					// });
					AppAlert.add('danger', '桌台不存在');
					return;
				}
				var tableKey = _.result(table, 'itemID');
				$scope.curTableID = _.result(table, 'itemID');
				$scope.curTableName = _.result(table, 'tableName', '');
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName,
					tableName : $scope.curTableName
				});
				callServer.success(function (data) {
					getCurTables();
					var orderHeader = _scope.orderHeader,
						fromTableName = _.result(orderHeader, 'tableName', ''),
						foodItemKeyLst = _scope.curSelectedOrderItems || [];
					var actionType = action == 'changeFood' ? 'CPHT' : (action == 'changeOrder' ? 'HT' : 'BT');
					// var con = window.confirm("是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？');
					// if (con) {
					// 	var callServer = OrderService.tableOperation(actionType, {
					// 		fromTableName : fromTableName,
					// 		toTableName : $scope.curTableName,
					// 		foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})
					// 	});
					// 	callServer.success(function (data) {
					// 		var code = _.result(data, 'code');
					// 		if (code == '000') {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('success', _.result(data, 'msg', ''));
					// 			_scope.refresh(table, actionType);
					// 			$modalInstance.close();
					// 		} else {
					// 			// HC.TopTip.addTopTips($rootScope, data);
					// 			AppAlert.add('danger', _.result(data, 'msg', ''));
					// 		}
					// 	});
					// } else {
					// 	$modalInstance.close();
					// }
					AppConfirm.add({
						title : (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作',
						msg : "是否进行" + (actionType == 'CPHT' ? '转菜' : (actionType == 'HT' ? '换台' : '并台')) + '操作？',
						yesFn : function () {
							var postParams = {
								fromTableName : fromTableName,
								toTableName : $scope.curTableName,
								foodItemKeyLst : JSON.stringify({itemKey : foodItemKeyLst})
							};
							var callServer = OrderService.tableOperation(actionType, postParams);
							var successCallBack = function (data) {
								var code = _.result(data, 'code');
								if (code == '000') {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('success', _.result(data, 'msg', ''));
									_scope.refresh(table, actionType);
									$modalInstance.close();
								} else if (code == 'CS005') {
									AppAuthEMP.add({
										yesFn : function (empInfo) {
											callServer = OrderService.tableOperation(actionType, _.extend(postParams, empInfo));
											callServer.success(successCallBack);
										},
										noFn : function () {

										}
									});
								} else {
									// HC.TopTip.addTopTips($rootScope, data);
									AppAlert.add('danger', _.result(data, 'msg', ''));
								}
							};
							callServer.success(function (data) {
								successCallBack(data);
							});
						},
						noFn : function () {
							$modalInstance.close();
						}
					});
				});
			};

			/**
			 * 判断桌台被锁定
			 * @param  {[type]} lockedBy [description]
			 * @return {[type]}          [description]
			 */
			$scope.tableIsLocked = function (lockedBy) {
				return !_.isEmpty(lockedBy);
			};

			/**
			 * 判断桌台被并台
			 * @param  {[type]} unionTableGroupName [description]
			 * @return {[type]}                     [description]
			 */
			$scope.tableIsUnion = function (unionTableGroupName) {
				return !_.isEmpty(unionTableGroupName);
			};

			/**
			 * 判断桌台被预定
			 * @param  {[type]} bookOrderNo [description]
			 * @return {[type]}             [description]
			 */
			$scope.tableIsBooked = function (bookOrderNo) {
				return !_.isEmpty(bookOrderNo);	
			};

			$scope.close = function () {
				$modalInstance.close();
			};
			/**
			 * 根据状态获取桌台数量
			 * @param  {[type]} status [description]
			 * @return {[type]}        [description]
			 */
			$scope.getTablesCountByStatus = function (status) {
				var tables = TableService.filterTableLst(status, $scope.curAreaName);
				return !tables ? 0 : tables.length;
			};
		} 
	]);


	
    
});
