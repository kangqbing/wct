package org.happy;

import java.nio.charset.Charset;

import org.happy.base.service.socketio.SocketioService;
import org.happy.base.service.syslog.SysLogService;
import org.nutz.dao.Dao;
import org.nutz.dao.entity.annotation.Table;
import org.nutz.dao.util.Daos;
import org.nutz.integration.shiro.NutShiro;
import org.nutz.integration.zbus.ZBusFactory;
import org.nutz.ioc.Ioc;
import org.nutz.ioc.impl.PropertiesProxy;
import org.nutz.lang.Encoding;
import org.nutz.lang.Mirror;
import org.nutz.log.Log;
import org.nutz.log.Logs;
import org.nutz.mvc.Mvcs;
import org.nutz.mvc.NutConfig;
import org.nutz.mvc.Setup;
import org.nutz.plugins.cache.dao.CachedNutDaoExecutor;
import org.nutz.resource.Scans;
import org.quartz.Scheduler;
import org.zbus.mq.server.MqServer;

import io.netty.util.internal.logging.InternalLoggerFactory;
import io.netty.util.internal.logging.Log4JLoggerFactory;
import net.sf.ehcache.CacheManager;

/**
 * Nutz内核初始化完成后的操作
 * 
 * @author wendal
 *
 */
public class MainSetup implements Setup {

	private static final Log log = Logs.get();

	public void init(NutConfig nc) {
		NutShiro.DefaultLoginURL = "/admin/login";

		// netty的东西,强制让它使用log4j记录日志. 因为环境中存在slf4j,它会自动选用,导致log4j配置日志级别失效
		InternalLoggerFactory.setDefaultFactory(new Log4JLoggerFactory());
		// 获取Ioc容器及Dao对象
		Ioc ioc = nc.getIoc();
		Dao dao = ioc.get(Dao.class);

		// 为全部标注了@Table的bean建表
		Daos.createTablesInPackage(dao, "org.happy", false);
		// 修正表结构
		for (Class<?> klass : Scans.me().scanPackage("org.happy")) {
			if (klass.getAnnotation(Table.class) != null)
				Daos.migration(dao, klass, true, false);
		}

		// 获取配置对象
		PropertiesProxy conf = ioc.get(PropertiesProxy.class, "conf");

		// 启动zbus######################
		// 启动内置zbus服务器
		if (conf.getBoolean("zbus.server.embed.enable", true)) {
			ioc.get(MqServer.class);
		}
		// 启动 生产者/消费者
		ioc.get(ZBusFactory.class, "zbus");
		// END zbus ######################

		// 初始化SysLog,触发全局系统日志初始化
		ioc.get(SysLogService.class);

		// 检查一下Ehcache CacheManager 是否正常.
		CacheManager cacheManager = ioc.get(CacheManager.class);
		log.debug("Ehcache CacheManager = " + cacheManager);
		CachedNutDaoExecutor.DEBUG = true;
		// 启用FastClass执行入口方法
		Mvcs.disableFastClassInvoker = true;
		// 测试一下能不能拿到原生连接对象
		// 启动socketio相关的服务
		if (conf.getBoolean("socketio.enable", false)) {
			ioc.get(SocketioService.class);
		}

	}

	public void destroy(NutConfig conf) {
		// 非mysql数据库,或多webapp共享mysql驱动的话,以下语句删掉
		try {
			Mirror.me(Class.forName("com.mysql.jdbc.AbandonedConnectionCleanupThread")).invoke(null, "shutdown");
		} catch (Throwable e) {
		}
		// 解决quartz有时候无法停止的问题
		try {
			conf.getIoc().get(Scheduler.class).shutdown(true);
		} catch (Exception e) {
		}
	}
}
