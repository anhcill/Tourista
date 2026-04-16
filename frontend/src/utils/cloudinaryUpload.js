const getCloudName = () => {
  const value = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!value || !String(value).trim()) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  }
  return String(value).trim();
};

const signUpload = async ({
  resourceType = "auto",
  folder,
  publicId,
  context,
} = {}) => {
  const response = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resourceType,
      folder,
      publicId,
      context,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.message || "Cannot sign Cloudinary upload.");
  }

  return payload.data;
};

const uploadOneFile = async (file, options = {}) => {
  if (!(file instanceof File)) {
    throw new Error("Invalid file for Cloudinary upload.");
  }

  const signed = await signUpload(options);
  const cloudName = signed.cloudName || getCloudName();
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${signed.resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  if (options?.publicId) {
    formData.append("public_id", String(options.publicId));
  }
  if (options?.context) {
    formData.append("context", String(options.context));
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || "Cloudinary upload failed.");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    resourceType: payload.resource_type,
    bytes: payload.bytes,
    format: payload.format,
    width: payload.width,
    height: payload.height,
    duration: payload.duration,
  };
};

export const uploadFilesToCloudinary = async (files, options = {}) => {
  const input = Array.isArray(files) ? files : Array.from(files || []);
  if (input.length === 0) {
    return [];
  }

  const uploads = [];
  for (const file of input) {
    const uploaded = await uploadOneFile(file, options);
    uploads.push(uploaded);
  }

  return uploads;
};

export const uploadReviewMediaToCloudinary = async (files) => {
  const folder =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || "tourista/reviews";
  const media = await uploadFilesToCloudinary(files, {
    resourceType: "auto",
    folder,
  });
  return media.map((item) => item.url);
};
