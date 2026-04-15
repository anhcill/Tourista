package vn.tourista.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPageResponse<T> {

    @Builder.Default
    private List<T> items = new ArrayList<>();

    // Page theo convention FE: bắt đầu từ 1
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public long getTotal() {
        return totalElements;
    }
}