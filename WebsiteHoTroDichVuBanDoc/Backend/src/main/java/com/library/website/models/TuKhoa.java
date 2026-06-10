package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tukhoa", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TuKhoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "matukhoa")
    private Long maTuKhoa;

    @Column(name = "tentukhoa", nullable = false)
    private String tenTuKhoa;

    @Column(name = "matukhoacha")
    private Long maTuKhoaCha;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
