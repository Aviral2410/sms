package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forum_answer", schema = "schoolops")
public class ForumAnswerEntity {
    @Id
    @Column(name = "answer_id", nullable = false, updatable = false)
    private UUID answerId;
    @Column(name = "question_id", nullable = false)
    private UUID questionId;
    @Column(name = "author_id", nullable = false)
    private UUID authorId;
    @Column(name = "author_name", nullable = false)
    private String authorName;
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;
    @Column(name = "upvotes", nullable = false)
    private Integer upvotes = 0;
    @Column(name = "status", nullable = false)
    private String status; // APPROVED, BLOCKED, FLAGGED
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getAnswerId() { return answerId; }
    public void setAnswerId(UUID answerId) { this.answerId = answerId; }
    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    public Integer getUpvotes() { return upvotes; }
    public void setUpvotes(Integer upvotes) { this.upvotes = upvotes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
