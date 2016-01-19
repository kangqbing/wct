package org.happy.base.beetl.tagext;

import java.util.LinkedHashMap;

import org.beetl.core.Context;
import org.beetl.core.Tag;
import org.beetl.core.statement.Statement;
import org.beetl.ext.tag.HTMLTagVarBindingWrapper;

/**
 * 封装了带变量绑定的html标签调用的标签
 * 
 * @author joelli
 *
 */
public class HTMLVarBindingTag extends HTMLTagVarBindingWrapper {

	Tag tag = new HTMLTag();

	@Override
	public void render() {
		tag.render();

	}

	public Object[] bindVars() {
		return null;
	}

	public void mapName2Index(LinkedHashMap<String, Integer> map) {
		((HTMLTag) tag).setBinds(map);
	}

	public void init(Context ctx, Object[] args, Statement st) {
		tag.init(ctx, args, st);

	}

}
