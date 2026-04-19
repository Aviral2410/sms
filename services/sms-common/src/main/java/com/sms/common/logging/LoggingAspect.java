package com.sms.common.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around("execution(* com.sms..*(..)) && !within(com.sms.common.logging..*) && !within(jakarta.servlet.Filter+)")
    public Object profileAllMethods(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        MethodSignature methodSignature = (MethodSignature) proceedingJoinPoint.getSignature();
        String className = methodSignature.getDeclaringType().getSimpleName();
        String methodName = methodSignature.getName();
        Object[] args = proceedingJoinPoint.getArgs();

        log.info("==> Entering method: {}.{} with arguments: {}", className, methodName, Arrays.toString(args));

        long start = System.currentTimeMillis();
        Object result;
        try {
            result = proceedingJoinPoint.proceed();
        } catch (Throwable e) {
            long executionTime = System.currentTimeMillis() - start;
            log.error("XXX Method {}.{} FAILED after {} ms. Error: {}", className, methodName, executionTime, e.getMessage(), e);
            throw e;
        }

        long executionTime = System.currentTimeMillis() - start;
        log.info("<== Method {}.{} success. Execution time: {} ms", className, methodName, executionTime);

        return result;
    }
}
