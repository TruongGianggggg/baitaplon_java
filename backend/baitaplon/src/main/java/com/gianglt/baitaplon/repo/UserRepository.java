package com.gianglt.baitaplon.repo;

import com.gianglt.baitaplon.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);


    @Query("""
        select u from User u
        where (:q is null or :q = '' 
            or lower(u.email) like lower(concat('%', :q, '%'))
            or lower(coalesce(u.fullName, '')) like lower(concat('%', :q, '%')))
        order by u.createdAt desc
        """)
    List<User> searchAll(@Param("q") String q);

}
