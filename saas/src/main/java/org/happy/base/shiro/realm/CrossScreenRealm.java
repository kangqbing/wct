package org.happy.base.shiro.realm;

import org.happy.base.bean.User;
import org.happy.base.crossscreen.CrossScreenUserToken;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAccount;
import org.nutz.lang.Lang;

/**
 * 用NutDao来实现Shiro的Realm
 * <p/> 在Web环境中通过Ioc来获取NutDao
 * @author wendal<wendal1985@gmail.com>
 *
 */
public class CrossScreenRealm extends NutDaoRealm {

	protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
		CrossScreenUserToken cst = (CrossScreenUserToken)token;
		User user = dao().fetch(User.class, cst.getUserId());
		if (user == null || user.isLocked())
			throw Lang.impossible(); // 不可能吧
		cst.setUsername(user.getName());
        return new SimpleAccount(user.getId(), user.getPassword(), getName());
	}
	
	/**
	 * 覆盖父类的验证,直接pass
	 */
	protected void assertCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) throws AuthenticationException {
	}

	public CrossScreenRealm() {
		setAuthenticationTokenClass(CrossScreenUserToken.class);
	}
}
