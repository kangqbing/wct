package org.happy.base.shiro.realm;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAccount;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;

public class WxRealm extends AuthorizingRealm {
	
	protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
		WxToken cst = (WxToken)token;
        return new SimpleAccount(cst.getUsername(), cst.getUsername(), getName());
	}
	
	public WxRealm() {
		setAuthenticationTokenClass(WxToken.class);
	}
	
	/**
	 * 覆盖父类的验证,直接pass
	 */
	protected void assertCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) throws AuthenticationException {
	}

	@Override
	protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
		SimpleAccount account = new SimpleAccount(principals.getPrimaryPrincipal(),principals.getPrimaryPrincipal(), getName());
		return account;
	}

}
