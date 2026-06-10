package com.library.website.repository;

import com.library.website.models.DatChoNgoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DatChoNgoiRepository extends JpaRepository<DatChoNgoi, Long> {
    List<DatChoNgoi> findByBanDocMaBanDoc(Long maBanDoc);
}
