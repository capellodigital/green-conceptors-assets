import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import map from 'lodash/map';
import { filter } from 'lodash';
import Json from '../../backup/projects.json';
import { NextFunction, Request, Response } from 'express';
import Mime from '@/utils/mime';
import slugify from 'slugify';

interface Image {
  key: string;
  name: string;
  alt: string;
  source: string;
}

interface ImageRequest {
  directories: string[];
  images: Image[];
  image?: Image;
  base: string[];
  formats: string[];
  url: string;
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
  const directories = ['assets', 'projects', itemSlug, 'gallery'];
  const cdn = [...base, ...directories].join('/');
  return { cdn, directories };
}

export const PageImageGenerator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { formats, base } = req.body as ImageRequest;
    const converter = async () => {
      const promises$ = map(Json, async (item$) => {
        const content$ = map(item$.content, (contentItem, index) => {
          const imageText = contentItem.image
            ? `![Page Image ${index}](${contentItem.image})`
            : '';
          return `${contentItem.content}\n${imageText}\n`;
        }).join('\n\n');
        const gallery$ =
          item$?.gallery?.length > 0
            ? map(filter(item$.gallery, 'source'), async (item$$, index) => {
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
              })
            : [[]];

        const gallery =
          item$?.gallery?.length > 0 ? await Promise.all(gallery$) : [[]];
        const flatGallery = gallery?.slice().flat(1);
        const data = {
          ...item$,
          image: flatGallery[0]?.original,
          gallery: flatGallery,
          content: content$,
          metadata: {
            title: item$.metadata.title,
            description: item$.metadata.description,
            keywords: item$.metadata.keywords,
          },
        };
        return data;
      });

      return Promise.all(promises$);
    };

    const convertedImages = await converter();

    res.status(200).json(convertedImages);
  } catch (error) {
    next(error);
  }
};

export const ImageArrayGenerator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { formats, base, images, directories } = req.body as ImageRequest;
    const filteredImages = filter(images, 'source');
    const data = await Promise.all(
      map(filteredImages, async (item$$, index) => {
        const cdn = [...base, ...directories].join('/');
        const payload = {
          cdn,
          formats,
          directories,
          image: {
            key: `image-${index + 1}`,
            name: item$$?.name,
            alt: item$$.alt,
            source: item$$?.source,
          },
        };
        const result = await processImage(payload);
        return result;
      })
    );
    res.status(200).json(data.slice().flat());
  } catch (error) {
    next(error);
  }
};
export const SingalImageGenerator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { formats, base, directories, image } = req.body as ImageRequest;
    const cdn = [...base, ...directories].join('/');
    const payload = {
      cdn,
      formats,
      directories,
      image: {
        key: slugify(image.name, {
          lower: true,
          strict: true,
          trim: true,
        }),
        name: image.name,
        alt: image.alt,
        source: image.source,
      },
    };
    const result = await processImage(payload);
    res
      .status(200)
      .json(result.map((data) => `![${data.alt}](${data.small})`).at(0));
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

const mime = new Mime();
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
    const contentType = response.headers['content-type'];
    // Function to get file extension from MIME type using regex
    function getExtension(mimeType: string) {
      const match = mimeType.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/);
      return match ? `${match[1]}` : '';
    }
    const extension = getExtension(contentType);
    // Save original image
    fs.writeFileSync(
      path.join(imageDirectory, `${key}.${extension}`),
      imageBuffer
    );

    // Use lodash map to iterate asynchronously over formats
    const convertedImages = await Promise.all(
      map(formats, async (format) => {
        await sharp(imageBuffer, {})
          .toFormat(format as any)
          .toFile(path.join(imageDirectory, `${key}.${format}`));
        return {
          name: image.name,
          alt: image.alt,
          small: cdn + `/${key}.${format}`,
          original: cdn + `/${key}.${extension}`,
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
