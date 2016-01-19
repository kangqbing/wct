package org.happy.base.beetl.tagext;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.beetl.core.BodyContent;
import org.beetl.core.ByteWriter;
import org.beetl.core.Context;
import org.beetl.core.Template;
import org.beetl.core.io.ByteWriter_Byte;
import org.beetl.core.io.ByteWriter_Char;
import org.beetl.core.statement.Statement;
import org.beetl.ext.tag.HTMLTagSupportWrapper;

/**
 * 支持标签嵌套，默认的render方法总是不做任何事情，除非在代码里调用此标签的tag.execute
 * 
 * @author joelli
 *
 */
public class HTMLTag extends HTMLTagSupportWrapper {

	HTMLTag parent = null;
	List<HTMLTag> children = null;
	LinkedHashMap<String, Integer> binds = null;
	HttpServletRequest request;
	// 0 run ,1 known
	int status = 0;
	private static String VS = "BEETL_VISIT_STATUS";
	private static int RUN = 0;
	private static int VISIT = 1;

	public void render() {

		if (status == RUN) {
			// 渲染逻辑交给beetl脚本
			runTemplateTag();
		} else { // visit
			TagNestContext tnc = (TagNestContext) request.getAttribute("tagContext");
			// 登记一个子标签
			tnc.getChildren().add(this);
			parent = tnc.getParent();
			return;
		}

	}

	public void binds(Object[] arrays) {
		if (binds == null) {
			throw new UnsupportedOperationException();
		}
		Iterator<Integer> it = binds.values().iterator();
		int i = 0;
		while (it.hasNext()) {
			int index = it.next();
			this.ctx.vars[index] = arrays[i++];
		}
	}

	public HTMLTag getParent() {
		return parent;
	}

	public String getBody() {

		return super.getBodyContent().toString();
	}

	public BodyContent getExecute() {
		ByteWriter writer = ctx.byteWriter;
		ByteWriter tempWriter = ctx.byteWriter.getTempWriter(writer);
		ctx.byteWriter = tempWriter;
		runTemplateTag();
		ctx.byteWriter = writer;
		return tempWriter.getTempConent();

	}

	@SuppressWarnings({ "static-access" })
	public List<HTMLTag> getChildren() {
		if (children == null) {
			// 设置visit
			request.setAttribute(VS, this.VISIT);
			TagNestContext tnc = new TagNestContext();
			tnc.setParent(this);
			request.setAttribute("tagContext", tnc);
			visitChild();
			request.removeAttribute(VS);
			children = tnc.getChildren();
		}
		return children;
	}

	public HTMLTag getT(String tagname) {

		System.out.println(tagname);

		for (int i = 0; i < getChildren().size(); i++) {
			if (getChildren().get(i).getTagName().equals(tagname)) {
				return getChildren().get(i);
			}
		}
		return null;
	}

	/**
	 * 标签名
	 * 
	 * @return
	 */
	public String getTagName() {
		return (String) this.args[0];
	}

	public Map<?, ?> getAttrs() {
		try {
			Map<?, ?> map = (Map<?, ?>) this.args[1];
			return map;
		} catch (Exception e) {
			return null;
		}

	}

	public Object get(String attr) {
		try {
			Map<?, ?> map = (Map<?, ?>) this.args[1];
			return map.get(attr);
		} catch (Exception e) {
			return null;
		}
	}

	public void init(Context ctx, Object[] args, Statement st) {
		super.init(ctx, args, st);
		request = (HttpServletRequest) this.ctx.getGlobal("request");
		Object temp = request.getAttribute(VS);
		this.status = temp == null ? 0 : (Integer) temp;

	}

	protected void setBinds(LinkedHashMap<String, Integer> binds) {
		this.binds = binds;
	}

	protected void visitChild() {

		// 执行标签体的所有脚本，但遇到子标签的时候，不再继续执行
		ByteWriter tempWriter = null;
		if (gt.getConf().isDirectByteOutput()) {
			tempWriter = new ByteWriter_Byte(new NoLockEmptyByteArrayOutputStream(), gt.getConf().getCharset(), ctx);
		} else {
			tempWriter = new ByteWriter_Char(new NoLockEmptyStringWriter(), gt.getConf().getCharset(), ctx);

		}
		ByteWriter realWriter = ctx.byteWriter;
		ctx.byteWriter = tempWriter;
		bs.execute(ctx);
		ctx.byteWriter = realWriter;

	}

	protected void runTemplateTag() {
		// 初始化

		String child = (String) args[0];

		String path = getHtmlTagResourceId(child);

		Template t = null;

		t = gt.getTemplate(path, this.ctx.getResourceId());

		t.binding(ctx.globalVar);
		t.dynamic(ctx.objectKeys);
		t.binding("tag", this);

		t.renderTo(ctx.byteWriter);
	}

	public String toString() {
		return this.args[0] + ":" + super.toString();
	}

}
