package org.happy.base.beetl.fn;

import org.beetl.core.Context;
import org.beetl.core.Function;

public class Bool implements Function {

	
	@Override
	public Object call(Object[] paras, Context ctx) {
		Object o = paras[0];
		return Boolean.parseBoolean((String)o);
	}

}
