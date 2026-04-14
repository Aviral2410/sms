package com.sms.schoolops.api;

import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.service.AcademicsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/school-ops/exams")
public class AcademicsController {

    private final AcademicsService academicsService;

    public AcademicsController(AcademicsService academicsService) {
        this.academicsService = academicsService;
    }

    @GetMapping
    public List<ExamResponse> listExams(@RequestParam UUID schoolId) {
        return academicsService.listExams(schoolId);
    }

    @PostMapping
    public ExamResponse createExam(
            @Valid @RequestBody ExamCreateRequest request,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId
    ) {
        return academicsService.createExam(request, userId);
    }

    @PostMapping("/{examId}/publish")
    public ExamResponse publishExam(
            @PathVariable UUID examId,
            @RequestParam UUID schoolId
    ) {
        return academicsService.publishExam(schoolId, examId);
    }

    @GetMapping("/{examId}/schedule")
    public List<ExamScheduleItemResponse> listSchedule(
            @PathVariable UUID examId,
            @RequestParam UUID schoolId
    ) {
        return academicsService.listSchedule(schoolId, examId);
    }

    @PostMapping("/{examId}/schedule")
    public ExamScheduleItemResponse addScheduleItem(
            @PathVariable UUID examId,
            @Valid @RequestBody ExamScheduleItemCreateRequest request
    ) {
        return academicsService.addScheduleItem(examId, request);
    }

    @PostMapping("/{examId}/marks")
    public ExamMarkResponse upsertMark(
            @PathVariable UUID examId,
            @Valid @RequestBody ExamMarkUpsertRequest request,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId
    ) {
        return academicsService.upsertMark(examId, request, userId);
    }

    @GetMapping("/{examId}/report-cards/student/{studentUserId}")
    public StudentReportCardResponse getStudentReportCard(
            @PathVariable UUID examId,
            @PathVariable UUID studentUserId,
            @RequestParam UUID schoolId
    ) {
        return academicsService.getStudentReportCard(schoolId, examId, studentUserId);
    }
}

