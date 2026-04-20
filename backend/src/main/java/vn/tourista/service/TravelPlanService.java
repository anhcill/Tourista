package vn.tourista.service;

import vn.tourista.dto.request.TravelPlanRequest;
import vn.tourista.dto.response.TravelPlanResponse;

public interface TravelPlanService {
    TravelPlanResponse generatePlan(TravelPlanRequest request);
}
