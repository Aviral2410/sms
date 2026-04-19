package com.sms.common.exception;

import com.sms.common.logging.LoggingAspect;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import({CommonExceptionHandler.class, LoggingAspect.class})
public class CommonExceptionHandlerConfig {

    @Bean
    public RequestIdFilter requestIdFilter() {
        return new RequestIdFilter();
    }
}
