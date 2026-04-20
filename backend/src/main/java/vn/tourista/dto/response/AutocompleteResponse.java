package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutocompleteResponse {

    private String value;
    private String type;
    private Long id;
    private String slug;
    private String detail;
}
