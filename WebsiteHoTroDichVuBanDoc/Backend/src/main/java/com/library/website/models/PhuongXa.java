package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phuongxa", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhuongXa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maphuongxa")
    private Long maPhuongXa;

    @Column(name = "tenphuongxa", unique = true, nullable = false)
    private String tenPhuongXa;

    @ManyToOne
    @JoinColumn(name = "matinhthanhpho")
    private TinhThanhPho tinhThanhPho;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
