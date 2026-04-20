package vn.tourista.service;

import vn.tourista.dto.request.FavoriteUpsertRequest;
import vn.tourista.dto.response.FavoriteItemResponse;

import java.util.List;

public interface FavoriteService {
    List<FavoriteItemResponse> getMyFavorites(String email);

    FavoriteItemResponse addFavorite(String email, FavoriteUpsertRequest request);

    void removeFavorite(String email, String targetType, Long targetId);

    boolean isFavorited(String email, String targetType, Long targetId);
}
