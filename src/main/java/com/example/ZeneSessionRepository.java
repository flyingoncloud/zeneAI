package com.example;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ZeneSessionRepository extends JpaRepository<ZeneSession, Long> {
    Optional<ZeneSession> findBySessionId(String sessionId);
}
