import { NextResponse } from "next/server";
import {
  getCloudinaryPublicConfig,
  signCloudinaryUploadParams,
} from "@/lib/cloudinaryServer";

export const runtime = "nodejs";

const ALLOWED_RESOURCE_TYPES = new Set(["auto", "image", "video", "raw"]);

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const publicConfig = getCloudinaryPublicConfig();

    const requestedResourceType = String(
      body?.resourceType || "auto",
    ).toLowerCase();
    const resourceType = ALLOWED_RESOURCE_TYPES.has(requestedResourceType)
      ? requestedResourceType
      : "auto";

    const folder = String(
      body?.folder || publicConfig.defaultFolder || "tourista/reviews",
    ).trim();
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      folder,
    };

    if (body?.publicId && String(body.publicId).trim()) {
      paramsToSign.public_id = String(body.publicId).trim();
    }

    if (body?.context && typeof body.context === "string") {
      paramsToSign.context = body.context;
    }

    const signature = signCloudinaryUploadParams(paramsToSign);

    return NextResponse.json({
      success: true,
      data: {
        cloudName: publicConfig.cloudName,
        apiKey: publicConfig.apiKey,
        folder,
        resourceType,
        timestamp,
        signature,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Cannot create Cloudinary signature.",
      },
      { status: 500 },
    );
  }
}
