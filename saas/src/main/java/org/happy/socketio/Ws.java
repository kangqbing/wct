package org.happy.socketio;

import org.happy.base.annotation.SocketIO;
import org.nutz.ioc.loader.annotation.IocBean;
import org.nutz.lang.random.R;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.annotation.OnEvent;

@SocketIO(name = "/ding")
@IocBean
public class Ws {
	
	@OnEvent("send")
    public void send(SocketIOClient client, Object data, AckRequest ackRequest) {
    	String name = R.UU32(client.getSessionId());
    	System.out.println(client.getSessionId());
//    	client.sendEvent("rev", new NutMap()
//    			.setv("msgType", "HLL_SAAS_MSG_REV_NEW_ORDER")
//    			.setv("msgEvent", "kkkk")
//    			.setv("msgData", new NutMap().setv("newOrderCount", 6))
//    			);
 }

}
