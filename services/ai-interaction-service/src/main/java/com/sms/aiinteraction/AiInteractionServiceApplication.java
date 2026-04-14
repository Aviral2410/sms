package com.sms.aiinteraction;

import com.sms.common.exception.CommonExceptionHandlerConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonExceptionHandlerConfig.class)
public class AiInteractionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiInteractionServiceApplication.class, args);
    }
}
