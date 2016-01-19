package org.happy.base.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Date;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.subject.Subject;
import org.nutz.integration.shiro.NutShiro;
import org.nutz.ioc.Ioc;
import org.nutz.ioc.impl.PropertiesProxy;
import org.nutz.lang.Lang;
import org.nutz.lang.Strings;
import org.nutz.lang.random.R;
import org.nutz.lang.util.NutMap;
import org.nutz.log.Log;
import org.nutz.log.Logs;
import org.nutz.mvc.Mvcs;


public class Toolkit {

	public static final Log log = Logs.get();

	public static String captcha_attr = "nutz_captcha";

	public static boolean checkCaptcha(String expected, String actual) {
		if (expected == null || actual == null || actual.length() == 0
				|| actual.length() > 24)
			return false;
		return actual.equalsIgnoreCase(expected);
	}

	public static String passwordEncode(String password, String slat) {
		String str = slat + password + slat + password.substring(4);
		return Lang.digest("SHA-512", str);
	}

	private static final String Iv = "\0\0\0\0\0\0\0\0";
	private static final String Transformation = "DESede/CBC/PKCS5Padding";

	public static String _3DES_encode(byte[] key, byte[] data) {
		SecretKey deskey = new SecretKeySpec(key, "DESede");
		IvParameterSpec iv = new IvParameterSpec(Iv.getBytes());
		try {
			Cipher c1 = Cipher.getInstance(Transformation);
			c1.init(Cipher.ENCRYPT_MODE, deskey, iv);
			byte[] re = c1.doFinal(data);
			return Lang.fixedHexString(re);
		} catch (Exception e) {
			log.info("3DES FAIL?", e);
			e.printStackTrace();
		}
		return null;
	}

	public static String _3DES_decode(byte[] key, byte[] data) {
		SecretKey deskey = new SecretKeySpec(key, "DESede");
		IvParameterSpec iv = new IvParameterSpec(Iv.getBytes());
		try {
			Cipher c1 = Cipher.getInstance(Transformation);
			c1.init(Cipher.DECRYPT_MODE, deskey, iv);
			byte[] re = c1.doFinal(data);
			return new String(re);
		} catch (Exception e) {
			log.debug("BAD 3DES decode", e);
		}
		return null;
	}

	public static NutMap kv2map(String kv) {
		NutMap re = new NutMap();
		if (kv == null || kv.length() == 0 || !kv.contains("="))
			return re;
		String[] tmps = kv.split(",");
		for (String tmp : tmps) {
			if (!tmp.contains("="))
				continue;
			String[] tmps2 = tmp.split("=", 2);
			re.put(tmps2[0], tmps2[1]);
		}
		return re;
	}



	public static byte[] hexstr2bytearray(String str) {
		byte[] re = new byte[str.length() / 2];
		for (int i = 0; i < re.length; i++) {
			int r = Integer.parseInt(str.substring(i * 2, i * 2 + 2), 16);
			re[i] = (byte) r;
		}
		return re;
	}



	public static String ip() {
		HttpServletRequest request = Mvcs.getReq();
		if (request == null) {
			return "";
		}
		String ip = request.getHeader("x-forwarded-for");
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getHeader("WL-Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
			ip = request.getRemoteAddr();
		}
		if (ip == null)
			ip = "";
		return ip;
	}
	
	public static String createAt(Date date) {
		if (date == null)
			return "未知";
		long now = System.currentTimeMillis() / 1000;
		long t = date.getTime() / 1000;
		long diff = now - t;
		if (diff < 5) {
			return "刚刚";
		}
		if (diff < 60) {
			return diff+"秒前";
		}
		if (diff < 60*60) {
			return (diff/60)+"分钟前";
		}
		if (diff < 24*60*60) {
			return (diff/60/60)+"小时";
		}
		return (diff/24/60/60)+"天前";
	}
	
	public static void doLogin(AuthenticationToken token, int userId) {
		Subject subject = SecurityUtils.getSubject();
		if (token != null)
			subject.login(token);
		subject.getSession().setAttribute(NutShiro.SessionKey, userId);
	}
	
	public static String filteContent(String cnt) {
		if (cnt != null)
			try {
				Reader r = new StringReader(cnt);
				BufferedReader br = new BufferedReader(r);
				StringWriter sw = new StringWriter();
				boolean isCode = false;
				String  prevLine = "";
				while (br.ready()) {
					String line = br.readLine();
					if (line == null)
						break;
					if ("``".equals(line.trim()) && !isCode) {
						line = "```";
					}
					if ("```".equals(line.trim())) {
						if (isCode) {
							isCode = false;
						} else {
							isCode = true;
							if (prevLine != null && !prevLine.trim().isEmpty()) {
								sw.append("\r\n");
							}
						}
					}
					sw.append(line);
					sw.append("\r\n");
					prevLine = line;
				}
				return sw.toString();
			} catch (IOException e) {
				e.printStackTrace();// 不可能吧
			}
		return cnt;
	}
	
	/**
	 * 模板引擎共用的变量
	 */
	
	public static NutMap getTemplateShareVars() {
		NutMap share = new NutMap();
		Ioc ioc = Mvcs.getIoc();
		share.put("ioc", ioc);
		PropertiesProxy conf = ioc.get(PropertiesProxy.class, "conf");
		share.put("conf", conf.toMap());

		if (!conf.getBoolean("cdn.enable", false) || Strings.isBlank(conf.get("cdn.urlbase"))) {
			share.put("cdnbase", "");
		} else {
			share.put("cdnbase", conf.get("cdn.urlbase"));
		}
		return share;
	}

	public static int uid() {
		int uid = 0;
		Object u;
		try {
			u = SecurityUtils.getSubject().getPrincipal();
		} catch (Throwable e) {
			return -1;
		}
		if (u != null) {
			 if (u instanceof Number) {
				uid = ((Number) u).intValue();
			}
		}
		return uid;
	}
}