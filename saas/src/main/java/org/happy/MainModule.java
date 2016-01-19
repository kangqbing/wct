package org.happy;

import org.beetl.ext.nutz.BeetlViewMaker;
import org.nutz.integration.shiro.ShiroSessionProvider;
import org.nutz.mvc.annotation.ChainBy;
import org.nutz.mvc.annotation.Fail;
import org.nutz.mvc.annotation.IocBy;
import org.nutz.mvc.annotation.Localization;
import org.nutz.mvc.annotation.Modules;
import org.nutz.mvc.annotation.Ok;
import org.nutz.mvc.annotation.SessionBy;
import org.nutz.mvc.annotation.SetupBy;
import org.nutz.mvc.annotation.Views;
import org.nutz.mvc.ioc.provider.ComboIocProvider;
import org.nutz.plugins.view.freemarker.FreemarkerViewMaker;

@SetupBy(value=MainSetup.class)
@IocBy(type=ComboIocProvider.class, args={"*js", "ioc/",
										   "*anno", "org.happy",
										   "*tx",
										   "*org.nutz.integration.quartz.QuartzIocLoader",// 关联Quartz
										   "*org.nutz.integration.zbus.ZBusIocLoader", "org.happy"
										   })
@Modules(scanPackage=true)
@ChainBy(args="mvc/happy-mvc-chain.js")
@Ok("json:full")
@Fail("jsp:jsp.500")
@Localization(value="msg/", defaultLocalizationKey="zh-CN")
@Views({BeetlViewMaker.class,FreemarkerViewMaker.class})
@SessionBy(ShiroSessionProvider.class)
public class MainModule {
}
