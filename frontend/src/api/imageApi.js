import axiosClient from './axiosClient';

const imageApi = {
  /**
   * Upload a single image file.
   * @param {File} file - The image file to upload
   * @returns {Promise<{ url: string, publicId: string, format: string, width: number, height: number }>}
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post('/admin/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const result = response?.data || response;
    return {
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  },

  /**
   * Upload multiple image files at once.
   * @param {File[]} files - Array of image files (max 10)
   * @returns {Promise<{ uploaded: Array, failed: Array, totalUploaded: number }>}
   */
  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await axiosClient.post('/admin/images/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response?.data || response;
  },

  /**
   * Delete an image from Cloudinary.
   * @param {string} publicId - The Cloudinary public ID
   */
  deleteImage: async (publicId) => {
    const response = await axiosClient.delete(`/admin/images/${encodeURIComponent(publicId)}`);
    return response?.data || response;
  },
};

export default imageApi;
