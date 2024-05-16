import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import map from 'lodash/map';
import { NextFunction, Request, Response } from 'express';

import Json from '../../backup/products-and-services.json';
interface Image {
  key: string;
  name: string;
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
interface ImagePaths {
  cdn: string;
  directories: string[];
}

function generateCDN(base: string[], itemSlug: string): ImagePaths {
  const cdn = [...base, 'products-and-services', itemSlug, 'gallery'].join('/');
  const directories = ['assets', 'products-and-services', itemSlug, 'gallery'];
  return { cdn, directories };
}

export const ImageGenerator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { directories, images, formats, base } = req.body as ImageRequest;
    // const BASE_CDN_URL = [...base, ...directories];
    // const processedImages: ProcessedImage[] = [];

    const converter = async () => {
      const promises$ = map(Json.slice(0, 1), async (item$) => {
        const promises$$ = map(item$.gallery, async (item$$, index) => {
          const { cdn, directories } = generateCDN(base, item$.slug);
          const payload = {
            cdn,
            formats,
            directories,
            image: {
              key: `image-${index + 1}`,
              name: item$$?.name || item$?.title,
              alt: item$$.alt,
              source: item$$?.source,
            },
          };
          const result = await processImage(payload);
          return result;
        });
        const gallery = await Promise.all(promises$$);
        const data = {
          ...item$,
          gallery: gallery.slice().flat(1),
        };
        return data;
      });

      return Promise.all(promises$);
    };

    const convertedImages = await converter();
    console.log(convertedImages);
    res.status(200).json(convertedImages);
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
    const { key } = image;
    // Create directory for the image
    const rootDirectory = path.join(__dirname, '..', '..', ...directories);
    const imageDirectory = rootDirectory;
    const response = await axios.get(image.source, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    // Save original image
    fs.writeFileSync(path.join(imageDirectory, `${key}.jpg`), imageBuffer);

    // Use lodash map to iterate asynchronously over formats
    const convertedImages = await Promise.all(
      map(formats, async (format) => {
        await sharp(imageBuffer)
          .toFormat(format as any)
          .toFile(path.join(imageDirectory, `${key}.${format}`));
        return {
          name: image.name,
          alt: image.alt,
          small: cdn + `/${key}.${format}`,
          original: cdn + `/${key}.jpg`,
        };
      })
    );

    return convertedImages;
  } catch (error) {
    // If an error occurs, you should handle it appropriately
    console.error('Error processing image:', error);
    throw error;
  }
}
