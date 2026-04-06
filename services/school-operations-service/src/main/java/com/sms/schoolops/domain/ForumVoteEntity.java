package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "forum_vote", schema = "schoolops")
public class ForumVoteEntity {
    @Id
    @Column(name = "vote_id", nullable = false, updatable = false)
    private UUID voteId;
    @Column(name = "target_id", nullable = false)
    private UUID targetId; // Question or Answer ID
    @Column(name = "voter_id", nullable = false)
    private UUID voterId;
    @Column(name = "vote_type", nullable = false)
    private Integer voteType; // 1 for UPVOTE, -1 for DOWNVOTE

    public UUID getVoteId() { return voteId; }
    public void setVoteId(UUID voteId) { this.voteId = voteId; }
    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }
    public UUID getVoterId() { return voterId; }
    public void setVoterId(UUID voterId) { this.voterId = voterId; }
    public Integer getVoteType() { return voteType; }
    public void setVoteType(Integer voteType) { this.voteType = voteType; }
}
