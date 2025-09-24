package com.gianglt.baitaplon.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;
import java.util.List;

@Data
@Getter
@Setter
public class PageDto<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;

    public PageDto() {}

    public PageDto(List<T> content, long totalElements, int totalPages, int size, int number) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.size = size;
        this.number = number;
    }

    public static <T> PageDto<T> from(Page<T> p) {
        return new PageDto<>(
                p.getContent(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.getSize(),
                p.getNumber()
        );
    }
}
