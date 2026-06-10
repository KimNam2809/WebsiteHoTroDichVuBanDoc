package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tacpham", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TacPham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "matacpham")
    private Long maTacPham;

    @Column(name = "tentacpham", nullable = false)
    private String tentacpham; // Giữ camelCase/lowercase khớp Pydantic hoặc JPA Column mapping

    @Column(name = "tacgia")
    private String tacgia;

    @Column(name = "mota")
    private String mota;

    @Column(name = "isbn", unique = true)
    private String isbn;

    @Column(name = "namxuatban")
    private Integer namxuatban;

    @Column(name = "ngaytao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "anhbia")
    private String anhbia;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
