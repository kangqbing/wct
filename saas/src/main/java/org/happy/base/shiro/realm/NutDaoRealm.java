package org.happy.base.shiro.realm;

import org.happy.base.bean.Permission;
import org.happy.base.bean.Role;
import org.happy.base.bean.User;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.LockedAccountException;
import org.apache.shiro.authc.SimpleAccount;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.authc.credential.CredentialsMatcher;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.cache.CacheManager;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.nutz.dao.Cnd;
import org.nutz.dao.Dao;
import org.nutz.ioc.loader.annotation.Inject;
import org.nutz.ioc.loader.annotation.IocBean;
import org.nutz.mvc.Mvcs;

/**
 * 用NutDao来实现Shiro的Realm
 * <p/>
 * 在Web环境中通过Ioc来获取NutDao
 * 
 * @author wendal<wendal1985@gmail.com>
 *
 */
@IocBean
public class NutDaoRealm extends AuthorizingRealm {

	@Inject
	protected Dao dao;

	protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
		// null usernames are invalid
		if (principals == null) {
			throw new AuthorizationException("PrincipalCollection method argument cannot be null.");
		}
		int userId = (Integer) principals.getPrimaryPrincipal();
		User user = dao().fetch(User.class, userId);
		if (user == null)
			return null;
		if (user.isLocked())
			throw new LockedAccountException("Account [" + user.getName() + "] is locked.");

		SimpleAuthorizationInfo auth = new SimpleAuthorizationInfo();
		user = dao().fetchLinks(user, null);
		if (user.getRoles() != null) {
			dao().fetchLinks(user.getRoles(), null);
			for (Role role : user.getRoles()) {
				auth.addRole(role.getName());
				if (role.getPermissions() != null) {
					for (Permission p : role.getPermissions()) {
						auth.addStringPermission(p.getName());
					}
				}
			}
		}
		if (user.getPermissions() != null) {
			for (Permission p : user.getPermissions()) {
				auth.addStringPermission(p.getName());
			}
		}
		return auth;
	}

	protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
		UsernamePasswordToken upToken = (UsernamePasswordToken) token;

		User user = dao().fetch(User.class, Cnd.where("name", "=", upToken.getUsername()));
		if (user == null)
			return null;
		if (user.isLocked())
			throw new LockedAccountException("Account [" + upToken.getUsername() + "] is locked.");
		SimpleAccount account = new SimpleAccount(user.getId(), user.getPassword(), getName());
		account.setCredentialsSalt(ByteSource.Util.bytes(user.getSalt()));
		return account;
	}

	public NutDaoRealm() {
		this(null, null);
		setAuthenticationTokenClass(UsernamePasswordToken.class);
	}

	public NutDaoRealm(CacheManager cacheManager, CredentialsMatcher matcher) {
		super(cacheManager, matcher);
		// setAuthenticationTokenClass(CaptchaUsernamePasswordToken.class);
		setAuthenticationTokenClass(UsernamePasswordToken.class);
	}

	public NutDaoRealm(CacheManager cacheManager) {
		this(cacheManager, null);
		setAuthenticationTokenClass(UsernamePasswordToken.class);
	}

	public NutDaoRealm(CredentialsMatcher matcher) {
		this(null, matcher);
		setAuthenticationTokenClass(UsernamePasswordToken.class);
	}

	public Dao dao() {
		if (dao == null) {
			dao = Mvcs.ctx().getDefaultIoc().get(Dao.class, "dao");
			return dao;
		}
		return dao;
	}

	public void setDao(Dao dao) {
		this.dao = dao;
	}
}
