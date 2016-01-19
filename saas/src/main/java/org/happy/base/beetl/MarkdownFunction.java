package org.happy.base.beetl;

import org.happy.base.util.Markdowns;

import org.beetl.core.Context;
import org.beetl.core.Function;

public class MarkdownFunction implements Function {
	
	public static String cdnbase;

	public Object call(Object[] paras, Context ctx) {
		 return Markdowns.toHtml(String.valueOf(paras[0]), cdnbase);
	}

}
