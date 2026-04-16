import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return String(value).trim();
};

const configureCloudinary = () => {
  if (isConfigured) {
    return;
  }

  cloudinary.config({
    cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
    api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });

  isConfigured = true;
};

export const getCloudinaryPublicConfig = () => ({
  cloudName: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  apiKey: getRequiredEnv("CLOUDINARY_API_KEY"),
  defaultFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || "tourista/reviews",
});

export const signCloudinaryUploadParams = (paramsToSign) => {
  configureCloudinary();
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
};
