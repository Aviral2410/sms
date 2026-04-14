package com.sms.schoolops;

import com.sms.common.exception.CommonExceptionHandlerConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@Import(CommonExceptionHandlerConfig.class)
public class SchoolOperationsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SchoolOperationsServiceApplication.class, args);
    }
}
