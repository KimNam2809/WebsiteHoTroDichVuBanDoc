package com.library.website.repository;

import com.library.website.models.TheBanDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TheBanDocRepository extends JpaRepository<TheBanDoc, Long> {
    List<TheBanDoc> findByBanDocMaBanDoc(Long maBanDoc);
    Optional<TheBanDoc> findBySoThe(String soThe);
}
