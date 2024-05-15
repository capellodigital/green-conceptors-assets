import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

interface Image {
  alt: string;
  source: string;
}

interface ImageRequest {
  directories: string[];
  images: Image[];
  base: string[];
  formats: string[];
}
interface Payload {
  cdn: string;
  image: Image;
  directories: string[];
  formats: string[];
}
interface ProcessedImage {
  alt: string;
  small: string;
  original: string;
}

// https://cdn.statically.io/gh/:user/:repo/:tag/:file
// capellodigital/green-conceptors-assets/main

export const ImageGenerator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { directories, images, formats, base } = req.body as ImageRequest;
    const BASE_CDN_URL = [...base, ...directories];
    const processedImages: ProcessedImage[] = [];
    for (const image of images) {
      const result = await processImage({
        cdn: BASE_CDN_URL.join('/'),
        image,
        directories,
        formats,
      });
      processedImages.push(result);
    }
    res.status(200).json(processedImages.slice().flat());
  } catch (error) {
    next(error);
  }
};

async function createDirectories(directories: string[]): Promise<void> {
  try {
    const rootDirectory = path.join(__dirname, '..', '..', ...directories);

    if (!fs.existsSync(rootDirectory)) {
      fs.mkdirSync(rootDirectory, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

async function processImage({
  cdn,
  image,
  directories,
  formats,
}: Payload): Promise<ProcessedImage[]> {
  try {
    await createDirectories(directories);
    // Create directory for the image
    const rootDirectory = path.join(__dirname, '..', '..', ...directories);
    const imageDirectory = rootDirectory;
    const response = await axios.get(image.source, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    // Save original image
    fs.writeFileSync(
      path.join(imageDirectory, `${image.alt}.jpg`),
      imageBuffer
    );
    const convertedImages: ProcessedImage[] = [];

    for (const format of formats) {
      await sharp(imageBuffer)
        // @ts-expect-error
        .toFormat(format as sharp.FormatEnum) // Convert to desired format
        .toFile(path.join(imageDirectory, `${image.alt}.${format}`));

      convertedImages.push({
        alt: image.alt,
        small: cdn + `/${image.alt}.${format}`,
        original: cdn + `/${image.alt}.${format}`,
      });
    }

    return convertedImages;
  } catch (error) {
    return error;
  }
}
