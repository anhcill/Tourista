package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

// Bảng roles: ADMIN, USER, HOST
@Entity
@Table(name = "roles")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", columnDefinition = "TINYINT UNSIGNED")
    private Short id;

    // Tên role: ADMIN / USER / HOST
    @Column(name = "name", nullable = false, unique = true, length = 30)
    private String name;

    @Column(name = "description", length = 100)
    private String description;
}
