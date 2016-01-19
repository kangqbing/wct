package org.happy.saas;

import javax.servlet.http.HttpServletResponse;

import org.nutz.ioc.loader.annotation.IocBean;
import org.nutz.lang.util.NutMap;
import org.nutz.mvc.annotation.At;
import org.nutz.mvc.annotation.Ok;

@IocBean
public class Saas {

	@At("/base/getShopInfo")
	@Ok("jsonp")
	public Object getShopInfo(HttpServletResponse resp) {
		return new NutMap().setv("code", "CS001");
	}

}
