package com.sms.aiinteraction.config;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
public class LlmLoggingAspect {
    private static final Logger log = LoggerFactory.getLogger(LlmLoggingAspect.class);

    @Around("execution(* com.sms.aiinteraction.llm.LlmPlanningEngine.plan(..))")
    public Object logLlmPlan(ProceedingJoinPoint joinPoint) throws Throwable {
        String engineName = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        String message = (String) args[0];
        UserContext userContext = (UserContext) args[1];

        log.info("[LLM-PLAN] Engine: {} | User: {} | Message: {}", 
                engineName, userContext.userId(), message);

        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;

        if (result instanceof List<?> calls) {
            if (!calls.isEmpty()) {
                log.info("[LLM-RESULT] Engine: {} | Took: {}ms | Tools Selected: {}", 
                        engineName, duration, calls.size());
                for (Object obj : calls) {
                    if (obj instanceof ToolCall call) {
                        log.info("  -> Tool: {} | Reason: {}", call.toolName(), call.reasoning());
                    }
                }
            } else {
                log.debug("[LLM-RESULT] Engine: {} | Took: {}ms | No tool selected", 
                        engineName, duration);
            }
        }

        return result;
    }
}
