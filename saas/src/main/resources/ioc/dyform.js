var ioc = {
		dynamicFormService : {
			type : "org.happy.base.service.impl.OrmDynamicFormService",
			fields : {
				dao : {refer:"dao"}
			}
		}
};