package vn.tourista.service;

import vn.tourista.dto.request.UserProfileUpdateRequest;
import vn.tourista.dto.response.UserProfileResponse;

public interface UserProfileService {
    UserProfileResponse getCurrentProfile(String email);

    UserProfileResponse updateCurrentProfile(String email, UserProfileUpdateRequest request);
}
