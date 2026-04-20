package com.sms.aiinteraction.config;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Aspect
@Component
@Slf4j
public class LlmLoggingAspect {

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

        if (result instanceof Optional<?> opt) {
            if (opt.isPresent()) {
                ToolCall call = (ToolCall) opt.get();
                log.info("[LLM-RESULT] Engine: {} | Took: {}ms | Tool Selected: {} | Source: {}", 
                        engineName, duration, call.tool(), call.source());
            } else {
                log.debug("[LLM-RESULT] Engine: {} | Took: {}ms | No tool selected", 
                        engineName, duration);
            }
        }

        return result;
    }
}
