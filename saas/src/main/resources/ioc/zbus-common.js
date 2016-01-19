var ioc = {
		// zbus 服务信息配置
		brokerConfig : {
			type : "org.zbus.broker.BrokerConfig",
			fields:{
				"serverAddress" : {java:"$conf.get('zbus.serverAddr', '127.0.0.1:15555')"}
			}
		},
		broker : {
			type : "org.zbus.broker.SingleBroker",
			args : [{refer:"brokerConfig"}],
			events : {
				depose : "close"
			}
		},
		zbus : {
			type: "org.nutz.integration.zbus.ZBusFactory",
			fields : {
				pkgs : ["org.happy"],
				ioc : {refer:"$ioc"},
				broker : {refer:"broker"}
			},
			events : {
				create : "init",
				depose : "close"
			}
		}
};