define(['app'], function(app)
{
	app.controller('HuiYuanViewController',
    [
        '$scope', '$rootScope',  '$sce', 'CommonCallServer', 'AppAlert', 'HuiYuanTabsService',

        function($scope, $rootScope, $sce, CommonCallServer, AppAlert, HuiYuanTabsService)
        {
            $scope.CCS = CommonCallServer;
            $scope.AA = AppAlert;
            IQ.ns("KO");

            $scope.tabs =
            [
                {class: '', active: true, label: '入会办卡', tabname: 'join'},
                {class: '', active: true, label: '储值', tabname: 'recharge'},
                {class: 'active', active: true, label: '消费刷卡', tabname: 'consume'},
                {class: '', active: true, label: '卡操作', tabname: 'cardhandle'}
                // 新需求--去掉会员报表，在报表模块中
                // {class: '', active: true, label: '报表', tabname: 'report'}
            ];

            $scope.handletype = {
                '绑定手机号': 41,
                '补办实体卡': 42,
                '挂失': 10,
                '解除挂失': 11,
                '卡遗损补办': 40,
                '冻结': 20,
                '解冻': 21,
                '注销': 30
            };

            $scope.rechargeplans = [];

            $scope.vipinfo = null;

            $scope.panel_userinfo = {
                show: function() {
                    $('.userinfo').show();
                    $('.panel-vouchers').show();
                },
                hide: function() {
                    $('.userinfo').hide();
                    $('.panel-vouchers').hide();
                    $scope.user = null;
                }
            };
            // html解析
            $scope.parseSnippet = function (v) {
                return $sce.trustAsHtml(v);
            };

            //点击查询按钮时打开会员信息面板
            $('.section-huiyuan').on('click', '.btn-query', function() {
                if($scope.cardnumber) {
                    CommonCallServer.getVIPCardInfo({
                        cardNoOrMobile: $scope.cardnumber
                    }).success(function(data) {
                        if(data.code == '000') {
                            var d = data.data;

                            $scope.setUserInfo(d);

                            $scope.vouchers = [];
                            var count = 0;
                            for(var i = 0; i < data.data.cashVoucherLst.length; i ++) {
                                var v = data.data.cashVoucherLst[i];
                                v.type = 1;
                                v.index = count ++;
                                $scope.vouchers.push(v);
                            };
                            for(var i = 0; i < data.data.exchangeVoucherLst.length; i ++) {
                                var v = data.data.exchangeVoucherLst[i];
                                v.type = 2;
                                v.index = count ++;
                                $scope.vouchers.push(v);
                            };
                            if ($scope.curTabName == 'consume') {
                                $scope.calculate('consumeamount');
                            }
                        }else {
                            AppAlert.add('danger', data.msg)
                        }
                    });
                }
            });
            $('.section-huiyuan').on('keydown', '.cardnumber', function(e) {
                if(e.type == 'keydown' && e.keyCode == 13) {
                    $('.btn-query').click();
                }
            });
            $scope.$watch('user', function(n, o, scope) {
                $('.btn-submit').each(function() {
                    if(!$(this).hasClass('btn-submit-join')) {
                        if(n) {
                            $(this).removeClass('btn-disable');
                        }else {
                            $(this).addClass('btn-disable');
                            $scope.panel_userinfo.hide();
                        }
                    }
                });
            });

            $scope.setUserInfo = function(d) {
                $scope.user = {
                    level: d.cardTypeName,
                    status: d.cardIsCanUsing == '1' ? '正常' : d.cardNotCanUsingNotes,
                    cardnumber: d.cardNo,
                    phone: d.userMobile,
                    name: d.userName,
                    birthday: d.customerBirthday,
                    joindate: '2015-01-01 18:11:11',
                    cashaccount: parseFloat(KO.Common.Math.add(d.cardCashBalance, d.cardGiveBalance)),
                    // pointaccount: d.cardPointBalance,
                    // 卡剩余积分所能抵扣的消费金额
                    pointaccount : d.cardPointAsMoney,
                    pointrate: d.pointRate,
                    pointasmoneyrate: d.pointAsMoneyRate,
                    //joinplace: '哗啦啦体验店铺（中关村店）',
                    cardkey: d.cardKey,
                    customerPrnTxt : _.result(d, 'customerPrnTxt', '')
                };
                $scope.prntUserInfo = KO.Common.formatPrintTxt2Html(_.result(d, 'customerPrnTxt', ''));

                $scope.userorg = d;

                $scope.panel_userinfo.show();

                if(d.isMobileCard == 1 && d.transSafeLevel != '0') {
                    $scope.ispwd = 1;
                }else{
                    $scope.ispwd = 0;
                }

                $scope.$watch('ispwd', function(n, o) {
                    if(n == 1) {
                        $('.formpwd').show();
                    }else {
                        $('.formpwd').hide();
                    }
                });

                if($scope.user.cashaccount > 0) {
                    $('.ca').show();
                }
                if($scope.user.pointaccount > 0) {
                    $('.pa').show();
                }
            };

            $scope.prtvipinfo = function() {
                KO.DevCom.exeCmd('PrintOther', _.result($scope.user, 'customerPrnTxt', ''));
                // KO.DevCom.exeCmd('PrintOther', $scope.crtprtinf());
            };

            //打开日历
            $scope.openDatePicker = function ($event, n) {
                $event.preventDefault();
                $event.stopPropagation();

                switch(n) {
                    case 1 : {
                        $scope.op1 = true;
                    }break;

                    case 2 : {
                        $scope.op2 = true;
                    }break;

                    case 3 : {
                        $scope.op3 = true;
                    }break;

                    case 4 : {
                        $scope.op4 = true;
                    }break;
                }
            };
            $scope.today = function () {
                return IQ.Date.getDateByFormat(new Date(), 'yyyy-MM-dd');
                // return IQ.Date.formatDate(new Date());
            };
            $scope.minday = function () {
                return $scope.listdatefrom;
                // return IQ.Date.formatDate(new Date());
            };

            $scope.crtprtinf = function() {
                var str = '';
                str += '会员信息详情\n';
                str += '    等级:' + $scope.user.level + '\n';
                str += '    状态:' + $scope.user.status + '\n';
                str += '    卡号:' + $scope.user.cardnumber + '\n';
                str += '    手机:' + $scope.user.phone + '\n';
                str += '    姓名:' + $scope.user.name + '\n';
                str += '    生日:' + $scope.user.birthday + '\n';
                str += '入会时间:' + $scope.user.joindate + '\n';
                str += '入会店铺:' + $scope.user.phone + '\n';
                str += '------------------------------\n';
                str += '储值余额:' + $scope.user.cashaccount + '\n';
                str += '积分余额:' + $scope.user.pointaccount + '\n';
                str += '------------------------------\n';
                str += '储值余额:' + $scope.user.cashaccount + '\n';
                str += '积分余额:' + $scope.user.pointaccount + '\n';
                str += '------------------------------\n';
                str += '当前等级:' + $scope.user.level + '\n';
                str += '    折扣:' + $scope.user.pointaccount + '\n';
                str += '积分系数:' + $scope.user.pointrate + '\n';
                str += '------------------------------\n';
                str += '打印时间:' + IQ.Date.getDateByFormat(new Date(), 'yyyy-MM-dd hh:mm:ss') + '\n';
                str += '打印店铺:' + $scope.user.pointrate;
                return str;
            };

            // 输入框聚焦事件
            // 告诉软键盘当前操作控件
            $scope.inputFocus = function ($event) {
                // console.info($event);
                // console.info(arguments);
                var curEl = $($event.target);
                var wrapEl = curEl.parents('.tab-wrapper'),
                    tabEl = curEl.parents('.tab'),
                    formGrpEl = curEl.parents('.form-group'),
                    wrapRect = tabEl[0].getBoundingClientRect(),
                    inputGrpRect = formGrpEl[0].getBoundingClientRect();
                var kbdTop = $('body').height() - inputGrpRect.top < 320 ? ($('body').height() - 320) : inputGrpRect.top;
                var kbdLeft = $('body').width() - wrapRect.right < 320 ? ($('body').width() - 320) : wrapRect.right;
                var keyboard = $('.site-numkeyboard');
                if (!curEl.attr('readonly')) {
                    $scope.focusInputEl = curEl;
                } else {
                    $scope.focusInputEl = null;
                }
                keyboard.css({
                    display : 'block',
                    position : 'fixed',
                    top : kbdTop,
                    left : kbdLeft,
                    'z-index' : 99
                });
                return;
            };
            $('.section-huiyuan').on('click', function (e) {
                var tar = $(e.target);
                var keyboard = $('.site-numkeyboard');
                if (!tar.is(':text, .site-numkeyboard .btn')) {
                    keyboard.css({
                        display : 'none',
                        position : 'relative',
                        top : 0,
                        left : 0
                    });
                }
            }).trigger('click');
            $('.tab').on('keypress', function ($event, keyCode) {
                var $tar = $($event.target);
                var $form = $tar.parents('.tab'),
                    formName = $form.attr('name');
                var keyCode = keyCode || $event.keyCode || $event.which;
                var tabIdx = parseInt($tar.attr('tabindex'));
                var nextIdx = tabIdx + 1;
                var nextEl = $('[tabindex=' + nextIdx + ']', $form);
                var $formGrp;
                if (keyCode == 13) {
                    $tar.blur();
                    if (formName == 'join_form') {
                        if (nextEl.parents('.panel-oldcard').css('display') == 'none') {
                            nextEl = $('[tabindex=' + (nextIdx + 3) + ']');
                        }
                        if (nextEl.parents('.form-group').css('display') == 'none') {
                            nextEl = $('[tabindex=' + (nextIdx + 1) + ']');
                        }
                        nextEl.eq(0).focus().select();
                        return;
                    }
                    if (formName == 'recharge_form' && nextEl.parents('.panel-body[rechargeway=0]').css('display') == 'none') {
                        nextEl = $('[tabindex=' + (nextIdx + 3) + ']');
                        nextEl.eq(0).focus().select();
                        return;
                    }
                    if (formName == 'consume_form') {
                        $formGrp = nextEl.parents('.form-group');
                        if (nextEl.attr('disabled') || $formGrp.css('display') == 'none') {
                            nextEl.trigger('keypress', keyCode);
                            return;
                        }
                    }
                    if (formName == 'cardhandle_form') {
                        $formGrp = nextEl.parents('form.bonus-panel');
                        if ($formGrp.css('display') == 'none') {
                            nextEl.trigger('keypress', keyCode);
                            return;
                        }
                    }
                    if (nextEl.length > 0) {
                        nextEl.eq(0).focus();
                        if (nextEl.is('.btn-submit')) {
                            nextEl.trigger('click');
                        }
                        if (nextEl.is(':text,:password,textarea')) {
                            nextEl.eq(0).select();
                        }
                    }
                }
            });

        }
    ]);

    //会员导航栏
    app.directive('huiyuantabs', [
        "HuiYuanTabsService",
        function (HuiYuanTabsService) {
            return {
                restrict : 'E',
                template : [
                    '<ul class="nav nav-tabs">',
                        '<li role="presentation" ng-repeat="el in tabs" ng-disabled="!tab.active" class="{{el.class}}" name="{{el.tabname}}" style="width:25%;"><a>{{el.label}}</a></li>',
                    '</ul>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.on('click', 'li', function(e) {
                        el.find('.active').removeClass('active');
                        $(this).addClass('active');

                        HuiYuanTabsService.changeTab($(this).attr('name'), scope, e);

                        //切换tab清除会员信息
                        scope.panel_userinfo.hide();
                        $(".cardnumber").val("");
                    });
                }
            };
        }
    ]);

    //会员页导航栏服务
    app.service('HuiYuanTabsService', [
        '$timeout',
        function ($timeout) {
            var self = this;

            //切换tab时展示对应tab内容区域
            self.changeTab = function(tabname, scope, $event) {
                $('.tab').hide();
                scope.curTabName = tabname;
                var node = $('.tab-' + tabname);
                node.show();
                $timeout(function () {
                    node.find(':text:first').trigger('focus');   
                }, 20);
                
                // scope.inputFocus($event);
                if(tabname == 'join') {
                    scope.user = null;
                    scope.$apply();
                };
            };
        }
    ]);

    //会员导航栏入会办卡
    app.directive('jointab', [
        '$rootScope', '$sce', 'storage', 'CommonCallServer', 'AppAlert','AppProgressbar',
        function ($rootScope, $sce, storage, CommonCallServer, AppAlert, AppProgressbar) {
            return {
                restrict : 'E',
                template : [
                    '<form class="tab tab-join form-horizontal" name="join_form" role="form" novalidate="novalidate" style="display:none;">',
                        '<div class="form-group has-feedback">',
                            '<label class="control-label col-xs-3 col-lg-3">实体卡卡号</label>',
                            '<div class="col-xs-6 col-lg-8" ng-class="{\'has-success\' : join_form.realcardnumber.$dirty && join_form.realcardnumber.$valid, \'has-error\' : join_form.realcardnumber.$invalid}">',
                                '<div class="input-group">',
                                    '<input name="realcardnumber" type="text" class="form-control input-lg realcardnumber" ng-model="realcardnumber" bv-isnum  ng-focus="inputFocus($event)" tabindex="1">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-viplevel" >{{level.cardLevelName || "&nbsp;"}}</button></span>',
                                '</div>',
                                '<small class="help-block" ng-show="join_form.realcardnumber.$dirty && join_form.realcardnumber.$error.bvIsnum">必须为数字</small>',
                            '</div>',
                        '</div>',
                        '<div class="form-group has-feedback">',
                            '<label class="control-label col-xs-3 col-lg-3">实体卡密码</label>',
                            '<div class="col-xs-6 col-lg-6" ng-class="{\'has-success\' : join_form.cardpassword.$dirty && join_form.cardpassword.$valid, \'has-error\' : join_form.cardpassword.$invalid}">',
                                '<input name="cardpassword" type="text" class="form-control input-lg cardpassword" value="888888" ng-model="cardpassword" bv-notempty bv-strlength="false" min="6" max="32"  ng-focus="inputFocus($event)"  tabindex="2">',
                                // '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvNotempty">不能为空</small>',
                                '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvStrlength">密码必须在6-32位之间</small>',
                                '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvNotempty">请输入密码</small>',
                            '</div>',
                        '</div>',
                        '<div class="form-group has-feedback">',
                            '<label class="control-label col-xs-3 col-lg-3">手机号码</label>',
                            '<div class="col-xs-9 col-lg-9"  ng-class="{\'has-success\' : join_form.phonenumber.$dirty && join_form.phonenumber.$valid, \'has-error\' : join_form.phonenumber.$invalid}">',
                                '<input name="phonenumber" style="width:200px;" type="text" class="form-control input-lg phonenumber pull-left" ng-model="phonenumber" bv-notempty bv-mobile  ng-focus="inputFocus($event)" tabindex="3">',
                                '<label class="checkbox-inline pull-left">',
                                    '<input type="checkbox" ng-model="checkmobile" value="1" tabindex="4" >验证手机号',
                                '</label>',
                                '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvNotempty">不能为空</small>',
                                '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvMobile">请输入正确手机号</small>',

                            '</div>',
                        '</div>',
                        '<div class="form-group has-feedback formcode">',
                            '<label class="control-label col-xs-3 col-lg-3">验证码</label>',
                            '<div class="col-xs-6 col-lg-6" >',
                                '<div class="input-group">',
                                    '<input  type="text" ng-model="checkcode" class="form-control input-lg checkcode"  ng-focus="inputFocus($event)" tabindex="5">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-sendcheckcode">发送验证码</button></span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">姓名</label>',
                            '<div class="col-xs-9 col-lg-9" ng-class="{\'has-success\' : join_form.username.$dirty && join_form.username.$valid, \'has-error\' : join_form.username.$invalid}">',
                                '<input name="username" style="width:240px;" type="text" class="form-control input-lg username pull-left" ng-model="username" bv-strlength min="1" max="32"  ng-focus="inputFocus($event)" tabindex="6">',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="sex" checked value="0" ng-model="sex" tabindex="7">女士',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="sex" value="1" ng-model="sex"  tabindex="7">先生',
                                '</label>',
                                '<small class="help-block" ng-show="join_form.username.$dirty && join_form.username.$error.bvStrlength">姓名不要超过32位字符</small>',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">生日</label>',
                            '<div class="input-group col-xs-6 col-lg-6">',
                                '<input  type="text" class="form-control input-lg birthday form_datetime"  ng-model="birthday" readonly datepicker-popup="yyyy-MM-dd" placeholder="日期" is-open="op4" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keypress="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 4)"  tabindex="8">',
                                '<span class="input-group-btn"><button class="btn btn-default btn-lg" type="button" ng-click="openDatePicker($event, 4)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">工本费</label>',
                            '<div class="col-xs-6 col-lg-6">',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" checked value="0" ng-model="cardfee" tabindex="9">免收',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="5" ng-model="cardfee" tabindex="9">5元', 
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="8" ng-model="cardfee" tabindex="9">8元',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="10" ng-model="cardfee" tabindex="9">10元',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" checked value="12" ng-model="cardfee" tabindex="9">12元',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="15" ng-model="cardfee" tabindex="9">15元',
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="18" ng-model="cardfee" tabindex="9">18元', 
                                '</label>',
                                '<label class="radio-inline pull-left">',
                                    '<input type="radio" name="cardfee" value="20" ng-model="cardfee" tabindex="9">20元',
                                '</label>',
                            '</div>',
                        '</div>',
                        '<div style="display:none;" class="panel-oldcard">',
                            '<div class="form-group">',
                                '<label class="control-label">换系统原卡资金及积分转入</label>',
                            '</div>',
                            '<div class="form-group">',
                                '<label class="control-label col-xs-3 col-lg-3">原系统卡号</label>',
                                '<div class="col-xs-6 col-lg-9">',
                                    '<input type="text" class="form-control input-lg oldcardnumber" ng-model="oldcardnumber"  ng-focus="inputFocus($event)" tabindex="10">',
                                '</div>',
                            '</div>',
                            '<div class="form-group">',
                                '<label class="control-label col-xs-3 col-lg-3">储值余额</label>',
                                '<div class="col-xs-3 col-lg-3">',
                                    '<input type="number" class="form-control input-lg oldrechargeamount" ng-model="oldrechargeamount"  ng-focus="inputFocus($event)" tabindex="11">',
                                '</div>',
                                '<label class="control-label col-xs-3 col-lg-3" style="width:68px;">积分余额</label>',
                                '<div class="col-xs-3 col-lg-3">',
                                    '<input type="number" class="form-control input-lg oldpointamount" ng-model="oldpointamount"  ng-focus="inputFocus($event)" tabindex="12">',
                                '</div>',
                            '</div>',
                        '</div>',





                        // '<div style="display:block;">',
                        //     '<div class="form-group has-feedback">',
                        //         '<label class="pull-left control-label">实体卡卡号</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : join_form.realcardnumber.$dirty && join_form.realcardnumber.$valid, \'has-error\' : join_form.realcardnumber.$invalid}">',
                        //             '<div class="input-group">',
                        //                 '<input name="realcardnumber" style="width: 250px;" type="text" class="form-control input-lg realcardnumber" ng-model="realcardnumber" bv-isnum  ng-focus="inputFocus($event)">',
                        //                 '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-viplevel">{{level.cardLevelName || "&nbsp;"}}</button></span>',
                        //             '</div>',
                        //             '<small class="help-block" ng-show="join_form.realcardnumber.$dirty && join_form.realcardnumber.$error.bvIsnum">必须为数字</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group has-feedback">',
                        //         '<label class="pull-left control-label">实体卡密码</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : join_form.cardpassword.$dirty && join_form.cardpassword.$valid, \'has-error\' : join_form.cardpassword.$invalid}">',
                        //             '<input name="cardpassword" style="width: 320px;" type="text" class="form-control input-lg cardpassword" value="888888" ng-model="cardpassword"  bv-strlength="false" min="6" max="32"  ng-focus="inputFocus($event)">',
                        //             // '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvNotempty">不能为空</small>',
                        //             '<small class="help-block" ng-show="join_form.cardpassword.$dirty && join_form.cardpassword.$error.bvStrlength">密码必须在6-32位之间</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group has-feedback">',
                        //         '<label class="pull-left control-label">手机号码</label>',
                        //         '<div class="pull-left"  ng-class="{\'has-success\' : join_form.phonenumber.$dirty && join_form.phonenumber.$valid, \'has-error\' : join_form.phonenumber.$invalid}">',
                        //             '<input name="phonenumber" style="width:240px;" type="text" class="form-control input-lg phonenumber" ng-model="phonenumber" bv-notempty bv-mobile  ng-focus="inputFocus($event)">',
                        //             '<input type="checkbox" ng-model="checkmobile" value="1">验证手机号',
                        //             '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvNotempty">不能为空</small>',
                        //             '<small class="help-block" ng-show="join_form.phonenumber.$dirty && join_form.phonenumber.$error.bvMobile">请输入正确手机号</small>',

                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:none;margin-top:10px;" class="formcode">',
                        //     '<div class="form-group has-feedback">',
                        //         '<label class="pull-left control-label">验证码</label>',
                        //         '<div class="pull-left" >',
                        //             '<div class="input-group">',
                        //                 '<input style="width: 198px;" type="text" ng-model="checkcode" class="form-control input-lg checkcode"  ng-focus="inputFocus($event)">',
                        //                 '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-sendcheckcode">发送验证码</button></span>',
                        //             '</div>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label class="pull-left control-label">姓名</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : join_form.username.$dirty && join_form.username.$valid, \'has-error\' : join_form.username.$invalid}">',
                        //             '<input name="username" style="width:240px;" type="text" class="form-control input-lg username" ng-model="username" bv-notempty bv-strlength min="2" max="50"  ng-focus="inputFocus($event)">',
                        //             '<input type="radio" name="sex" checked value="0" ng-model="sex">女士',
                        //             '<input type="radio" name="sex" value="1" ng-model="sex">先生',
                        //             '<small class="help-block" ng-show="join_form.username.$dirty && join_form.username.$error.bvNotempty">请输入姓名</small>',
                        //             '<small class="help-block" ng-show="join_form.username.$dirty && join_form.username.$error.bvStrlength">姓名在2-32位字符之间</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label>生日</label>',
                        //         '<div class="input-group">',
                        //             '<input style="width:240px;" type="text" class="form-control input-lg birthday form_datetime"  ng-model="birthday" readonly datepicker-popup="yyyy-MM-dd" placeholder="日期" is-open="op4" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keypress="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 4)">',
                        //             '<span class="input-group-btn"><button class="btn btn-default btn-lg" type="button" ng-click="openDatePicker($event, 4)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label>工本费</label>',
                        //         '<input type="radio" name="cardfee" checked value="0" ng-model="cardfee">免收',
                        //         '<input type="radio" name="cardfee" value="10" ng-model="cardfee">10元',
                        //         '<input type="radio" name="cardfee" value="15" ng-model="cardfee">15元',
                        //         '<input type="radio" name="cardfee" value="20" ng-model="cardfee">20元',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:none;" class="panel-oldcard">',
                        //     '<div style="display:block;margin-top:10px;">换系统原卡资金及积分转入</div>',
                        //     '<div style="display:block;margin-top:10px;">',
                        //         '<div class="form-group">',
                        //             '<label>原系统卡号</label>',
                        //             '<input style="width:187px;" type="text" class="form-control input-lg oldcardnumber" ng-model="oldcardnumber"  ng-focus="inputFocus($event)">',
                        //         '</div>',
                        //     '</div>',
                        //     '<div style="display:block;margin-top:10px;">',
                        //         '<div class="form-group">',
                        //             '<label>储值余额</label>',
                        //             '<input style="width: 58px;" type="number" class="form-control input-lg oldrechargeamount" ng-model="oldrechargeamount"  ng-focus="inputFocus($event)">',
                        //             '<label style="width:60px;margin-left:1px;">积分余额</label>',
                        //             '<input style="width: 58px;" type="number" class="form-control input-lg oldpointamount" ng-model="oldpointamount"  ng-focus="inputFocus($event)">',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        '<div class="panel-viplevel" style="display:none;">',
                            '<div class="header">会员等级</div>',
                            '<ul class="table-viplevel">',
                                '<li role="presentation" ng-repeat="el in viplevels" name="{{el.cardLevelName}}" levelid="{{el.cardLevelID}}" class="{{el.def}}">',
                                    '<div class="name">{{el.cardLevelName}} {{el.isDefaultLevel == "1" ? "（默认）" : ""}}</div>',
                                    // '<div class="account">会员价 部分{{el.discountRate * 10}}折</div>',
                                    // '<div class="point">消费100元积{{el.pointRate * 100}}分</div>',
                                    '<div class="account">会员价 部分{{calcDiscount(el.discountRate)}}折</div>',
                                    '<div class="point">消费100元积{{calcPoint(el.pointRate)}}分</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-join btn-success">提交入会办卡</button>',
                        //     '</div>',
                        // '</div>',
                        '<div class="col-xs-8 col-lg-10 clearfix submitbtn">',
                            '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-join btn-disable btn-success btn-block" tabindex="13">提交入会办卡</button>',
                        '</div>',
                    '</form>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-viplevel ul').css('height', $(window).height() - 82);
                    var ti, checkcode;

                    var viplevel = {
                        defLevel: function(levels) {
                            for(var i = 0; i < levels.length; i ++) {
                                if(levels[i].isDefaultLevel == '1') {
                                    levels[i].def = true;
                                    scope.cardlevelid = levels[i].cardLevelID;
                                    return  i;
                                }
                            }
                        },
                        changeLevel: function(index) {
                            scope.level = scope.viplevels[index];
                            scope.$apply();
                        }
                    };

                    //初始值设定
                    var init = function() {
                        scope.realcardnumber = '';
                        scope.phonenumber = '';
                        scope.username = '';
                        scope.sex = 0;
                        scope.cardfee = 0;
                        scope.birthday = null;
                        scope.cardpassword = '888888';
                        scope.checkmobile = false;
                        scope.checkcode = '';
                        clearInterval(ti);
                        $('.btn-sendcheckcode', el).html('获取验证码').removeClass('btn-disable');
                    };
                    // 需求变更，要把获取的集团信息缓存在localstorage中
                    // 需求变更判断是localstorage中有集团会员参数信息缓存，如果没有再去请求获取
                    // 由于后台没有提供有效的消息推送机制，这种做法无法做到当集团会员数据信息在后端更新后，
                    // 前端无法及时更新localstorage中的缓存信息
                    // 问题反馈说点击会员模块速度慢，根源问题不在于每次进入会员模块请求集团会员参数信息，
                    // 而在于请求这个数据后端响应时间太长
                    // 初始化集团会员参数
                    var initShopVIPInfo = function (data) {
                        storage.set('SHOPVIPINFO', data);
                        scope.vipinfo = storage.get('SHOPVIPINFO');
                        scope.viplevels = _.result(scope.vipinfo, 'cardLevelList');
                        var index = viplevel.defLevel(scope.viplevels);
                        scope.level = scope.viplevels[index];
                        scope.rechargeplans = _.result(scope.vipinfo, 'saveMoneySet');
                        if (_.result(scope.vipinfo, 'isSysSwitchActive') == '1') {
                            el.find('.panel-oldcard').show();
                        }
                    };
                    
                    if (_.isEmpty(storage.get('SHOPVIPINFO'))) {
                        scope.CCS.getShopVipInfo({}).success(function (data) {
                            if (data.code == '000') {
                                scope.AA.add('success', '获取集团会员参数成功');
                                initShopVIPInfo(_.result(data, 'data', null));
                            } else {
                                scope.AA.add('danger', data.msg);
                            }
                        });
                    } else {
                        initShopVIPInfo(storage.get('SHOPVIPINFO'));
                    }

                    init();
                    

                    //获取集团会员参数
                    // scope.CCS.getShopVipInfo({}).success(function(data) {
                    //     if(data.code == '000') {
                    //         scope.AA.add('success', '获取集团会员参数成功');

                    //         scope.vipinfo = data.data;

                    //         scope.viplevels = data.data.cardLevelList;

                    //         var index = viplevel.defLevel(scope.viplevels);
                    //         scope.level = scope.viplevels[index];

                    //         scope.rechargeplans = data.data.saveMoneySet;

                    //         if(data.data.isSysSwitchActive == '1') {
                    //             el.find('.panel-oldcard').show();
                    //         }
                    //     }else {
                    //         scope.AA.add('danger', data.msg);
                    //     }
                    // });

                    scope.$watch('checkmobile',function(n, o) {
                        if(n == true) {
                            el.find('.formcode').show();
                        }else {
                            el.find('.formcode').hide();
                        }
                    });

                    //获取验证码按钮

                    var createCode = function() {
                        var str = '0123456789';

                        var code = '';

                        for(var i = 0; i < 5; i ++) {
                            code += str.charAt(Math.floor(Math.random() * 6));
                        }

                        return code;
                    };

                    
                    el.on('click', '.btn-sendcheckcode', function() {
                        if(scope.phonenumber) {
                            var time = 60;
                            var self = $(this);

                            if(!self.hasClass('btn-disable')) {
                                checkcode = createCode();

                                scope.CCS.sendCode({
                                    customerMobile: scope.phonenumber,
                                    SMSVerCode: checkcode
                                }).success(function(data) {
                                    if(data.code == '000') {
                                        self.html('60秒后重新发送').addClass('btn-disable');

                                        ti = setInterval(function() {
                                            if(time > 0) {
                                                time --;
                                                self.html(time + '秒后重新发送')
                                            }else{
                                                clearInterval(ti);
                                                self.html('获取验证码').removeClass('btn-disable');
                                            }
                                        }, 1000);
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
                        }
                    });

                    

                    //点击会员等级标签时
                    el.on('click', '.panel-viplevel li', function() {
                        viplevel.changeLevel($(this).index());
                        el.find('.panel-viplevel').find('.true').removeClass('true');
                        $(this).addClass('true');
                        scope.cardlevelid = $(this).attr('levelid');
                        el.find('.panel-viplevel').hide();
                    });

                    //点击会员等级按钮时
                    el.on('click', '.btn-viplevel', function() {
                        el.find('.panel-viplevel').show();
                    });

                    //判断是否符合提交要求
                    scope.$watch('realcardnumber + cardpassword + phonenumber', function() {
                        if((scope.realcardnumber || scope.phonenumber) && scope.cardpassword){
                            $('.btn-submit-join').removeClass('btn-disable');
                        }else{
                            $('.btn-submit-join').addClass('btn-disable');
                        }
                    });
                    //点击提交按钮时
                    el.on('click', '.btn-submit-join', function() {
                        if(!$(this).hasClass('btn-disable')) {
                            if((scope.checkmobile && checkcode == scope.checkcode) || !scope.checkmobile) {
                                var progressbar = AppProgressbar.add('warning', '提交数据...');
                                scope.CCS.createVIPCard({
                                    shopName: null,
                                    cardNO: scope.realcardnumber,
                                    cardLevelID: scope.cardlevelid,
                                    cardFee: scope.cardfee,
                                    cardPWD: scope.cardpassword,
                                    customerName: scope.username,
                                    customerSex: scope.sex,
                                    customerMobile: scope.phonenumber,
                                    isMobileChecked: scope.checkmobile == true ? 1 : 0,
                                    customerBirthday: IQ.Date.getDateByFormat(scope.birthday, 'yyyy-MM-dd'),
                                    birthdayType: '0',
                                    oldSystemcardNO: scope.oldcardnumber,
                                    oldCardMoneyBalnace: scope.oldrechargeamount,
                                    oldCardPointBalnace: scope.oldpointamount
                                }).success(function(data) {
                                    AppProgressbar.close(progressbar);
                                    if(data.code == '000') {
                                        AppAlert.add('success', '办卡成功！');
                                        scope.panel_userinfo.hide();
                                        init();
                                    }else{
                                        AppAlert.add('danger', data.msg);
                                    }
                                });
                            }else {
                                AppAlert.add('danger', '验证码错误！');
                                scope.$apply();
                            }
                        }
                    });
                    scope.calcDiscount = function (discountRate) {
                        return KO.Common.Math.multi(discountRate, 10);
                    };
                    scope.calcPoint = function (pointRate) {
                        return KO.Common.Math.multi(pointRate, 100);
                    };
                }
            };
        }
    ]);

    //会员导航栏储值
    app.directive('rechargetab', ['AppProgressbar',
        function (AppProgressbar) {
            return {
                restrict : 'E',
                template : [
                    '<form class="tab tab-recharge form-horizontal" name="recharge_form" role="form" novalidate="novalidate" style="display:none;">',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">卡号/手机号</label>',
                            '<div class="col-xs-6 col-lg-8">',
                                '<div class="input-group">',
                                    '<input type="text" ng-model="cardnumber" class="form-control input-lg cardnumber"  ng-focus="inputFocus($event)" tabindex="1">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">储值金额方式</label>',
                            '<div class="col-xs-6 col-lg-6">',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="rechargeway" ng-model="rechargeway" value="0" tabindex="2">任意金额',
                                '</label>',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="rechargeway" ng-model="rechargeway" value="1" tabindex="2">储值套餐',
                                '</label>',
                            '</div>',
                        '</div>',
                        '<div class="col-xs-10 col-lg-10 col-lg-offset-2 clearfix">',
                            '<div class="panel panel-default">',
                                '<div class="panel-heading">本次储值信息</div>',
                                '<div class="panel-body" rechargeway="0">',
                                    '<div class="form-group">',
                                        '<label class="control-label col-xs-3 col-lg-3">储值金额</label>',
                                        '<div class="col-xs-6 col-lg-6" ng-class="{\'has-success\' : recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$valid, \'has-error\' : recharge_form.rechargeamount.$invalid}">',
                                            '<input name="rechargeamount" type="text" class="form-control input-lg rechargeamount" ng-model="rechargeamount"  bv-isdigit bv-greaterthan min="0"  ng-focus="inputFocus($event)" tabindex="3">',
                                            '<small class="help-block" ng-show="recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$error.bvIsdigit">请输入数字</small>',
                                            '<small class="help-block" ng-show="recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$error.bvGreaterthan">必须大于0</small>',
                                        '</div>',
                                    '</div>',
                                    '<div class="form-group">',
                                        '<label class="control-label col-xs-3 col-lg-3">储值返金额</label>',
                                        '<div class="col-xs-6 col-lg-6" ng-class="{\'has-success\' : recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$valid, \'has-error\' : recharge_form.rechargereturnamount.$invalid}">',
                                            '<input name="rechargereturnamount" type="text" class="form-control input-lg rechargereturnamount" ng-model="rechargereturnamount"  bv-isdigit bv-greaterthan="true" min=0  ng-focus="inputFocus($event)" tabindex="4">',
                                            '<small class="help-block" ng-show="recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$error.bvIsdigit">请输入数字</small>',
                                            '<small class="help-block" ng-show="recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$error.bvGreaterthan">必须大于0</small>',
                                        '</div>',
                                    '</div>',
                                    '<div class="form-group">',
                                        '<label class="control-label col-xs-3 col-lg-3">储值返积分</label>',
                                        '<div class="col-xs-6 col-lg-6" ng-class="{\'has-success\' : recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$valid, \'has-error\' : recharge_form.rechargereturnpoint.$invalid}">',
                                            '<input name="rechargereturnpoint" type="text" class="form-control input-lg rechargereturnpoint" ng-model="rechargereturnpoint"  bv-isdigit bv-greaterthan="true" min="0"  ng-focus="inputFocus($event)" tabindex="5">',
                                            '<small class="help-block" ng-show="recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$error.bvIsdigit">请输入数字</small>',
                                            '<small class="help-block" ng-show="recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$error.bvGreaterthan">必须大于0</small>',
                                        '</div>',
                                    '</div>',   
                                '</div>',
                                '<div class="panel-body" rechargeway="1" style="display:none;">',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="form-group clearfix">',
                            '<label class="control-label col-xs-3 col-lg-3">付款方式</label>',
                            '<div class="col-xs-9 col-lg-9">',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="payway" ng-model="payway" value="现金" tabindex="6">现金',
                                '</label>',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="payway" ng-model="payway" value="银行卡" tabindex="6">银行卡',
                                '</label>',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="payway" ng-model="payway" value="支票" tabindex="6">支票',
                                '</label>',
                                '<label class="radio-inline">',
                                    '<input type="radio" name="payway" ng-model="payway" value="其他" tabindex="6">其他',
                                '</label>',
                            '</div>',
                        '</div>',
                        '<div class="form-group clearfix">',
                            '<label class="control-label col-xs-3 col-lg-3">备注</label>',
                            '<div class="col-xs-6 col-lg-6">',
                                '<input type="text" class="form-control input-lg remark" ng-model="remark"  ng-focus="inputFocus($event)" tabindex="7">',
                            '</div>',
                        '</div>',
                        '<div class="col-xs-8 col-lg-10 clearfix submitbtn">',
                            '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-recharge btn-disable btn-success btn-block" tabindex="8">提交储值</button>',
                        '</div>',


                        // '<div style="display:block;">',
                        //     '<div class="form-group">',
                        //         '<label class="control-label pull-left">卡号/手机号</label>',
                        //         '<div class="pull-left">',
                        //             '<div class="input-group">',
                        //                 '<input style="width: 250px;" type="text" ng-model="cardnumber" class="form-control input-lg cardnumber"  ng-focus="inputFocus($event)">',
                        //                 '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                        //             '</div>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:20px;">',
                        //     '<div class="form-group">',
                        //         '<label>储值金额方式</label>',
                        //         '<input type="radio" name="rechargeway" ng-model="rechargeway" value="0">任意金额',
                        //         '<input type="radio" name="rechargeway" ng-model="rechargeway" value="1">储值套餐',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;width:415px;">',
                        //     '<div class="panel panel-default">',
                        //         '<div class="panel-heading">本次储值信息</div>',
                        //         '<div class="panel-body" rechargeway="0">',
                        //             '<div style="display:block;">',
                        //                 '<div class="form-group">',
                        //                     '<label class="control-label pull-left">储值金额</label>',
                        //                     '<div class="pull-left" ng-class="{\'has-success\' : recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$valid, \'has-error\' : recharge_form.rechargeamount.$invalid}">',
                        //                         '<input name="rechargeamount" style="width: 240px;" type="text" class="form-control input-lg rechargeamount" ng-model="rechargeamount" bv-isnum bv-greaterthan min="0"  ng-focus="inputFocus($event)">',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$error.bvIsnum">请输入数字</small>',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargeamount.$dirty && recharge_form.rechargeamount.$error.bvGreaterthan">必须大于0</small>',
                        //                     '</div>',
                        //                 '</div>',
                        //             '</div>',
                        //             '<div style="display:block;margin-top:10px;">',
                        //                 '<div class="form-group">',
                        //                     '<label class="control-label pull-left">储值返金额</label>',
                        //                     '<div class="pull-left" ng-class="{\'has-success\' : recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$valid, \'has-error\' : recharge_form.rechargereturnamount.$invalid}">',
                        //                         '<input name="rechargereturnamount" style="width: 240px;" type="text" class="form-control input-lg rechargereturnamount" ng-model="rechargereturnamount" bv-isnum bv-greaterthan="true" min=0  ng-focus="inputFocus($event)">',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$error.bvIsnum">请输入数字</small>',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargereturnamount.$dirty && recharge_form.rechargereturnamount.$error.bvGreaterthan">必须大于0</small>',
                        //                     '</div>',
                        //                 '</div>',
                        //             '</div>',
                        //             '<div style="display:block;margin-top:10px;">',
                        //                 '<div class="form-group">',
                        //                     '<label class="control-label pull-left">储值返积分</label>',
                        //                     '<div class="pull-left" ng-class="{\'has-success\' : recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$valid, \'has-error\' : recharge_form.rechargereturnpoint.$invalid}">',
                        //                         '<input name="rechargereturnpoint" style="width: 240px;" type="text" class="form-control input-lg rechargereturnpoint" ng-model="rechargereturnpoint" bv-isnum bv-greaterthan="true" min="0"  ng-focus="inputFocus($event)">',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$error.bvIsnum">请输入数字</small>',
                        //                         '<small class="help-block" ng-show="recharge_form.rechargereturnpoint.$dirty && recharge_form.rechargereturnpoint.$error.bvGreaterthan">必须大于0</small>',
                        //                     '</div>',
                        //                 '</div>',
                        //             '</div>',
                        //         '</div>',
                        //         '<div class="panel-body" rechargeway="1" style="display:none;">',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label>付款方式</label>',
                        //         '<input type="radio" name="payway" ng-model="payway" value="现金">现金',
                        //         '<input type="radio" name="payway" ng-model="payway" value="银行卡">银行卡',
                        //         '<input type="radio" name="payway" ng-model="payway" value="支票">支票',
                        //         '<input type="radio" name="payway" ng-model="payway" value="其他">其他',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label>备注</label>',
                        //         '<input style="width: 260px;" type="text" class="form-control input-lg remark" ng-model="remark"  ng-focus="inputFocus($event)">',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-recharge btn-disable btn-success">提交储值</button>',
                        //     '</div>',
                        // '</div>',
                        // '<div class="col-xs-8 clearfix">',
                        //     '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-recharge btn-disable btn-success btn-block">提交储值</button>',
                        // '</div>',
                        '<div class="panel-rechargeplan" style="display:none;">',
                            '<div class="header">储值套餐</div>',
                            '<ul class="table-rechargeplan">',
                                '<li role="presentation" ng-repeat="el in rechargeplans" setid="{{el.saveMoneySetID}}">',
                                    '<div class="name">{{el.setName}}</div>',
                                    '<div class="savemoney">*储值金额：{{el.setSaveMoney}}元</div>',
                                    '<div class="returnmoney" return="{{el.returnMoney}}">*送返金额：{{el.returnMoney}}元</div>',
                                    '<div class="returnpoint" return="{{el.returnPoint}}">*送返积分：{{el.returnPoint}}元</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                    '</form>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    el.find('.panel-rechargeplan ul').css('height', $(window).height() - 82);

                    var init = function() {
                        scope.cardnumber = '';
                        scope.rechargeway = 0;
                        scope.rechargeamount = 0;
                        scope.rechargereturnamount = 0;
                        scope.rechargereturnpoint = 0;
                        scope.payway = '现金';
                        scope.remark = '';

                        scope.panel_userinfo.hide();
                    };
                    init();

                    scope.$watch('rechargeway', function(newValue, oldValue, scope) {
                        el.find('.panel-body[rechargeway="' + oldValue + '"]').hide();
                        el.find('.panel-body[rechargeway="' + newValue + '"]').show();

                        if(1 == newValue) {
                            $('.panel-rechargeplan').show();

                            el.find('div[return="0.00"]').hide();
                        }else {
                            $('.panel-rechargeplan').hide();
                        }
                    });

                    var rechargeplans = {
                        changePlan: function(index) {
                            scope.rechargeplan = scope.rechargeplans[index];
                            scope.$apply();
                        }
                    };

                    //点击储值套餐标签时
                    el.on('click', '.panel-rechargeplan li', function() {
                        rechargeplans.changePlan($(this).index());
                        el.find('.panel-rechargeplan').find('.active').removeClass('active');
                        $(this).addClass('active');
                        el.find('.panel-body[rechargeway="1"]').html($(this).html());;
                    });

                    //点击提交按钮时
                    el.on('click', '.btn-submit-recharge', function() {
                        if(!$(this).hasClass('btn-disable')) {
                            var progressbar = AppProgressbar.add('warning', '提交数据...');
                            scope.CCS.saveMoney({
                                cardID: scope.user.cardkey,
                                payWayName: scope.payway,
                                saveMoneySetID: scope.rechargeway == 0 ? '' : scope.rechargeplan.saveMoneySetID,
                                transAmount: scope.rechargeway == 0 ? scope.rechargeamount : scope.rechargeplan.setSaveMoney,
                                transRemark: scope.remark,
                                transReturnMoneyAmount: scope.rechargeway == 0 ? scope.rechargereturnamount : scope.rechargeplan.returnMoney,
                                transReturnPointAmount: scope.rechargeway == 0 ? scope.rechargereturnpoint : scope.rechargeplan.returnPoint
                            }).success(function(data) {
                                AppProgressbar.close(progressbar);
                                if(data.code == '000') {
                                    scope.AA.add('success', '储值成功！');

                                    KO.DevCom.exeCmd('PrintCRMTransBill', _.result(data.data, 'transReceiptsTxt', ''));
                                    scope.panel_userinfo.hide();
                                    init();
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏消费刷卡
    app.directive('consumetab', [
        '$rootScope', '$sce', 'CommonCallServer', 'AppAlert','AppProgressbar',
        function ($rootScope, $sce, CommonCallServer, AppAlert, AppProgressbar) {
            return {
                restrict : 'E',
                template : [
                    '<form name="consume_form" class="tab tab-consume form-horizontal">',
                        '<div class="form-group has-feedback">',
                            '<label class="control-label col-xs-3 col-lg-3">卡号/手机号</label>',
                            '<div class="col-xs-5 col-lg-6">',
                                '<div class="input-group">',
                                    '<input type="text" ng-model="cardnumber" class="form-control input-lg cardnumber"  ng-focus="inputFocus($event)" autofocus="true" tabindex="1">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">本次消费金额</label>',
                            '<div class="col-xs-2 col-lg-3" ng-class="{\'has-success\' : consume_form.consumeamount.$dirty && consume_form.consumeamount.$valid, \'has-error\' : consume_form.consumeamount.$invalid}">',
                                '<input name="consumeamount" type="text" class="form-control input-lg group" ng-model="group.consumeamount" ng-change="calculate(\'consumeamount\')" bv-greaterthan="true" min="0" bv-isdigit  ng-focus="inputFocus($event)" tabindex="2">',
                                '<small class="help-block" ng-show="consume_form.consumeamount.$dirty && consume_form.consumeamount.$error.bvIsdigit">请输入正确金额</small>',
                                '<small class="help-block" ng-show="consume_form.consumeamount.$dirty && consume_form.consumeamount.$error.bvGreaterthan">必须大于或等于0</small>',
                            '</div>',
                            '<label class="control-label col-xs-1 col-lg-2 onumber">单号</label>',
                            '<div class="col-xs-2 col-lg-3" ng-class="">',
                                '<input style="width: 86px;" type="text" class="form-control input-lg ordernumber" ng-model="ordernumber"  ng-focus="inputFocus($event)" tabindex="3">',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">代金券抵扣金额</label>',
                            '<div class="col-xs-5 col-lg-6">',
                                '<input type="text" disabled class="form-control input-lg group usevoucheramount" ng-model="group.usevoucheramount" ng-change="calculate(\'usevoucheramount\')"  ng-focus="inputFocus($event)" tabindex="4">',
                            '</div>',
                        '</div>',
                        '<div class="form-group pa" style="display:none;">',
                            '<label class="control-label col-xs-3 col-lg-3">积分抵扣金额</label>',
                            '<div class="col-xs-3 col-lg-3" ng-class="{\'has-success\' : consume_form.pointamount.$dirty && consume_form.pointamount.$valid, \'has-error\' : consume_form.pointamount.$invalid}">',
                                '<input name="pointamount" style="width: 120px;" type="text" class="form-control input-lg group" ng-model="group.pointamount" ng-change="calculate(\'pointamount\')" bv-between="true" min="0" max="{{user.pointaccount || 0}}" bv-isdigit  ng-focus="inputFocus($event)" tabindex="5">',
                                '<small class="help-block" ng-show="consume_form.pointamount.$dirty && consume_form.pointamount.$error.bvBetween">必须在0~{{user.pointaccount || 0}}</small>',
                                '<small class="help-block" ng-show="consume_form.pointamount.$dirty && consume_form.pointamount.$error.bvIsdigit">请输入正确金额</small>',
                            '</div>',
                            '<span class="col-xs-2 col-lg-5">积分可抵扣金额: {{user.pointaccount || 0 | mycurrency: "￥"}}</span>',
                        '</div>',
                        '<div class="form-group ca" style="display:none;">',
                            '<label class="control-label col-xs-3 col-lg-3">储值余额付款</label>',
                            '<div class="col-xs-3 col-lg-3" ng-class="{\'has-success\' : consume_form.balanceamount.$dirty && consume_form.balanceamount.$valid, \'has-error\' : consume_form.balanceamount.$invalid}">',
                                '<input name="balanceamount" type="text" class="form-control input-lg group" ng-model="group.balanceamount" ng-change="calculate(\'balanceamount\')" bv-between="true" min="0" max="{{user.cashaccount || 0}}" bv-isdigit  ng-focus="inputFocus($event)" tabindex="6">',
                                '<small class="help-block" ng-show="consume_form.balanceamount.$dirty && consume_form.balanceamount.$error.bvGreaterthan">必须在0~{{user.cashaccount || 0}}</small>',
                                '<small class="help-block" ng-show="consume_form.balanceamount.$dirty && consume_form.balanceamount.$error.bvIsdigit">请输入正确金额</small>',
                            '</div>',
                            '<span class="col-xs-2 col-lg-5">可用余额: {{user.cashaccount || 0 | mycurrency: "￥"}}</span>',
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">消费可积分金额</label>',
                            '<div class="col-xs-3 col-lg-3" ng-class="{\'has-success\' : consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$valid, \'has-error\' : consume_form.pointgetamount.$invalid}">',
                                '<input name="pointgetamount" type="text" class="form-control input-lg group" ng-model="group.pointgetamount" ng-change="calculate(\'pointgetamount\')" bv-greaterthan="true" min="0" bv-isdigit  ng-focus="inputFocus($event)" tabindex="7">',
                                '<small class="help-block" ng-show="consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$error.bvGreaterthan">必须大于或等于0</small>',
                                '<small class="help-block" ng-show="consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$error.bvIsdigit">请输入正确金额</small>',
                            '</div>',
                            '<span class="col-xs-3 col-lg-5 radio-inline help-block"><-现金支付那部分金额</span>',
                        '</div>',
                        '<div class="form-group formpwd" style="display:none;">',
                            '<label class="control-label col-xs-3">动态交易密码</label>',
                            '<div class="col-xs-6 col-lg-6" ng-class="{\'has-success\' : consume_form.transpwd.$dirty && consume_form.transpwd.$valid, \'has-error\' : consume_form.transpwd.$invalid}">',
                                '<div class="input-group" >',
                                    '<input name="transpwd" type="text" ng-model="transpwd" class="form-control input-lg transpwd" bv-notempty  ng-focus="inputFocus($event)" tabindex="8">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-sendtranspwd">发送动态交易密码</button></span>',
                                '</div>',
                                '<small class="help-block" ng-show="consume_form.transpwd.$dirty && consume_form.transpwd.$error.bvNotempty">请输入动态交易密码</small>',
                            '</div>',
                            
                        '</div>',
                        '<div class="form-group">',
                            '<label class="control-label col-xs-3 col-lg-3">备注</label>',
                            '<div class="col-xs-5 col-lg-6">',
                                '<input type="text" class="form-control input-lg remark" ng-model="remark"  ng-focus="inputFocus($event)" tabindex="9">',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<p class="col-xs-offset-3 col-xs-9 help-block">会员消费积分＝可积分金额*等级积分系数</p>',
                        '</div>',
                        '<div class="col-xs-8 col-lg-10 clearfix submitbtn">',
                            '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-consume btn-disable btn-success btn-block" tabindex="10">提交刷卡</button>',
                        '</div>',
                        '<div class="panel-vouchers" style="display:none;">',
                            '<div class="header">会员代金券和兑换券 {{vouchers.length}}张</div>',
                            '<ul class="table-vouchers">',
                                '<li role="presentation" ng-repeat="el in vouchers" voucherid="{{el.voucherID}}" ng-click="changeVoucher($index)" index="{{el.index}}">',
                                    '<div class="left">',
                                        '<div class="placeholder"></div>',
                                        '<div class="text-box">',
                                            '<div>{{el.type == 1 ? "代金券" : "兑换券"}}</div>',
                                            '<div>{{el.voucherValue | mycurrency: "￥"}}</div>',
                                        '</div>',
                                    '</div>',
                                    '<div class="right">',
                                        '<div class="placeholder"></div>',
                                        '<div class="text-box">',
                                            '<div>{{el.voucherName}}</div>',
                                            '<div>截止日期：{{el.voucherValidDate}}</div>',
                                        '</div>',
                                    '</div>',
                                '</li>',
                            '</ul>',
                        '</div>',
                        


                        // '<div style="display:block;">',
                        //     '<div class="form-group has-feedback">',
                        //         '<label class="">卡号/手机号</label>',
                        //         '<div class="input-group">',
                        //             '<input style="width:250px;" type="text" ng-model="cardnumber" class="form-control input-lg cardnumber"  ng-focus="inputFocus($event)">',
                        //             '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div class="row clearfix" style="display:block;margin-top:10px;">',
                        //     '<div class="form-group col-xs-6">',
                        //         '<label class="pull-left control-label">本次消费金额</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : consume_form.consumeamount.$dirty && consume_form.consumeamount.$valid, \'has-error\' : consume_form.consumeamount.$invalid}">',
                        //             '<input name="consumeamount" style="width: 120px;" type="text" class="form-control input-lg group" ng-model="group.consumeamount" ng-change="calculate(\'consumeamount\')" bv-greaterthan="true" min="0" bv-isnum  ng-focus="inputFocus($event)">',
                        //             '<small class="help-block" ng-show="consume_form.consumeamount.$dirty && consume_form.consumeamount.$error.bvIsnum">请输入正确金额</small>',
                        //             '<small class="help-block" ng-show="consume_form.consumeamount.$dirty && consume_form.consumeamount.$error.bvGreaterthan">必须大于或等于0</small>',
                                    
                        //         '</div>',
                        //     '</div>',
                        //     '<div class="form-group col-xs-4">',
                        //         '<label class="pull-left control-label" style="width:30px;margin-left:1px;">单号</label>',
                        //         '<div class="pull-left" ng-class="">',
                        //             '<input style="width: 86px;" type="text" class="form-control input-lg ordernumber" ng-model="ordernumber"  ng-focus="inputFocus($event)">',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label class="pull-left control-label">代金券抵扣金额</label>',
                        //         '<div class="pull-left">',
                        //             '<input style="width: 300px;" type="text" disabled class="form-control input-lg group usevoucheramount" ng-model="group.usevoucheramount" ng-change="calculate(\'usevoucheramount\')"  ng-focus="inputFocus($event)">',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:none;margin-top:10px;" class="pa">',
                        //     '<div class="form-group">',
                        //         '<label class="pull-left control-label">积分抵扣金额</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : consume_form.pointamount.$dirty && consume_form.pointamount.$valid, \'has-error\' : consume_form.pointamount.$invalid}">',
                        //             '<input name="pointamount" style="width: 160px;" type="text" class="form-control input-lg group" ng-model="group.pointamount" ng-change="calculate(\'pointamount\')" bv-between="true" min="0" max="{{user.pointaccount || 0}}" bv-isnum  ng-focus="inputFocus($event)">',
                        //             '<span>积分可抵扣金额: {{user.pointaccount || 0 | mycurrency: "￥"}}</span>',
                        //             '<small class="help-block" ng-show="consume_form.pointamount.$dirty && consume_form.pointamount.$error.bvBetween">必须在0~{{user.pointaccount || 0}}</small>',
                        //             '<small class="help-block" ng-show="consume_form.pointamount.$dirty && consume_form.pointamount.$error.bvIsnum">请输入正确金额</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:none;margin-top:10px;" class="ca">',
                        //     '<div class="form-group">',
                        //         '<label class="pull-left control-label">储值余额付款</label>',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : consume_form.balanceamount.$dirty && consume_form.balanceamount.$valid, \'has-error\' : consume_form.balanceamount.$invalid}">',
                        //             '<input name="balanceamount" style="width: 160px;" type="text" class="form-control input-lg group" ng-model="group.balanceamount" ng-change="calculate(\'balanceamount\')" bv-between="true" min="0" max="{{user.cashaccount || 0}}" bv-isnum  ng-focus="inputFocus($event)">',
                        //             '<span>可用余额: {{user.cashaccount || 0 | mycurrency: "￥"}}</span>',
                        //             '<small class="help-block" ng-show="consume_form.balanceamount.$dirty && consume_form.balanceamount.$error.bvGreaterthan">必须在0~{{user.cashaccount || 0}}</small>',
                        //             '<small class="help-block" ng-show="consume_form.balanceamount.$dirty && consume_form.balanceamount.$error.bvIsnum">请输入正确金额</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //     '<label class="pull-left control-label">消费可积分金额</label>',
                        //     '<div class="pull-left" >',
                        //         '<div class="pull-left" ng-class="{\'has-success\' : consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$valid, \'has-error\' : consume_form.pointgetamount.$invalid}">',
                        //             '<input name="pointgetamount" style="width: 160px;" type="text" class="form-control input-lg group" ng-model="group.pointgetamount" ng-change="calculate(\'pointgetamount\')" bv-greaterthan="true" min="0" bv-isnum  ng-focus="inputFocus($event)">',
                        //             '<span><-现金支付那部分金额</span>',
                        //             '<small class="help-block" ng-show="consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$error.bvGreaterthan">必须大于或等于0</small>',
                        //             '<small class="help-block" ng-show="consume_form.pointgetamount.$dirty && consume_form.pointgetamount.$error.bvIsnum">请输入正确金额</small>',
                        //         '</div>',
                        //     '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:none;margin-top:10px;" class="formpwd">',
                        //     '<div class="form-group">',
                        //         '<label class="pull-left control-label">动态交易密码</label>',
                        //         '<div class="pull-left"  ng-class="{\'has-success\' : consume_form.transpwd.$dirty && consume_form.transpwd.$valid, \'has-error\' : consume_form.transpwd.$invalid}">',
                        //             '<div class="input-group">',
                        //                 '<input name="transpwd" style="width:123px;" type="text" ng-model="transpwd" class="form-control input-lg transpwd" bv-notempty  ng-focus="inputFocus($event)">',
                        //                 '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-sendtranspwd">发送动态交易密码</button></span>',
                        //             '</div>',
                        //             '<small class="help-block" ng-show="consume_form.transpwd.$dirty && consume_form.transpwd.$error.bvNotempty">请输入动态交易密码</small>',
                        //         '</div>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<label>备注</label>',
                        //         '<input style="width: 300px;" type="text" class="form-control input-lg remark" ng-model="remark"  ng-focus="inputFocus($event)">',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<span>会员消费积分＝可积分金额*等级积分系数</span>',
                        //     '</div>',
                        // '</div>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-consume btn-disable btn-success">提交刷卡</button>',
                        //     '</div>',
                        // '</div>',
                        // '<div class="panel-vouchers" style="display:none;">',
                        //     '<div class="header">会员代金券和兑换券 {{vouchers.length}}张</div>',
                        //     '<ul class="table-vouchers">',
                        //         '<li role="presentation" ng-repeat="el in vouchers" voucherid="{{el.voucherID}}" ng-click="changeVoucher($index)" index="{{el.index}}">',
                        //             '<div class="left">',
                        //                 '<div>{{el.type == 1 ? "代金券" : "兑换券"}}</div><div>￥{{el.voucherValue}}</div>',
                        //             '</div>',
                        //             '<div class="right">',
                        //                 '<div>{{el.voucherName}}</div>',
                        //                 '<div>截止日期：{{el.voucherValidDate}}</div>',
                        //             '</div>',
                        //         '</li>',
                        //     '</ul>',
                        // '</div>',
                    '</form>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {
                    IQ.ns('KO');
                    var HCMath = KO.Common.Math;
                    el.find('.panel-vouchers ul').css('height', $(window).height() - 82);

                    var init = function() {
                        scope.cardnumber = '';
                        scope.ordernumber = '';
                        scope.transpwd = '';
                        scope.group = {
                            consumeamount: 0,
                            usevoucheramount: 0,
                            pointamount: 0,
                            balanceamount: 0,
                            pointgetamount: 0,
                            vl: '',
                            el: ''
                        }
                        scope.usevoucher = [];
                        scope.ispwd = 0;
                    };
                    init();


                    //获取验证码按钮

                    var ti;
                    el.on('click', '.btn-sendtranspwd', function() {
                        var time = 60;
                        var self = $(this);

                        if(!self.hasClass('btn-disable')) {
                            scope.CCS.sendTransPWD({
                                cardID: scope.userorg.cardKey
                            }).success(function(data) {
                                if(data.code == '000') {
                                    self.html('60秒后重新发送').addClass('btn-disable');

                                    ti = setInterval(function() {
                                        if(time > 0) {
                                            time --;
                                            self.html(time + '秒后重新发送')
                                        }else{
                                            clearInterval(ti);
                                            self.html('获取验证码').removeClass('btn-disable');
                                        }
                                    }, 1000);
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });

                    scope.$watch('usevoucher', function(newValue, oldValue) {
                        var sum = 0;
                        var vl = [];
                        var el = [];

                        if(newValue.length > 0) {
                            for(var i = 0; i < newValue.length; i ++) {
                                if(newValue[i].type == 1) {
                                    sum += parseFloat(newValue[i].voucherValue);
                                    vl.push(newValue[i].voucherID);
                                }else{
                                    el.push(newValue[i].voucherID);
                                }
                            }

                            scope.group.usevoucheramount = sum;

                            if(sum >= scope.group.consumeamount) {
                                $('.panel-vouchers').addClass('full');
                            }else {
                                $('.panel-vouchers').removeClass('full');
                            }
                        }else{
                            scope.group.usevoucheramount = 0;
                            $('.panel-vouchers').find('.active').removeClass('active');
                            $('.panel-vouchers').removeClass('full');
                        }

                        scope.group.vl = vl.join();
                        scope.group.el = el.join();
                        scope.calculate('usevoucheramount')
                    });

                    //价格变动时的一些联动
                    scope.calculate = function (name) {
                        if (_.isEmpty(scope.user)) return;
                        // ca:consumeamount;uva:usevoucheramount;pa:pointamount;ba:balanceamount;pga:pointgetamount
                        var ca, uva, pa, ba, pga;
                        var delta;
                        switch(name) {
                            case 'consumeamount' :
                                scope.uservoucher = [];
                                pa = ba = uva = 0;
                                ca = parseFloat(scope.group['consumeamount']);
                                // 如果消费金额小于等于会员卡积分余额，使用部分会员卡积分余额，否则使用全部积分余额
                                pa = parseFloat(_.result(scope.user, 'pointaccount', 0));
                                pa = ca < pa ? ca : pa;
                                ba = parseFloat(HCMath.sub(ca, pa, uva));
                                ba = ba >= parseFloat(_.result(scope.user, 'cashaccount')) ? parseFloat(_.result(scope.user, 'cashaccount')) : ba;
                                break;
                            case 'usevoucheramount' : 
                                pa = ba = 0;
                                ca = parseFloat(scope.group['consumeamount']);
                                uva = parseFloat(scope.group['usevoucheramount']);
                                delta = parseFloat(HCMath.sub(ca, uva));
                                if (delta > 0) {
                                    pa = parseFloat(_.result(scope.user, 'pointaccount', 0));
                                    pa = delta < pa ? ca : pa;
                                    ba = parseFloat(HCMath.sub(delta, pa));
                                    ba = ba >= parseFloat(_.result(scope.user, 'cashaccount')) ? parseFloat(_.result(scope.user, 'cashaccount')) : ba;
                                }
                                break;
                            case 'pointamount':
                                ba = 0;
                                ca = parseFloat(scope.group['consumeamount']);
                                pa = parseFloat(_.result(scope.group, 'pointamount'));
                                pa = parseFloat(_.result(scope.user, 'pointaccount', 0)) < pa ? parseFloat(_.result(scope.user, 'pointaccount', 0)) : pa;
                                uva = parseFloat(scope.group['usevoucheramount']);
                                delta = parseFloat(HCMath.sub(ca, uva, pa));
                                if (delta > 0) {
                                    ba = delta >= parseFloat(_.result(scope.user, 'cashaccount')) ? parseFloat(_.result(scope.user, 'cashaccount')) : delta;
                                }
                                break;
                            case 'balanceamount':
                                ca = parseFloat(scope.group['consumeamount']);
                                pa = parseFloat(_.result(scope.group, 'pointamount'));
                                uva = parseFloat(scope.group['usevoucheramount']);
                                ba = parseFloat(_.result(scope.group, 'balanceamount', 0));
                                delta = parseFloat(HCMath.sub(ca, uva, pa));
                                ba = delta < ba ? delta : ba;
                                break;
                        }
                        pga = parseFloat(HCMath.sub(ca, uva, pa, ba));

                        scope.group.pointamount = pa;
                        scope.group.balanceamount = ba;
                        scope.group.pointgetamount = pga;
                    };
                    // scope.calculate = function(name) {

                    //     if(scope.user) {
                    //         var ca, uva, pa, ba, pga;

                    //         switch (name) {
                    //             case 'consumeamount' : {
                    //                 scope.usevoucher = [];
                    //                 pa = ba = uva = 0;
                    //                 ca = parseFloat(scope.group['consumeamount']);
                    //                 pga = parseFloat(scope.group['consumeamount']);
                    //             }break;

                    //             case 'usevoucheramount' : {
                    //                 pa = ba = 0;
                    //                 uva = parseFloat(scope.group['usevoucheramount']);
                    //                 ca = parseFloat(scope.group['consumeamount']);
                    //                 // pga = parseFloat(ca) - parseFloat(uva);
                    //                 pga = parseFloat(HCMath.sub(ca, uva));
                    //                 if(!pga) pga = 0;
                    //             }break;

                    //             case 'pointamount' : {
                    //                 ba = 0;
                    //                 pa = parseFloat(scope.group['pointamount']);
                    //                 uva = parseFloat(scope.group['usevoucheramount']);
                    //                 ca = parseFloat(scope.group['consumeamount']);
                    //                 if (pa > (ca - uva)) {
                    //                     pa = parseFloat(HCMath.sub(ca, uva));
                    //                 }
                    //                 if(pa > parseFloat(scope.user.pointaccount) * parseFloat(scope.user.pointasmoneyrate)) {
                    //                     // pa = parseFloat(scope.user.pointaccount) * parseFloat(scope.user.pointasmoneyrate);
                    //                     pa = parseFloat(HCMath.multi(scope.user.pointaccount, scope.user.pointasmoneyrate));
                    //                 }

                    //                 pga = parseFloat(HCMath.sub(ca, uva, pa));
                    //                 if(!pga) pga = 0;
                    //             }break;

                    //             case 'balanceamount' : {
                    //                 ba = parseFloat(scope.group['balanceamount']);
                    //                 pa = parseFloat(scope.group['pointamount']);
                    //                 uva = parseFloat(scope.group['usevoucheramount']);
                    //                 ca = parseFloat(scope.group['consumeamount']);
                    //                 if(ba > ca - uva - pa) {
                    //                     ba = parseFloat(HCMath.sub(ca.toString(), uva.toString(), pa.toString()));
                    //                 }
                    //                 if(ba > parseFloat(scope.user.cashaccount)) {
                    //                     ba = parseFloat(scope.user.cashaccount);
                    //                 }
                    //                 pga = parseFloat(HCMath.sub(ca.toString(), uva.toString(), pa.toString(), ba.toString()));
                    //                 if(!pga) pga = 0;
                    //             }break;

                    //         }

                    //         scope.group.pointamount = pa;
                    //         scope.group.balanceamount = ba;
                    //         scope.group.pointgetamount = pga;
                    //     }
                    // }

                    //点击储值套餐标签时
                    scope.changeVoucher =  function(index) {
                        var self = $('.panel-vouchers li').eq(index);
                        var arr = [];
                        if (scope.group.consumeamount == 0 || _.isEmpty(scope.group.consumeamount)) {
                            AppAlert.add('warning', '本次消费金额为0或为空，不需要使用代金券！');
                            scope.usevoucher = arr;
                            return;
                        }

                        if(self.hasClass('active')) {
                            self.removeClass('active');
                        }else {
                            if(!$('.panel-vouchers').hasClass('full')) {
                                scope.usevoucher.push(index);
                                self.addClass('active');
                            }
                        }

                        

                        $('.panel-vouchers').find('.active').each(function() {
                            arr.push(scope.vouchers[$(this).attr('index')]);
                        });

                        scope.usevoucher = arr;
                    };

                    //点击提交按钮时
                    el.on('click', '.btn-submit-consume', function() {
                        if(!$(this).hasClass('btn-disable')) {
                            var progressbar = AppProgressbar.add('warning', '提交数据...');
                            scope.CCS.deductMoney({
                                cardKey: scope.user.cardkey,
                                cardTransPWD: scope.transpwd,
                                isMobileCard: scope.userorg.isMobileCard,
                                consumptionAmount: scope.group.consumeamount,
                                consumptionPointAmount: scope.group.pointgetamount,
                                deductGiftAmount: scope.group.usevoucheramount,
                                deductMoneyAmount: scope.group.balanceamount,
                                deductPointAmount: scope.group.pointamount,
                                discountAmount: 0,
                                posOrderNo: scope.ordernumber,
                                remark: scope.remark,
                                EGiftItemIDList: scope.group.vl,
                                exchangeItemIDList: scope.group.el
                            }).success(function(data) {
                                AppProgressbar.close(progressbar);
                                if(data.code == '000') {
                                    scope.AA.add('success', '消费成功！');
                                    scope.panel_userinfo.hide();

                                    KO.DevCom.exeCmd('PrintCRMTransBill', data.data.transReceiptsTxt);
                                    init();
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏卡操作
    app.directive('cardhandletab', ['AppProgressbar',
        function (AppProgressbar) {
            return {
                restrict : 'E',
                template : [
                    '<div name="cardhandle_form" class="tab tab-cardhandle form-inline" style="display:none;">',
                        '<div style="display:block;">',
                            '<div class="form-group">',
                                '<label>卡号/手机号</label>',
                                '<div class="input-group col-xs-6 col-lg-8">',
                                    '<input type="text" ng-model="cardnumber" class="form-control input-lg cardnumber"  ng-focus="inputFocus($event)" tabindex="1">',
                                    '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-query"><span class="glyphicon glyphicon-search"></span></button></span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div style="display:block;margin-top:10px;/*width:700px;*/">',
                            '<div class="panel panel-default">',
                                '<div class="panel-heading">选择卡操作类型</div>',
                                '<div class="list-group">',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="绑定手机号" ng-model="handler" text="bind"  tabindex="2"><b>绑定手机号</b></div>',
                                        '<span>（为持实体卡的会员绑定手机号，以便报手机号即可使用，也可以用来更改绑定的手机号）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="补办实体卡" ng-model="handler" text="transactrealcard"  tabindex="2"><b>补办实体卡</b></div>',
                                        '<span>（顾客通过网上加入会员，可在店内补办实体卡）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="挂失" ng-model="handler" text="lost"  tabindex="2"><b>挂失</b></div>',
                                        '<span>（卡遗失客户申请挂失，挂失后卡不能使用）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="解除挂失" ng-model="handler" text="cancellost"  tabindex="2"><b>解除挂失</b></div>',
                                        '<span>（顾客挂失后又找到卡，则可解除挂失，解除挂失后卡正常使用）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="卡遗损补办" ng-model="handler" text="transactlostcard"  tabindex="2"><b>卡遗损补办</b></div>',
                                        '<span>（原卡损坏或遗失到店补办信啊，换卡后原来的卡将不能使用，积分及资金转入新卡）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="冻结" ng-model="handler" text="freeze"  tabindex="2"><b>冻结</b></div>',
                                        '<span>（卡金额出现异常时可冻结，冻结后卡不能使用）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="解冻" ng-model="handler" text="unfreeze"  tabindex="2"><b>解冻</b></div>',
                                        '<span>（卡被冻结后经排除问题并解决后可用解冻来恢复卡的正常使用）</span>',
                                    '</label>',
                                    '<label class="list-group-item">',
                                        '<div class="radio"><input type="radio" name="handler" value="注销" ng-model="handler" text="logout"  tabindex="2"><b>注销</b></div>',
                                        '<span>（卡永久失效时，可用注销将其作废，注销后卡不能再使用，也不能再恢复）</span>',
                                    '</label>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<form name="form1" class="bonus-panel form-horizontal clearfix" novalidate="novalidate" style="display:block;margin-top:10px;" for="绑定手机号">',
                            '<div class="form-group col-xs-5 row">',
                                '<span class="col-xs-4 control-label">手机号</span>',
                                '<div class="col-xs-8"  ng-class="{\'has-success\' : form1.sendcodephone.$dirty && form1.sendcodephone.$valid, \'has-error\' : form1.sendcodephone.$invalid}">',
                                    '<input name="sendcodephone" style="width: 187px;" type="text" ng-model="sendcodephone" class="form-control input-lg phonenumber" bv-mobile  ng-focus="inputFocus($event)" tabindex="3">',
                                    '<small class="help-block" ng-show="form1.sendcodephone.$dirty && form1.sendcodephone.$error.bvMobile">请输入正确手机号</small>',
                                '</div>',
                            '</div>',
                            '<div class="form-group col-xs-7 row">',
                                '<span class="col-xs-5 control-label">短信验证码</span>',
                                '<div class="col-xs-7" ng-class="{\'has-success\' : form1.msgcode.$dirty && form1.msgcode.$valid, \'has-error\' : form1.msgcode.$invalid}">',
                                    '<div class="input-group">',
                                        '<input name="msgcode" style="width: 100px;" type="text" ng-model="msgcode" class="form-control input-lg msgcode" bv-notempty  ng-focus="inputFocus($event)" tabindex="4">',
                                        '<span class="input-group-btn"><button type="button" class="btn btn-default btn-lg btn-getmsgcode">获取手机验证码</button></span>',
                                    '</div>',
                                    '<small class="help-block" ng-show="form1.msgcode.$dirty && form1.msgcode.$error.bvNotempty">请输入手机验证码</small>',
                                '</div>',
                            '</div>',
                        '</form>',
                        '<form name="form2" class="bonus-panel form-horizontal clearfix" style="display:none;margin-top:10px;" novalidate="novalidate" for="补办实体卡">',
                            '<div class="form-group col-xs-6 row">',
                                '<span class="col-xs-4 control-label">卡号</span>',
                                '<div class="col-xs-8"  ng-class="{\'has-success\' : form2.getrealcard.$dirty && form2.getrealcard.$valid, \'has-error\' : form2.getrealcard.$invalid}">',
                                    '<input name="getrealcard" style="width: 187px;" type="text" ng-model="getrealcard" class="form-control input-lg getrealcard" bv-notempty  ng-focus="inputFocus($event)" tabindex="5">',
                                    '<small class="help-block" ng-show="form2.getrealcard.$dirty && form2.getrealcard.$error.bvNotempty">请输入卡号</small>',
                                '</div>',
                            '</div>',
                        '</form>',
                        '<form name="form3" class="bonus-panel form-horizontal clearfix" style="display:none;margin-top:10px;" novalidate="novalidate" for="卡遗损补办">',
                            '<div class="form-group col-xs-6 row">',
                                '<span class="col-xs-4 control-label">新卡号</span>',
                                '<div class="col-xs-8"  ng-class="{\'has-success\' : form3.getnewcard.$dirty && form3.getnewcard.$valid, \'has-error\' : form3.getnewcard.$invalid}">',
                                    '<input name="getnewcard" style="width: 187px;" type="text" ng-model="getnewcard" class="form-control input-lg getnewcard" bv-notempty  ng-focus="inputFocus($event)" tabindex="6">',
                                    '<small class="help-block" ng-show="form3.getnewcard.$dirty && form3.getnewcard.$error.bvNotempty">请输入卡号</small>',
                                '</div>',
                            '</div>',
                        '</form>',
                        // '<div style="display:block;margin-top:10px;">',
                        //     '<div class="form-group">',
                        //         '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-handle btn-disable btn-success">提交{{handler}}操作</button>',
                        //     '</div>',
                        // '</div>',
                        '<div class="col-xs-7 col-lg-10 clearfix submitbtn">',
                            '<button type="button" class="btn btn-default btn-submit btn-lg btn-submit-handle btn-disable btn-success btn-block" tabindex="7">提交{{handler}}操作</button>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {

                    var init = function() {
                        scope.handler = '绑定手机号';
                        scope.sendcodephone = '';
                        scope.msgcode = '';
                        scope.getrealcard = '';
                        scope.getnewcard = '';
                    };
                    init();

                    scope.$watch('handler', function(newValue, oldValue, scope) {
                        $('.bonus-panel').hide();

                        $('.bonus-panel[for="' + newValue + '"]').show();
                    });

                    //获取验证码按钮
                    var ti,msgcode;
                    el.on('click', '.btn-getmsgcode', function() {
                        if(scope.sendcodephone) {
                            var time = 60;
                            var self = $(this);

                            if(!self.hasClass('btn-disable')) {
                                msgcode = createCode();
                                scope.CCS.sendCode({
                                    customerMobile: scope.sendcodephone,
                                    SMSVerCode: msgcode
                                }).success(function(data) {
                                    if(data.code == '000') {
                                        self.html('60秒后重新发送').addClass('btn-disable');

                                        ti = setInterval(function() {
                                            if(time > 0) {
                                                time --;
                                                self.html(time + '秒后重新发送')
                                            }else{
                                                clearInterval(ti);
                                                self.html('获取验证码').removeClass('btn-disable');
                                            }
                                        }, 1000);
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
                        }
                    });

                    var getval = function(type) {
                        switch(scope.handletype[type]) {
                            case 42 : {
                                return scope.getrealcard;
                            }break;

                            case 41 : {
                                return scope.sendcodephone;
                            }break;

                            case 40 : {
                                return scope.getnewcard;
                            }break;

                            default : {
                                return null;
                            }
                        }
                    };

                    var createCode = function() {
                        var str = '0123456789';

                        var code = '';

                        for(var i = 0; i < 5; i ++) {
                            code += str.charAt(Math.floor(Math.random() * 6));
                        }

                        return code;
                    };

                    //点击提交按钮时
                    el.on('click', '.btn-submit-handle', function() {
                        if(!$(this).hasClass('btn-disable')) {
                            var progressbar = AppProgressbar.add('warning', '提交数据...');
                            if(scope.handler == '绑定手机号' && msgcode != scope.msgcode) {
                                AppProgressbar.close(progressbar);
                                scope.AA.add('danger', '验证码错误！');
                            }else {
                                scope.CCS.cardOption({
                                    cardID: scope.user.cardkey,
                                    optionType: scope.handletype[scope.handler],
                                    remark: scope.remark,
                                    newCardNoOrMobile: getval(scope.handler),
                                    oldCardNoOrMobile: getval(scope.handler)
                                }).success(function(data) {
                                    AppProgressbar.close(progressbar);
                                    if(data.code == '000') {
                                        scope.AA.add('success', '操作成功！');
                                        scope.panel_userinfo.hide();
                                        init();
                                    }else{
                                        scope.AA.add('danger', data.msg);
                                    }
                                });
                            }
                        }
                    });
                }
            };
        }
    ]);

    //会员导航栏报表
    app.directive('reporttab', [
        function () {
            return {
                restrict : 'E',
                template : [
                    '<div class="tab tab-report" style="display:none;">',
                        '<div class="form-inline">',
                            '<div class="form-group">',
                                '<input type="radio" value="1" name="reporttype" class="viporderdetail" ng-model="reporttype">会员交易明细',
                                '<input type="radio" value="2" name="reporttype" class="viporderlist" ng-model="reporttype">会员交易汇总',
                                '<div class="input-group input-group-lg date-detail" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control input-lg detaildate form_datetime"  ng-model="detaildate" readonly datepicker-popup="yyyy-MM-dd" placeholder="日期" is-open="op1" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keypress="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 1)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 1)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<div class="input-group input-group-lg date-list" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control input-lg listdatefrom form_datetime"  ng-model="listdatefrom" readonly datepicker-popup="yyyy-MM-dd" placeholder="起始日期" is-open="op2" max-date="today()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keypress="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 2)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 2)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<div class="input-group input-group-lg date-list" style="display:none;">',
                                    '<input style="width:120px;" type="text" class="form-control input-lg listdateto form_datetime"  ng-model="listdateto" readonly datepicker-popup="yyyy-MM-dd" placeholder="截止日期" is-open="op3" max-date="today()" min-date="minday()" datepicker-options="datePickerOptions" close-text="关闭" current-text="今天" clear-text="清空" ng-keypress="queryByReportDate($event, qReportDate)" ng-change="queryByReportDate($event, qReportDate)" ng-click="openDatePicker($event, 3)">',
                                    '<span class="input-group-btn"><button class="btn btn-default" type="button" ng-click="openDatePicker($event, 3)"><span class="glyphicon glyphicon-calendar"></span></button></span>',
                                '</div>',
                                '<button type="button" class="btn btn-default btn-lg btn-query-report">查询</button>',
                            '</div>',
                        '</div>',
                        '<div>',
                            '<div class="panel-report-detail" style="display:none;overflow-x:auto;">',
                                '<table class="table" style="width:1500px;">',
                                    '<thead><th>序</th><th>卡号</th><th>姓名</th><th>手机号</th><th>交易类型</th><th>交易时间</th><th>消费金额</th><th>储值变动</th><th>积分</th></thead>',
                                    '<tr role="presentation" ng-repeat="el in reportlist"><td>{{el.transIDFormat}}</td><td>{{el.cardNo}}</td><td>{{el.customerName}}</td><td>{{el.customerMobile}}</td><td>{{handletype[el.transType]}}</td><td>{{el.transTimeFormat}}</td><td>{{el.cunsumptionAmount}}</td><td>{{el.pointChange}}</td></tr>',
                                '</table>',
                            '</div>',
                            '<textarea class="panel-report-list" style="display:none;width:604px;height:480px;">{{reportprnstr}}',
                            '</textarea>',
                        '</div>',
                    '</div>'
                ].join(''),
                replace : true,
                link : function (scope, el, attr) {

                    //初始值设定
                    var init = function() {
                        scope.reporttype = 1;
                        scope.reportlist = [];
                        scope.reportprnstr = '';
                    };
                    init();

                    //报表类型变化时切换面板
                    scope.$watch('reporttype', function(n, o, s) {
                        el.find('.input-group').hide();
                        if(n == 1) {
                            el.find('.date-detail').show();
                            el.find('.panel-report-detail').show();
                            el.find('.panel-report-list').hide();
                        }else {
                            el.find('.date-list').show();
                            el.find('.panel-report-detail').hide();
                            el.find('.panel-report-list').show();
                        }
                    });

                    scope.$watch('listdatefrom', function(n, o, s) {
                        scope.listdateto = null;
                    });

                    el.on('click', '.btn-query-report', function() {
                        if(scope.reporttype == 1) {
                            scope.reportprnstr = '';

                            scope.CCS.reportDetail({
                                queryDate: IQ.Date.getDateByFormat(scope.detaildate, 'yyyyMMdd')
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.reportlist = data.data;
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }else{
                            scope.reportlist = [];

                            scope.CCS.reportTotal({
                                startDate: IQ.Date.getDateByFormat(scope.listdatefrom, 'yyyyMMdd'),
                                endDate: IQ.Date.getDateByFormat(scope.listdateto, 'yyyyMMdd')
                            }).success(function(data) {
                                if(data.code == '000') {
                                    scope.reportprnstr = data.data.reportPrnStr;
                                }else{
                                    scope.AA.add('danger', data.msg);
                                }
                            });
                        }
                    });
                }
            };
        }
    ]);
});