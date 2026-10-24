package com.neuralproof.repository;

import com.neuralproof.domain.ClaimReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ClaimReviewRepository extends JpaRepository<ClaimReview, UUID> {
}
