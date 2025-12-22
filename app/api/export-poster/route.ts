import { NextRequest, NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium-min';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

// Check if running in production/serverless environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

// Remote chromium binary URL - using official Sparticuz release (must match @sparticuz/chromium-min version)
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';

async function getBrowser() {
  if (isProduction) {
    // Use @sparticuz/chromium-min with remote binary for serverless (Vercel)
    const executablePath = await chromium.executablePath(CHROMIUM_URL);

    return puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  } else {
    // Use regular puppeteer for local development
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const { html, format, width, height, scale = 2 } = await request.json();

    if (!html || !format || !width || !height) {
      return NextResponse.json(
        { error: 'Missing required fields: html, format, width, height' },
        { status: 400 }
      );
    }

    if (format !== 'png' && format !== 'pdf' && format !== 'pdf-multi') {
      return NextResponse.json(
        { error: 'Format must be "png", "pdf", or "pdf-multi"' },
        { status: 400 }
      );
    }

    // For pdf-multi, html should be an array
    if (format === 'pdf-multi' && !Array.isArray(html)) {
      return NextResponse.json(
        { error: 'pdf-multi format requires html to be an array of HTML strings' },
        { status: 400 }
      );
    }

    // Launch browser (works for both local and serverless)
    browser = await getBrowser();

    const page = await browser.newPage();

    // Handle multi-page PDF for carousel
    if (format === 'pdf-multi') {
      const htmlArray = html as string[];

      // Create PDF document for all slides
      const pdfDoc = await PDFDocument.create();

      // Generate compressed image for each slide and add to PDF
      for (let i = 0; i < htmlArray.length; i++) {
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(htmlArray[i], {
          waitUntil: ['load', 'networkidle0'],
          timeout: 30000,
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Take screenshot
        const screenshot = await page.screenshot({
          type: 'png',
          fullPage: false,
          omitBackground: false,
        });

        // Compress as JPEG
        const compressedImage = await sharp(screenshot)
          .jpeg({ quality: 85 })
          .toBuffer();

        // Embed in PDF
        const jpgImage = await pdfDoc.embedJpg(compressedImage);
        const pdfPage = pdfDoc.addPage([width, height]);
        pdfPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBuffer = await pdfDoc.save();

      await browser.close();
      browser = null;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="carousel-${htmlArray.length}-slides.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });
    }

    // Set viewport to exact poster dimensions
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: format === 'png' ? scale : 1,
    });

    // Set content and wait for fonts/images to load
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });

    // Wait a bit extra for any web fonts to render
    await new Promise(resolve => setTimeout(resolve, 500));

    let buffer: Uint8Array;
    let contentType: string;
    let filename: string;

    if (format === 'png') {
      // High-res PNG screenshot
      buffer = await page.screenshot({
        type: 'png',
        fullPage: false,
        omitBackground: false,
      });
      contentType = 'image/png';
      filename = `poster-${width}x${height}@${scale}x.png`;
    } else {
      // PDF: Take screenshot, compress with sharp, embed in PDF
      // This creates much smaller PDFs than Puppeteer's page.pdf()
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        omitBackground: false,
      });

      // Compress the screenshot as JPEG (85% quality for good balance)
      const compressedImage = await sharp(screenshot)
        .jpeg({ quality: 85 })
        .toBuffer();

      // Create PDF and embed the compressed image
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(compressedImage);
      const page_pdf = pdfDoc.addPage([width, height]);
      page_pdf.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      buffer = await pdfDoc.save();
      contentType = 'application/pdf';
      filename = `poster-${width}x${height}.pdf`;
    }

    await browser.close();
    browser = null;

    // Return the file
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

// Increase function timeout for Vercel
export const maxDuration = 60;
