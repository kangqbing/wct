package org.happy.base.crossscreen;

import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;
import org.nutz.json.Json;
import org.nutz.lang.Strings;
import org.nutz.lang.util.NutMap;
import org.nutz.log.Log;
import org.nutz.log.Logs;
import org.nutz.mvc.Mvcs;

import org.happy.base.bean.SysLog;
import org.happy.base.service.syslog.SysLogService;
import org.happy.base.util.Toolkit;

/**
 * 处理跨屏登陆的入口授权
 * @author wendal
 *
 */
public class CrossScreenAuthentication extends FormAuthenticationFilter {
	
	private static final Log log = Logs.get();
	
	protected long timeout = 60;
	
	protected SysLogService sysLogService;
	
	public boolean onPreHandle(ServletRequest request,ServletResponse response, Object mappedValue) throws Exception {
		HttpServletRequest req = (HttpServletRequest)request;
		HttpServletResponse resp = (HttpServletResponse)response;
		if ("GET".equals(req.getMethod()) && !Strings.isBlank(req.getParameter("token"))) {
			String token = req.getParameter("token");
			try {
				token = Toolkit._3DES_decode(CrossScreen.csKEY, Toolkit.hexstr2bytearray(token));
				NutMap map = Json.fromJson(NutMap.class, token);
				Long t = map.getLong("t", -1);
				if (System.currentTimeMillis() - t > timeout*1000) {
					resp.sendError(403); // TODO 提示token已经过期
					return false;
				}
				Integer uid = (Integer) map.get("uid");
				if (uid != null) {
					// 有登陆用户
					Toolkit.doLogin(new CrossScreenUserToken(uid), uid);
					if (sysLogService == null) {
						try {
							sysLogService = Mvcs.ctx().getDefaultIoc().get(SysLogService.class);
							sysLogService.async(SysLog.c("method", "用户登陆", null, uid, "用户通过跨屏二维码登陆"));
						} catch (Throwable e) {
						}
					}
				}
				resp.sendRedirect(map.getString("url"));
				return false;
			} catch (Exception e) {
				log.debug("bad token?", e);
				resp.sendError(502);
				return false;
			}
		} else {
			resp.sendError(403);
			return false;
		}
	}
	
	public void setTimeout(long timeout) {
		this.timeout = timeout;
	}
}
