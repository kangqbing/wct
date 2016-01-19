package org.happy.base.beetl.tagext;

import java.util.ArrayList;
import java.util.List;

public class TagNestContext {
	private HTMLTag tag = null;
	private HTMLTag parent = null;
	private List<HTMLTag> children = null;

	public HTMLTag getTag() {
		return tag;
	}

	public void setTag(HTMLTag para) {
		this.tag = para;
	}

	public HTMLTag getParent() {
		return parent;
	}

	public void setParent(HTMLTag parent) {
		this.parent = parent;
	}

	public List<HTMLTag> getChildren() {
		if (children == null)
			children = new ArrayList<HTMLTag>();
		return children;
	}

	public void setChildren(List<HTMLTag> children) {
		this.children = children;
	}

}
