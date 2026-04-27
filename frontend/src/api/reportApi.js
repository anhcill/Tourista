import axiosClient from './axiosClient';

const reportApi = {
    /** Gui bao cao/khieu nai */
    createReport: (data) =>
        axiosClient.post('/reports', data),

    /** Lay danh sach bao cao (admin) */
    getReports: (page = 0, size = 20, status) =>
        axiosClient.get('/admin/reports', {
            params: { page, size, ...(status && { status }) },
        }),

    /** Lay chi tiet 1 bao cao (admin) */
    getReport: (id) =>
        axiosClient.get(`/admin/reports/${id}`),

    /** Cap nhat trang thai bao cao (admin) */
    updateReportStatus: (id, data) =>
        axiosClient.patch(`/admin/reports/${id}`, data),
};

export default reportApi;
