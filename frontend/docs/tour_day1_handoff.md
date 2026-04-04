# Tour Day 1 Handoff

## Done

- Finalized API contract for tours + tour booking.
- Added OpenAPI format for FE/BE alignment.
- Added mock payloads for success, empty, validation error, and business error.

## Artifacts

- docs/tour_api_contract_day1.md
- docs/tour_api_openapi_day1.yaml
- mocks/tours/tours-search-success.json
- mocks/tours/tours-search-empty.json
- mocks/tours/tour-detail-success.json
- mocks/tours/tour-booking-create-success.json
- mocks/tours/tour-booking-validation-error.json
- mocks/tours/tour-booking-no-slot-error.json
- mocks/tours/requests/tour-search-query.example.txt
- mocks/tours/requests/tour-booking-create.request.json

## Locked decisions

- Wrapper format follows ApiResponse<T> currently used by backend.
- Booking endpoint for tour uses dedicated route: POST /api/bookings/tours.
- Date format is yyyy-MM-dd.
- Currency is VND.

## Ready for Day 2

- Backend starts with DTO + controller/service for /api/tours and /api/bookings/tours.
- Frontend can start static integration against mock JSON while waiting backend implementation.
