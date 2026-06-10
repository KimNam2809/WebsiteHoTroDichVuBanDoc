package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tinhthanhpho", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TinhThanhPho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "matinhthanhpho")
    private Long maTinhThanhPho;

    @Column(name = "tentinhthanhpho", unique = true, nullable = false)
    private String tenTinhThanhPho;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
