package vn.tourista.service;

import vn.tourista.dto.request.CsvHotelRow;
import vn.tourista.dto.request.HotelImportRequest;
import vn.tourista.dto.response.HotelImportPreviewResponse;
import vn.tourista.dto.response.HotelImportResultResponse;

import java.util.List;

public interface HotelImportService {

    List<CsvHotelRow> parseCsv(String csvContent);

    HotelImportPreviewResponse previewImport(HotelImportRequest request);

    HotelImportResultResponse executeImport(HotelImportRequest request);

    String cleanString(String input);

    String generateSlug(String name);
}
