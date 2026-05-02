package vn.tourista.service;

import vn.tourista.dto.request.admin.AdminComboUpsertRequest;
import vn.tourista.dto.response.admin.AdminComboItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;

public interface AdminComboService {

    AdminPageResponse<AdminComboItemResponse> getCombos(
            Integer page,
            Integer size,
            String q,
            String status,
            String type,
            String sort);

    AdminComboItemResponse getComboById(Long comboId);

    AdminComboItemResponse createCombo(AdminComboUpsertRequest request, String actorEmail);

    AdminComboItemResponse updateCombo(Long comboId, AdminComboUpsertRequest request, String actorEmail);

    AdminComboItemResponse updateComboStatus(Long comboId, boolean isActive, String reason, String actorEmail);

    void deleteCombo(Long comboId, String reason, String actorEmail);
}
