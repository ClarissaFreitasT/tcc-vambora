import cloudinaryPackage from "cloudinary";
import { randomUUID } from "node:crypto";

const cloudinary = cloudinaryPackage.v2;
const MAX_PUBLIC_URL_LENGTH = 255;
const MANAGED_PREFIXES = ["profiles/", "community/", "routes/"];
const IMAGE_EXTENSIONS = new Set(["jpg", "png", "webp"]);

export function readStorageConfig(env = process.env) {
  const values = {
    cloudName: env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: env.CLOUDINARY_API_KEY || "",
    apiSecret: env.CLOUDINARY_API_SECRET || "",
  };
  const enabled = Object.values(values).every(Boolean);
  return {
    ...values,
    enabled,
    publicBaseUrl: values.cloudName
      ? `https://res.cloudinary.com/${values.cloudName}/image/upload`
      : "",
  };
}

const config = readStorageConfig();
if (config.enabled) {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
}

export function storageIsConfigured() {
  return config.enabled;
}

export function storageConfig() {
  return {
    cloudName: config.cloudName,
    enabled: config.enabled,
    publicBaseUrl: config.publicBaseUrl,
  };
}

export function managedObjectKey(prefix, extension) {
  if (!MANAGED_PREFIXES.includes(prefix)) {
    throw new Error("Prefixo de imagem inválido");
  }
  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Formato de imagem inválido");
  }
  return `${prefix}${randomUUID()}.${extension}`;
}

export function buildPublicImageUrl(key, publicBaseUrl = config.publicBaseUrl) {
  const url = `${publicBaseUrl}/${key}`;
  if (url.length > MAX_PUBLIC_URL_LENGTH) {
    const error = new Error(
      `A URL da imagem excede o limite de ${MAX_PUBLIC_URL_LENGTH} caracteres.`,
    );
    error.status = 400;
    throw error;
  }
  return url;
}

export function isManagedImageUrl(value, publicBaseUrl = config.publicBaseUrl) {
  if (
    typeof value !== "string" ||
    !publicBaseUrl ||
    !value.startsWith(`${publicBaseUrl}/`)
  ) {
    return false;
  }
  const key = value.slice(publicBaseUrl.length + 1);
  const [prefix] = MANAGED_PREFIXES.filter((candidate) =>
    key.startsWith(candidate),
  );
  if (!prefix || key.includes("..")) return false;
  const filename = key.slice(prefix.length);
  return /^[\da-f-]+\.(?:jpg|png|webp)$/i.test(filename);
}

export function imageKeyFromManagedUrl(
  value,
  publicBaseUrl = config.publicBaseUrl,
) {
  return isManagedImageUrl(value, publicBaseUrl)
    ? value.slice(publicBaseUrl.length + 1)
    : null;
}

export function assertStorageConfigured() {
  if (!config.enabled) {
    const error = new Error("O armazenamento de imagens não está configurado.");
    error.status = 503;
    throw error;
  }
}

function uploadBuffer(publicId, body, contentType) {
  return new Promise((resolve, reject) => {
    const extension = contentType.split("/")[1].replace("jpeg", "jpg");
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        unique_filename: false,
        format: extension,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.public_id) {
          return reject(
            new Error("O Cloudinary não confirmou o upload da imagem."),
          );
        }
        resolve(result);
      },
    );
    stream.end(body);
  });
}

export async function uploadImage({ key, body, contentType }) {
  assertStorageConfigured();
  const extension = key.split(".").at(-1)?.toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) {
    const error = new Error("Formato de imagem inválido.");
    error.status = 400;
    throw error;
  }
  const publicUrl = buildPublicImageUrl(key);
  const publicId = key.slice(0, -(extension.length + 1));
  await uploadBuffer(publicId, body, contentType);
  return publicUrl;
}

export async function deleteManagedImage(value) {
  const key = imageKeyFromManagedUrl(value);
  if (!key) return false;
  assertStorageConfigured();
  const extension = key.split(".").at(-1);
  const publicId = key.slice(0, -(extension.length + 1));
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "upload",
    invalidate: true,
  });
  return result?.result === "ok" || result?.result === "not found";
}

export { MAX_PUBLIC_URL_LENGTH, MANAGED_PREFIXES };
