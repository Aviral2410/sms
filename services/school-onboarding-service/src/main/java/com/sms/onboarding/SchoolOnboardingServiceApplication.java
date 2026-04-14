package com.sms.onboarding;

import com.sms.common.exception.CommonExceptionHandlerConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonExceptionHandlerConfig.class)
public class SchoolOnboardingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SchoolOnboardingServiceApplication.class, args);
    }
}
