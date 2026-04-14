package com.sms.schoolops.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AttendanceAutomationScheduler {

    private final AttendanceManagementService attendanceManagementService;

    public AttendanceAutomationScheduler(AttendanceManagementService attendanceManagementService) {
        this.attendanceManagementService = attendanceManagementService;
    }

    @Scheduled(cron = "${app.attendance.auto-absent-cron:0 */10 * * * *}")
    public void runAutoAbsentSweep() {
        this.attendanceManagementService.runAutoAbsentSweep();
    }

    @Scheduled(cron = "${app.attendance.reminder-cron:0 0 8 * * *}")
    public void runReminderSweep() {
        this.attendanceManagementService.runReminderSweep();
    }
}
